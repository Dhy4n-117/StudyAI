import jsPDF from 'jspdf';
import Papa from 'papaparse';

// ─── Export Quiz as PDF ─────────────────────────────────────────────────────────
export function exportQuizAsPDF(quiz, results = null) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 48;
  const pageW = doc.internal.pageSize.getWidth();
  let y = margin;

  const addPage = () => { doc.addPage(); y = margin; };
  const checkPage = (needed = 60) => { if (y + needed > 780) addPage(); };

  // Header
  doc.setFillColor(15, 15, 26);
  doc.rect(0, 0, pageW, 80, 'F');
  doc.setTextColor(124, 101, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('StudyAI — Quiz Export', margin, 50);
  doc.setFontSize(10);
  doc.setTextColor(136, 136, 170);
  doc.text(new Date().toLocaleDateString('en-IN', { dateStyle: 'long' }), pageW - margin, 50, { align: 'right' });

  y = 110;

  // Title
  doc.setTextColor(30, 30, 50);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(quiz.title || 'Quiz', margin, y);
  y += 30;

  // Score badge if results
  if (results) {
    doc.setFillColor(245, 166, 35);
    doc.roundedRect(margin, y, 160, 36, 8, 8, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(13);
    doc.text(`Score: ${results.score}/${results.total}  (${results.percentage}%)`, margin + 12, y + 23);
    y += 56;
  }

  // Questions
  quiz.questions.forEach((q, i) => {
    checkPage(100);
    doc.setTextColor(30, 30, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    const qLines = doc.splitTextToSize(`Q${i + 1}. ${q.question}`, pageW - margin * 2);
    doc.text(qLines, margin, y);
    y += qLines.length * 16 + 8;

    if (q.options) {
      q.options.forEach((opt, oi) => {
        checkPage(28);
        const isCorrect = results && opt === q.correctAnswer;
        const isWrong = results && results.answers?.[i] === opt && opt !== q.correctAnswer;
        doc.setFont('helvetica', isCorrect ? 'bold' : 'normal');
        doc.setTextColor(isCorrect ? 46 : isWrong ? 220 : 80, isCorrect ? 160 : isWrong ? 50 : 80, isCorrect ? 46 : isWrong ? 50 : 80);
        doc.text(`   ${String.fromCharCode(65 + oi)}. ${opt}`, margin + 8, y);
        y += 20;
      });
    }

    if (q.explanation) {
      checkPage(40);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(100, 100, 140);
      doc.setFontSize(10);
      const expLines = doc.splitTextToSize(`💡 ${q.explanation}`, pageW - margin * 2 - 16);
      doc.text(expLines, margin + 8, y);
      y += expLines.length * 14 + 8;
    }

    y += 16;
  });

  doc.save(`quiz-${Date.now()}.pdf`);
}

// ─── Export Flashcards as CSV ───────────────────────────────────────────────────
export function exportFlashcardsAsCSV(deck) {
  const rows = deck.cards.map((card, i) => ({
    '#': i + 1,
    Front: card.front,
    Back: card.back,
    Difficulty: card.difficulty || 'medium',
    Tags: (card.tags || []).join('; '),
  }));

  const csv = Papa.unparse(rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `flashcards-${deck.title?.replace(/\s+/g, '-') || 'deck'}-${Date.now()}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
