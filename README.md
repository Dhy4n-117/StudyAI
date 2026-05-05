# StudyAI - Premium Study Assistant 🎓✨

StudyAI is a professional, full-stack AI-powered study platform designed to help students and researchers master their documents. Upload a PDF, and instantly generate summaries, interactive quizzes, flashcards, and chat with your material using Google's Gemini Pro.

![StudyAI Banner](https://img.shields.io/badge/AI-Gemini--Pro-blueviolet?style=for-the-badge&logo=google-gemini)
![Frontend](https://img.shields.io/badge/Frontend-React-61DAFB?style=for-the-badge&logo=react)
![Backend](https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi)

## 🚀 Key Features

- **🧠 Intelligent Chat**: Context-aware chatting with your PDFs. Ask questions, clarify concepts, and get instant answers.
- **📝 Automatic Summarization**: Condense long documents into key topics and bullet points.
- **🧠 Quiz Generator**: Automatically generate multiple-choice questions to test your knowledge.
- **🃏 Smart Flashcards**: Spaced-repetition flashcards generated directly from your content.
- **🏛️ Premium UX**: Cinematic "Desktop Menu" animations, shimmering branding, and full mobile responsiveness.
- **🛡️ Secure Auth**: Robust JWT-based authentication for your study sessions.

## 🛠️ Tech Stack

- **Frontend**: React, React Router, Axios, CSS3 (Glassmorphism & Custom Animations).
- **Backend**: FastAPI (Python), Motor (Async MongoDB), PyMuPDF (PDF Extraction).
- **AI Engine**: Google Gemini Pro (Generative AI).
- **Database**: MongoDB (GridFS for document storage).

## 📦 Installation & Setup

### 1. Prerequisites
- Python 3.9+
- Node.js 16+
- MongoDB instance (Atlas or Local)
- Google AI (Gemini) API Key

### 2. Backend Setup
```bash
cd server
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```
Create a `.env` file in `/server`:
```env
MONGODB_URL=your_mongodb_url
SECRET_KEY=your_secret_key
GOOGLE_API_KEY=your_gemini_key
```
Run server: `uvicorn main:app --reload`

### 3. Frontend Setup
```bash
cd client
npm install
npm run dev
```

## 📐 Design Philosophy
StudyAI focuses on a **Premium Dark Aesthetic**, utilizing curated gradients, subtle micro-animations, and a highly responsive layout to ensure that studying feels like a high-end experience on both desktop and mobile.

---
Built with ❤️ for better learning.
