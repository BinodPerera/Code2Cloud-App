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
