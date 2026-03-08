from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class MongoDB:
    client: AsyncIOMotorClient = None
    db = None

db = MongoDB()

async def get_database():
    if db.client is None:
        db.client = AsyncIOMotorClient(settings.MONGODB_URL)
        db.db = db.client[settings.DATABASE_NAME]
    return db.db

async def close_mongo_connection():
    if db.client:
        db.client.close()
