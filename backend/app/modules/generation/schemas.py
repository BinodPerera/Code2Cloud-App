from pydantic import BaseModel
from typing import Optional, Dict, Any

class GenerateRequest(BaseModel):
    serviceId: str
    cloud: str
    techStack: Optional[Dict[str, Any]] = None
    registryType: Optional[str] = 'native'
    awsComputeChoice: Optional[str] = 'fargate'
    awsInstanceType: Optional[str] = 't3.micro'
    awsUseEip: Optional[bool] = False
    gcpComputeChoice: Optional[str] = 'cloudrun'
    gcpMachineType: Optional[str] = 'e2-micro'
    gcpUseStaticIp: Optional[bool] = False


class UpdateCodeRequest(BaseModel):
    generated_code: Dict[str, str]

class CommitRequest(BaseModel):
    branch: Optional[str] = None
    commit_message: Optional[str] = None

class PushSecretsRequest(BaseModel):
    credential_ids: list[str]

