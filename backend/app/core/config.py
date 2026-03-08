from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional

class Settings(BaseSettings):
    PROJECT_NAME: str = "code2cloud API"
    API_V1_STR: str = "/api/v1"
    
    # Change these in .env
    SECRET_KEY: str = "YOUR_SUPER_SECRET_KEY"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days

    # GitHub OAuth
    GITHUB_CLIENT_ID: Optional[str] = None
    GITHUB_CLIENT_SECRET: Optional[str] = None
    # This should be your public URL + /api/v1/auth/github/callback
    GITHUB_REDIRECT_URI: str = "http://localhost:8000/api/v1/auth/github/callback"

    # MongoDB
    MONGODB_URL: Optional[str] = None
    DATABASE_NAME: str = "code2cloud"

    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=True,
        extra="ignore"
    )

settings = Settings()
