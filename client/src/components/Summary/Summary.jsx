import React, { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { summaryAPI } from '../../services/api';
import { SkeletonCard } from '../shared/Skeleton';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import './Summary.css';

const DIFFICULTY_LABELS = ['Beginner', 'Intermediate', 'Advanced'];
const DIFFICULTY_COLORS = ['var(--mint)', 'var(--amber)', 'var(--rose)'];

// ── Collapsible Section ───────────────────────────────────────────────────────
function Section({ title, content, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`sum-section ${open ? 'open' : ''}`}>
      <button className="sum-section-header" onClick={() => setOpen((o) => !o)}>
        <span className="sum-section-title">{title}</span>
        <span className="sum-section-chevron">{open ? '▲' : '▼'}</span>
      </button>
      {open && (
        <div className="sum-section-body" style={{ animation: 'fadeUp 0.22s ease' }}>
          <ReactMarkdown>{content}</ReactMarkdown>
        </div>
      )}
    </div>
  );
}

// ── Summary Card ──────────────────────────────────────────────────────────────
function SummaryCard({ summary, index }) {
  const [expanded, setExpanded] = useState(false);
  const diff = summary.difficulty ?? 1;

  return (
    <div
      className="sum-card"
      style={{ animationDelay: `${index * 0.06}s` }}
    >
      <div className="sum-card-top">
        <div className="sum-card-meta">
          <span
            className="sum-diff-tag"
            style={{
              background: DIFFICULTY_COLORS[diff] + '1a',
              color: DIFFICULTY_COLORS[diff],
              borderColor: DIFFICULTY_COLORS[diff] + '44',
            }}
          >
            {DIFFICULTY_LABELS[diff]}
          </span>
          {summary.topic && (
            <span className="sum-topic-tag">{summary.topic}</span>
          )}
          <span className="sum-date">
            {summary.createdAt
              ? new Date(summary.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })
              : 'Recent'}
          </span>
        </div>
        <button
          className="sum-expand-btn"
          onClick={() => setExpanded((e) => !e)}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {expanded ? '−' : '＋'}
        </button>
      </div>

      <h2 className="sum-card-title">{summary.title}</h2>
      <p className="sum-card-preview">{summary.overview}</p>

      {expanded && summary.sections?.length > 0 && (
        <div className="sum-sections" style={{ animation: 'fadeUp 0.3s ease' }}>
          {summary.sections.map((sec, i) => (
            <Section
              key={i}
              title={sec.title}
              content={sec.content}
              defaultOpen={i === 0}
            />
          ))}
        </div>
      )}

      {summary.keyPoints?.length > 0 && (
        <div className="sum-key-points">
          <span className="sum-kp-label">Key Points</span>
          <ul className="sum-kp-list">
            {summary.keyPoints.slice(0, expanded ? undefined : 3).map((pt, i) => (
              <li key={i} className="sum-kp-item">
                <span className="sum-kp-dot" />
                {pt}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ── Generate Summary Form ─────────────────────────────────────────────────────
function GenerateForm({ onGenerate, loading }) {
  const activeDocumentId = localStorage.getItem('activeDocumentId');

  return (
    <div className="sum-gen-form">
      <div className="sum-gen-card">
        <div className="sum-gen-icon">📖</div>
        <h2 className="sum-gen-title">Generate a Summary</h2>
        <p className="sum-gen-sub">
          {activeDocumentId ? 'Generate a summary from your active document.' : 'Please select a document from the Dashboard first.'}
        </p>

        <button
          className="quiz-generate-btn btn-next-hover"
          onClick={() => onGenerate({ document_id: activeDocumentId })}
          disabled={loading || !activeDocumentId}
          style={{ background: 'linear-gradient(135deg, #7c65ff, #9b7dff)', marginTop: '1rem' }}
        >
          {loading
            ? <><span className="btn-spinner" /> Summarizing…</>
            : <><span>✦</span> Generate Summary <span className="btn-arrow">→</span></>}
        </button>
      </div>
    </div>
  );
}

// ── Main Summary Page ─────────────────────────────────────────────────────────
export default function Summary() {
  const [summaries, setSummaries] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState(null);

  const mapSummary = (s) => ({
    id: s.id,
    title: 'Document Summary',
    overview: s.summary,
    sections: s.topics?.map(t => ({ title: t.title, content: t.description })) || [],
    keyPoints: s.topics?.[0]?.keyPoints || [],
    difficulty: s.topics?.[0]?.difficulty || 1,
    createdAt: s.created_at
  });

  useEffect(() => {
    summaryAPI.getAll()
      .then((data) => {
        const raw = data?.summaries || data || [];
        setSummaries(raw.map(mapSummary));
      })
      .catch(() => {})
      .finally(() => setFetching(false));
  }, []);

  const generate = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await summaryAPI.generate(params);
      const newSummary = mapSummary(data);
      setSummaries((prev) => [newSummary, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <div className="sum-page">
      <div className="quiz-header">
        <div>
          <h1 className="quiz-page-title" style={{
            background: 'linear-gradient(135deg, var(--text) 40%, var(--violet-light))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            Topic Summaries
          </h1>
          <p className="quiz-page-sub">{summaries.length} summar{summaries.length !== 1 ? 'ies' : 'y'} generated</p>
        </div>
        <button
          className="sum-new-btn"
          onClick={() => setShowForm((s) => !s)}
        >
          {showForm ? '✕ Cancel' : '＋ New Summary'}
        </button>
      </div>

      {error && <div style={{ padding: '0 32px 16px' }}><ErrorDisplay message={error} onRetry={() => setError(null)} /></div>}

      {showForm && (
        <div style={{ borderBottom: '1px solid var(--border)' }}>
          <GenerateForm onGenerate={generate} loading={loading} />
        </div>
      )}

      <div className="sum-list">
        {fetching
          ? [1, 2, 3].map((i) => <SkeletonCard key={i} height={160} />)
          : summaries.length === 0
            ? (
              <div className="sum-empty">
                <div className="sum-empty-icon">📚</div>
                <h3>No summaries yet</h3>
                <p>Generate your first summary to get started</p>
                <button className="sum-new-btn" onClick={() => setShowForm(true)}>
                  ＋ Create Summary
                </button>
              </div>
            )
            : summaries.map((s, i) => (
              <SummaryCard key={s.id || i} summary={s} index={i} />
            ))
        }
      </div>
    </div>
  );
}
