from fastapi import APIRouter, Depends, HTTPException, status
from app.modules.auth.schemas import UserBase
from app.modules.auth.deps import get_current_user, get_user_repository
from app.modules.auth.repository import UserRepository
from app.modules.repos.client import GitHubClient
from app.core.config import settings

router = APIRouter()

@router.get("/")
async def get_user_repositories(
    current_user: UserBase = Depends(get_current_user),
    user_repo: UserRepository = Depends(get_user_repository)
):
    """
    Get all repositories (public and private) for the authenticated user.
    """
    if not settings.MONGODB_URL:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database not configured"
        )
        
    user_data = await user_repo.get_by_login(current_user.login)
    
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
        
    return await GitHubClient.get_user_repositories(github_access_token)
