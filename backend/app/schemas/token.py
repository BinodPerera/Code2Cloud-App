from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class Token(BaseModel):
    access_token: str
    token_type: str
    user: Optional[Dict[str, Any]] = None

class UserBase(BaseModel):
    login: str
    id: int
    avatar_url: Optional[str] = None
    email: Optional[EmailStr] = None

class OAuthLoginResponse(BaseModel):
    login_url: str
