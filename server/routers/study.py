from fastapi import APIRouter, Depends, HTTPException
import traceback
from typing import List
from pydantic import BaseModel
from bson import ObjectId
from database import get_db
from models.user import UserResponse
from models.study import QuizCreate, FlashcardDeckCreate, FlashcardReview, Flashcard
from services.dependencies import get_current_user
from services.ai_service import generate_quiz, generate_flashcards, generate_summary
from datetime import datetime, timedelta

router = APIRouter()

class GenerateRequest(BaseModel):
    document_id: str

@router.post("/quiz/generate")
async def create_quiz(req: GenerateRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    document_id = req.document_id
    doc = await db["documents"].find_one({"_id": ObjectId(document_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        quiz_data = await generate_quiz(doc["chunks"])
        quiz = {
            "document_id": document_id,
            "user_id": current_user.id,
            "questions": quiz_data.get("questions", []),
            "created_at": datetime.utcnow()
        }
        result = await db["quizzes"].insert_one(quiz)
        quiz["id"] = str(result.inserted_id)
        del quiz["_id"]
        return quiz
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/flashcards/generate")
async def create_flashcards(req: GenerateRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    document_id = req.document_id
    doc = await db["documents"].find_one({"_id": ObjectId(document_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        flashcards_data = await generate_flashcards(doc["chunks"])
        cards = flashcards_data.get("cards", [])
        
        # Add SM-2 default fields
        for card in cards:
            card["ease_factor"] = 2.5
            card["interval"] = 0
            card["repetition"] = 0
            card["next_review"] = datetime.utcnow()
            card["user_id"] = current_user.id
            card["document_id"] = document_id
            
        if cards:
            await db["flashcards"].insert_many(cards)
            
        # retrieve inserted to return string ids
        cursor = db["flashcards"].find({"document_id": document_id, "user_id": current_user.id})
        result = []
        async for c in cursor:
            c["id"] = str(c["_id"])
            del c["_id"]
            result.append(c)
        return {"cards": result}
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.patch("/flashcards/{card_id}/review")
async def review_flashcard(card_id: str, review: FlashcardReview, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    card = await db["flashcards"].find_one({"_id": ObjectId(card_id), "user_id": current_user.id})
    if not card:
        raise HTTPException(status_code=404, detail="Flashcard not found")
        
    q = review.quality
    if q < 0 or q > 5:
        raise HTTPException(status_code=400, detail="Quality must be between 0 and 5")
        
    # SM-2 Algorithm
    repetition = card.get("repetition", 0)
    interval = card.get("interval", 0)
    ease_factor = card.get("ease_factor", 2.5)
    
    if q >= 3:
        if repetition == 0:
            interval = 1
        elif repetition == 1:
            interval = 6
        else:
            interval = int(interval * ease_factor)
        repetition += 1
    else:
        repetition = 0
        interval = 1
        
    ease_factor = ease_factor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    if ease_factor < 1.3:
        ease_factor = 1.3
        
    next_review = datetime.utcnow() + timedelta(days=interval)
    
    update_data = {
        "repetition": repetition,
        "interval": interval,
        "ease_factor": ease_factor,
        "next_review": next_review
    }
    
    await db["flashcards"].update_one({"_id": ObjectId(card_id)}, {"$set": update_data})
    
    card.update(update_data)
    card["id"] = str(card["_id"])
    del card["_id"]
    return card

@router.post("/summary/generate")
async def create_summary(req: GenerateRequest, current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    document_id = req.document_id
    doc = await db["documents"].find_one({"_id": ObjectId(document_id), "user_id": current_user.id})
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found")
        
    try:
        summary_data = await generate_summary(doc["chunks"])
        summary = {
            "document_id": document_id,
            "user_id": current_user.id,
            "summary": summary_data.get("summary", ""),
            "topics": summary_data.get("topics", []),
            "created_at": datetime.utcnow()
        }
        result = await db["summaries"].insert_one(summary)
        summary["id"] = str(result.inserted_id)
        del summary["_id"]
        return summary
    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/flashcards/decks")
async def get_flashcard_decks(current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    pipeline = [
        {"$match": {"user_id": current_user.id}},
        {"$group": {
            "_id": "$document_id",
            "cards": {"$push": "$$ROOT"}
        }}
    ]
    cursor = db["flashcards"].aggregate(pipeline)
    decks = []
    async for doc in cursor:
        doc_info = await db["documents"].find_one({"_id": ObjectId(doc["_id"])})
        title = doc_info["filename"] if doc_info else "Document Deck"
        cards = doc["cards"]
        for c in cards:
            c["id"] = str(c["_id"])
            del c["_id"]
        decks.append({
            "id": str(doc["_id"]),
            "title": title,
            "cards": cards,
            "topic": "General"
        })
    return {"decks": decks}

@router.get("/summary/all")
async def get_all_summaries(current_user: UserResponse = Depends(get_current_user), db = Depends(get_db)):
    cursor = db["summaries"].find({"user_id": current_user.id}).sort("created_at", -1)
    summaries = []
    async for s in cursor:
        s["id"] = str(s["_id"])
        del s["_id"]
        summaries.append(s)
    return {"summaries": summaries}

