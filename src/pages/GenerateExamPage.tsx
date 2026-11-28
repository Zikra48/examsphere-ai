import React, { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  CheckCircle2,
  FileText,
  FileUp,
  Layers,
  Loader2,
  Sparkles,
  Upload,
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
const MAX_UPLOAD_BYTES = 4 * 1024 * 1024; // 4 MB cap for safe JSON inline transfer

function readFileAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : '';
      const commaIdx = result.indexOf(',');
      resolve(commaIdx >= 0 ? result.slice(commaIdx + 1) : result);
    };
    reader.onerror = () => reject(new Error('Failed to read uploaded file.'));
    reader.readAsDataURL(file);
  });
}

export function GenerateExamPage() {
  const { user, generateExam, addToast } = useApp();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const generatingLockRef = useRef(false);

  // A. Exam Information
  const [examTitle, setExamTitle] = useState('');
  const [subject, setSubject] = useState('Computer Science');
  const [topic, setTopic] = useState('Graph Algorithms & Shortest Paths');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(user.academicLevel);
  const [instructions, setInstructions] = useState('');

  // B. Question Configuration
  const [questionTypes, setQuestionTypes] = useState<QuestionType[]>(['multiple_choice']);
  const [questionCount, setQuestionCount] = useState(10);
  const [difficulty, setDifficulty] = useState<DifficultyLevel>(user.defaultDifficulty);
  const [durationMinutes, setDurationMinutes] = useState(user.defaultTimerMinutes);
  const [totalMarks, setTotalMarks] = useState(50);

  // C. Learning Material
  const [sourceMode, setSourceMode] = useState<SourceMode>('prompt');
  const [sourcePrompt, setSourcePrompt] = useState(
    'Focus on Dijkstra’s algorithm, Bellman-Ford negative cycles, BFS/DFS complexity, and topological sorting.'
  );
  const [sourceNotes, setSourceNotes] = useState('');
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: number;
    mimeType: string;
    textContent?: string;
    base64Data?: string;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // D. Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStage, setGenerationStage] = useState('');
  const [generationError, setGenerationError] = useState('');

  const noteStats = useMemo(() => {
    const trimmed = sourceNotes.trim();
    const words = trimmed ? trimmed.split(/\s+/).length : 0;
    return { words, chars: sourceNotes.length };
  }, [sourceNotes]);

  const toggleQuestionType = (type: QuestionType) => {
    setQuestionTypes((prev) => {
      if (prev.includes(type)) {
        if (prev.length === 1) return prev;
        return prev.filter((t) => t !== type);
      }
      return [...prev, type];
    });
  };

  const handleFileSelection = async (file: File | undefined) => {
    if (!file) return;
    setGenerationError('');
    const validExt = /\.(pdf|docx|txt)$/i.test(file.name);
    if (!validExt) {
      addToast({
        title: 'Unsupported File Format',
        description: 'Please attach a .pdf, .docx, or .txt study document.',
        variant: 'warning',
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      addToast({
        title: 'File Too Large',
        description: 'Please choose a document smaller than 4 MB.',
        variant: 'warning',
      });
      return;
    }

    try {
      const isTxt = /\.txt$/i.test(file.name) || file.type.startsWith('text/');
      if (isTxt) {
        const textContent = (await file.text()).slice(0, 32000);
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType: file.type || 'text/plain',
          textContent,
        });
      } else {
        const base64Data = await readFileAsBase64(file);
        const mimeType = /\.pdf$/i.test(file.name)
          ? 'application/pdf'
          : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
        setUploadedFile({
          name: file.name,
          size: file.size,
          mimeType,
          base64Data,
        });
      }
      addToast({
        title: 'Document Ready',
        description: `${file.name} parsed and attached for AI synthesis.`,
        variant: 'info',
      });
    } catch (err) {
      addToast({
        title: 'File Read Error',
        description: err instanceof Error ? err.message : 'Unable to read the selected file.',
        variant: 'error',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (generatingLockRef.current || isGenerating) return;

    setGenerationError('');

    if (!subject.trim() || !topic.trim()) {
      setGenerationError('Provide both a subject and a topic/chapter before generating.');
      return;
    }
    if (sourceMode === 'notes' && noteStats.words < 5) {
      setGenerationError('Paste at least a few sentences of study notes or switch to Topic Prompt.');
      return;
    }
    if (sourceMode === 'document' && !uploadedFile) {
      setGenerationError('Attach a .pdf, .docx, or .txt file or switch the learning material tab.');
      return;
    }

    generatingLockRef.current = true;
    setIsGenerating(true);
    setGenerationStage('Preparing AI prompt and rubric...');

    try {
      const created = await generateExam(
        {
          title: examTitle.trim() || undefined,
          subject: subject.trim(),
          topic: topic.trim(),
          academicLevel,
          difficulty,
          questionCount,
          questionTypes,
          totalMarks,
          durationMinutes,
          instructions: instructions.trim() || undefined,
          sourceMode,
          sourcePrompt,
          sourceNotes,
          uploadedFileName: uploadedFile?.name,
          uploadedFileSizeBytes: uploadedFile?.size,
          uploadedFileContent: uploadedFile?.textContent,
          uploadedFileBase64: uploadedFile?.base64Data,
          uploadedFileMimeType: uploadedFile?.mimeType,
        },
        (stage) => setGenerationStage(stage)
      );
      navigate(`/exams/${created.id}/edit`);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to generate examination right now. Please try again.';
      setGenerationError(message);
      addToast({
        title: 'Generation Failed',
        description: message,
        variant: 'error',
      });
    } finally {
      generatingLockRef.current = false;
      setIsGenerating(false);
      setGenerationStage('');
    }
  };

  const avgMarksPerQuestion = (totalMarks / Math.max(1, questionCount)).toFixed(1);
  const secondsPerQuestion = Math.round((durationMinutes * 60) / Math.max(1, questionCount));
  const resolvedPreviewTitle = examTitle.trim() || `${subject || 'Untitled Subject'}: ${topic || 'Untitled Topic'}`;

  return (
    <AppShell title="Exam Generator Studio" breadcrumb="Assessment Studio / New Examination">
      <form onSubmit={handleSubmit} className="grid lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sections A, B, C */}
        <div className="lg:col-span-8 space-y-6">
          {/* A. Exam Information */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#648BFF]">
                  Section A
                </p>
                <h2 className="text-base font-semibold text-[#F1F5FC] mt-0.5">
                  Exam Information
                </h2>
              </div>
              <span className="text-xs text-[#9AA8BD]">Identity &amp; academic tier</span>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="gen-title" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Exam Title <span className="text-xs font-normal text-[#9AA8BD]">(optional)</span>
                </label>
                <input
                  id="gen-title"
                  type="text"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  placeholder={`${subject || 'Subject'}: ${topic || 'Topic'} (auto-named if left blank)`}
                  className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                />
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gen-subject" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Subject
                  </label>
                  <input
                    id="gen-subject"
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g., Machine Learning, Computer Science"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                  />
                </div>

                <div>
                  <label htmlFor="gen-topic" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Topic / Chapter
                  </label>
                  <input
                    id="gen-topic"
                    type="text"
                    required
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                    placeholder="e.g., Gradient Descent & Regularization"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="gen-level" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Academic Level
                  </label>
                  <select
                    id="gen-level"
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full h-10 px-3 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                  >
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="gen-instructions" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Optional Instructions
                  </label>
                  <input
                    id="gen-instructions"
                    type="text"
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="e.g., Emphasize time complexity & edge cases"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                  />
                </div>
              </div>
            </div>
          </Card>

          {/* B. Question Configuration */}
          <Card className="space-y-5">
            <div className="flex items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#648BFF]">
                  Section B
                </p>
                <h2 className="text-base font-semibold text-[#F1F5FC] mt-0.5">
                  Question Configuration
                </h2>
              </div>
              <span className="font-mono tabular-nums text-xs text-[#9AA8BD]">
                ~{avgMarksPerQuestion} marks / item
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Question Types
                </span>
                <div className="grid grid-cols-2 gap-2.5">
                  <label
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      questionTypes.includes('multiple_choice')
                        ? 'bg-[#648BFF]/15 border-[#648BFF]/40 text-[#F1F5FC]'
                        : 'bg-[#080D19] border-white/[0.1] text-[#9AA8BD] hover:text-[#F1F5FC]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes('multiple_choice')}
                      onChange={() => toggleQuestionType('multiple_choice')}
                      className="w-4 h-4 rounded accent-[#648BFF]"
                    />
                    <span>MCQ (A–D)</span>
                  </label>
                  <label
                    className={`inline-flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                      questionTypes.includes('true_false')
                        ? 'bg-[#648BFF]/15 border-[#648BFF]/40 text-[#F1F5FC]'
                        : 'bg-[#080D19] border-white/[0.1] text-[#9AA8BD] hover:text-[#F1F5FC]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={questionTypes.includes('true_false')}
                      onChange={() => toggleQuestionType('true_false')}
                      className="w-4 h-4 rounded accent-[#648BFF]"
                    />
                    <span>True / False</span>
                  </label>
                </div>
              </div>

              <div>
                <span className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Difficulty Level
                </span>
                <div
                  role="radiogroup"
                  aria-label="Difficulty Level"
                  className="grid grid-cols-4 gap-1 p-1 bg-[#080D19] rounded-lg border border-white/[0.1]"
                >
                  {DIFFICULTIES.map((lvl) => {
                    const active = difficulty === lvl;
                    return (
                      <button
                        key={lvl}
                        type="button"
                        onClick={() => setDifficulty(lvl)}
                        className={`h-8 rounded-md text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                          active
                            ? 'bg-[#648BFF] text-[#080D19]'
                            : 'text-[#9AA8BD] hover:text-[#F1F5FC]'
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
                  <label htmlFor="gen-qcount" className="text-sm font-medium text-[#F1F5FC]">
                    Question Count
                  </label>
                  <span className="font-mono tabular-nums text-xs font-semibold text-[#648BFF]">
                    {questionCount} Qs
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
                  className="w-full accent-[#648BFF] cursor-pointer"
                />
                <div className="flex justify-between text-[11px] font-mono tabular-nums text-[#9AA8BD] mt-1">
                  <span>5</span>
                  <span>25</span>
                  <span>50</span>
                </div>
              </div>

              <div>
                <label htmlFor="gen-marks" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Total Marks
                </label>
                <input
                  id="gen-marks"
                  type="number"
                  min={5}
                  max={200}
                  value={totalMarks}
                  onChange={(e) => setTotalMarks(Math.max(5, Number(e.target.value) || 5))}
                  className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] font-mono tabular-nums text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                />
              </div>

              <div>
                <label htmlFor="gen-time" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Duration (minutes)
                </label>
                <input
                  id="gen-time"
                  type="number"
                  min={5}
                  max={180}
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Math.max(5, Number(e.target.value) || 5))}
                  className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] font-mono tabular-nums text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
                />
              </div>
            </div>
          </Card>

          {/* C. Learning Material */}
          <Card className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#648BFF]">
                  Section C
                </p>
                <h2 className="text-base font-semibold text-[#F1F5FC] mt-0.5">
                  Learning Material
                </h2>
              </div>

              <div className="inline-flex p-1 bg-[#080D19] rounded-lg border border-white/[0.1] shrink-0">
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
                          ? 'bg-[#151F30] text-[#F1F5FC] border border-[#648BFF]/35'
                          : 'text-[#9AA8BD] hover:text-[#F1F5FC] border border-transparent'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? 'text-[#648BFF]' : ''}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {sourceMode === 'prompt' && (
              <div>
                <label htmlFor="gen-prompt" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                  Structured Guidance Prompt
                </label>
                <textarea
                  id="gen-prompt"
                  rows={5}
                  value={sourcePrompt}
                  onChange={(e) => setSourcePrompt(e.target.value)}
                  placeholder="Specify subtopics, theorem proofs, edge cases, or syllabus learning objectives..."
                  className="w-full p-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] leading-relaxed"
                />
              </div>
            )}

            {sourceMode === 'notes' && (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label htmlFor="gen-notes" className="text-sm font-medium text-[#F1F5FC]">
                    Study Notes Excerpt
                  </label>
                  <span className="text-xs font-mono tabular-nums text-[#9AA8BD]">
                    {noteStats.words} words · {noteStats.chars} chars
                  </span>
                </div>
                <textarea
                  id="gen-notes"
                  rows={7}
                  value={sourceNotes}
                  onChange={(e) => setSourceNotes(e.target.value)}
                  placeholder="Paste lecture transcripts, textbook definitions, or formula sheets here..."
                  className="w-full p-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] leading-relaxed"
                />
              </div>
            )}

            {sourceMode === 'document' && (
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.txt"
                  onChange={(e) => void handleFileSelection(e.target.files?.[0])}
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
                    void handleFileSelection(e.dataTransfer.files?.[0]);
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors cursor-pointer ${
                    isDragging
                      ? 'border-[#648BFF] bg-[#648BFF]/10'
                      : 'border-white/[0.14] bg-[#080D19]/70 hover:border-[#648BFF]/50'
                  }`}
                >
                  <div className="w-11 h-11 rounded-xl bg-[#151F30] border border-white/[0.1] text-[#648BFF] flex items-center justify-center mx-auto mb-3">
                    <Upload className="w-5 h-5" />
                  </div>
                  <p className="text-sm font-semibold text-[#F1F5FC]">
                    Drop your study document here, or click to browse
                  </p>
                  <p className="mt-1 text-xs text-[#9AA8BD]">
                    Supported formats: .pdf, .docx, and .txt (up to 4 MB)
                  </p>
                </div>

                {uploadedFile && (
                  <div className="mt-3 flex items-center justify-between gap-3 px-4 py-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-medium text-[#F1F5FC] truncate">
                        {uploadedFile.name}
                      </span>
                      <span className="text-xs font-mono tabular-nums text-[#9AA8BD] shrink-0">
                        {Math.max(1, Math.round(uploadedFile.size / 1024))} KB
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setUploadedFile(null)}
                      aria-label="Remove attached file"
                      className="p-1 rounded-md text-[#9AA8BD] hover:text-[#F1F5FC] cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Generation Status / Error Display */}
          {isGenerating && (
            <Card className="bg-[#151F30] border-[#9275F5]/35">
              <div className="flex items-center gap-4">
                <Loader2 className="w-5 h-5 text-[#9275F5] animate-spin shrink-0" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-[#F1F5FC]">
                    {generationStage || 'Generating exam questions...'}
                  </p>
                  <p className="text-xs text-[#C1B0FF]">
                    Generating {questionCount} unique questions at {difficulty} difficulty ({academicLevel}).
                  </p>
                </div>
              </div>
            </Card>
          )}

          {generationError && (
            <Card className="bg-rose-500/10 border-rose-500/30">
              <div role="alert" className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-rose-200">
                    Could not generate examination
                  </p>
                  <p className="text-xs text-rose-300 leading-relaxed">{generationError}</p>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column: Section D — Generation & Blueprint Summary */}
        <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
          <Card className="space-y-5 bg-[#151F30] border-[#648BFF]/20">
            <div className="flex items-start justify-between gap-3 pb-4 border-b border-white/[0.08]">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[#9275F5] flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5" />
                  <span>Section D · Generation</span>
                </p>
                <h3 className="mt-1.5 text-base font-bold text-[#F1F5FC] leading-snug break-words">
                  {resolvedPreviewTitle}
                </h3>
              </div>
              <Badge variant="violet">AI Draft</Badge>
            </div>

            <dl className="space-y-3 text-sm">
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Academic Level</dt>
                <dd className="font-medium text-[#F1F5FC] text-right">{academicLevel}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Difficulty</dt>
                <dd className="font-medium text-[#F1F5FC]">{difficulty}</dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Question Count</dt>
                <dd className="font-mono tabular-nums font-semibold text-[#F1F5FC]">
                  {questionCount} items
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Marks / Question</dt>
                <dd className="font-mono tabular-nums font-semibold text-[#F1F5FC]">
                  ~{avgMarksPerQuestion} pts ({totalMarks} total)
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Time Allocation</dt>
                <dd className="font-mono tabular-nums font-semibold text-[#F1F5FC]">
                  {durationMinutes} min (~{secondsPerQuestion}s/Q)
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Formats</dt>
                <dd className="text-xs font-medium text-[#F1F5FC]">
                  {questionTypes
                    .map((t) => (t === 'multiple_choice' ? 'MCQ (A–D)' : 'T/F'))
                    .join(' + ')}
                </dd>
              </div>
              <div className="flex items-center justify-between gap-2">
                <dt className="text-[#9AA8BD]">Source Material</dt>
                <dd className="text-xs font-medium text-[#F1F5FC] capitalize">
                  {sourceMode === 'document' && uploadedFile ? uploadedFile.name : sourceMode}
                </dd>
              </div>
            </dl>

            <div className="pt-4 border-t border-white/[0.08] space-y-3">
              <Button
                type="submit"
                size="lg"
                isLoading={isGenerating}
                disabled={isGenerating}
                className="w-full"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                {isGenerating ? 'Generating Exam...' : 'Generate Exam'}
              </Button>
              <p className="text-[11px] text-[#9AA8BD] text-center leading-relaxed">
                Generates subject-specific questions with unique A–D distractors, validates answer keys, and opens the editor.
              </p>
            </div>
          </Card>
        </div>
      </form>
    </AppShell>
  );
}
