import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  Send,
} from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { formatDurationClock, getDifficultyBadgeVariant } from '../utils/formatters';

export function ExamAttemptPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, submitAttempt } = useApp();

  const exam = exams.find((e) => e.id === id);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [selections, setSelections] = useState<Record<string, number | null>>({});
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(() => new Set());
  const [secondsLeft, setSecondsLeft] = useState(() => (exam ? exam.durationMinutes * 60 : 1800));
  const [startedAt] = useState(() => new Date().toISOString());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!exam) return;
    setSecondsLeft(exam.durationMinutes * 60);
  }, [exam?.id]);

  const handleFinalizeSubmit = async () => {
    if (!exam || submitting) return;
    setSubmitting(true);
    try {
      const totalDuration = exam.durationMinutes * 60;
      const elapsed = Math.max(1, totalDuration - secondsLeft);
      const attempt = await submitAttempt({
        exam,
        selections,
        flaggedIds,
        startedAt,
        durationTakenSeconds: elapsed,
      });
      setConfirmOpen(false);
      navigate(`/results/${attempt.id}`);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (!exam) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleFinalizeSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [exam?.id]);

  const stats = useMemo(() => {
    if (!exam) return { answered: 0, unanswered: 0, flagged: 0 };
    let answered = 0;
    for (const q of exam.questions) {
      if (selections[q.id] !== undefined && selections[q.id] !== null) {
        answered += 1;
      }
    }
    return {
      answered,
      unanswered: exam.questions.length - answered,
      flagged: flaggedIds.size,
    };
  }, [exam, selections, flaggedIds]);

  if (!exam) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full">
          <EmptyState
            icon={<BookOpen className="w-5 h-5" />}
            title="Examination not found"
            description="The selected exam blueprint does not exist in your library."
            action={
              <Link to="/exams">
                <Button>Return to Library</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  const currentQuestion = exam.questions[currentIdx];
  const progressPercent = Math.round((stats.answered / exam.questions.length) * 100);
  const timerStateClass =
    secondsLeft < 60
      ? 'bg-rose-50 border-rose-300 text-rose-700'
      : secondsLeft < 300
        ? 'bg-amber-50 border-amber-300 text-amber-700'
        : 'bg-white border-slate-200 text-slate-900';

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Sticky Distraction-Free Focus Mode Header */}
      <header className="sticky top-0 z-30 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-slate-500 truncate">
              Focus Simulation · {exam.subject}
            </p>
            <h1 className="text-sm sm:text-base font-bold text-slate-900 truncate">
              {exam.title}
            </h1>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div
              aria-label="Time remaining"
              className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono tabular-nums text-sm font-semibold ${timerStateClass}`}
            >
              <Clock className="w-4 h-4 shrink-0" aria-hidden="true" />
              <span>{formatDurationClock(secondsLeft)}</span>
            </div>

            <Button size="sm" onClick={() => setConfirmOpen(true)} rightIcon={<Send className="w-3.5 h-3.5" />}>
              Submit Exam
            </Button>
          </div>
        </div>
        <div className="h-1 w-full bg-slate-100">
          <div
            className="h-full bg-indigo-900 transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Split Layout: Main Question Stage + Sticky Question Navigator Palette */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 grid lg:grid-cols-12 gap-6 items-start">
        {/* Main Question Stage */}
        <div className="lg:col-span-8 space-y-5">
          <Card padding="lg" className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <span className="font-mono tabular-nums text-sm font-bold text-indigo-900">
                  Question {String(currentIdx + 1).padStart(2, '0')} /{' '}
                  {String(exam.questions.length).padStart(2, '0')}
                </span>
                <span aria-hidden="true" className="text-slate-300">
                  ·
                </span>
                <span className="text-xs text-slate-500">{currentQuestion.topicTag}</span>
              </div>

              <div className="flex items-center gap-2">
                <Badge variant={getDifficultyBadgeVariant(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="slate">
                  <span className="font-mono tabular-nums">
                    {currentQuestion.marks} Marks
                  </span>
                </Badge>
              </div>
            </div>

            <p className="text-base sm:text-lg font-medium text-slate-900 leading-relaxed">
              {currentQuestion.prompt}
            </p>

            <div className="space-y-3" role="radiogroup" aria-label={`Question ${currentIdx + 1} choices`}>
              {currentQuestion.options.map((opt, optIdx) => {
                const isSelected = selections[currentQuestion.id] === optIdx;
                return (
                  <button
                    key={optIdx}
                    type="button"
                    onClick={() =>
                      setSelections((prev) => ({ ...prev, [currentQuestion.id]: optIdx }))
                    }
                    className={`w-full text-left px-4 py-3.5 rounded-xl border transition-colors flex items-center gap-3.5 cursor-pointer ${
                      isSelected
                        ? 'bg-indigo-50/80 border-indigo-900 text-slate-900'
                        : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0 border ${
                        isSelected
                          ? 'bg-indigo-900 text-white border-indigo-900'
                          : 'bg-slate-50 text-slate-600 border-slate-200'
                      }`}
                    >
                      {String.fromCharCode(65 + optIdx)}
                    </span>
                    <span className="text-sm sm:text-base leading-snug">{opt}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => toggleFlag(currentQuestion.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                  flaggedIds.has(currentQuestion.id)
                    ? 'bg-amber-50 border-amber-300 text-amber-800'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Flag className="w-3.5 h-3.5" />
                <span>
                  {flaggedIds.has(currentQuestion.id) ? 'Flagged for Review' : 'Flag for Review'}
                </span>
              </button>

              <div className="flex items-center gap-2.5">
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={currentIdx === 0}
                  leftIcon={<ChevronLeft className="w-4 h-4" />}
                  onClick={() => setCurrentIdx((i) => Math.max(0, i - 1))}
                >
                  Previous
                </Button>
                {currentIdx < exam.questions.length - 1 ? (
                  <Button
                    size="sm"
                    rightIcon={<ChevronRight className="w-4 h-4" />}
                    onClick={() =>
                      setCurrentIdx((i) => Math.min(exam.questions.length - 1, i + 1))
                    }
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={() => setConfirmOpen(true)}
                    rightIcon={<Send className="w-3.5 h-3.5" />}
                  >
                    Review &amp; Submit
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Sticky Question Navigator Palette */}
        <aside className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <Card className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-900">Question Palette</h2>
              <span className="font-mono tabular-nums text-xs text-slate-500">
                {stats.answered}/{exam.questions.length} answered
              </span>
            </div>

            <div className="grid grid-cols-5 gap-2">
              {exam.questions.map((q, idx) => {
                const isAnswered =
                  selections[q.id] !== undefined && selections[q.id] !== null;
                const isFlagged = flaggedIds.has(q.id);
                const isCurrent = idx === currentIdx;

                let cellClass = 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50';
                if (isFlagged) {
                  cellClass = 'bg-amber-50 border-amber-300 text-amber-800';
                } else if (isAnswered) {
                  cellClass = 'bg-indigo-900 border-indigo-900 text-white';
                }

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    aria-label={`Jump to question ${idx + 1}`}
                    className={`h-10 rounded-lg border font-mono tabular-nums text-xs font-semibold transition-colors cursor-pointer ${cellClass} ${
                      isCurrent ? 'ring-2 ring-indigo-600 ring-offset-1' : ''
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-200 grid grid-cols-3 gap-2 text-[11px] text-slate-600">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-indigo-900 inline-block shrink-0" />
                <span>Answered ({stats.answered})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-amber-100 border border-amber-400 inline-block shrink-0" />
                <span>Flagged ({stats.flagged})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded bg-white border border-slate-300 inline-block shrink-0" />
                <span>Open ({stats.unanswered})</span>
              </div>
            </div>
          </Card>
        </aside>
      </main>

      {/* Submission Confirmation Modal */}
      <Modal
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Submit Examination?"
        description="Your answers will be graded immediately and recorded in your Attempt History."
        footer={
          <>
            <Button variant="secondary" onClick={() => setConfirmOpen(false)}>
              Continue Exam
            </Button>
            <Button isLoading={submitting} onClick={handleFinalizeSubmit}>
              Confirm &amp; Grade
            </Button>
          </>
        }
      >
        <div className="space-y-3">
          {stats.unanswered > 0 && (
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2.5 text-amber-800">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="text-xs leading-relaxed">
                You still have <span className="font-semibold">{stats.unanswered} unanswered</span>{' '}
                {stats.unanswered === 1 ? 'question' : 'questions'}. Unanswered items receive zero
                marks.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-lg bg-slate-50 border border-slate-200">
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-slate-900">
                {stats.answered}
              </p>
              <p className="text-xs text-slate-500">Answered</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-amber-700">
                {stats.flagged}
              </p>
              <p className="text-xs text-slate-500">Flagged</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-slate-600">
                {stats.unanswered}
              </p>
              <p className="text-xs text-slate-500">Unanswered</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
