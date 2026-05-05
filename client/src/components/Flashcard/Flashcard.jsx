import React, { useState, useCallback, useEffect } from 'react';
import { flashcardAPI } from '../../services/api';
import { exportFlashcardsAsCSV } from '../../utils/exportUtils';
import { SkeletonCard } from '../shared/Skeleton';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import './Flashcard.css';

const DIFFICULTY_COLORS = {
  easy: 'var(--mint)',
  medium: 'var(--amber)',
  hard: 'var(--rose)',
};

// ── Single Flashcard ──────────────────────────────────────────────────────────
function FlashCard({ card, index, total, onKnow, onSkip }) {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => { setFlipped(false); }, [index]);

  return (
    <div className="fc-wrapper">
      <div className="fc-counter">
        <span>{index + 1}</span> / <span>{total}</span>
      </div>

      <div
        className={`fc-card ${flipped ? 'flipped' : ''}`}
        onClick={() => setFlipped((f) => !f)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === ' ' && setFlipped((f) => !f)}
        aria-label={flipped ? 'Back side. Click to flip.' : 'Front side. Click to reveal answer.'}
      >
        <div className="fc-inner">
          <div className="fc-front">
            <div className="fc-side-label">Question</div>
            <p className="fc-text">{card.front}</p>
            <div className="fc-hint">tap to reveal →</div>
          </div>
          <div className="fc-back">
            <div className="fc-side-label answer">Answer</div>
            <p className="fc-text">{card.back}</p>
            {card.tags?.length > 0 && (
              <div className="fc-tags">
                {card.tags.map((t) => <span key={t} className="fc-tag">{t}</span>)}
              </div>
            )}
          </div>
        </div>
        {card.difficulty && (
          <div
            className="fc-difficulty"
            style={{ background: DIFFICULTY_COLORS[card.difficulty] + '22', color: DIFFICULTY_COLORS[card.difficulty] }}
          >
            {card.difficulty}
          </div>
        )}
      </div>

      {flipped && (
        <div className="fc-actions" style={{ animation: 'fadeUp 0.25s ease' }}>
          <button className="fc-action-btn skip" onClick={onSkip}>
            <span>✗</span> Still Learning
          </button>
          <button className="fc-action-btn know" onClick={onKnow}>
            <span>✓</span> Got It!
          </button>
        </div>
      )}
    </div>
  );
}

// ── Progress Bar ──────────────────────────────────────────────────────────────
function ProgressBar({ known, skipped, total }) {
  const knownPct = (known / total) * 100;
  const skippedPct = (skipped / total) * 100;
  return (
    <div className="fc-progress-bar-wrap">
      <div className="fc-progress-bar">
        <div className="fc-progress-known" style={{ width: `${knownPct}%` }} />
        <div className="fc-progress-skipped" style={{ width: `${skippedPct}%`, left: `${knownPct}%` }} />
      </div>
      <div className="fc-progress-legend">
        <span className="legend-known">✓ {known} known</span>
        <span className="legend-skip">✗ {skipped} reviewing</span>
        <span className="legend-left">{total - known - skipped} left</span>
      </div>
    </div>
  );
}

// ── Deck Complete ─────────────────────────────────────────────────────────────
function DeckComplete({ known, total, deck, onRestart, onBack }) {
  const pct = Math.round((known / total) * 100);
  return (
    <div className="fc-complete" style={{ animation: 'bounce-in 0.4s ease' }}>
      <div className="fc-complete-icon">🎉</div>
      <h2 className="fc-complete-title">Deck Complete!</h2>
      <div className="fc-complete-stat">
        <span className="fc-complete-pct">{pct}%</span>
        <span className="fc-complete-label">mastered</span>
      </div>
      <p className="fc-complete-sub">{known} of {total} cards nailed</p>
      <div className="fc-complete-actions">
        <button className="fc-cta primary" onClick={onRestart}>🔁 Restart Deck</button>
        <button className="fc-cta secondary" onClick={() => exportFlashcardsAsCSV(deck)}>⬇ Export CSV</button>
        <button className="fc-cta ghost" onClick={onBack}>← All Decks</button>
      </div>
    </div>
  );
}

// ── Deck List ─────────────────────────────────────────────────────────────────
function DeckList({ decks, onSelect, onGenerate }) {
  return (
    <div className="fc-deck-list">
      <button className="fc-new-deck-btn" onClick={onGenerate}>
        <span>＋</span> Generate New Deck
      </button>
      {decks.map((deck, i) => (
        <button
          key={deck.id || i}
          className="fc-deck-card"
          onClick={() => onSelect(deck)}
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          <div className="fc-deck-info">
            <h3 className="fc-deck-title">{deck.title}</h3>
            <p className="fc-deck-meta">{deck.cards.length} cards · {deck.topic || 'General'}</p>
          </div>
          <div className="fc-deck-arrow">→</div>
        </button>
      ))}
    </div>
  );
}

