from fastapi import APIRouter, Depends, UploadFile, File, HTTPException, status
from typing import List
from database import get_db, get_fs
from models.user import UserResponse
from models.document import DocumentResponse, DocumentCreate
from services.dependencies import get_current_user
from services.chunking import extract_text_from_pdf, chunk_text
from bson import ObjectId

router = APIRouter()

@router.post("/upload", response_model=DocumentResponse)
async def upload_document(
    file: UploadFile = File(...),
    current_user: UserResponse = Depends(get_current_user),
    db = Depends(get_db),
    fs = Depends(get_fs)
):
    if file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    file_bytes = await file.read()
    
    # Extract text and chunk
    try:
        text = extract_text_from_pdf(file_bytes)
        chunks = chunk_text(text)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Failed to parse PDF: {str(e)}")

    # Store file in GridFS
    grid_in = fs.open_upload_stream(file.filename, metadata={"content_type": file.content_type, "user_id": current_user.id})
    await grid_in.write(file_bytes)
    await grid_in.close()

    # Store document metadata
    doc = DocumentCreate(
        filename=file.filename,
        content_type=file.content_type,
        size=len(file_bytes),
        user_id=current_user.id,
        gridfs_id=str(grid_in._id),
        chunks=chunks
    )
    
    doc_dict = doc.dict()
    result = await db["documents"].insert_one(doc_dict)
    
    created_doc = await db["documents"].find_one({"_id": result.inserted_id})
    created_doc["id"] = str(created_doc["_id"])
    return DocumentResponse(**created_doc)

@router.get("", response_model=List[DocumentResponse])
async def list_documents(current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    cursor = db["documents"].find({"user_id": current_user.id})
    docs = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        docs.append(DocumentResponse(**doc))
    return docs

@router.get("/{doc_id}", response_model=DocumentResponse)
async def get_document(doc_id: str, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    doc = await db["documents"].find_one({"_id": ObjectId(doc_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
    doc["id"] = str(doc["_id"])
    return DocumentResponse(**doc)

@router.delete("/{doc_id}")
async def delete_document(doc_id: str, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db), fs = Depends(get_fs)):
    doc = await db["documents"].find_one({"_id": ObjectId(doc_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    await fs.delete(ObjectId(doc["gridfs_id"]))
    await db["documents"].delete_one({"_id": ObjectId(doc_id)})
    
    return {"detail": "Document deleted successfully"}
