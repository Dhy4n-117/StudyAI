import json
from fastapi import APIRouter, Depends, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional
from bson import ObjectId
import google.generativeai as genai

from database import get_db
from models.user import UserResponse
from services.dependencies import get_current_user
from config import settings

router = APIRouter()
genai.configure(api_key=settings.gemini_api_key)
model = genai.GenerativeModel('gemini-2.5-flash')

class Message(BaseModel):
    role: str
    content: str

class ChatRequest(BaseModel):
    document_id: str
    messages: List[Message]

@router.post("/chat")
async def chat_stream(request: Request, chat_req: ChatRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    doc = await db["documents"].find_one({"_id": ObjectId(chat_req.document_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    # Construct context from document chunks
    context = " ".join(doc.get("chunks", [])[:10]) # Use first 10 chunks to avoid limits
    
    # Construct history for Gemini
    history = [
        {"role": "user", "parts": [f"Here is the context document: {context}. Please answer my questions based on this document."]},
        {"role": "model", "parts": ["I understand. I am ready to answer your questions based on the document."]}
    ]
    
    for msg in chat_req.messages[:-1]:
        history.append({
            "role": "model" if msg.role == "assistant" else "user",
            "parts": [msg.content]
        })
        
    last_user_message = chat_req.messages[-1].content
    
    async def event_generator():
        try:
            chat = model.start_chat(history=history)
            response = await chat.send_message_async(last_user_message, stream=True)
            
            async for chunk in response:
                if await request.is_disconnected():
                    break
                if chunk.text:
                    # SSE format: data: {"text": "..."}\n\n
                    data = json.dumps({"text": chunk.text})
                    yield f"data: {data}\n\n"
                    
            yield "data: [DONE]\n\n"
        except Exception as e:
            error_data = json.dumps({"error": str(e)})
            yield f"data: {error_data}\n\n"

    return StreamingResponse(event_generator(), media_type="text/event-stream")

@router.post("/chat/message")
async def chat_message(chat_req: ChatRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    doc = await db["documents"].find_one({"_id": ObjectId(chat_req.document_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    context = " ".join(doc.get("chunks", [])[:10])
    
    history = [
        {"role": "user", "parts": [f"Context: {context}"]},
        {"role": "model", "parts": ["Understood."]}
    ]
    
    for msg in chat_req.messages[:-1]:
        history.append({"role": "model" if msg.role == "assistant" else "user", "parts": [msg.content]})
        
    chat = model.start_chat(history=history)
    response = await chat.send_message_async(chat_req.messages[-1].content)
    
    return {"reply": response.text}

@router.post("/chat/clear/{session_id}")
async def clear_chat(session_id: str):
    return {"status": "ok"}
