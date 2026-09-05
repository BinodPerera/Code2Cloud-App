from pydantic import BaseModel
from typing import Optional, Dict, Any, List

class GenerateRequest(BaseModel):
    serviceId: str
    cloud: str
    techStack: Optional[Dict[str, Any]] = None
    registryType: Optional[str] = 'native'
    region: Optional[str] = None
    environment: Optional[str] = 'production'
    storageSizeGb: Optional[int] = 20
    storageType: Optional[str] = 'gp3'
    dbEnabled: Optional[bool] = False
    dbEngine: Optional[str] = 'postgres'
    dbInstanceClass: Optional[str] = 'db.t3.micro'
    dbAllocatedStorage: Optional[int] = 20
    swapEnabled: Optional[bool] = False
    swapSizeGb: Optional[int] = 2
    awsComputeChoice: Optional[str] = 'ec2'
    awsInstanceType: Optional[str] = 't3.micro'
    awsUseEip: Optional[bool] = False
    gcpComputeChoice: Optional[str] = 'cloudrun'
    gcpMachineType: Optional[str] = 'e2-micro'
    gcpUseStaticIp: Optional[bool] = False
    componentConfigs: Optional[Dict[str, Dict[str, Any]]] = None
    envVars: Optional[Dict[str, List[Dict[str, Any]]]] = None


class UpdateCodeRequest(BaseModel):
    generated_code: Dict[str, str]

class SecretsPayload(BaseModel):
    push_to_github: bool = True
    provider: str = "aws"
    credential_id: Optional[str] = None
    manual_data: Optional[Dict[str, Any]] = None
    save_to_profile: bool = False
    profile_name: Optional[str] = None

class CommitRequest(BaseModel):
    branch: Optional[str] = None
    commit_message: Optional[str] = None
    secrets_payload: Optional[SecretsPayload] = None
    app_env_vars: Optional[Dict[str, List[Dict[str, Any]]]] = None
    merge_to_default: Optional[bool] = True

class UpdateEnvVarsRequest(BaseModel):
    env_vars: Dict[str, List[Dict[str, Any]]]
    redeploy: bool = True
    branch: Optional[str] = "code2cloud-setup"

class PushSecretsRequest(BaseModel):
    credential_ids: list[str]


class InstanceRecommendationRequest(BaseModel):
    cloud: str
    computeChoice: str
    techStack: Optional[Dict[str, Any]] = None
    componentName: Optional[str] = None
    componentType: Optional[str] = None


