from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from models.user import PyObjectId

# Quiz Models
class Question(BaseModel):
    question: str
    type: str
    options: List[str] = []
    answer: str

class QuizCreate(BaseModel):
    document_id: str
    questions: List[Question]

class QuizResponse(QuizCreate):
    id: str
    user_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class QuizSubmit(BaseModel):
    answers: dict # question index -> user answer

# Flashcard Models (SM-2)
class Flashcard(BaseModel):
    term: str
    definition: str
    # SM-2 fields
    ease_factor: float = 2.5
    interval: int = 0
    repetition: int = 0
    next_review: datetime = Field(default_factory=datetime.utcnow)

class FlashcardDeckCreate(BaseModel):
    document_id: str
    cards: List[Flashcard]

class FlashcardReview(BaseModel):
    quality: int # 0-5 for SM-2
