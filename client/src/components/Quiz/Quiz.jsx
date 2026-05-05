import React, { useState, useCallback } from 'react';
import { quizAPI } from '../../services/api';
import { exportQuizAsPDF } from '../../utils/exportUtils';
import { SkeletonCard } from '../shared/Skeleton';
import { ErrorDisplay } from '../shared/ErrorDisplay';
import './Quiz.css';

const QUIZ_TYPES = [
  { id: 'mcq', label: 'Multiple Choice', icon: '◉' },
  { id: 'true_false', label: 'True / False', icon: '⊕' },
  { id: 'short_answer', label: 'Short Answer', icon: '✎' },
];

// ── Quiz Setup Screen ─────────────────────────────────────────────────────────
function QuizSetup({ onGenerate, loading }) {
  const activeDocumentId = localStorage.getItem('activeDocumentId');

  const handleSubmit = () => {
    onGenerate({ document_id: activeDocumentId });
  };

  return (
    <div className="quiz-setup" style={{ animation: 'fadeUp 0.3s ease' }}>
      <div className="quiz-setup-card">
        <div className="quiz-setup-icon">🧠</div>
        <h2 className="quiz-setup-title">Generate a Quiz</h2>
        <p className="quiz-setup-sub">
          {activeDocumentId ? 'Generate a quiz from your active document.' : 'Please select a document from the Dashboard first.'}
        </p>

        <button
          className="quiz-generate-btn btn-next-hover"
          onClick={handleSubmit}
          disabled={loading || !activeDocumentId}
        >
          {loading ? (
            <><span className="btn-spinner" /> Generating Quiz…</>
          ) : (
            <><span>⚡</span> Generate Quiz <span className="btn-arrow">→</span></>
          )}
        </button>
      </div>
    </div>
  );
}

