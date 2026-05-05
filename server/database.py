from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from config import settings

class Database:
    client: AsyncIOMotorClient = None
    db = None
    fs: AsyncIOMotorGridFSBucket = None

db_config = Database()

def connect_to_mongo():
    db_config.client = AsyncIOMotorClient(settings.mongodb_url)
    db_config.db = db_config.client[settings.database_name]
    db_config.fs = AsyncIOMotorGridFSBucket(db_config.db)

def close_mongo_connection():
    if db_config.client:
        db_config.client.close()

def get_db():
    return db_config.db

def get_fs():
    return db_config.fs
