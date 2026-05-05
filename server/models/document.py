from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from models.user import PyObjectId

class DocumentBase(BaseModel):
    filename: str
    content_type: str
    size: int

class DocumentCreate(DocumentBase):
    user_id: str
    gridfs_id: str
    chunks: List[str] = []
    created_at: datetime = Field(default_factory=datetime.utcnow)

class DocumentResponse(DocumentBase):
    id: str
    user_id: str
    created_at: datetime
    
    class Config:
        populate_by_name = True