// ── MCQ Question ──────────────────────────────────────────────────────────────
function MCQQuestion({ question, index, selected, onSelect, showAnswer }) {
  return (
    <div className="quiz-question-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="quiz-q-number">Q{index + 1}</div>
      <p className="quiz-q-text">{question.question}</p>
      <div className="quiz-options">
        {question.options?.map((opt, oi) => {
          const isSelected = selected === opt;
          const isCorrect = showAnswer && opt === question.correctAnswer;
          const isWrong = showAnswer && isSelected && !isCorrect;
          return (
            <button
              key={oi}
              className={`quiz-option ${isSelected ? 'selected' : ''} ${isCorrect ? 'correct' : ''} ${isWrong ? 'wrong' : ''}`}
              onClick={() => !showAnswer && onSelect(opt)}
              disabled={showAnswer}
            >
              <span className="quiz-option-letter">{String.fromCharCode(65 + oi)}</span>
              <span>{opt}</span>
              {isCorrect && <span className="quiz-option-badge correct-badge">✓ Correct</span>}
              {isWrong && <span className="quiz-option-badge wrong-badge">✗ Wrong</span>}
            </button>
          );
        })}
      </div>
      {showAnswer && question.explanation && (
        <div className="quiz-explanation">
          <span>💡</span>
          <p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ── True/False Question ───────────────────────────────────────────────────────
function TrueFalseQuestion({ question, index, selected, onSelect, showAnswer }) {
  const isCorrect = (val) => showAnswer && val.toString() === question.correctAnswer?.toString();
  const isWrong = (val) => showAnswer && selected === val && !isCorrect(val);

  return (
    <div className="quiz-question-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="quiz-q-number">Q{index + 1}</div>
      <p className="quiz-q-text">{question.question}</p>
      <div className="tf-options">
        {['True', 'False'].map((val) => (
          <button
            key={val}
            className={`tf-btn ${selected === val ? 'selected' : ''} ${isCorrect(val) ? 'correct' : ''} ${isWrong(val) ? 'wrong' : ''}`}
            onClick={() => !showAnswer && onSelect(val)}
            disabled={showAnswer}
          >
            <span>{val === 'True' ? '✓' : '✗'}</span> {val}
          </button>
        ))}
      </div>
      {showAnswer && question.explanation && (
        <div className="quiz-explanation">
          <span>💡</span><p>{question.explanation}</p>
        </div>
      )}
    </div>
  );
}

// ── Short Answer Question ─────────────────────────────────────────────────────
function ShortAnswerQuestion({ question, index, value, onChange, showAnswer }) {
  return (
    <div className="quiz-question-card" style={{ animationDelay: `${index * 0.06}s` }}>
      <div className="quiz-q-number">Q{index + 1}</div>
      <p className="quiz-q-text">{question.question}</p>
      <textarea
        className="sa-input"
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Type your answer here…"
        rows={3}
        disabled={showAnswer}
      />
      {showAnswer && (
        <div className="sa-model-answer">
          <span className="sa-label">Model Answer:</span>
          <p>{question.correctAnswer || question.answer}</p>
        </div>
      )}
    </div>
  );
}

// ── Score Screen ──────────────────────────────────────────────────────────────
function ScoreScreen({ score, total, quiz, answers, onRetry, onNew }) {
  const pct = Math.round((score / total) * 100);
  const grade = pct >= 80 ? '🏆' : pct >= 60 ? '👍' : pct >= 40 ? '📚' : '💪';
  const gradeText = pct >= 80 ? 'Excellent!' : pct >= 60 ? 'Good job!' : pct >= 40 ? 'Keep studying!' : 'Need more practice';

  return (
    <div className="score-screen" style={{ animation: 'bounce-in 0.4s ease' }}>
      <div className="score-card">
        <div className="score-grade-icon">{grade}</div>
        <div className="score-circle">
          <svg viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="var(--surface-high)" strokeWidth="8" />
            <circle
              cx="50" cy="50" r="40" fill="none"
              stroke="var(--violet)" strokeWidth="8"
              strokeDasharray={`${2.51 * pct} 251`}
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="score-number">
            <span className="score-pct">{pct}%</span>
            <span className="score-fraction">{score}/{total}</span>
          </div>
        </div>
        <p className="score-grade-text">{gradeText}</p>

        <div className="score-actions">
          <button className="score-btn primary" onClick={onRetry}>🔁 Retry Quiz</button>
          <button
            className="score-btn secondary"
            onClick={() => exportQuizAsPDF(quiz, { score, total, percentage: pct, answers })}
          >
            ⬇ Export PDF
          </button>
          <button className="score-btn ghost" onClick={onNew}>＋ New Quiz</button>
        </div>
      </div>
    </div>
  );
}

// ── Main Quiz Page ────────────────────────────────────────────────────────────
export default function Quiz() {
  const [stage, setStage] = useState('setup'); // setup | quiz | score
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showAnswers, setShowAnswers] = useState(false);
  const [score, setScore] = useState(null);

  const generateQuiz = useCallback(async (params) => {
    setLoading(true);
    setError(null);
    try {
      const data = await quizAPI.generate({ document_id: params.document_id });
      setQuiz(data);
      setAnswers({});
      setShowAnswers(false);
      setStage('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const submitQuiz = () => {
    if (!quiz) return;
    let correct = 0;
    quiz.questions.forEach((q, i) => {
      const ans = answers[i];
      if (ans === q.correctAnswer || ans?.toString() === q.correctAnswer?.toString()) {
        correct++;
      }
    });
    setScore(correct);
    setShowAnswers(true);
    setStage('score');
    quizAPI.submit({ quizId: quiz.id, answers }).catch(() => {});
  };

  const allAnswered = quiz &&
    Object.keys(answers).length === quiz.questions.length &&
    Object.values(answers).every((v) => v !== undefined && v !== '');

  if (stage === 'score') {
    return (
      <div className="quiz-page">
        <div className="quiz-header">
          <h1 className="quiz-page-title">Quiz Results</h1>
        </div>
        <ScoreScreen
          score={score}
          total={quiz.questions.length}
          quiz={quiz}
          answers={answers}
          onRetry={() => { setAnswers({}); setShowAnswers(false); setStage('quiz'); }}
          onNew={() => { setQuiz(null); setStage('setup'); }}
        />
      </div>
    );
  }

  return (
    <div className="quiz-page">
      <div className="quiz-header">
        <div>
          <h1 className="quiz-page-title">
            {stage === 'quiz' ? quiz?.title || 'Quiz' : 'Quiz Generator'}
          </h1>
          {stage === 'quiz' && (
            <p className="quiz-page-sub">{quiz?.questions?.length} questions</p>
          )}
        </div>
        {stage === 'quiz' && (
          <div className="quiz-header-actions">
            <button className="quiz-back-btn" onClick={() => setStage('setup')}>← Back</button>
            <button
              className="quiz-export-btn"
              onClick={() => exportQuizAsPDF(quiz)}
            >⬇ Export</button>
          </div>
        )}
      </div>

      {error && <div style={{ padding: '0 32px 16px' }}><ErrorDisplay message={error} onRetry={() => setError(null)} /></div>}

      {stage === 'setup' && (
        loading
          ? <div className="quiz-skeleton-list">{[1,2,3].map(i => <SkeletonCard key={i} height={100} />)}</div>
          : <QuizSetup onGenerate={generateQuiz} loading={loading} />
      )}

      {stage === 'quiz' && quiz && (
        <div className="quiz-questions-list">
          {quiz.questions.map((q, i) => {
            const type = (quiz.type || q.type || 'mcq').toLowerCase();
            if (type === 'true_false' || type === 'truefalse' || type === 'tf') {
              return <TrueFalseQuestion key={i} question={q} index={i} selected={answers[i]} onSelect={(v) => setAnswers((p) => ({ ...p, [i]: v }))} showAnswer={showAnswers} />;
            }
            if (type === 'short_answer' || type === 'short' || type === 'sa') {
              return <ShortAnswerQuestion key={i} question={q} index={i} value={answers[i]} onChange={(v) => setAnswers((p) => ({ ...p, [i]: v }))} showAnswer={showAnswers} />;
            }
            return <MCQQuestion key={i} question={q} index={i} selected={answers[i]} onSelect={(v) => setAnswers((p) => ({ ...p, [i]: v }))} showAnswer={showAnswers} />;
          })}

          {!showAnswers && (
            <div className="quiz-submit-bar">
              <span className="quiz-progress-text">
                {Object.keys(answers).length}/{quiz.questions.length} answered
              </span>
              <button
                className="quiz-submit-btn btn-next-hover"
                onClick={submitQuiz}
                disabled={!allAnswered}
              >
                Submit Quiz <span className="btn-arrow">→</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
