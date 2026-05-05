import os
import json
import google.generativeai as genai
from config import settings

genai.configure(api_key=settings.gemini_api_key)

# We use Gemini 2.0 Flash for standard tasks, 2.5 Pro for complex ones
FLASH_MODEL = "gemini-2.5-flash"
PROMPT_SUFFIX = "\n\nIMPORTANT: Return ONLY valid JSON. Do not include markdown code blocks like ```json or any explanations. Start your response with { and end with }."

def get_model(model_name: str = FLASH_MODEL):
    return genai.GenerativeModel(model_name)

async def generate_json(prompt: str, model_name: str = FLASH_MODEL, retries: int = 1) -> dict:
    model = get_model(model_name)
    full_prompt = prompt + PROMPT_SUFFIX
    
    for attempt in range(retries + 1):
        try:
            response = await model.generate_content_async(full_prompt)
            text = response.text.strip()
            
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]
            text = text.strip()
            
            return json.loads(text)
        except json.JSONDecodeError:
            if attempt == retries:
                raise ValueError("Failed to parse JSON from AI response after retries.")
            # Stricter prompt for retry
            full_prompt = prompt + "\n\nWARNING: Your previous response was not valid JSON. You MUST return strictly valid JSON format with no additional text, code fences, or preamble."
        except Exception as e:
            raise e

async def generate_quiz(text_chunks: list[str]) -> dict:
    context = " ".join(text_chunks[:5]) # Use first few chunks to avoid token limits for now
    prompt = f"""Generate a comprehensive quiz based on the following text. 
Format: {{ 
  "questions": [ 
    {{ 
      "question": "Question text", 
      "type": "mcq", 
      "options": ["Choice A", "Choice B", "Choice C", "Choice D"], 
      "correctAnswer": "Exact string of the correct choice",
      "explanation": "Brief explanation" 
    }},
    {{
      "question": "True/False statement",
      "type": "true_false",
      "correctAnswer": "True",
      "explanation": "Brief explanation"
    }},
    {{
      "question": "Short answer question",
      "type": "short_answer",
      "correctAnswer": "Expected answer",
      "explanation": "Brief explanation"
    }}
  ] 
}}
Text: {context}"""
    return await generate_json(prompt)

async def generate_flashcards(text_chunks: list[str]) -> dict:
    context = " ".join(text_chunks[:5])
    prompt = f"""Generate a deck of flashcards from the following text.
Format: {{ 
  "cards": [ 
    {{ 
      "front": "Term or Question", 
      "back": "Definition or Answer",
      "difficulty": "easy|medium|hard",
      "tags": ["topic1", "topic2"] 
    }} 
  ] 
}}
Text: {context}"""
    return await generate_json(prompt)

async def generate_summary(text_chunks: list[str]) -> dict:
    context = " ".join(text_chunks[:5])
    prompt = f"""Provide a detailed summary and breakdown of the following text.
Format: {{ 
  "summary": "Overall high-level summary paragraph", 
  "topics": [ 
    {{ 
      "title": "Topic Heading", 
      "description": "Detailed explanation of this topic in markdown format", 
      "difficulty": 0,
      "keyPoints": ["Point 1", "Point 2"]
    }} 
  ] 
}}
Note: difficulty should be 0 (Beginner), 1 (Intermediate), or 2 (Advanced).
Text: {context}"""
    return await generate_json(prompt)
