import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Clock,
  Edit3,
  FilePlus2,
  Play,
  Search,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { DifficultyLevel, Exam } from '../types/exam';
import { formatShortDate, getDifficultyBadgeVariant } from '../utils/formatters';

export function ExamLibraryPage() {
  const { exams, deleteExam } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | DifficultyLevel>('All');
  const [examToDelete, setExamToDelete] = useState<Exam | null>(null);
  const [deleting, setDeleting] = useState(false);

  const subjects = useMemo(() => {
    const set = new Set(exams.map((e) => e.subject));
    return ['All', ...Array.from(set).sort()];
  }, [exams]);

  const filteredExams = useMemo(() => {
    return exams.filter((exam) => {
      const q = search.trim().toLowerCase();
      const matchesSearch =
        !q ||
        exam.title.toLowerCase().includes(q) ||
        exam.subject.toLowerCase().includes(q) ||
        exam.topic.toLowerCase().includes(q);
      const matchesSubject = subjectFilter === 'All' || exam.subject === subjectFilter;
      const matchesDiff = difficultyFilter === 'All' || exam.difficulty === difficultyFilter;
      return matchesSearch && matchesSubject && matchesDiff;
    });
  }, [exams, search, subjectFilter, difficultyFilter]);

  const handleConfirmDelete = async () => {
    if (!examToDelete) return;
    setDeleting(true);
    try {
      await deleteExam(examToDelete.id);
      setExamToDelete(null);
    } finally {
      setDeleting(false);
    }
  };

  return (
    <AppShell
      title="My Examinations Library"
      breadcrumb="Workspace / Saved Assessments"
      actions={
        <Link to="/exams/new">
          <Button size="sm" leftIcon={<FilePlus2 className="w-4 h-4" />}>
            Generate Exam
          </Button>
        </Link>
      }
    >
      <div className="space-y-6">
        {/* Search & Filter Toolbar */}
        <Card padding="sm">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by exam title, subject, or chapter..."
                aria-label="Search examinations"
                className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              />
            </div>

            <div className="flex flex-wrap sm:flex-nowrap gap-3">
              <select
                aria-label="Filter by subject"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                {subjects.map((sub) => (
                  <option key={sub} value={sub}>
                    {sub === 'All' ? 'All Subjects' : sub}
                  </option>
                ))}
              </select>

              <select
                aria-label="Filter by difficulty"
                value={difficultyFilter}
                onChange={(e) =>
                  setDifficultyFilter(e.target.value as 'All' | DifficultyLevel)
                }
                className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-600"
              >
                <option value="All">All Difficulties</option>
                <option value="Easy">Easy</option>
                <option value="Medium">Medium</option>
                <option value="Hard">Hard</option>
                <option value="Mixed">Mixed</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Filtered Results */}
        {filteredExams.length === 0 ? (
          <EmptyState
            icon={<BookOpen className="w-5 h-5" />}
            title="No matching examinations found"
            description="Adjust your search query or filters, or synthesize a new calibrated exam."
            action={
              <div className="flex items-center gap-3">
                {(search || subjectFilter !== 'All' || difficultyFilter !== 'All') && (
                  <Button
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setSubjectFilter('All');
                      setDifficultyFilter('All');
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
                <Link to="/exams/new">
                  <Button>Generate New Exam</Button>
                </Link>
              </div>
            }
          />
        ) : (
          <div className="grid md:grid-cols-2 gap-5">
            {filteredExams.map((exam) => (
              <Card key={exam.id} className="flex flex-col justify-between space-y-5">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-indigo-900">
                        {exam.subject} · {exam.academicLevel}
                      </p>
                      <h2 className="mt-1 text-base font-bold text-slate-900 leading-snug">
                        {exam.title}
                      </h2>
                    </div>
                    <Badge variant={getDifficultyBadgeVariant(exam.difficulty)}>
                      {exam.difficulty}
                    </Badge>
                  </div>

                  <p className="text-xs text-slate-500 line-clamp-2">{exam.topic}</p>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 pt-1">
                    <span className="font-mono tabular-nums">
                      {exam.questionCount} questions
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">{exam.totalMarks} marks</span>
                    <span aria-hidden="true">·</span>
                    <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exam.durationMinutes} min
                    </span>
                    {exam.lastScorePercent !== undefined && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono tabular-nums font-semibold text-emerald-700">
                          Last: {exam.lastScorePercent}%
                        </span>
                      </>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <span className="text-xs text-slate-400">
                    Updated {formatShortDate(exam.updatedAt)}
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setExamToDelete(exam)}
                      aria-label={`Delete ${exam.title}`}
                      className="p-2 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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
                      Attempt
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      <Modal
        isOpen={Boolean(examToDelete)}
        onClose={() => setExamToDelete(null)}
        title="Delete Examination?"
        description="This removes the exam blueprint from your local library."
        footer={
          <>
            <Button variant="secondary" onClick={() => setExamToDelete(null)}>
              Cancel
            </Button>
            <Button variant="danger" isLoading={deleting} onClick={handleConfirmDelete}>
              Delete Exam
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          Are you sure you want to remove{' '}
          <span className="font-semibold text-slate-900">{examToDelete?.title}</span>? Past
          attempt records will remain in your Attempt History.
        </p>
      </Modal>
    </AppShell>
  );
}
