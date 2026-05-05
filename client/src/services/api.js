import axios from 'axios';

const BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { 'Content-Type': 'application/json' },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.detail || error.response?.data?.message || error.message || 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Auth & Documents ──────────────────────────────────────────────────────────
export const authAPI = {
  login: (payload) => api.post('/auth/login', payload, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  }),
  register: (payload) => api.post('/auth/register', payload),
};

export const documentAPI = {
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getAll: () => api.get('/documents'),
  delete: (id) => api.delete(`/documents/${id}`),
};

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatAPI = {
  sendMessage: (payload) => api.post('/chat/message', payload),
  clearHistory: (sessionId) => api.post(`/chat/clear/${sessionId}`),
  streamMessage: async (payload, onChunk, onDone, onError) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${BASE_URL}/chat`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload),
      });
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) { onDone(); break; }
        
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop(); // Keep partial line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const dataStr = line.slice(6);
            if (dataStr === '[DONE]') {
              onDone();
              return;
            }
            try {
              const data = JSON.parse(dataStr);
              if (data.error) {
                onError(new Error(data.error));
                return;
              }
              if (data.text) {
                onChunk(data.text);
              }
            } catch (e) {
              console.error('Error parsing SSE data:', e);
            }
          }
        }
      }
    } catch (err) {
      onError(err);
    }
  },
};

// ─── Quiz ──────────────────────────────────────────────────────────────────────
export const quizAPI = {
  generate: (payload) => api.post('/quiz/generate', payload),
  submit: (payload) => api.post('/quiz/submit', payload),
  getResults: (quizId) => api.get(`/quiz/results/${quizId}`),
};

// ─── Flashcards ────────────────────────────────────────────────────────────────
export const flashcardAPI = {
  generate: (payload) => api.post('/flashcards/generate', payload),
  review: (cardId, payload) => api.patch(`/flashcards/${cardId}/review`, payload),
  getDecks: () => api.get('/flashcards/decks'),
  getDeck: (deckId) => api.get(`/flashcards/decks/${deckId}`),
  saveDeck: (payload) => api.post('/flashcards/decks', payload),
};

// ─── Summary ───────────────────────────────────────────────────────────────────
export const summaryAPI = {
  generate: (payload) => api.post('/summary/generate', payload),
  getAll: () => api.get('/summary/all'),
};

export default api;
