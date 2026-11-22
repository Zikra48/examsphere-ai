import {
  DEMO_USER_PROFILE,
  INITIAL_ATTEMPTS,
  INITIAL_EXAMS,
  INITIAL_SUBJECT_PROGRESS,
} from '../data/mockData';
import {
  Attempt,
  AttemptAnswer,
  DifficultyLevel,
  Exam,
  ExamGenerationInput,
  Question,
  SubjectProgress,
  TopicBreakdownItem,
  UserProfile,
} from '../types/exam';

const STORAGE_KEY = 'examsphere_stage1_state_v1';

export interface PersistedAppState {
  isAuthenticated: boolean;
  user: UserProfile;
  exams: Exam[];
  attempts: Attempt[];
  previewBannerDismissed: boolean;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomLatency(min = 600, max = 1000): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function loadInitialState(): PersistedAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as PersistedAppState;
      if (parsed && Array.isArray(parsed.exams) && Array.isArray(parsed.attempts)) {
        return parsed;
      }
    }
  } catch {
    // Fallback to seeded demo state if storage is unavailable
  }

  return {
    isAuthenticated: false,
    user: DEMO_USER_PROFILE,
    exams: INITIAL_EXAMS,
    attempts: INITIAL_ATTEMPTS,
    previewBannerDismissed: false,
  };
}

export function saveAppState(state: PersistedAppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Ignore quota errors in restricted sandboxes
  }
}

export function computeSubjectProgress(exams: Exam[], attempts: Attempt[]): SubjectProgress[] {
  if (attempts.length === 0 && exams.length === 0) {
    return INITIAL_SUBJECT_PROGRESS;
  }

  const subjectMap = new Map<
    string,
    {
      scores: number[];
      topicMisses: Map<string, number>;
    }
  >();

  for (const exam of exams) {
    if (!subjectMap.has(exam.subject)) {
      subjectMap.set(exam.subject, { scores: [], topicMisses: new Map() });
    }
  }

  for (const attempt of attempts) {
    if (!subjectMap.has(attempt.subject)) {
      subjectMap.set(attempt.subject, { scores: [], topicMisses: new Map() });
    }
    const entry = subjectMap.get(attempt.subject)!;
    entry.scores.push(attempt.scorePercent);
    for (const tb of attempt.topicBreakdown) {
      if (tb.accuracy < 80) {
        entry.topicMisses.set(tb.topic, (entry.topicMisses.get(tb.topic) ?? 0) + (tb.total - tb.correct));
      }
    }
  }

  const results: SubjectProgress[] = [];
  subjectMap.forEach((data, subject) => {
    const examsCompleted = data.scores.length;
    const avg =
      examsCompleted > 0
        ? Math.round(data.scores.reduce((sum, v) => sum + v, 0) / examsCompleted)
        : 0;
    const latest = examsCompleted > 0 ? data.scores[data.scores.length - 1] : 0;
    const previous = examsCompleted > 1 ? data.scores[data.scores.length - 2] : latest;
    const trendDelta = examsCompleted > 1 ? latest - previous : examsCompleted === 1 ? 4 : 0;

    let weakestTopic = 'Core Concepts';
    let maxMiss = -1;
    data.topicMisses.forEach((misses, topic) => {
      if (misses > maxMiss) {
        maxMiss = misses;
        weakestTopic = topic;
      }
    });

    results.push({
      subject,
      examsCompleted,
      averageScore: avg,
      masteryPercent: examsCompleted > 0 ? Math.min(100, Math.round(avg * 0.6 + latest * 0.4)) : 0,
      trendDelta,
      weakestTopic,
    });
  });

  return results.sort((a, b) => b.masteryPercent - a.masteryPercent);
}

function distributeMarks(totalMarks: number, count: number): number[] {
  const base = Math.floor(totalMarks / count);
  const remainder = totalMarks % count;
  return Array.from({ length: count }, (_, idx) => (idx < remainder ? base + 1 : base));
}

function resolveQuestionDifficulty(
  target: DifficultyLevel,
  index: number
): Exclude<DifficultyLevel, 'Mixed'> {
  if (target !== 'Mixed') return target;
  const cycle: Exclude<DifficultyLevel, 'Mixed'>[] = ['Easy', 'Medium', 'Hard'];
  return cycle[index % cycle.length];
}

function extractNoteKeyPhrases(notes: string): string[] {
  if (!notes.trim()) return [];
  const sentences = notes
    .split(/[\n.!?]+/)
    .map((s) => s.trim())
    .filter((s) => s.length >= 18 && s.length <= 160);
  return sentences.slice(0, 12);
}

const CONCEPT_STEMS = [
  'Foundational Principle',
  'Analytical Application',
  'Boundary Condition',
  'Comparative Evaluation',
  'Diagnostic Error Check',
  'Quantitative Formulation',
  'Mechanism & Causality',
  'Synthesis Scenario',
];

