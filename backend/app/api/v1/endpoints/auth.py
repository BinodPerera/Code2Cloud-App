from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.responses import RedirectResponse
import httpx
import base64
import json
import urllib.parse
from typing import Any
from app.core.config import settings
from app.core.security import create_access_token
from app.schemas.token import Token
from app.db.mongodb import get_database

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
        f"scope=user:email%20repo"
    )
    return RedirectResponse(github_url)

@router.get("/github/callback")
async def github_callback(code: str, request: Request):
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
        print(f"DEBUG CALLBACK TOKEN DATA: {token_data}")
        
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
        
    # Store access token in user_data for private repo access
    user_data["github_access_token"] = access_token
        
    # Persist user in MongoDB
    if settings.MONGODB_URL:
        db = await get_database()
        await db.users.update_one(
            {"login": user_data.get("login")},
            {"$set": user_data},
            upsert=True
        )
    
    # Create JWT for the user
    jwt_token = create_access_token(subject=user_data.get("login"))
    
    auth_data = {
        "access_token": jwt_token,
        "token_type": "bearer",
        "user": user_data
    }
    # Check if the client expects JSON (e.g. an AJAX fetch from React)
    accept_header = request.headers.get("accept", "")
    if "application/json" in accept_header:
        return auth_data
        
    # Otherwise, it's a direct browser redirect (Option B)
    # Encode auth data to base64 for safe URL passing
    json_data = json.dumps(auth_data)
    encoded_data = base64.b64encode(json_data.encode("utf-8")).decode("utf-8")
    safe_encoded_data = urllib.parse.quote(encoded_data)
    
    # Redirect to frontend callback page
    redirect_url = f"{settings.FRONTEND_URL}/callback?data={safe_encoded_data}"
    return RedirectResponse(redirect_url)
