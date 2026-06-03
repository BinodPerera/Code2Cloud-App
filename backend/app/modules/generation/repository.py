from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase
from datetime import datetime

class GenerationRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.generations

    async def insert_generation(self, record: Dict[str, Any]) -> None:
        """
        Insert a new generation record.
        """
        await self.collection.insert_one(record)

    async def get_by_id(self, generation_id: str) -> Optional[Dict[str, Any]]:
        """
        Fetch a generation record by its unique generation ID.
        """
        return await self.collection.find_one({"generation_id": generation_id})

    async def get_history_by_user(self, user_id: str) -> List[Dict[str, Any]]:
        """
        Fetch all generated configurations for the user, sorted by timestamp descending,
        excluding the heavy generated_code content.
        """
        cursor = self.collection.find({"user_id": user_id}).sort("timestamp", -1)
        history = []
        async for doc in cursor:
            doc["_id"] = str(doc["_id"])
            if "generated_code" in doc:
                del doc["generated_code"]
            history.append(doc)
        return history

    async def update_generation_code(
        self, generation_id: str, new_code: Dict[str, str], url: Optional[str] = None
    ) -> None:
        """
        Update generation code and optionally the cloud download URL.
        """
        update_fields = {
            "generated_code": new_code,
            "timestamp": datetime.utcnow().isoformat()
        }
        if url:
            update_fields["url"] = url

        await self.collection.update_one(
            {"generation_id": generation_id},
            {"$set": update_fields}
        )

    async def mark_as_committed(self, generation_id: str) -> None:
        """
        Mark the generation as committed to repository.
        """
        await self.collection.update_one(
            {"generation_id": generation_id},
            {"$set": {"committed": True}}
        )
