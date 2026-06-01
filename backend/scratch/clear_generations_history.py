import sys
import os
from pymongo import MongoClient

# Add backend directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.core.config import settings

def main():
    print("Connecting to MongoDB...")
    if not settings.MONGODB_URL:
        print("ERROR: MONGODB_URL is not set!")
        return

    client = MongoClient(settings.MONGODB_URL)
    db = client[settings.DATABASE_NAME]
    
    print(f"Database: {settings.DATABASE_NAME}")
    print("Purging 'generations' collection...")
    
    # Drop the generations collection
    db.generations.drop()
    
    print("SUCCESS: Generations collection has been successfully dropped!")
    
if __name__ == "__main__":
    main()
