import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  ArrowDown,
  ArrowUp,
  BookOpen,
  Eye,
  EyeOff,
  Play,
  Plus,
  Save,
  Sparkles,
  Trash2,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useApp } from '../context/AppContext';
import { Exam, Question, QuestionType } from '../types/exam';
import { getDifficultyBadgeVariant } from '../utils/formatters';

export function ExamEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { exams, saveExam } = useApp();

  const sourceExam = exams.find((e) => e.id === id);
  const [draft, setDraft] = useState<Exam | null>(sourceExam ? structuredClone(sourceExam) : null);
  const [saving, setSaving] = useState(false);
  const [studentPreviewMode, setStudentPreviewMode] = useState(false);

  useEffect(() => {
    if (sourceExam) {
      setDraft(structuredClone(sourceExam));
    }
  }, [sourceExam?.id]);

  if (!draft) {
    return (
      <AppShell title="Examination Not Found" breadcrumb="Workspace / Exam Library">
        <EmptyState
          icon={<BookOpen className="w-5 h-5" />}
          title="We could not locate this examination"
          description="It may have been removed from your library."
          action={
            <Link to="/exams">
              <Button>Return to Library</Button>
            </Link>
          }
        />
      </AppShell>
    );
  }

  const totalMarksComputed = draft.questions.reduce((sum, q) => sum + q.marks, 0);

  const updateQuestion = (qId: string, patch: Partial<Question>) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => (q.id === qId ? { ...q, ...patch } : q)),
      };
    });
  };

  const handleTypeChange = (qId: string, newType: QuestionType) => {
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions.map((q) => {
          if (q.id !== qId) return q;
          if (newType === 'true_false') {
            return {
              ...q,
              type: 'true_false',
              options: ['True', 'False'],
              correctOptionIndex: q.correctOptionIndex > 1 ? 0 : q.correctOptionIndex,
            };
          }
          const padded =
            q.options.length >= 4
              ? q.options.slice(0, 4)
              : ['Choice A', 'Choice B', 'Choice C', 'Choice D'];
          return {
            ...q,
            type: 'multiple_choice',
            options: padded,
            correctOptionIndex: Math.min(q.correctOptionIndex, 3),
          };
        }),
      };
    });
  };

  const moveQuestion = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= draft.questions.length) return;
    setDraft((prev) => {
      if (!prev) return prev;
      const copy = [...prev.questions];
      const [moved] = copy.splice(index, 1);
      copy.splice(target, 0, moved);
      return {
        ...prev,
        questions: copy.map((q, idx) => ({ ...q, order: idx + 1 })),
      };
    });
  };

  const deleteQuestion = (qId: string) => {
    if (draft.questions.length <= 1) return;
    setDraft((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        questions: prev.questions
          .filter((q) => q.id !== qId)
          .map((q, idx) => ({ ...q, order: idx + 1 })),
      };
    });
  };

  const addQuestion = () => {
    const nextNum = draft.questions.length + 1;
    const newQuestion: Question = {
      id: `q_custom_${Date.now()}`,
      examId: draft.id,
      order: nextNum,
      type: 'multiple_choice',
      prompt: `New ${draft.subject} question on ${draft.topic}`,
      options: ['Choice A', 'Choice B', 'Choice C', 'Choice D'],
      correctOptionIndex: 0,
      marks: 5,
      topicTag: draft.topic.split(',')[0].trim() || draft.subject,
      difficulty: draft.difficulty === 'Mixed' ? 'Medium' : draft.difficulty,
      explanation: 'Add a concise conceptual explanation for post-exam review.',
    };
    setDraft((prev) =>
      prev ? { ...prev, questions: [...prev.questions, newQuestion] } : prev
    );
  };

  const handleSave = async (startAfter = false) => {
    setSaving(true);
    try {
      const saved = await saveExam({
        ...draft,
        totalMarks: totalMarksComputed,
        questionCount: draft.questions.length,
      });
      if (startAfter) {
        navigate(`/exams/${saved.id}/attempt`);
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <AppShell
      title={studentPreviewMode ? 'Student Exam Preview' : 'Preview & Edit Examination'}
      breadcrumb={`Exam Library / ${draft.subject}`}
      actions={
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            leftIcon={studentPreviewMode ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            onClick={() => setStudentPreviewMode((prev) => !prev)}
          >
            <span className="hidden sm:inline">
              {studentPreviewMode ? 'Show Answer Key' : 'Hide Answer Key'}
            </span>
          </Button>
          <Button
            size="sm"
            variant="secondary"
            isLoading={saving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
            onClick={() => handleSave(false)}
          >
            Save
          </Button>
          <Button
            size="sm"
            isLoading={saving}
            leftIcon={<Play className="w-3.5 h-3.5" />}
            onClick={() => handleSave(true)}
          >
            Start Exam
          </Button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Header Blueprint Card */}
        <Card className="space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <label htmlFor="exam-title-input" className="block text-xs font-medium text-[#9AA8BD] mb-1">
                Examination Title
              </label>
              <input
                id="exam-title-input"
                type="text"
                readOnly={studentPreviewMode}
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full text-lg sm:text-xl font-bold text-[#F1F5FC] bg-[#080D19] border border-white/[0.1] rounded-lg px-3.5 py-2 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <Badge variant={getDifficultyBadgeVariant(draft.difficulty)}>
                {draft.difficulty}
              </Badge>
              <span className="text-xs font-mono tabular-nums text-[#9AA8BD]">
                {draft.questions.length} Qs · {totalMarksComputed} Marks
              </span>
              <div className="inline-flex items-center gap-1.5 bg-[#151F30] border border-white/[0.1] rounded-md px-2.5 py-1 text-xs">
                <span className="text-[#9AA8BD]">Timer:</span>
                <input
                  type="number"
                  min={5}
                  max={180}
                  readOnly={studentPreviewMode}
                  aria-label="Duration in minutes"
                  value={draft.durationMinutes}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      durationMinutes: Math.max(5, Number(e.target.value) || 5),
                    })
                  }
                  className="w-12 bg-[#080D19] border border-white/[0.1] rounded px-1.5 py-0.5 font-mono tabular-nums text-xs text-[#F1F5FC]"
                />
                <span className="text-[#9AA8BD]">min</span>
              </div>
            </div>
          </div>

          {draft.instructions && (
            <div className="px-3.5 py-2.5 rounded-lg bg-[#151F30] border border-white/[0.08] text-xs text-[#9AA8BD]">
              <span className="font-semibold text-[#F1F5FC]">Instructions: </span>
              {draft.instructions}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.08]">
            <p className="text-xs text-[#9AA8BD] truncate max-w-2xl">
              Source: <span className="font-medium text-[#F1F5FC]">{draft.sourceSummary}</span>
            </p>
            {!studentPreviewMode && (
              <Button
                size="sm"
                variant="secondary"
                leftIcon={<Plus className="w-3.5 h-3.5" />}
                onClick={addQuestion}
              >
                Add Question
              </Button>
            )}
          </div>
        </Card>

        {/* Distinct Question Cards */}
        <div className="space-y-4">
          {draft.questions.map((question, qIndex) => (
            <Card key={question.id} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
                <div className="flex items-center gap-3">
                  <span className="px-2.5 py-1 rounded-md bg-[#648BFF] text-[#080D19] font-mono tabular-nums text-xs font-bold">
                    Q{String(qIndex + 1).padStart(2, '0')}
                  </span>

                  {studentPreviewMode ? (
                    <span className="text-xs text-[#9AA8BD]">
                      {question.topicTag} · {question.difficulty}
                    </span>
                  ) : (
                    <>
                      <select
                        aria-label={`Question ${qIndex + 1} format`}
                        value={question.type}
                        onChange={(e) =>
                          handleTypeChange(question.id, e.target.value as QuestionType)
                        }
                        className="h-8 px-2.5 rounded-md border border-white/[0.1] bg-[#080D19] text-xs font-medium text-[#F1F5FC]"
                      >
                        <option value="multiple_choice">Multiple Choice</option>
                        <option value="true_false">True / False</option>
                      </select>

                      <div className="inline-flex items-center gap-1.5 text-xs text-[#9AA8BD]">
                        <span>Marks:</span>
                        <input
                          type="number"
                          min={1}
                          max={25}
                          aria-label={`Question ${qIndex + 1} marks`}
                          value={question.marks}
                          onChange={(e) =>
                            updateQuestion(question.id, {
                              marks: Math.max(1, Number(e.target.value) || 1),
                            })
                          }
                          className="w-14 h-8 px-2 rounded-md border border-white/[0.1] bg-[#080D19] font-mono tabular-nums text-xs text-[#F1F5FC]"
                        />
                      </div>
                    </>
                  )}
                </div>

                {studentPreviewMode ? (
                  <span className="font-mono tabular-nums text-xs text-[#9AA8BD]">
                    {question.marks} Marks
                  </span>
                ) : (
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={qIndex === 0}
                      onClick={() => moveQuestion(qIndex, -1)}
                      aria-label="Move question up"
                      className="p-1.5 rounded-lg border border-white/[0.1] bg-[#151F30] text-[#9AA8BD] hover:text-[#F1F5FC] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={qIndex === draft.questions.length - 1}
                      onClick={() => moveQuestion(qIndex, 1)}
                      aria-label="Move question down"
                      className="p-1.5 rounded-lg border border-white/[0.1] bg-[#151F30] text-[#9AA8BD] hover:text-[#F1F5FC] disabled:opacity-40 cursor-pointer"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={draft.questions.length <= 1}
                      onClick={() => deleteQuestion(question.id)}
                      aria-label="Delete question"
                      className="p-1.5 rounded-lg border border-white/[0.1] bg-[#151F30] text-rose-400 hover:bg-rose-500/15 disabled:opacity-40 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {studentPreviewMode ? (
                <p className="text-base font-medium text-[#F1F5FC] leading-relaxed">
                  {question.prompt}
                </p>
              ) : (
                <div className="grid sm:grid-cols-4 gap-3">
                  <div className="sm:col-span-3">
                    <label className="block text-xs font-medium text-[#9AA8BD] mb-1">
                      Question Prompt
                    </label>
                    <textarea
                      rows={2}
                      value={question.prompt}
                      onChange={(e) => updateQuestion(question.id, { prompt: e.target.value })}
                      className="w-full p-3 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#9AA8BD] mb-1">
                      Topic Tag
                    </label>
                    <input
                      type="text"
                      value={question.topicTag}
                      onChange={(e) => updateQuestion(question.id, { topicTag: e.target.value })}
                      className="w-full h-10 px-3 rounded-lg border border-white/[0.1] bg-[#080D19] text-xs text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                {!studentPreviewMode && (
                  <p className="text-xs font-medium text-[#9AA8BD]">
                    Options (select radio button for correct answer)
                  </p>
                )}
                <div className="grid sm:grid-cols-2 gap-2.5">
                  {question.options.map((opt, optIdx) => {
                    const isCorrect = !studentPreviewMode && question.correctOptionIndex === optIdx;
                    return (
                      <div
                        key={optIdx}
                        className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border ${
                          isCorrect
                            ? 'bg-emerald-500/12 border-emerald-400/45'
                            : 'bg-[#151F30] border-white/[0.08]'
                        }`}
                      >
                        {!studentPreviewMode && (
                          <input
                            type="radio"
                            name={`correct_${question.id}`}
                            checked={question.correctOptionIndex === optIdx}
                            onChange={() =>
                              updateQuestion(question.id, { correctOptionIndex: optIdx })
                            }
                            aria-label={`Mark option ${String.fromCharCode(65 + optIdx)} correct`}
                            className="w-4 h-4 accent-emerald-400 cursor-pointer shrink-0"
                          />
                        )}
                        <span className="font-mono text-xs font-semibold text-[#648BFF] w-5 shrink-0">
                          {String.fromCharCode(65 + optIdx)}.
                        </span>
                        {studentPreviewMode ? (
                          <span className="text-sm text-[#F1F5FC]">{opt}</span>
                        ) : (
                          <input
                            type="text"
                            value={opt}
                            readOnly={question.type === 'true_false'}
                            onChange={(e) => {
                              const updatedOpts = [...question.options];
                              updatedOpts[optIdx] = e.target.value;
                              updateQuestion(question.id, { options: updatedOpts });
                            }}
                            className="flex-1 min-w-0 bg-transparent text-sm text-[#F1F5FC] focus:outline-none"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!studentPreviewMode && (
                <div className="p-3.5 rounded-xl bg-[#9275F5]/10 border border-[#9275F5]/25 space-y-1.5">
                  <label className="flex items-center gap-1.5 text-xs font-semibold text-[#C1B0FF]">
                    <Sparkles className="w-3.5 h-3.5 text-[#9275F5]" />
                    <span>Concept Explanation (Hidden Until Submission)</span>
                  </label>
                  <textarea
                    rows={2}
                    value={question.explanation}
                    onChange={(e) => updateQuestion(question.id, { explanation: e.target.value })}
                    className="w-full p-2.5 rounded-lg border border-[#9275F5]/25 bg-[#080D19] text-xs sm:text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#9275F5]"
                  />
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
