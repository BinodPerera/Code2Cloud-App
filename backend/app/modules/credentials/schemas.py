from pydantic import BaseModel, Field, model_validator
from typing import Dict, Any, Optional
from datetime import datetime

class CredentialCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    provider: str = Field(..., pattern="^(aws|gcp|dockerhub)$")
    data: Dict[str, Any]

    @model_validator(mode='after')
    def validate_data_fields(self):
        prov = self.provider
        fields = self.data
        
        if prov == "aws":
            if "aws_access_key_id" not in fields or not fields["aws_access_key_id"]:
                raise ValueError("aws_access_key_id is required for AWS credentials")
            if "aws_secret_access_key" not in fields or not fields["aws_secret_access_key"]:
                raise ValueError("aws_secret_access_key is required for AWS credentials")
            # Default region if not provided
            if "aws_region" not in fields or not fields["aws_region"]:
                self.data["aws_region"] = "us-east-1"
                
        elif prov == "gcp":
            if "gcp_sa_key" not in fields or not fields["gcp_sa_key"]:
                raise ValueError("gcp_sa_key (JSON Service Account) is required for GCP credentials")
            # Automatically try to extract project_id from SA key if not specified
            if "gcp_project_id" not in fields or not fields["gcp_project_id"]:
                import json
                try:
                    sa_json = json.loads(fields["gcp_sa_key"])
                    self.data["gcp_project_id"] = sa_json.get("project_id", "")
                except Exception:
                    raise ValueError("gcp_project_id is required or gcp_sa_key must be valid JSON containing project_id")
                    
        elif prov == "dockerhub":
            if "docker_username" not in fields or not fields["docker_username"]:
                raise ValueError("docker_username is required for Docker Hub credentials")
            if "docker_password" not in fields or not fields["docker_password"]:
                raise ValueError("docker_password is required for Docker Hub credentials")
                
        return self

class CredentialUpdate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    data: Dict[str, Any]

class CredentialResponse(BaseModel):
    credential_id: str
    name: str
    provider: str
    data: Dict[str, Any]
    created_at: str
    updated_at: str

    @classmethod
    def mask_credentials(cls, doc: Dict[str, Any]) -> "CredentialResponse":
        """
        Produce a CredentialResponse where sensitive data fields are masked.
        """
        raw_data = doc.get("data", {})
        masked_data = {}
        prov = doc.get("provider")

        for k, v in raw_data.items():
            if not isinstance(v, str):
                masked_data[k] = v
                continue
                
            # Perform specific masking rules
            if prov == "aws":
                if k == "aws_secret_access_key":
                    masked_data[k] = "••••••••••••••••••••"
                elif k == "aws_access_key_id":
                    if len(v) > 8:
                        masked_data[k] = f"{v[:4]}••••{v[-4:]}"
                    else:
                        masked_data[k] = "••••••••"
                else:
                    masked_data[k] = v
            elif prov == "gcp":
                if k == "gcp_sa_key":
                    masked_data[k] = "••••••••••••••••••••"
                else:
                    masked_data[k] = v
            elif prov == "dockerhub":
                if k == "docker_password":
                    masked_data[k] = "••••••••••••••••••••"
                else:
                    masked_data[k] = v
            else:
                masked_data[k] = "••••••••"

        return cls(
            credential_id=doc["credential_id"],
            name=doc["name"],
            provider=doc["provider"],
            data=masked_data,
            created_at=doc["created_at"],
            updated_at=doc["updated_at"]
        )
