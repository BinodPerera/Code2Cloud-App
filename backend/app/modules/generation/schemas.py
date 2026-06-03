from pydantic import BaseModel
from typing import Optional, Dict, Any

class GenerateRequest(BaseModel):
    serviceId: str
    cloud: str
    techStack: Optional[Dict[str, Any]] = None

class UpdateCodeRequest(BaseModel):
    generated_code: Dict[str, str]

class CommitRequest(BaseModel):
    branch: Optional[str] = None
    commit_message: Optional[str] = None
