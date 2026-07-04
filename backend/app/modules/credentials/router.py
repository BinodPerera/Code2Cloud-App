from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.modules.auth.schemas import UserBase
from app.modules.auth.deps import get_current_user
from app.db.mongodb import get_database
from app.modules.credentials.repository import CredentialRepository
from app.modules.credentials.schemas import (
    CredentialCreate,
    CredentialUpdate,
    CredentialResponse
)

router = APIRouter()

async def get_credential_repository() -> CredentialRepository:
    db = await get_database()
    return CredentialRepository(db)

@router.get("/", response_model=List[CredentialResponse])
async def list_credentials(
    current_user: UserBase = Depends(get_current_user),
    repo: CredentialRepository = Depends(get_credential_repository)
):
    """
    List all saved credentials for the authenticated user, with sensitive fields masked.
    """
    docs = await repo.list_by_user(current_user.login)
    return [CredentialResponse.mask_credentials(doc) for doc in docs]

@router.post("/", response_model=CredentialResponse, status_code=status.HTTP_201_CREATED)
async def create_credential(
    payload: CredentialCreate,
    current_user: UserBase = Depends(get_current_user),
    repo: CredentialRepository = Depends(get_credential_repository)
):
    """
    Save a new encrypted credential.
    """
    try:
        doc = await repo.create(
            user_id=current_user.login,
            name=payload.name,
            provider=payload.provider,
            data=payload.data
        )
        return CredentialResponse.mask_credentials(doc)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create credential: {str(e)}"
        )

@router.put("/{credential_id}", response_model=CredentialResponse)
async def update_credential(
    credential_id: str,
    payload: CredentialUpdate,
    current_user: UserBase = Depends(get_current_user),
    repo: CredentialRepository = Depends(get_credential_repository)
):
    """
    Update a credential's name and data.
    """
    doc = await repo.get_by_id(credential_id, current_user.login)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    
    # Check that provider schemas validate the update data
    try:
        # Re-validate with original provider to ensure structure is correct
        validator = CredentialCreate(
            name=payload.name,
            provider=doc["provider"],
            data=payload.data
        )
        # Proceed with update
        updated_doc = await repo.update(
            credential_id=credential_id,
            user_id=current_user.login,
            name=validator.name,
            data=validator.data
        )
        if not updated_doc:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Update operation failed"
            )
        return CredentialResponse.mask_credentials(updated_doc)
    except ValueError as val_err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(val_err)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update credential: {str(e)}"
        )

@router.delete("/{credential_id}", status_code=status.HTTP_200_OK)
async def delete_credential(
    credential_id: str,
    current_user: UserBase = Depends(get_current_user),
    repo: CredentialRepository = Depends(get_credential_repository)
):
    """
    Delete a credential record.
    """
    doc = await repo.get_by_id(credential_id, current_user.login)
    if not doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Credential not found"
        )
    
    deleted = await repo.delete(credential_id, current_user.login)
    if not deleted:
         raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete credential"
        )
    return {"status": "success", "message": "Credential deleted successfully"}