// ── Generate Form ─────────────────────────────────────────────────────────────
function GenerateForm({ onGenerate, loading, onCancel }) {
  const activeDocumentId = localStorage.getItem('activeDocumentId');

  return (
    <div className="fc-generate-form" style={{ animation: 'fadeUp 0.3s ease' }}>
      <div className="fc-gen-card">
        <h2 className="fc-gen-title">🃏 New Flashcard Deck</h2>
        <div className="quiz-field">
          <p className="quiz-setup-sub">
            {activeDocumentId ? 'Generate flashcards from your active document.' : 'Please select a document from the Dashboard first.'}
          </p>
        </div>
        
        <div className="fc-gen-actions">
          <button className="fc-gen-cancel" onClick={onCancel}>Cancel</button>
          <button
            className="quiz-generate-btn"
            onClick={() => onGenerate({ document_id: activeDocumentId })}
            disabled={loading || !activeDocumentId}
            style={{ flex: 1 }}
          >
            {loading ? <><span className="btn-spinner" /> Generating…</> : <><span>⚡</span> Create Deck</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main Flashcard Page ───────────────────────────────────────────────────────
export default function Flashcards() {
  const [stage, setStage] = useState('list'); // list | generate | study | complete
  const [decks, setDecks] = useState([]);
  const [activeDeck, setActiveDeck] = useState(null);
  const [cardIndex, setCardIndex] = useState(0);
  const [known, setKnown] = useState(0);
  const [skipped, setSkipped] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    flashcardAPI.getDecks()
      .then((data) => setDecks(data?.decks || data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const generateDeck = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await flashcardAPI.generate(params);
      const newDeck = { id: Date.now(), title: 'Document Deck', cards: data?.cards || [] };
      setDecks((prev) => [newDeck, ...prev]);
      startDeck(newDeck);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const startDeck = (deck) => {
    setActiveDeck(deck);
    setCardIndex(0);
    setKnown(0);
    setSkipped(0);
    setStage('study');
  };

  const handleKnow = () => {
    setKnown((k) => k + 1);
    flashcardAPI.review(activeDeck.cards[cardIndex].id, { quality: 5 }).catch(() => {});
    nextCard();
  };

  const handleSkip = () => {
    setSkipped((s) => s + 1);
    flashcardAPI.review(activeDeck.cards[cardIndex].id, { quality: 1 }).catch(() => {});
    nextCard();
  };

  const nextCard = () => {
    if (!activeDeck) return;
    if (cardIndex >= activeDeck.cards.length - 1) {
      setStage('complete');
    } else {
      setCardIndex((i) => i + 1);
    }
  };

  if (stage === 'generate') {
    return (
      <div className="fc-page">
        <div className="quiz-header">
          <h1 className="quiz-page-title" style={{ background: 'linear-gradient(135deg, var(--text) 40%, var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            New Deck
          </h1>
        </div>
        {error && <div style={{ padding: '0 32px 16px' }}><ErrorDisplay message={error} onRetry={() => setError(null)} /></div>}
        <GenerateForm
          onGenerate={generateDeck}
          loading={loading}
          onCancel={() => setStage('list')}
        />
      </div>
    );
  }

  if (stage === 'study' && activeDeck) {
    return (
      <div className="fc-page">
        <div className="quiz-header">
          <div>
            <h1 className="quiz-page-title" style={{ background: 'linear-gradient(135deg, var(--text) 40%, var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
              {activeDeck.title}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="quiz-export-btn" onClick={() => exportFlashcardsAsCSV(activeDeck)}>⬇ CSV</button>
            <button className="quiz-back-btn" onClick={() => setStage('list')}>← Decks</button>
          </div>
        </div>
        <ProgressBar known={known} skipped={skipped} total={activeDeck.cards.length} />
        <FlashCard
          card={activeDeck.cards[cardIndex]}
          index={cardIndex}
          total={activeDeck.cards.length}
          onKnow={handleKnow}
          onSkip={handleSkip}
        />
      </div>
    );
  }

  if (stage === 'complete') {
    return (
      <div className="fc-page">
        <div className="quiz-header">
          <h1 className="quiz-page-title" style={{ background: 'linear-gradient(135deg, var(--text) 40%, var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Complete!
          </h1>
        </div>
        <DeckComplete
          known={known}
          total={activeDeck.cards.length}
          deck={activeDeck}
          onRestart={() => { setCardIndex(0); setKnown(0); setSkipped(0); setStage('study'); }}
          onBack={() => setStage('list')}
        />
      </div>
    );
  }

  return (
    <div className="fc-page">
      <div className="quiz-header">
        <div>
          <h1 className="quiz-page-title" style={{ background: 'linear-gradient(135deg, var(--text) 40%, var(--mint))', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
            Flashcards
          </h1>
          <p className="quiz-page-sub">{decks.length} deck{decks.length !== 1 ? 's' : ''} saved</p>
        </div>
      </div>

      {error && <div style={{ padding: '0 32px 16px' }}><ErrorDisplay message={error} /></div>}

      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 32px 32px' }}>
        {loading
          ? <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>{[1,2,3].map(i => <SkeletonCard key={i} />)}</div>
          : <DeckList decks={decks} onSelect={startDeck} onGenerate={() => setStage('generate')} />
        }
      </div>
    </div>
  );
}
