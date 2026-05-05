import React, { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { chatAPI } from '../../services/api';
import { MessageSkeleton } from '../shared/Skeleton';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import './Chat.css';

const SESSION_ID = `session_${Date.now()}`;

const SUGGESTED_PROMPTS = [
  "Explain this topic in simple terms",
  "What are the key concepts I should know?",
  "Give me 5 practice questions on this",
  "Summarize the main ideas",
  "What's the difference between X and Y?",
];

function Message({ msg }) {
  const isUser = msg.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(msg.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`chat-message ${isUser ? 'user' : 'assistant'}`}>
      {!isUser && (
        <div className="chat-avatar ai-avatar">
          <span>✦</span>
        </div>
      )}
      <div className="chat-bubble-wrapper">
        <div className="chat-bubble">
          {isUser ? (
            <p>{msg.content}</p>
          ) : (
            <ReactMarkdown>{msg.content}</ReactMarkdown>
          )}
          {msg.streaming && (
            <span className="stream-cursor" aria-hidden="true">▋</span>
          )}
        </div>
        {!isUser && !msg.streaming && msg.id !== 'welcome' && (
          <button 
            className={`chat-copy-btn ${copied ? 'copied' : ''}`} 
            onClick={handleCopy}
            title="Copy to clipboard"
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
        )}
      </div>
      {isUser && (
        <div className="chat-avatar user-avatar">
          <span>U</span>
        </div>
      )}
    </div>
  );
}

export default function Chat() {
  const [messages, setMessages] = useState([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hey! I'm your AI study assistant. Upload your notes or just ask me anything — I can explain concepts, answer questions, and help you study smarter. 🚀",
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showSuggestions, setShowSuggestions] = useState(true);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  
  const activeDocumentId = localStorage.getItem('activeDocumentId');

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = useCallback(async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;

    setInput('');
    setShowSuggestions(false);
    setError(null);

    const userMsg = { id: Date.now(), role: 'user', content: userText };
    const aiMsgId = Date.now() + 1;

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    // Add empty AI message for streaming
    setMessages((prev) => [
      ...prev,
      { id: aiMsgId, role: 'assistant', content: '', streaming: true },
    ]);

    try {
      let fullText = '';
      
      const payloadMessages = messages
        .filter(m => m.role !== 'system' && m.id !== 'welcome')
        .map(m => ({ role: m.role, content: m.content }));
      
      payloadMessages.push({ role: 'user', content: userText });

      await chatAPI.streamMessage(
        { document_id: activeDocumentId, messages: payloadMessages },
        (chunk) => {
          fullText += chunk;
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, content: fullText } : m
            )
          );
        },
        () => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === aiMsgId ? { ...m, streaming: false } : m
            )
          );
          setLoading(false);
        },
        (err) => {
          // Fallback: use non-streaming endpoint
          chatAPI
            .sendMessage({ message: userText, sessionId: SESSION_ID })
            .then((data) => {
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === aiMsgId
                    ? { ...m, content: data.reply || data.message || 'Got it!', streaming: false }
                    : m
                )
              );
            })
            .catch((e) => {
              setError(e.message);
              setMessages((prev) => prev.filter((m) => m.id !== aiMsgId));
            })
            .finally(() => setLoading(false));
        }
      );
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  }, [input, loading]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const clearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: "Chat cleared! What would you like to study?",
    }]);
    setShowSuggestions(true);
    chatAPI.clearHistory(SESSION_ID).catch(() => {});
  };

  return (
    <div className="chat-page">
      <div className="chat-header">
        <div>
          <h1 className="chat-title">Ask AI</h1>
          <p className="chat-subtitle">
            {activeDocumentId ? 'Chatting about your document' : 'Please select a document from the Dashboard first'}
          </p>
        </div>
        <button className="chat-clear-btn" onClick={clearChat} title="Clear chat">
          🗑 Clear
        </button>
      </div>

      <div className="chat-messages" role="log" aria-live="polite">
        {messages.map((msg) => (
          <Message key={msg.id} msg={msg} />
        ))}
        {loading && !messages.some((m) => m.streaming) && <MessageSkeleton />}
        {error && (
          <ErrorDisplay
            message={error}
            onRetry={() => { setError(null); sendMessage(input); }}
          />
        )}
        <div ref={bottomRef} />
      </div>

      {showSuggestions && (
        <div className="chat-suggestions">
          {SUGGESTED_PROMPTS.map((prompt) => (
            <button
              key={prompt}
              className="chat-suggestion-chip"
              onClick={() => sendMessage(prompt)}
            >
              {prompt}
            </button>
          ))}
        </div>
      )}

      <div className="chat-input-bar">
        <textarea
          ref={inputRef}
          className="chat-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your study material…"
          rows={1}
          disabled={loading}
          aria-label="Message input"
        />
        <button
          className={`chat-send-btn ${loading ? 'loading' : ''}`}
          onClick={() => sendMessage()}
          disabled={loading || !input.trim() || !activeDocumentId}
          aria-label="Send message"
        >
          {loading ? <span className="send-spinner" /> : '↑'}
        </button>
      </div>
    </div>
  );
}
