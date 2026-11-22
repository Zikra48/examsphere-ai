import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowUpRight,
  BookOpen,
  CheckCircle2,
  ClipboardCheck,
  Edit3,
  FilePlus2,
  Flame,
  Play,
  TrendingUp,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useApp } from '../context/AppContext';
import {
  formatDurationReadable,
  formatShortDate,
  getDifficultyBadgeVariant,
} from '../utils/formatters';

export function DashboardPage() {
  const { user, exams, attempts, subjectProgress } = useApp();
  const navigate = useNavigate();

  const totalExams = exams.length;
  const totalAttempts = attempts.length;
  const averageScore =
    totalAttempts > 0
      ? Math.round(
          attempts.reduce((sum, a) => sum + a.scorePercent, 0) / totalAttempts
        )
      : 0;

  const sortedAttempts = [...attempts].sort(
    (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
  );

  const recentTrendDelta =
    sortedAttempts.length >= 2
      ? sortedAttempts[0].scorePercent - sortedAttempts[1].scorePercent
      : sortedAttempts.length === 1
        ? 4
        : 0;

  const overallMastery =
    subjectProgress.length > 0
      ? Math.round(
          subjectProgress.reduce((sum, s) => sum + s.masteryPercent, 0) /
            subjectProgress.length
        )
      : 0;

  return (
    <AppShell
      title="Dashboard"
      breadcrumb={`Workspace / ${user.academicLevel}`}
      actions={
        <Link to="/exams/new">
          <Button size="sm" leftIcon={<FilePlus2 className="w-4 h-4" />}>
            Generate New Exam
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Personalized Welcome Banner */}
        <Card className="bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="text-xs font-medium text-indigo-900">
                Academic Studio · {user.targetExam}
              </p>
              <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Welcome back, {user.fullName.split(' ')[0]}
              </h2>
              <p className="text-sm text-slate-600 max-w-2xl">
                Review your subject mastery trajectory, refine custom exam blueprints, or launch a
                timed simulation from your library.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <Link to="/exams">
                <Button variant="secondary">Browse Library</Button>
              </Link>
              <Link to="/exams/new">
                <Button leftIcon={<FilePlus2 className="w-4 h-4" />}>
                  Generate New Exam
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        {/* 4 KPI Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Total Examinations</span>
              <BookOpen className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalExams}
              </span>
              <span className="text-xs text-slate-500">In library</span>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Exams Attempted</span>
              <ClipboardCheck className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalAttempts}
              </span>
              <span className="text-xs text-slate-500">Completed runs</span>
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Average Score</span>
              <TrendingUp className="w-4 h-4 text-slate-400" aria-hidden="true" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {totalAttempts > 0 ? `${averageScore}%` : '—'}
              </span>
              {totalAttempts > 0 && (
                <span
                  className={`text-xs font-mono tabular-nums font-semibold ${
                    recentTrendDelta >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}
                >
                  {recentTrendDelta >= 0 ? `+${recentTrendDelta}%` : `${recentTrendDelta}%`} latest
                </span>
              )}
            </div>
          </Card>

          <Card className="space-y-2">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500">
              <span>Study Streak &amp; Mastery</span>
              <Flame className="w-4 h-4 text-amber-500" aria-hidden="true" />
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-2xl font-bold font-mono tabular-nums text-slate-900">
                {user.studyStreakDays}d
              </span>
              <span className="text-xs font-mono tabular-nums font-semibold text-indigo-900">
                {overallMastery}% index
              </span>
            </div>
          </Card>
        </div>

        {/* Subject-Wise Progress */}
        <Card>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <h3 className="text-base font-semibold text-slate-900">
                Subject-Wise Progress
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Weighted mastery across recent graded simulations
              </p>
            </div>
            <Link
              to="/analytics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-900 hover:text-indigo-600 whitespace-nowrap"
            >
              <span>Full Analytics</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {subjectProgress.length === 0 ? (
            <EmptyState
              icon={<TrendingUp className="w-5 h-5" />}
              title="No subject metrics yet"
              description="Generate and complete an examination to initialize subject mastery tracking."
              action={
                <Link to="/exams/new">
                  <Button size="sm">Generate First Exam</Button>
                </Link>
              }
            />
          ) : (
            <div className="grid sm:grid-cols-2 gap-x-8 gap-y-5">
              {subjectProgress.map((item) => (
                <div key={item.subject} className="space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-slate-900">{item.subject}</span>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-xs">
                      <span className="text-slate-500">
                        {item.examsCompleted} {item.examsCompleted === 1 ? 'run' : 'runs'}
                      </span>
                      <span className="font-semibold text-indigo-900">
                        {item.masteryPercent}%
                      </span>
                    </div>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-indigo-900 transition-all duration-300"
                      style={{ width: `${Math.max(4, item.masteryPercent)}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-500">
                    Focus area: <span className="text-slate-700">{item.weakestTopic}</span>
                  </p>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Split Two-Column Grid: Recent Examinations & Recent Activity */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Recent Examinations */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Recent Examinations
              </h3>
              <Link
                to="/exams"
                className="text-xs font-semibold text-indigo-900 hover:text-indigo-600"
              >
                View All
              </Link>
            </div>
            {exams.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<BookOpen className="w-5 h-5" />}
                  title="Your exam library is empty"
                  description="Create a calibrated assessment from notes, prompts, or study documents."
                  action={
                    <Link to="/exams/new">
                      <Button size="sm">Generate New Exam</Button>
                    </Link>
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {exams.slice(0, 4).map((exam) => (
                  <div
                    key={exam.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {exam.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{exam.subject}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {exam.questionCount} Qs
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {exam.durationMinutes}m
                        </span>
                        <Badge variant={getDifficultyBadgeVariant(exam.difficulty)}>
                          {exam.difficulty}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button
                        size="sm"
                        variant="secondary"
                        leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/exams/${exam.id}/edit`)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        leftIcon={<Play className="w-3.5 h-3.5" />}
                        onClick={() => navigate(`/exams/${exam.id}/attempt`)}
                      >
                        Start Attempt
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Recent Activity */}
          <Card padding="none" className="overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">Recent Activity</h3>
              <Link
                to="/history"
                className="text-xs font-semibold text-indigo-900 hover:text-indigo-600"
              >
                Full History
              </Link>
            </div>
            {sortedAttempts.length === 0 ? (
              <div className="p-6">
                <EmptyState
                  icon={<ClipboardCheck className="w-5 h-5" />}
                  title="No completed attempts yet"
                  description="Start any exam in Focus Mode to record your score and concept review."
                />
              </div>
            ) : (
              <div className="divide-y divide-slate-200">
                {sortedAttempts.slice(0, 4).map((attempt) => (
                  <div
                    key={attempt.id}
                    className="px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 transition-colors"
                  >
                    <div className="min-w-0 space-y-1">
                      <p className="text-sm font-semibold text-slate-900 truncate">
                        {attempt.examTitle}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span>{formatShortDate(attempt.completedAt)}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {formatDurationReadable(attempt.durationTakenSeconds)}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums">
                          {attempt.earnedMarks}/{attempt.totalMarks} marks
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <Badge
                        variant={attempt.passed ? 'emerald' : 'amber'}
                        icon={<CheckCircle2 className="w-3 h-3" />}
                      >
                        <span className="font-mono tabular-nums">{attempt.scorePercent}%</span>
                      </Badge>
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => navigate(`/results/${attempt.id}`)}
                      >
                        View Results
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
