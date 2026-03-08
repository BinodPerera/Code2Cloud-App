from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import RedirectResponse
import httpx
from typing import Any
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.token import Token

router = APIRouter()

@router.get("/github/login")
async def github_login():
    """
    Redirect to GitHub for OAuth authentication.
    """
    github_url = (
        f"https://github.com/login/oauth/authorize?"
        f"client_id={settings.GITHUB_CLIENT_ID}&"
        f"redirect_uri={settings.GITHUB_REDIRECT_URI}&"
        f"scope=user:email"
    )
    return RedirectResponse(github_url)

@router.get("/github/callback", response_model=Token)
async def github_callback(code: str):
    """
    Callback for GitHub OAuth. 
    Exchanges authorization code for an access token and returns a local JWT.
    """
    # Exchange code for access token
    async with httpx.AsyncClient() as client:
        token_response = await client.post(
            "https://github.com/login/oauth/access_token",
            headers={"Accept": "application/json"},
            data={
                "client_id": settings.GITHUB_CLIENT_ID,
                "client_secret": settings.GITHUB_CLIENT_SECRET,
                "code": code,
                "redirect_uri": settings.GITHUB_REDIRECT_URI,
            },
        )
        token_data = token_response.json()
        
        if "error" in token_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=token_data.get("error_description", "Unknown error from GitHub"),
            )
            
        access_token = token_data.get("access_token")
        
        # Get user info
        user_response = await client.get(
            "https://api.github.com/user",
            headers={"Authorization": f"token {access_token}"},
        )
        user_data = user_response.json()
        
    # In a real app, you'd save/update the user in the database here.
    # For now, we'll just create a JWT for the user.
    jwt_token = create_access_token(subject=user_data.get("login"))
    
    return {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": user_data
    }
