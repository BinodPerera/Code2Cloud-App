from fastapi import APIRouter, Depends, HTTPException, status
from app.schemas.token import UserBase
from app.api.deps import get_current_user
from app.db.mongodb import get_database
from app.core.config import settings
import httpx

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
        
    async with httpx.AsyncClient() as client:
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
                    "direction": "desc"
                }
            )
            if response.status_code != 200:
                raise HTTPException(
                    status_code=response.status_code,
                    detail=f"GitHub API Error: {response.text}"
                )
            repos = response.json()
            print(f"DEBUG GITHUB SCOPES: {response.headers.get('X-OAuth-Scopes')}")
            print(f"DEBUG REPOS: found {len(repos)} repos")
            private_count = sum(1 for r in repos if r.get("private"))
            print(f"DEBUG REPOS: private count = {private_count}")
            # Return list of repositories
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
    Fetch languages and parse dependency files (package.json, requirements.txt) to identify libraries.
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

    headers = {
        "Authorization": f"token {github_access_token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    languages = {}
    components = [] # [{ "name": "frontend", "type": "Node/JS", "libraries": [] }]
    
    async with httpx.AsyncClient() as client:
        # 1. Get Repo metadata for default branch
        default_branch = "main"
        try:
            repo_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}", headers=headers)
            if repo_res.status_code == 200:
                default_branch = repo_res.json().get("default_branch", "main")
        except Exception:
            pass

        # 2. Get Languages
        try:
            lang_url = f"https://api.github.com/repos/{owner}/{repo}/languages"
            lang_res = await client.get(lang_url, headers=headers)
            if lang_res.status_code == 200:
                languages = lang_res.json()
        except Exception:
            pass
            
        import base64
        import json

        # 3. Get Recursive Git Tree to detect monorepos
        try:
            tree_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/{default_branch}?recursive=1"
            tree_res = await client.get(tree_url, headers=headers)
            
            if tree_res.status_code == 200:
                tree_data = tree_res.json()
                tree_items = tree_data.get("tree", [])
                
                # Filter paths containing manifest signatures (and ignore node_modules/venv content)
                manifests = []
                for item in tree_items:
                    path = item.get("path", "")
                    if "node_modules" in path or "venv" in path or ".venv" in path:
                        continue
                    if path.endswith("package.json") or path.endswith("requirements.txt"):
                        manifests.append(path)
                
                # Concurrent content fetch requests
                for path in manifests:
                    try:
                        file_res = await client.get(f"https://api.github.com/repos/{owner}/{repo}/contents/{path}", headers=headers)
                        if file_res.status_code == 200:
                            content_data = file_res.json()
                            content = base64.b64decode(content_data["content"]).decode("utf-8")
                            
                            component_name = path.split("/")[0] if "/" in path else "Root"
                            component_libraries = []
                            
                            if path.endswith("package.json"):
                                pkg = json.loads(content)
                                deps = pkg.get("dependencies", {})
                                dev_deps = pkg.get("devDependencies", {})
                                component_libraries.extend(list(deps.keys()))
                                component_libraries.extend(list(dev_deps.keys()))
                                cmp_type = "NodeJS / Javascript"
                            elif path.endswith("requirements.txt"):
                                for line in content.splitlines():
                                    if line and not line.startswith("#"):
                                        name = line.split("==")[0].split(">=")[0].split("<=")[0].strip()
                                        if name and not name.startswith("-r"):
                                            component_libraries.append(name)
                                cmp_type = "Python"
                                
                            if component_libraries:
                                components.append({
                                    "name": component_name,
                                    "path": path,
                                    "type": cmp_type,
                                    "libraries": list(set(component_libraries))
                                })
                    except Exception:
                        continue # Skip that file if erroring
        except Exception:
            pass

    return {
        "languages": languages,
        "components": components
    }
