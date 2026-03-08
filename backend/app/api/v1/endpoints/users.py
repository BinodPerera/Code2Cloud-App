from fastapi import APIRouter, Depends
from app.schemas.token import UserBase
from app.api.deps import get_current_user

router = APIRouter()

@router.get("/me", response_model=UserBase)
async def read_user_me(
    current_user: UserBase = Depends(get_current_user)
):
    """
    Get current logged-in user.
    """
    return current_user