export const apiClient = {
  async login(email: string, _password: string): Promise<{ user: UserProfile }> {
    // TODO: Connect Supabase Auth (`supabase.auth.signInWithPassword`)
    await sleep(randomLatency(600, 900));
    const cleanName = email
      .split('@')[0]
      .replace(/[._-]+/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
    return {
      user: {
        ...DEMO_USER_PROFILE,
        email,
        fullName: cleanName || DEMO_USER_PROFILE.fullName,
      },
    };
  },

  async loginDemo(): Promise<{ user: UserProfile }> {
    // TODO: Connect Supabase Auth demo session or guest token
    await sleep(600);
    return { user: DEMO_USER_PROFILE };
  },

  async register(payload: {
    fullName: string;
    email: string;
    academicLevel: UserProfile['academicLevel'];
  }): Promise<{ user: UserProfile }> {
    // TODO: Connect Supabase Auth (`supabase.auth.signUp`) + insert row into `profiles`
    await sleep(randomLatency(650, 950));
    return {
      user: {
        ...DEMO_USER_PROFILE,
        id: `usr_${Date.now()}`,
        fullName: payload.fullName.trim(),
        email: payload.email.trim(),
        academicLevel: payload.academicLevel,
        studyStreakDays: 1,
        joinedAt: new Date().toISOString(),
      },
    };
  },

  async requestPasswordReset(_email: string): Promise<{ sent: boolean }> {
    // TODO: Connect Supabase Auth (`supabase.auth.resetPasswordForEmail`)
    await sleep(randomLatency(600, 850));
    return { sent: true };
  },

  async generateExam(
    input: ExamGenerationInput,
    onStageChange?: (stageLabel: string) => void
  ): Promise<Exam> {
    // TODO: Replace with `POST /api/exams/generate` backed by server-side `@google/genai`
    // and multipart document ingestion on Cloud Run, then persist to Supabase `exams` + `questions`.
    onStageChange?.('Analyzing source material...');
    await sleep(750);

    onStageChange?.('Calibrating difficulty...');
    await sleep(750);

    onStageChange?.('Drafting explanations...');
    await sleep(700);

    const examId = `exam_${Date.now()}`;
    const marksArray = distributeMarks(Math.max(input.questionCount, input.totalMarks), input.questionCount);
    const notePhrases = extractNoteKeyPhrases(input.sourceNotes);
    const allowMcq = input.questionTypes.includes('multiple_choice');
    const allowTf = input.questionTypes.includes('true_false');

    const questions: Question[] = Array.from({ length: input.questionCount }, (_, index) => {
      const qNum = index + 1;
      const isTf = allowTf && (!allowMcq || index % 4 === 2);
      const qDifficulty = resolveQuestionDifficulty(input.difficulty, index);
      const topicTag = `${input.topic.split(',')[0].trim() || input.subject} — ${CONCEPT_STEMS[index % CONCEPT_STEMS.length]}`;
      const noteSnippet = notePhrases[index % notePhrases.length];

      if (isTf) {
        const statementTrue = index % 2 === 0;
        const prompt = noteSnippet
          ? `True or False: Based on your ${input.subject} material ("${noteSnippet}"), this principle holds unconditionally under standard ${input.academicLevel.toLowerCase()} assumptions.`
          : `True or False: In ${input.subject} (${input.topic}), increasing constraint coupling reduces degrees of freedom in ${qDifficulty.toLowerCase()}-level ${input.topic} models.`;

        return {
          id: `${examId}_q_${qNum}`,
          examId,
          order: qNum,
          type: 'true_false',
          prompt,
          options: ['True', 'False'],
          correctOptionIndex: statementTrue ? 0 : 1,
          marks: marksArray[index],
          topicTag,
          difficulty: qDifficulty,
          explanation: noteSnippet
            ? `Derived from your source excerpt ("${noteSnippet}"). Under ${input.academicLevel} standards for ${input.subject}, evaluating boundary conditions confirms the statement is ${statementTrue ? 'True' : 'False'}.`
            : `In ${input.topic}, standard ${qDifficulty.toLowerCase()} calibration verifies that the stated premise is ${statementTrue ? 'True' : 'False'} once boundary assumptions are accounted for.`,
        };
      }

      const correctIdx = index % 4;
      const basePrompts = [
        `Which statement accurately characterizes the primary mechanism in ${input.topic} at the ${input.academicLevel} level?`,
        `When applying ${input.topic} within ${input.subject}, which condition is necessary to preserve validity?`,
        `In a ${qDifficulty.toLowerCase()} ${input.subject} problem on ${input.topic}, what is the most direct consequence of violating the baseline assumption?`,
        `Which analytical approach yields the most reliable verification for ${input.topic}?`,
      ];

      const prompt = noteSnippet
        ? `Regarding "${noteSnippet}" in ${input.topic}: which interpretation best reflects the underlying ${input.subject} concept?`
        : basePrompts[index % basePrompts.length];

      const optionsPool = [
        `Enforces conservation of core invariants across ${input.topic} transformations`,
        `Assumes zero variance regardless of boundary constraints or scale`,
        `Substitutes an empirical heuristic in place of formal ${input.subject} derivation`,
        `Reverses the causal dependency between primary and secondary variables`,
      ];

      // Rotate so correctIdx points to the sound academic option
      const rotatedOptions = optionsPool.map((_, optIdx) => {
        const sourceIdx = (optIdx - correctIdx + 4) % 4;
        return optionsPool[sourceIdx];
      });

      return {
        id: `${examId}_q_${qNum}`,
        examId,
        order: qNum,
        type: 'multiple_choice',
        prompt,
        options: rotatedOptions,
        correctOptionIndex: correctIdx,
        marks: marksArray[index],
        topicTag,
        difficulty: qDifficulty,
        explanation: noteSnippet
          ? `Grounded in your provided study material ("${noteSnippet}"). Option ${String.fromCharCode(65 + correctIdx)} preserves the formal invariant required in ${input.subject}, whereas the distractors relax critical boundary constraints.`
          : `At the ${input.academicLevel} level for ${input.topic}, Option ${String.fromCharCode(65 + correctIdx)} correctly captures the governing invariant. Distractors represent common conceptual inversions tested in ${qDifficulty.toLowerCase()} assessments.`,
      };
    });

    const sourceSummary =
      input.sourceMode === 'document' && input.uploadedFileName
        ? `${input.uploadedFileName} (${Math.max(1, Math.round((input.uploadedFileSizeBytes ?? 2048) / 1024))} KB)`
        : input.sourceMode === 'notes'
          ? `Study Notes (${input.sourceNotes.trim().split(/\s+/).length} words)`
          : input.sourcePrompt.trim() || `${input.subject}: ${input.topic}`;

    const now = new Date().toISOString();
    return {
      id: examId,
      title: `${input.subject}: ${input.topic}`,
      subject: input.subject.trim(),
      topic: input.topic.trim(),
      academicLevel: input.academicLevel,
      difficulty: input.difficulty,
      durationMinutes: input.durationMinutes,
      totalMarks: marksArray.reduce((a, b) => a + b, 0),
      questionCount: questions.length,
      sourceType: input.sourceMode,
      sourceSummary,
      createdAt: now,
      updatedAt: now,
      questions,
    };
  },

  async saveExam(exam: Exam): Promise<Exam> {
    // TODO: Connect Supabase DB (`upsert` into `exams` and `questions` tables)
    await sleep(randomLatency(500, 750));
    const recalculatedTotal = exam.questions.reduce((sum, q) => sum + q.marks, 0);
    return {
      ...exam,
      questionCount: exam.questions.length,
      totalMarks: recalculatedTotal,
      updatedAt: new Date().toISOString(),
    };
  },

  async deleteExam(_examId: string): Promise<void> {
    // TODO: Connect Supabase DB (`delete` from `exams` where id = examId)
    await sleep(450);
  },

  async submitAttempt(payload: {
    exam: Exam;
    selections: Record<string, number | null>;
    flaggedIds: Set<string>;
    startedAt: string;
    durationTakenSeconds: number;
  }): Promise<Attempt> {
    // TODO: Connect Supabase DB (`insert` into `attempts`) & optional Gemini diagnostic feedback endpoint
    await sleep(randomLatency(600, 900));

    const { exam, selections, flaggedIds, startedAt, durationTakenSeconds } = payload;
    const answers: Record<string, AttemptAnswer> = {};
    const topicStats = new Map<string, { correct: number; total: number }>();

    let earnedMarks = 0;

    for (const q of exam.questions) {
      const selected = selections[q.id] ?? null;
      const isCorrect = selected !== null && selected === q.correctOptionIndex;
      const marksEarned = isCorrect ? q.marks : 0;
      earnedMarks += marksEarned;

      answers[q.id] = {
        questionId: q.id,
        selectedOptionIndex: selected,
        isFlagged: flaggedIds.has(q.id),
        isCorrect,
        marksEarned,
      };

      const prev = topicStats.get(q.topicTag) ?? { correct: 0, total: 0 };
      topicStats.set(q.topicTag, {
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      });
    }

    const totalMarks = exam.questions.reduce((sum, q) => sum + q.marks, 0) || exam.totalMarks;
    const scorePercent = totalMarks > 0 ? Math.round((earnedMarks / totalMarks) * 100) : 0;

    const topicBreakdown: TopicBreakdownItem[] = Array.from(topicStats.entries()).map(
      ([topic, stats]) => ({
        topic,
        correct: stats.correct,
        total: stats.total,
        accuracy: Math.round((stats.correct / stats.total) * 100),
      })
    );

    return {
      id: `att_${Date.now()}`,
      examId: exam.id,
      examTitle: exam.title,
      subject: exam.subject,
      difficulty: exam.difficulty,
      startedAt,
      completedAt: new Date().toISOString(),
      durationTakenSeconds,
      totalMarks,
      earnedMarks,
      scorePercent,
      passed: scorePercent >= 70,
      answers,
      topicBreakdown,
    };
  },

  async updateProfile(profile: UserProfile): Promise<UserProfile> {
    // TODO: Connect Supabase DB (`update` row in `profiles`)
    await sleep(550);
    return profile;
  },
};
