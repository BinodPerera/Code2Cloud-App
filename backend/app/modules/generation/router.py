from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.auth.schemas import UserBase
from app.modules.auth.deps import get_current_user, get_user_repository
from app.modules.auth.repository import UserRepository
from app.modules.generation.repository import GenerationRepository
from app.modules.generation.schemas import GenerateRequest, UpdateCodeRequest, CommitRequest, PushSecretsRequest
from app.modules.credentials.repository import CredentialRepository
from app.modules.credentials.router import get_credential_repository
from app.modules.generation.secrets_handler import GitHubSecretsManager

from app.modules.generation.service_analyzer import TechStackAnalyzer
from app.modules.generation.service_generator import CodeGenerator
from app.db.mongodb import get_database
from app.core.config import settings
import httpx
from typing import Optional, Dict, Any

router = APIRouter()

async def get_generation_repository() -> GenerationRepository:
    db = await get_database()
    return GenerationRepository(db)

@router.get("/{owner}/{repo}/tech-stack")
async def get_repository_tech_stack(
    owner: str,
    repo: str,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Fetch languages and parse manifest files to identify components using the TechStackAnalyzer service.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
        
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data:
         raise HTTPException(status_code=404, detail="User not found")
         
    github_access_token = user_data.get("github_access_token")
    if not github_access_token:
        raise HTTPException(status_code=400, detail="GitHub access token missing")

    return await TechStackAnalyzer.analyze(owner, repo, github_access_token)

@router.post("/{owner}/{repo}/generate")
async def generate_deployment_code(
    owner: str,
    repo: str,
    request: GenerateRequest,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Generate deployment configurations using the modular CodeGenerator service.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
    
    # Self-healing: Resolve github access token and dynamically fetch stack if null
    user_data = await user_repo.get_by_login(current_user.login)
    github_access_token = user_data.get("github_access_token") if user_data else None
    
    tech_stack = request.techStack
    if not tech_stack or "components" not in tech_stack or not tech_stack["components"]:
        if github_access_token:
            try:
                tech_stack = await TechStackAnalyzer.analyze(owner, repo, github_access_token)
            except Exception:
                pass
    
    # Delegate to the modular CodeGenerator service
    return await CodeGenerator.generate(
        owner=owner,
        repo=repo,
        service_id=request.serviceId,
        cloud=request.cloud,
        tech_stack=tech_stack,
        current_user_login=current_user.login,
        generation_repo=generation_repo,
        registry_type=request.registryType,
        aws_compute_choice=request.awsComputeChoice,
        aws_instance_type=request.awsInstanceType,
        aws_use_eip=request.awsUseEip,
        gcp_compute_choice=request.gcpComputeChoice,
        gcp_machine_type=request.gcpMachineType,
        gcp_use_static_ip=request.gcpUseStaticIp
    )

@router.get("/generations/history")
async def get_user_generation_history(
    current_user: UserBase = Depends(get_current_user),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Fetch all generated configurations for the authenticated user, excluding heavy code content.
    """
    return await generation_repo.get_history_by_user(current_user.login)

@router.get("/generations/{generation_id}")
async def get_generation_by_id(
    generation_id: str,
    current_user: UserBase = Depends(get_current_user),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Get raw generated configurations from MongoDB Hot Tier.
    """
    gen = await generation_repo.get_by_id(generation_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    gen["_id"] = str(gen["_id"])
    return gen

@router.get("/generations/{generation_id}/download")
async def download_generation_zip(
    generation_id: str,
    current_user: UserBase = Depends(get_current_user),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Download the generated code as a zip file directly from the database configurations.
    """
    import io
    import zipfile
    from fastapi.responses import StreamingResponse
    
    gen = await generation_repo.get_by_id(generation_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    generated_code = gen.get("generated_code", {})
    project_name = gen.get("project_name", "project")
    
    # Create zip in memory
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        for filename, content in generated_code.items():
            zip_file.writestr(filename, content)
    zip_buffer.seek(0)
    
    headers = {
        "Content-Disposition": f"attachment; filename={project_name}-{generation_id}.zip",
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers=headers
    )

@router.put("/generations/{generation_id}/update")
async def update_generation_code(
    generation_id: str,
    request: UpdateCodeRequest,
    current_user: UserBase = Depends(get_current_user),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Update Hot Tier code and re-upload Cold Tier S3 package.
    """
    return await CodeGenerator.update_code(
        generation_id=generation_id,
        new_code=request.generated_code,
        generation_repo=generation_repo
    )

@router.post("/generations/{generation_id}/commit")
async def commit_generation_code(
    generation_id: str,
    request: CommitRequest,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
    generation_repo: GenerationRepository = Depends(get_generation_repository)
):
    """
    Directly commit generated and live-edited files to the SCM (GitHub repository) in a single atomic commit.
    """
    gen = await generation_repo.get_by_id(generation_id)
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    repo_url = gen.get("repo_url")
    if not repo_url:
        raise HTTPException(status_code=400, detail="Repository URL not found in generation record")
        
    path_part = repo_url.replace("https://github.com/", "").replace("http://github.com/", "")
    parts = [p for p in path_part.split("/") if p]
    if len(parts) < 2:
        raise HTTPException(status_code=400, detail=f"Invalid repository URL format in generation: {repo_url}")
    owner = parts[0]
    repo = parts[1]
    
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data or not user_data.get("github_access_token"):
        raise HTTPException(status_code=401, detail="GitHub access token not found. Please log in again.")
    github_access_token = user_data["github_access_token"]
    
    branch = request.branch.strip() if request.branch else ""
    if not branch:
        branch = "code2cloud-setup"
        
    commit_message = request.commit_message.strip() if request.commit_message else ""
    if not commit_message:
        commit_message = "ci: add generated deployment configurations via Code2Cloud"
        
    headers = {
        "Authorization": f"token {github_access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    async with httpx.AsyncClient(timeout=30.0) as client:
        # Step 0: Get default branch if we need to fall back or branch off
        default_branch = "main"
        try:
            repo_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            if repo_res.status_code == 200:
                default_branch = repo_res.json().get("default_branch", "main")
        except Exception:
            pass
            
        # Step 1: Check if the target branch ref exists
        target_ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{branch}"
        res = await client.get(target_ref_url, headers=headers)
        
        base_commit_sha = None
        if res.status_code == 200:
            # Target branch exists
            ref_data = res.json()
            base_commit_sha = ref_data.get("object", {}).get("sha")
        else:
            # Target branch does not exist, create it from the default branch
            default_ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/{default_branch}"
            def_res = await client.get(default_ref_url, headers=headers)
            if def_res.status_code != 200:
                # Fallback to master
                default_ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/ref/heads/master"
                def_res = await client.get(default_ref_url, headers=headers)
                
            if def_res.status_code != 200:
                raise HTTPException(
                    status_code=400, 
                    detail=f"Could not find base reference branch (tried '{default_branch}' and 'master') to create the target branch '{branch}'."
                )
            
            def_ref_data = def_res.json()
            base_commit_sha = def_ref_data.get("object", {}).get("sha")
            
            # Create branch ref
            create_ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/refs"
            create_res = await client.post(create_ref_url, headers=headers, json={
                "ref": f"refs/heads/{branch}",
                "sha": base_commit_sha
            })
            if create_res.status_code == 403:
                raise HTTPException(
                    status_code=403,
                    detail=(
                        f"GitHub API returned 403 in Step 1 (Create Branch Ref): {create_res.text}. "
                        "This means your GitHub OAuth App or GitHub App integration lacks write access (Repository Permissions > 'Contents' must be set to 'Read & write')."
                      )
                )
            if create_res.status_code not in (200, 201):
                raise HTTPException(status_code=400, detail=f"Failed to create new branch '{branch}': {create_res.text}")
                
        # Step 2: Create a Git Tree overlays on base tree
        tree_elements = []
        for filepath, filecontent in gen.get("generated_code", {}).items():
            tree_elements.append({
                "path": filepath,
                "mode": "100644",
                "type": "blob",
                "content": filecontent
            })
            
        if not tree_elements:
            raise HTTPException(status_code=400, detail="No generated code files found in hot ledger.")
            
        tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees"
        tree_res = await client.post(tree_url, headers=headers, json={
            "base_tree": base_commit_sha,
            "tree": tree_elements
        })
        if tree_res.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"GitHub API returned 403 in Step 2 (Create Tree): {tree_res.text}. "
                    "This means your GitHub OAuth App or GitHub App integration lacks write access or Workflows permissions (if editing files under .github/workflows)."
                )
            )
        if tree_res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Failed to compile Git tree: {tree_res.text}")
            
        new_tree_sha = tree_res.json().get("sha")
        
        # Step 3: Create Git Commit
        commit_url = f"https://api.github.com/repos/{owner}/{repo}/git/commits"
        commit_res = await client.post(commit_url, headers=headers, json={
            "message": commit_message,
            "tree": new_tree_sha,
            "parents": [base_commit_sha]
        })
        if commit_res.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"GitHub API returned 403 in Step 3 (Create Commit): {commit_res.text}. "
                    "This means your GitHub OAuth App or GitHub App integration lacks write access."
                )
            )
        if commit_res.status_code not in (200, 201):
            raise HTTPException(status_code=400, detail=f"Failed to compose Git commit: {commit_res.text}")
            
        new_commit_sha = commit_res.json().get("sha")
        
        # Step 4: Move Target Branch Head Reference
        update_ref_url = f"https://api.github.com/repos/{owner}/{repo}/git/refs/heads/{branch}"
        update_res = await client.patch(update_ref_url, headers=headers, json={
            "sha": new_commit_sha,
            "force": False
        })
        if update_res.status_code == 403:
            raise HTTPException(
                status_code=403,
                detail=(
                    f"GitHub API returned 403 in Step 4 (Update Ref): {update_res.text}. "
                    "This means your GitHub OAuth App or GitHub App integration lacks write access."
                )
            )
        if update_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to point branch ref to new commit: {update_res.text}")
            
        commit_web_url = f"https://github.com/{owner}/{repo}/commit/{new_commit_sha}"
        
        # Update committed status to True in MongoDB Hot Tier
        await generation_repo.mark_as_committed(generation_id)
        
        return {
            "status": "success",
            "branch": branch,
            "commit_sha": new_commit_sha,
            "commit_url": commit_web_url
        }

@router.post("/{owner}/{repo}/secrets/push-saved")
async def push_saved_credentials_to_github(
    owner: str,
    repo: str,
    payload: PushSecretsRequest,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository),
    cred_repo: CredentialRepository = Depends(get_credential_repository)
):
    """
    Load saved credentials from MongoDB, decrypt them, encrypt them using the repository's
    public key, and push them to GitHub repository secrets.
    """
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data or not user_data.get("github_access_token"):
        raise HTTPException(status_code=401, detail="GitHub access token not found. Please log in again.")
    github_access_token = user_data["github_access_token"]

    pushed_secrets = []
    
    for cred_id in payload.credential_ids:
        cred = await cred_repo.get_by_id(cred_id, current_user.login)
        if not cred:
            raise HTTPException(
                status_code=404, 
                detail=f"Saved credential '{cred_id}' not found or unauthorized"
            )
            
        provider = cred.get("provider")
        data = cred.get("data", {})
        
        try:
            if provider == "aws":
                await GitHubSecretsManager.push_secret(
                    owner, repo, "AWS_ACCESS_KEY_ID", data.get("aws_access_key_id", ""), github_access_token
                )
                await GitHubSecretsManager.push_secret(
                    owner, repo, "AWS_SECRET_ACCESS_KEY", data.get("aws_secret_access_key", ""), github_access_token
                )
                await GitHubSecretsManager.push_secret(
                    owner, repo, "AWS_REGION", data.get("aws_region", "us-east-1"), github_access_token
                )
                pushed_secrets.extend(["AWS_ACCESS_KEY_ID", "AWS_SECRET_ACCESS_KEY", "AWS_REGION"])
                
            elif provider == "gcp":
                await GitHubSecretsManager.push_secret(
                    owner, repo, "GCP_SA_KEY", data.get("gcp_sa_key", ""), github_access_token
                )
                await GitHubSecretsManager.push_secret(
                    owner, repo, "GCP_PROJECT_ID", data.get("gcp_project_id", ""), github_access_token
                )
                pushed_secrets.extend(["GCP_SA_KEY", "GCP_PROJECT_ID"])
                
            elif provider == "dockerhub":
                await GitHubSecretsManager.push_secret(
                    owner, repo, "DOCKER_USERNAME", data.get("docker_username", ""), github_access_token
                )
                await GitHubSecretsManager.push_secret(
                    owner, repo, "DOCKER_PASSWORD", data.get("docker_password", ""), github_access_token
                )
                pushed_secrets.extend(["DOCKER_USERNAME", "DOCKER_PASSWORD"])
        except HTTPException as e:
            raise e
        except Exception as err:
            raise HTTPException(
                status_code=500,
                detail=f"Failed to push secret for provider '{provider}': {str(err)}"
            )
            
    return {"status": "success", "pushed": pushed_secrets}

@router.get("/{owner}/{repo}/actions/runs")
async def get_github_workflow_runs(
    owner: str,
    repo: str,
    branch: Optional[str] = None,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Fetch the latest GitHub Actions workflow run for this repository and branch.
    """
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data or not user_data.get("github_access_token"):
        raise HTTPException(status_code=401, detail="GitHub access token not found.")
    github_access_token = user_data["github_access_token"]

    headers = {
        "Authorization": f"token {github_access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    url = f"https://api.github.com/repos/{owner}/{repo}/actions/runs"
    params = {}
    if branch:
        params["branch"] = branch
        
    async with httpx.AsyncClient(timeout=15.0) as client:
        res = await client.get(url, headers=headers, params=params)
        if res.status_code != 200:
            raise HTTPException(
                status_code=res.status_code, 
                detail=f"Failed to fetch workflow runs from GitHub: {res.text}"
            )
            
        data = res.json()
        runs = data.get("workflow_runs", [])
        
        if not runs:
            return {"status": "no_runs", "latest_run": None}
            
        latest = runs[0]
        return {
            "status": "success",
            "latest_run": {
                "id": latest.get("id"),
                "name": latest.get("name"),
                "status": latest.get("status"),
                "conclusion": latest.get("conclusion"),
                "html_url": latest.get("html_url"),
                "created_at": latest.get("created_at"),
                "updated_at": latest.get("updated_at")
            }
        }

@router.get("/{owner}/{repo}/secrets-keys")
async def get_repository_secret_keys(
    owner: str,
    repo: str,
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Fetch existing GitHub Action secret names for the repository (no values exposed).
    """
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data or not user_data.get("github_access_token"):
        raise HTTPException(status_code=401, detail="GitHub access token missing")
    
    secret_names = await GitHubSecretsManager.list_secrets(owner, repo, user_data["github_access_token"])
    return {"secrets": secret_names}

@router.post("/{owner}/{repo}/push-custom-secrets")
async def push_custom_env_secrets(
    owner: str,
    repo: str,
    secrets_dict: Dict[str, str],
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Push custom environment variables/secrets to GitHub repository secrets.
    """
    user_data = await user_repo.get_by_login(current_user.login)
    if not user_data or not user_data.get("github_access_token"):
        raise HTTPException(status_code=401, detail="GitHub access token missing")
    
    pushed = []
    token = user_data["github_access_token"]
    for key_name, value in secrets_dict.items():
        if key_name and value is not None:
            await GitHubSecretsManager.push_secret(owner, repo, key_name, str(value), token)
            pushed.append(key_name)
            
    return {"status": "success", "pushed": pushed}


