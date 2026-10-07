from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.modules.auth.router import auth_router, users_router
from app.modules.repos.router import router as repos_router
from app.modules.generation.router import router as generation_router
from app.modules.credentials.router import router as credentials_router

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="Backend API for code2cloud with GitHub OAuth integration",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Configure CORS
origins = {settings.FRONTEND_URL.rstrip('/')}
if settings.FRONTEND_URL.startswith("http://"):
    _host = settings.FRONTEND_URL.replace("http://", "").rstrip('/')
    if ":" not in _host:
        origins.add(f"http://{_host}:80")

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(origins),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create a central API router and mount all modular routers
api_router = APIRouter()
api_router.include_router(auth_router, prefix="/auth", tags=["auth"])
api_router.include_router(users_router, prefix="/users", tags=["users"])
api_router.include_router(repos_router, prefix="/repos", tags=["repos"])
api_router.include_router(generation_router, prefix="/repos", tags=["repos"])
api_router.include_router(credentials_router, prefix="/credentials", tags=["credentials"])

app.include_router(api_router, prefix=settings.API_V1_STR)

@app.get("/")
async def root():
    return {"message": "Welcome to code2cloud API"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
