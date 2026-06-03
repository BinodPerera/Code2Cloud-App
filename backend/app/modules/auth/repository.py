from typing import Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase

class UserRepository:
    def __init__(self, db: AsyncIOMotorDatabase):
        self.db = db
        self.collection = db.users

    async def get_by_login(self, login: str) -> Optional[Dict[str, Any]]:
        """
        Fetch user details from MongoDB by their login name.
        """
        return await self.collection.find_one({"login": login})

    async def upsert_user(self, login: str, user_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Create or update user details in MongoDB.
        """
        await self.collection.update_one(
            {"login": login},
            {"$set": user_data},
            upsert=True
        )
        return user_data
