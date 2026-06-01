from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.token import UserBase
from app.api.deps import get_current_user
from app.db.mongodb import get_database
from app.core.config import settings
from app.services import TechStackAnalyzer, CodeGenerator
import httpx
from pydantic import BaseModel
from typing import Optional, Dict, Any

router = APIRouter()

@router.get("/")
async def get_user_repositories(
    current_user: UserBase = Depends(get_current_user)
):
    """
    Get all repositories (public and private) for the authenticated user.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
        
    db = await get_database()
    user_data = await db.users.find_one({"login": current_user.login})
    
    if not user_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User data not found"
        )
        
    github_access_token = user_data.get("github_access_token")
    if not github_access_token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="GitHub access token not found. Please log in again."
        )
        
    async with httpx.AsyncClient(timeout=30.0) as client:
        try:
            response = await client.get(
                "https://api.github.com/user/repos",
                headers={
                    "Authorization": f"token {github_access_token}",
                    "Accept": "application/vnd.github.v3+json"
                },
                params={
                    "per_page": 100,
                    "sort": "updated",
                    "direction": "desc",
                    "affiliation": "owner,collaborator,organization_member"
                }
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API Error: {response.text}"
                )
            repos = response.json()
            return repos
        except httpx.RequestError as exc:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail=f"Connection failure contacting GitHub API: {exc}"
            )

@router.get("/{owner}/{repo}/tech-stack")
async def get_repository_tech_stack(
    owner: str,
    repo: str,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Fetch languages and parse manifest files to identify components using the TechStackAnalyzer service.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
        
    db = await get_database()
    user_data = await db.users.find_one({"login": current_user.login})
    if not user_data:
         raise HTTPException(status_code=404, detail="User not found")
         
    github_access_token = user_data.get("github_access_token")
    if not github_access_token:
        raise HTTPException(status_code=400, detail="GitHub access token missing")

    # Delegate to the standalone TechStackAnalyzer service
    return await TechStackAnalyzer.analyze(owner, repo, github_access_token)

class GenerateRequest(BaseModel):
    serviceId: str
    cloud: str
    techStack: Optional[Dict[str, Any]] = None

@router.post("/{owner}/{repo}/generate")
async def generate_deployment_code(
    owner: str,
    repo: str,
    request: GenerateRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Generate deployment configurations using the modular CodeGenerator service.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
    db = await get_database()
    
    # Self-healing: Resolve github access token and dynamically fetch stack if null
    user_data = await db.users.find_one({"login": current_user.login})
    github_access_token = user_data.get("github_access_token") if user_data else None
    
    tech_stack = request.techStack
    if not tech_stack or "components" not in tech_stack or not tech_stack["components"]:
        if github_access_token:
            try:
                tech_stack = await TechStackAnalyzer.analyze(owner, repo, github_access_token)
            except Exception:
                pass
    
    # Delegate to the standalone CodeGenerator service
    return await CodeGenerator.generate(
        owner=owner,
        repo=repo,
        service_id=request.serviceId,
        cloud=request.cloud,
        tech_stack=tech_stack,
        current_user_login=current_user.login,
        db=db
    )

@router.get("/generations/history")
async def get_user_generation_history(
    current_user: UserBase = Depends(get_current_user)
):
    """
    Fetch all generated configurations for the authenticated user, excluding heavy code content.
    """
    db = await get_database()
    cursor = db.generations.find({"user_id": current_user.login}).sort("timestamp", -1)
    history = []
    async for doc in cursor:
        doc["_id"] = str(doc["_id"])
        # Strip heavy raw code block to minimize network payload size
        if "generated_code" in doc:
            del doc["generated_code"]
        history.append(doc)
    return history

@router.get("/generations/{generation_id}")
async def get_generation_by_id(
    generation_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Get raw generated configurations from MongoDB Hot Tier.
    """
    db = await get_database()
    gen = await db.generations.find_one({"generation_id": generation_id})
    if not gen:
        raise HTTPException(status_code=404, detail="Generation not found")
        
    gen["_id"] = str(gen["_id"])
    return gen

@router.get("/generations/{generation_id}/download")
async def download_generation_zip(
    generation_id: str,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Download the generated code as a zip file directly from the database configurations.
    """
    import io
    import zipfile
    from fastapi.responses import StreamingResponse
    
    db = await get_database()
    gen = await db.generations.find_one({"generation_id": generation_id})
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

class UpdateCodeRequest(BaseModel):
    generated_code: Dict[str, str]

@router.put("/generations/{generation_id}/update")
async def update_generation_code(
    generation_id: str,
    request: UpdateCodeRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Update Hot Tier code and re-upload Cold Tier S3 package.
    """
    db = await get_database()
    return await CodeGenerator.update_code(
        generation_id=generation_id,
        new_code=request.generated_code,
        db=db
    )

class CommitRequest(BaseModel):
    branch: Optional[str] = None
    commit_message: Optional[str] = None

@router.post("/generations/{generation_id}/commit")
async def commit_generation_code(
    generation_id: str,
    request: CommitRequest,
    current_user: UserBase = Depends(get_current_user)
):
    """
    Directly commit generated and live-edited files to the SCM (GitHub repository) in a single atomic commit.
    """
    db = await get_database()
    gen = await db.generations.find_one({"generation_id": generation_id})
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
    
    user_data = await db.users.find_one({"login": current_user.login})
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
                        "GitHub API returned 403 (Resource not accessible). This means your GitHub OAuth App or GitHub App "
                        "integration lacks write access (Repository Permissions > 'Contents' must be set to 'Read & write'). "
                        "Please go to your GitHub developer settings, upgrade permissions for your App, and accept the "
                        "updated permission consent on your repository settings page."
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
                    "GitHub API returned 403 (Resource not accessible). This means your GitHub OAuth App or GitHub App "
                    "integration lacks write access (Repository Permissions > 'Contents' must be set to 'Read & write'). "
                    "Please go to your GitHub developer settings, upgrade permissions for your App, and accept the "
                    "updated permission consent on your repository settings page."
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
                    "GitHub API returned 403 (Resource not accessible). This means your GitHub OAuth App or GitHub App "
                    "integration lacks write access (Repository Permissions > 'Contents' must be set to 'Read & write'). "
                    "Please go to your GitHub developer settings, upgrade permissions for your App, and accept the "
                    "updated permission consent on your repository settings page."
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
                    "GitHub API returned 403 (Resource not accessible). This means your GitHub OAuth App or GitHub App "
                    "integration lacks write access (Repository Permissions > 'Contents' must be set to 'Read & write'). "
                    "Please go to your GitHub developer settings, upgrade permissions for your App, and accept the "
                    "updated permission consent on your repository settings page."
                )
            )
        if update_res.status_code != 200:
            raise HTTPException(status_code=400, detail=f"Failed to point branch ref to new commit: {update_res.text}")
            
        commit_web_url = f"https://github.com/{owner}/{repo}/commit/{new_commit_sha}"
        
        # Update committed status to True in MongoDB Hot Tier
        await db.generations.update_one(
            {"generation_id": generation_id},
            {"$set": {"committed": True}}
        )
        
        return {
            "status": "success",
            "branch": branch,
            "commit_sha": new_commit_sha,
            "commit_url": commit_web_url
        }

