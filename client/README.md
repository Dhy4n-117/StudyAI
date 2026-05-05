# StudyAI Frontend 

A polished, production-ready React frontend for all AI-powered study screens.

## Features Built

| Feature | Details |
|---|---|
| **Chat Interface** | Streaming AI responses, message bubbles, suggested prompts, history clear |
| **Quiz Generator** | MCQ, True/False, Short Answer layouts, score screen, PDF export |
| **Flashcard Viewer** | 3D flip animation, deck list, "Got It / Still Learning" progress, CSV export |
| **Topic Summaries** | Collapsible sections, difficulty tags (Beginner/Intermediate/Advanced), key points |
| **API Layer** | Full Axios integration for all backend endpoints + streaming support |
| **Export** | Quiz → PDF (with scores), Flashcards → CSV |
| **Loading States** | Skeleton loaders on every screen |
| **Error Handling** | ErrorBoundary + per-screen ErrorDisplay with retry |

## Tech Stack

- React 18 + React Router v6
- Axios (API calls) + native fetch (streaming)
- jsPDF (quiz PDF export)
- PapaParse (flashcard CSV export)
- react-markdown (AI response rendering)

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Set up environment
cp .env.example .env
# Edit .env and set REACT_APP_API_URL to your backend URL

# 3. Start development server
npm start
```

## Project Structure

```
src/
├── assets/styles/
│   └── globals.css          # Design tokens, animations, global styles
├── components/
│   ├── Chat/
│   │   ├── Chat.jsx         # Streaming chat with message bubbles
│   │   └── Chat.css
│   ├── Quiz/
│   │   ├── Quiz.jsx         # MCQ + T/F + Short Answer + Score screen
│   │   └── Quiz.css
│   ├── Flashcard/
│   │   ├── Flashcard.jsx    # 3D flip cards, deck list, progress
│   │   └── Flashcard.css
│   ├── Summary/
│   │   ├── Summary.jsx      # Collapsible topic summaries
│   │   └── Summary.css
│   └── shared/
│       ├── Sidebar.jsx      # Navigation
│       ├── Skeleton.jsx     # Loading skeletons
│       └── ErrorDisplay.jsx # Error states + ErrorBoundary
├── services/
│   └── api.js               # All API calls (chat, quiz, flashcard, summary)
├── utils/
│   └── exportUtils.js       # PDF + CSV export logic
├── App.js                   # Router setup
└── index.js                 # Entry point
```

## API Endpoints Expected from Backend

```
POST   /api/chat/message          { message, sessionId }
POST   /api/chat/stream           { message, sessionId }     ← streaming
DELETE /api/chat/history/:id

POST   /api/quiz/generate         { topic, type, count }
POST   /api/quiz/submit           { quizId, answers }
GET    /api/quiz/results/:id

POST   /api/flashcards/generate   { topic, count }
GET    /api/flashcards/decks
GET    /api/flashcards/decks/:id

POST   /api/summary/generate      { topic, difficulty }
GET    /api/summary/all
```

## Design System

Dark theme with Syne (display) + DM Sans (body) fonts. CSS variables for all tokens. Responsive sidebar collapses on mobile.
