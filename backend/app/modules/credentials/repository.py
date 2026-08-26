import uuid
from datetime import datetime
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from app.core.encryption import SymmetricEncryptor

class CredentialRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.credentials

    def _encrypt_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Encrypt all string values in the credential data dictionary.
        """
        encrypted_data = {}
        for k, v in data.items():
            if isinstance(v, str):
                encrypted_data[k] = SymmetricEncryptor.encrypt(v)
            else:
                encrypted_data[k] = v
        return encrypted_data

    def _decrypt_data(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Decrypt all encrypted string values in the credential data dictionary.
        """
        decrypted_data = {}
        for k, v in data.items():
            if isinstance(v, str):
                decrypted_data[k] = SymmetricEncryptor.decrypt(v)
            else:
                decrypted_data[k] = v
        return decrypted_data

    async def list_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all credentials for a user and decrypt their data.
        """
        cursor = self.collection.find({"user_id": user_id}).sort("created_at", -1)
        credentials = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "data" in doc:
                doc["data"] = self._decrypt_data(doc["data"])
            credentials.append(doc)
        return credentials

    async def get_by_id(self, credential_id: str, user_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a single credential by its ID, ensuring user ownership, and decrypt its data.
        """
        doc = await self.collection.find_one({"credential_id": credential_id, "user_id": user_id})
        if doc:
            doc["_id"] = str(doc["_id"])
            if "data" in doc:
                doc["data"] = self._decrypt_data(doc["data"])
            return doc
        return None

    async def create(self, user_id: str, name: str, provider: str, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create a new credential record with encrypted data.
        """
        credential_id = f"cred_{uuid.uuid4().hex[:8]}"
        encrypted_data = self._encrypt_data(data)
        
        record = {
            "credential_id": credential_id,
            "user_id": user_id,
            "name": name,
            "provider": provider,
            "data": encrypted_data,
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        await self.collection.insert_one(record)
        
        # Return decrypted version for confirmation
        record["data"] = data
        if "_id" in record:
            record["_id"] = str(record["_id"])
        return record

    async def update(self, credential_id: str, user_id: str, name: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        Update an existing credential record and encrypt its data.
        """
        encrypted_data = self._encrypt_data(data)
        update_fields = {
            "name": name,
            "data": encrypted_data,
            "updated_at": datetime.utcnow().isoformat()
        }
        
        result = await self.collection.update_one(
            {"credential_id": credential_id, "user_id": user_id},
            {"$set": update_fields}
        )
        
        if result.modified_count > 0 or result.matched_count > 0:
            updated_doc = await self.collection.find_one({"credential_id": credential_id, "user_id": user_id})
            if updated_doc:
                updated_doc["_id"] = str(updated_doc["_id"])
                updated_doc["data"] = data
                return updated_doc
        return None

    async def delete(self, credential_id: str, user_id: str) -> bool:
        """
        Delete a credential record.
        """
        result = await self.collection.delete_one({"credential_id": credential_id, "user_id": user_id})
        return result.deleted_count > 0
