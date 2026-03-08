from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.core.config import settings
from app.schemas.token import UserBase
from app.db.mongodb import get_database

reusable_oauth2 = HTTPBearer()

async def get_current_user(
    token: HTTPAuthorizationCredentials = Depends(reusable_oauth2)
) -> UserBase:
    try:
        payload = jwt.decode(
            token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM]
        )
        username: str = payload.get("sub")
        if username is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Could not validate credentials",
            )
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Could not validate credentials",
        )
    
    # Fetch user from MongoDB
    if settings.MONGODB_URL:
        db = await get_database()
        user_data = await db.users.find_one({"login": username})
        if user_data:
            return UserBase(**user_data)
    
    # Fallback if DB not configured or user not found
    return UserBase(login=username, id=0)
