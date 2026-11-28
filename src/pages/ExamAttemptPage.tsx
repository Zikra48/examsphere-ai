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

  // Strip answer keys & explanations from active exam-taking view state
  const sanitizedQuestions = useMemo(() => {
    if (!exam) return [];
    return exam.questions.map((q) => ({
      id: q.id,
      order: q.order,
      type: q.type,
      prompt: q.prompt,
      options: q.options,
      marks: q.marks,
      topicTag: q.topicTag,
      difficulty: q.difficulty,
    }));
  }, [exam]);

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
    for (const q of sanitizedQuestions) {
      if (selections[q.id] !== undefined && selections[q.id] !== null) {
        answered += 1;
      }
    }
    return {
      answered,
      unanswered: sanitizedQuestions.length - answered,
      flagged: flaggedIds.size,
    };
  }, [exam, sanitizedQuestions, selections, flaggedIds]);

  if (!exam || sanitizedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#080D19] flex items-center justify-center p-6">
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

  const currentQuestion = sanitizedQuestions[currentIdx];
  const progressPercent = Math.round((stats.answered / sanitizedQuestions.length) * 100);
  const timerStateClass =
    secondsLeft < 60
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
      : secondsLeft < 300
        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
        : 'bg-[#151F30] border-white/[0.1] text-[#F1F5FC]';

  const toggleFlag = (qId: string) => {
    setFlaggedIds((prev) => {
      const next = new Set(prev);
      if (next.has(qId)) next.delete(qId);
      else next.add(qId);
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F1F5FC] flex flex-col">
      {/* Sticky Focused Exam Header */}
      <header className="sticky top-0 z-30 bg-[#101827]/95 backdrop-blur-md border-b border-white/[0.08]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-xs text-[#9AA8BD] truncate">
              Timed Assessment · {exam.subject}
            </p>
            <h1 className="text-sm sm:text-base font-bold text-[#F1F5FC] truncate">
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
        <div className="h-1 w-full bg-[#151F30]">
          <div
            className="h-full bg-[#648BFF] transition-all duration-200"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {exam.instructions && (
          <div className="px-4 py-3 rounded-xl bg-[#101827] border border-white/[0.08] text-xs text-[#9AA8BD]">
            <span className="font-semibold text-[#F1F5FC]">Instructions: </span>
            {exam.instructions}
          </div>
        )}

        <div className="grid lg:grid-cols-12 gap-6 items-start">
          {/* Question Stage */}
          <div className="lg:col-span-8 space-y-5">
            <Card padding="lg" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-white/[0.08]">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono tabular-nums text-sm font-bold text-[#648BFF]">
                    Question {String(currentIdx + 1).padStart(2, '0')} /{' '}
                    {String(sanitizedQuestions.length).padStart(2, '0')}
                  </span>
                  <span aria-hidden="true" className="text-white/20">
                    ·
                  </span>
                  <span className="text-xs text-[#9AA8BD]">{currentQuestion.topicTag}</span>
                </div>

                <div className="flex items-center gap-2">
                  <Badge variant={getDifficultyBadgeVariant(currentQuestion.difficulty)}>
                    {currentQuestion.difficulty}
                  </Badge>
                  <span className="font-mono tabular-nums text-xs text-[#9AA8BD]">
                    {currentQuestion.marks} Marks
                  </span>
                </div>
              </div>

              <p className="text-base sm:text-lg font-medium text-[#F1F5FC] leading-relaxed">
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
                          ? 'bg-[#648BFF]/15 border-[#648BFF] text-[#F1F5FC]'
                          : 'bg-[#151F30] border-white/[0.08] text-[#9AA8BD] hover:text-[#F1F5FC] hover:border-[#648BFF]/40'
                      }`}
                    >
                      <span
                        className={`w-7 h-7 rounded-lg font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0 border ${
                          isSelected
                            ? 'bg-[#648BFF] text-[#080D19] border-[#648BFF]'
                            : 'bg-[#080D19] text-[#9AA8BD] border-white/[0.1]'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="text-sm sm:text-base leading-snug">{opt}</span>
                    </button>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => toggleFlag(currentQuestion.id)}
                  className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs font-semibold transition-colors cursor-pointer ${
                    flaggedIds.has(currentQuestion.id)
                      ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
                      : 'bg-[#151F30] border-white/[0.1] text-[#9AA8BD] hover:text-[#F1F5FC]'
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
                  {currentIdx < sanitizedQuestions.length - 1 ? (
                    <Button
                      size="sm"
                      rightIcon={<ChevronRight className="w-4 h-4" />}
                      onClick={() =>
                        setCurrentIdx((i) => Math.min(sanitizedQuestions.length - 1, i + 1))
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
                <h2 className="text-sm font-semibold text-[#F1F5FC]">Question Palette</h2>
                <span className="font-mono tabular-nums text-xs text-[#9AA8BD]">
                  {stats.answered}/{sanitizedQuestions.length} answered
                </span>
              </div>

              <div className="grid grid-cols-5 gap-2">
                {sanitizedQuestions.map((q, idx) => {
                  const isAnswered =
                    selections[q.id] !== undefined && selections[q.id] !== null;
                  const isFlagged = flaggedIds.has(q.id);
                  const isCurrent = idx === currentIdx;

                  let cellClass =
                    'bg-[#151F30] border-white/[0.08] text-[#9AA8BD] hover:text-[#F1F5FC] hover:border-[#648BFF]/35';
                  if (isFlagged) {
                    cellClass = 'bg-amber-500/15 border-amber-500/40 text-amber-300';
                  } else if (isAnswered) {
                    cellClass = 'bg-[#648BFF] border-[#648BFF] text-[#080D19]';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentIdx(idx)}
                      aria-label={`Jump to question ${idx + 1}`}
                      className={`h-10 rounded-lg border font-mono tabular-nums text-xs font-semibold transition-colors cursor-pointer ${cellClass} ${
                        isCurrent ? 'ring-2 ring-[#F1F5FC] ring-offset-2 ring-offset-[#101827]' : ''
                      }`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              <div className="pt-3 border-t border-white/[0.08] grid grid-cols-3 gap-2 text-[11px] text-[#9AA8BD]">
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#648BFF] inline-block shrink-0" />
                  <span>Answered ({stats.answered})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-amber-500/40 border border-amber-400 inline-block shrink-0" />
                  <span>Flagged ({stats.flagged})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-3 h-3 rounded bg-[#151F30] border border-white/[0.15] inline-block shrink-0" />
                  <span>Open ({stats.unanswered})</span>
                </div>
              </div>
            </Card>
          </aside>
        </div>
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
            <div className="p-3.5 rounded-lg bg-amber-500/12 border border-amber-500/30 flex items-start gap-2.5 text-amber-200">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <p className="text-xs leading-relaxed">
                You still have <span className="font-semibold">{stats.unanswered} unanswered</span>{' '}
                {stats.unanswered === 1 ? 'question' : 'questions'}. Unanswered items receive zero
                marks.
              </p>
            </div>
          )}

          <div className="grid grid-cols-3 gap-3 text-center p-3 rounded-lg bg-[#101827] border border-white/[0.08]">
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-[#F1F5FC]">
                {stats.answered}
              </p>
              <p className="text-xs text-[#9AA8BD]">Answered</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-amber-300">
                {stats.flagged}
              </p>
              <p className="text-xs text-[#9AA8BD]">Flagged</p>
            </div>
            <div>
              <p className="font-mono tabular-nums text-base font-bold text-[#9AA8BD]">
                {stats.unanswered}
              </p>
              <p className="text-xs text-[#9AA8BD]">Unanswered</p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
