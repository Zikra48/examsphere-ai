import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText,
  FileUp,
  Layers,
  Loader2,
  Sparkles,
  Upload,
  CheckCircle2,
  X,
} from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { AcademicLevel, DifficultyLevel, QuestionType, SourceMode } from '../types/exam';

const ACADEMIC_LEVELS: AcademicLevel[] = [
  'High School',
  'Undergraduate',
  'Postgraduate',
  'Professional Certification',
];

const DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Mixed'];

export function GenerateExamPage() {
  const { user, generateExam, addToast } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Graph Algorithms & Shortest Paths');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(user.academicLevel);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(user.defaultDifficulty);
  const [questionCount, setQuestionCount] = useState(10);
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>([
    'multiple_choice',
    'true_false',
  ]);
  const [totalMarks, setTotalMarks] = useState(50);
  const [durationMinutes, setDurationMinutes] = useState(user.defaultTimerMinutes);

  const [sourceMode, setSourceMode] = useState<SourceMode>('prompt');
  const [sourcePrompt, setSourcePrompt] = useState(
    'Focus on Dijkstra’s algorithm, Bellman-Ford negative cycles, BFS/DFS complexity, and topological sorting.'
  );
  const [sourceNotes, setSourceNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{ name: string; size: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');

  const noteStats = useMemo(() => {
    const trimmed = sourceNotes.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return { words, chars: sourceNotes.length };
  }, [sourceNotes]);

  const toggleQuestionType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev; // Keep at least one selected
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleFileSelection = (file: File | undefined) => {
    if (!file) return;
    const validExt = /\.(pdf|docx|txt)$/i.test(file.name);
    if (!validExt) {
      addToast({
        title: 'Unsupported File Format',
        description: 'Please attach a .pdf, .docx, or .txt study document.',
        variant: 'warning',
      });
      return;
    }
    setUploadedFile({ name: file.name, size: file.size });
    addToast({
      title: 'Document Attached (Simulated Parser)',
      description: `${file.name} queued for Stage-1 blueprint synthesis.`,
      variant: 'info',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !topic.trim()) {
      addToast({
        title: 'Missing Subject or Topic',
        description: 'Provide both a subject and a topic/chapter before generating.',
        variant: 'warning',
      });
      return;
    }
    if (sourceMode === 'notes' && noteStats.words < 5) {
      addToast({
        title: 'Study Notes Too Short',
        description: 'Paste at least a few sentences of notes or switch to Topic Prompt.',
        variant: 'warning',
      });
      return;
    }
    if (sourceMode === 'document' && !uploadedFile) {
      addToast({
        title: 'No Document Selected',
        description: 'Attach a .pdf, .docx, or .txt file or switch source material tab.',
        variant: 'warning',
      });
      return;
    }

    setIsGenerating(true);
    try {
      const created = await generateExam(
        {
          subject,
          topic,
          academicLevel,
          difficulty,
          questionCount,
          questionTypes,
          totalMarks,
          durationMinutes,
          sourceMode,
          sourcePrompt,
          sourceNotes,
          uploadedFileName: uploadedFile?.name,
          uploadedFileSizeBytes: uploadedFile?.size,
        },
        (stage) => setGenerationStage(stage)
      );
      navigate(`/exams/${created.id}/edit`);
    } finally {
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const avgMarksPerQuestion = (totalMarks / Math.max(1, questionCount)).toFixed(1);
  const secondsPerQuestion = Math.round((durationMinutes * 60) / Math.max(1, questionCount));

  return (
    <AppShell
      title="Generate Examination"
      breadcrumb="Workspace / Exam Studio"
    >
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Configuration Form */}
        <div className="lg:col-span-8 space-y-6">
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                01. Scope &amp; Calibration Parameters
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Define subject boundaries, cognitive tier, and scoring constraints.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gen-subject" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Subject
                </label>
                <input
                  id="gen-subject"
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="e.g., Linear Algebra, Biology, AWS"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="gen-topic" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Topic / Chapter
                </label>
                <input
                  id="gen-topic"
                  type="text"
                  required
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Eigenvalues & Diagonalization"
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="gen-level" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Educational Level
                </label>
                <select
                  id="gen-level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Difficulty Calibration
                </span>
                <div
                  role="radiogroup"
                  aria-label="Difficulty Calibration"
                  className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200"
                >
                  {DIFFICULTIES.map((lvl) => {
                    const active = difficulty === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`h-8 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-indigo-900 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        {lvl}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-4 pt-1">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gen-qcount" className="text-sm font-medium text-slate-700">
                    Questions
                  </label>
                  <span className="font-mono tabular-nums text-xs font-semibold text-indigo-900">
                    {questionCount}
                  </span>
                </div>
                <input
                  id="gen-qcount"
                  type="range"
                  min={5}
                  max={50}
                  step={1}
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value))}
                  className="w-full accent-indigo-900 cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono text-slate-400 mt-1">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label htmlFor="gen-marks" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Total Marks
                </label>
                <input
                  id="gen-marks"
                  type="number"
                  min={5}
                  max={200}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Math.max(5, Number(e.target.value) || 5))}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white font-mono tabular-nums text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="gen-time" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Time Limit (minutes)
                </label>
                <input
                  id="gen-time"
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value) || 5))}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white font-mono tabular-nums text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="pt-1">
              <span className="block text-sm font-medium text-slate-700 mb-2">
                Question Formats
              </span>
              <div className="flex flex-wrap gap-3">
                <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionTypes.includes('multiple_choice')}
                    onChange={() => toggleQuestionType('multiple_choice')}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-600"
                  />
                  <span>Multiple Choice (A–D)</span>
                </label>
                <label className="inline-flex items-center gap-2.5 px-3.5 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-sm text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={questionTypes.includes('true_false')}
                    onChange={() => toggleQuestionType('true_false')}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-600"
                  />
                  <span>True / False</span>
                </label>
              </div>
            </div>
          </Card>

          {/* Source Material Tabs */}
          <Card className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  02. Source Material Ingestion
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Anchor question synthesis to your syllabus prompt, pasted notes, or files.
                </p>
              </div>

              <div className="inline-flex p-1 bg-slate-100 rounded-lg border border-slate-200 shrink-0">
                {[
                  { id: 'prompt' as SourceMode, label: 'Topic Prompt', icon: Sparkles },
                  { id: 'notes' as SourceMode, label: 'Paste Notes', icon: FileText },
                  { id: 'document' as SourceMode, label: 'Upload File', icon: FileUp },
                ].map((tab) => {
                  const Icon = tab.icon;
                  const active = sourceMode === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => setSourceMode(tab.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                        active
                          ? 'bg-white text-slate-900 shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {sourceMode === 'prompt' && (
              <div>
                <label htmlFor="gen-prompt" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Structured Guidance Prompt
                </label>
                <textarea
                  id="gen-prompt"
                  rows={5}
                  value={sourcePrompt}
                  onChange={(e) => setSourcePrompt(e.target.value)}
                  placeholder="Specify subtopics, theorem proofs, edge cases, or syllabus learning objectives..."
                  className="w-full p-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                />
              </div>
            )}

            {sourceMode === 'notes' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gen-notes" className="text-sm font-medium text-slate-700">
                    Study Notes Excerpt
                  </label>
                  <span className="text-xs font-mono tabular-nums text-slate-500">
                    {noteStats.words} words · {noteStats.chars} chars
                  </span>
                </div>
                <textarea
                  id="gen-notes"
                  rows={7}
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder="Paste lecture transcripts, textbook definitions, or formula sheets here..."
                  className="w-full p-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 leading-relaxed"
                />
              </div>
            )}

            {sourceMode === 'document' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => handleFileSelection(e.target.files?.[0])}
                  className="hidden"
                />
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDragging(true);
                  }}
                  onDragLeave={() => setIsDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    handleFileSelection(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-indigo-600 bg-indigo-50/60'
                      : 'border-slate-300 bg-slate-50/70 hover:border-slate-400'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-white border border-slate-200 text-indigo-900 flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    Drop your study document here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Accepts .pdf, .docx, and .txt files (Stage-1 local metadata simulation)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-emerald-50 border border-emerald-200 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span className="font-medium text-slate-900 truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-slate-500 shrink-0">
                        {Math.max(1, Math.round(uploadedFile.size / 1024))} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      aria-label="Remove attached file"
                      className="p-1 rounded-md text-slate-500 hover:text-slate-800 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {isGenerating && (
            <Card className="bg-violet-50 border-violet-200">
              <div className="flex items-center gap-4">
                <Loader2 className="w-5 h-5 text-violet-600 animate-spin shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">
                    {generationStage || 'Synthesizing exam blueprint...'}
                  </p>
                  <p className="text-xs text-violet-700">
                    Calibrating {questionCount} questions at {difficulty} rigor ({academicLevel}).
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Sticky Live Blueprint Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <Card className="space-y-5">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
              <div>
                <p className="text-xs font-semibold text-violet-700 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Exam Blueprint Summary</span>
                </p>
                <h3 className="mt-1 text-base font-bold text-slate-900 leading-snug">
                  {subject || 'Untitled Subject'}: {topic || 'Untitled Topic'}
                </h3>
              </div>
              <Badge variant="violet">Draft</Badge>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Academic Level</dt>
                <dd className="font-medium text-slate-900">{academicLevel}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Difficulty</dt>
                <dd className="font-medium text-slate-900">{difficulty}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Question Count</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {questionCount} items
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Total Marks</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {totalMarks} pts (~{avgMarksPerQuestion}/Q)
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Time Allocation</dt>
                <dd className="font-mono tabular-nums font-semibold text-slate-900">
                  {durationMinutes} min (~{secondsPerQuestion}s/Q)
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Formats</dt>
                <dd className="text-xs font-medium text-slate-800">
                  {questionTypes
                    .map((t) => (t === 'multiple_choice' ? 'MCQ' : 'T/F'))
                    .join(' + ')}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-slate-500">Source Channel</dt>
                <dd className="text-xs font-medium text-slate-800 capitalize">
                  {sourceMode}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-slate-200 space-y-3">
              <Button
                type="submit"
                size="lg"
                isLoading={isGenerating}
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isGenerating ? 'Synthesizing...' : 'Generate Exam Blueprint'}
              </Button>
              <p className="text-[11px] text-slate-500 text-center leading-relaxed">
                Stage 1 uses deterministic local blueprint synthesis. You can edit every question
                before starting.
              </p>
            </div>
          </Card>
        </div>
      </form>
    </AppShell>
  );
}
