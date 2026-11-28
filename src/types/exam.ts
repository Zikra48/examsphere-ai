export type AcademicLevel =
  | 'High School'
  | 'Undergraduate'
  | 'Postgraduate'
  | 'Professional Certification';

export type DifficultyLevel = 'Easy' | 'Medium' | 'Hard' | 'Mixed';

export type QuestionType = 'multiple_choice' | 'true_false';

export type SourceMode = 'prompt' | 'notes' | 'document';

export interface Question {
  id: string;
  examId: string;
  order: number;
  type: QuestionType;
  prompt: string;
  options: string[];
  correctOptionIndex: number;
  marks: number;
  topicTag: string;
  difficulty: Exclude<DifficultyLevel, 'Mixed'>;
  explanation: string;
}

export interface Exam {
  id: string;
  title: string;
  subject: string;
  topic: string;
  academicLevel: AcademicLevel;
  difficulty: DifficultyLevel;
  durationMinutes: number;
  totalMarks: number;
  questionCount: number;
  instructions?: string;
  sourceType: SourceMode;
  sourceSummary: string;
  createdAt: string;
  updatedAt: string;
  lastScorePercent?: number;
  questions: Question[];
}

export interface AttemptAnswer {
  questionId: string;
  selectedOptionIndex: number | null;
  isFlagged: boolean;
  isCorrect: boolean;
  marksEarned: number;
}

export interface TopicBreakdownItem {
  topic: string;
  correct: number;
  total: number;
  accuracy: number;
}

export interface Attempt {
  id: string;
  examId: string;
  examTitle: string;
  subject: string;
  difficulty: DifficultyLevel;
  startedAt: string;
  completedAt: string;
  durationTakenSeconds: number;
  totalMarks: number;
  earnedMarks: number;
  scorePercent: number;
  passed: boolean;
  answers: Record<string, AttemptAnswer>;
  topicBreakdown: TopicBreakdownItem[];
}

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  academicLevel: AcademicLevel;
  targetExam: string;
  defaultDifficulty: DifficultyLevel;
  defaultTimerMinutes: number;
  studyStreakDays: number;
  joinedAt: string;
}

export interface SubjectProgress {
  subject: string;
  examsCompleted: number;
  averageScore: number;
  masteryPercent: number;
  trendDelta: number;
  weakestTopic: string;
}

export interface ExamGenerationInput {
  title?: string;
  subject: string;
  topic: string;
  academicLevel: AcademicLevel;
  difficulty: DifficultyLevel;
  questionCount: number;
  questionTypes: QuestionType[];
  totalMarks: number;
  durationMinutes: number;
  instructions?: string;
  sourceMode: SourceMode;
  sourcePrompt: string;
  sourceNotes: string;
  uploadedFileName?: string;
  uploadedFileSizeBytes?: number;
  uploadedFileContent?: string;
  uploadedFileBase64?: string;
  uploadedFileMimeType?: string;
}

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'info' | 'success' | 'warning' | 'error';
}
