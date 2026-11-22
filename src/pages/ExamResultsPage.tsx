import React, { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardCheck,
  Flag,
  RotateCcw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useApp } from '../context/AppContext';
import { formatDurationReadable, formatShortDate } from '../utils/formatters';

type ReviewFilter = 'all' | 'incorrect' | 'flagged';

export function ExamResultsPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const navigate = useNavigate();
  const { attempts, exams } = useApp();
  const [filter, setFilter] = useState<ReviewFilter>('all');

  const attempt = attempts.find((a) => a.id === attemptId);
  const exam = attempt ? exams.find((e) => e.id === attempt.examId) : undefined;

  if (!attempt || !exam) {
    return (
      <AppShell title="Results Not Found" breadcrumb="Workspace / Attempt History">
        <EmptyState
          icon={<ClipboardCheck className="w-5 h-5" />}
          title="Assessment record unavailable"
          description="This attempt record could not be located in your local history."
          action={
            <Link to="/history">
              <Button>View Attempt History</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const filteredQuestions = exam.questions.filter((q) => {
    const ans = attempt.answers[q.id];
    if (filter === 'incorrect') return !ans?.isCorrect;
    if (filter === 'flagged') return ans?.isFlagged;
    return true;
  });

  return (
    <AppShell
      title="Assessment Breakdown"
      breadcrumb={`Results / ${attempt.subject}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
            onClick={() => navigate('/dashboard')}
          >
            Back to Dashboard
          </Button>
          <Button
            size="sm"
            leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            onClick={() => navigate(`/exams/${exam.id}/attempt`)}
          >
            Retake Exam
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Executive Score Summary Card */}
        <Card padding="lg">
          <div className="grid lg:grid-cols-12 gap-8 items-start">
            <div className="lg:col-span-5 space-y-4">
              <div className="flex items-center gap-2.5">
                <Badge
                  variant={attempt.passed ? 'emerald' : 'amber'}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  {attempt.passed ? 'Mastery Threshold Met' : 'Review Recommended'}
                </Badge>
                <span className="text-xs text-slate-500">
                  {formatShortDate(attempt.completedAt)}
                </span>
              </div>

              <h2 className="text-xl font-bold text-slate-900 leading-snug">
                {attempt.examTitle}
              </h2>

              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Score</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-indigo-900">
                    {attempt.scorePercent}%
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Marks Earned</p>
                  <p className="mt-1 text-2xl font-bold font-mono tabular-nums text-slate-900">
                    {attempt.earnedMarks}
                    <span className="text-sm font-normal text-slate-500">
                      /{attempt.totalMarks}
                    </span>
                  </p>
                </div>
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <p className="text-xs text-slate-500">Time Taken</p>
                  <p className="mt-1 text-lg sm:text-xl font-bold font-mono tabular-nums text-slate-900">
                    {formatDurationReadable(attempt.durationTakenSeconds)}
                  </p>
                </div>
              </div>
            </div>

            {/* Topic Breakdown Bars */}
            <div className="lg:col-span-7 space-y-3 lg:pl-6 lg:border-l lg:border-slate-200">
              <h3 className="text-sm font-semibold text-slate-900">Topic Breakdown</h3>
              <div className="space-y-3">
                {attempt.topicBreakdown.map((tb) => (
                  <div key={tb.topic} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-medium text-slate-800">{tb.topic}</span>
                      <span className="font-mono tabular-nums text-slate-600">
                        {tb.correct}/{tb.total} ({tb.accuracy}%)
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          tb.accuracy >= 80
                            ? 'bg-emerald-600'
                            : tb.accuracy >= 50
                              ? 'bg-amber-500'
                              : 'bg-rose-600'
                        }`}
                        style={{ width: `${Math.max(4, tb.accuracy)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {/* Detailed Question Review */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h3 className="text-base font-semibold text-slate-900">
              Detailed Question Review
            </h3>

            <div className="inline-flex p-1 bg-slate-100 border border-slate-200 rounded-lg self-start">
              {[
                { id: 'all' as ReviewFilter, label: `All Questions (${exam.questions.length})` },
                {
                  id: 'incorrect' as ReviewFilter,
                  label: `Incorrect Only (${
                    exam.questions.filter((q) => !attempt.answers[q.id]?.isCorrect).length
                  })`,
                },
                {
                  id: 'flagged' as ReviewFilter,
                  label: `Flagged (${
                    exam.questions.filter((q) => attempt.answers[q.id]?.isFlagged).length
                  })`,
                },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                    filter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredQuestions.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="w-5 h-5" />}
              title="No matching questions in this filter"
              description="Try switching back to All Questions to review the full assessment."
              action={
                <Button size="sm" variant="secondary" onClick={() => setFilter('all')}>
                  Show All Questions
                </Button>
              }
            />
          ) : (
            <div className="space-y-4">
              {filteredQuestions.map((q) => {
                const ans = attempt.answers[q.id];
                const selectedIdx = ans?.selectedOptionIndex ?? null;
                const isCorrect = ans?.isCorrect ?? false;

                return (
                  <Card key={q.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200">
                      <div className="flex items-center gap-2.5">
                        <span className="font-mono tabular-nums text-xs font-bold px-2.5 py-1 rounded-md bg-slate-100 text-slate-800">
                          Q{String(q.order).padStart(2, '0')}
                        </span>
                        <span className="text-xs text-slate-500">{q.topicTag}</span>
                        {ans?.isFlagged && (
                          <Badge variant="amber" icon={<Flag className="w-3 h-3" />}>
                            Flagged
                          </Badge>
                        )}
                      </div>

                      <Badge
                        variant={isCorrect ? 'emerald' : 'rose'}
                        icon={
                          isCorrect ? (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5" />
                          )
                        }
                      >
                        <span className="font-mono tabular-nums">
                          {isCorrect ? `Correct (+${q.marks})` : `Incorrect (0/${q.marks})`}
                        </span>
                      </Badge>
                    </div>

                    <p className="text-sm sm:text-base font-medium text-slate-900 leading-relaxed">
                      {q.prompt}
                    </p>

                    <div className="grid sm:grid-cols-2 gap-2.5">
                      {q.options.map((opt, idx) => {
                        const isUserChoice = selectedIdx === idx;
                        const isAnswerKey = q.correctOptionIndex === idx;

                        let style = 'bg-white border-slate-200 text-slate-700';
                        if (isAnswerKey) {
                          style = 'bg-emerald-50/80 border-emerald-500 text-slate-900 font-medium';
                        } else if (isUserChoice && !isAnswerKey) {
                          style = 'bg-rose-50/80 border-rose-400 text-rose-900';
                        }

                        return (
                          <div
                            key={idx}
                            className={`px-3.5 py-2.5 rounded-lg border text-sm flex items-center justify-between gap-2 ${style}`}
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="font-mono text-xs font-semibold shrink-0">
                                {String.fromCharCode(65 + idx)}.
                              </span>
                              <span>{opt}</span>
                            </div>
                            {isAnswerKey && (
                              <span className="text-[11px] font-semibold text-emerald-700 shrink-0">
                                Correct Answer
                              </span>
                            )}
                            {isUserChoice && !isAnswerKey && (
                              <span className="text-[11px] font-semibold text-rose-700 shrink-0">
                                Your Answer
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {selectedIdx === null && (
                      <p className="text-xs font-medium text-amber-700">
                        You left this question unanswered during the attempt.
                      </p>
                    )}

                    {/* Violet-accented AI Concept Explanation */}
                    <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>AI Concept Explanation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        {q.explanation}
                      </p>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
