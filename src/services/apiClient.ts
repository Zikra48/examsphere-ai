import type { AuthChangeEvent, Session, User as SupabaseUser } from '@supabase/supabase-js';
import {
  DEMO_USER_PROFILE,
  INITIAL_ATTEMPTS,
  INITIAL_EXAMS,
  INITIAL_SUBJECT_PROGRESS,
} from '../data/mockData';
import {
  getSupabaseBrowserClient,
  getSupabaseEnvDiagnostics,
  requireSupabaseBrowserClient,
  SupabaseEnvDiagnostics,
  verifySupabaseGatewayKey,
} from '../lib/supabase';
import {
  AcademicLevel,
  Attempt,
  AttemptAnswer,
  DifficultyLevel,
  Exam,
  ExamGenerationInput,
  SubjectProgress,
  TopicBreakdownItem,
  UserProfile,
} from '../types/exam';

const STORAGE_KEY = 'examsphere_stage1_state_v1';

export interface PersistedAppState {
  exams: Exam[];
  attempts: Attempt[];
  previewBannerDismissed: boolean;
}

export const GUEST_USER_PROFILE: UserProfile = {
  id: '',
  fullName: 'Student',
  email: '',
  academicLevel: 'Undergraduate',
  targetExam: 'Academic & Certification Prep',
  defaultDifficulty: 'Medium',
  defaultTimerMinutes: 40,
  studyStreakDays: 1,
  joinedAt: new Date(0).toISOString(),
};

const VALID_ACADEMIC_LEVELS: AcademicLevel[] = [
  'High School',
  'Undergraduate',
  'Postgraduate',
  'Professional Certification',
];

function formatNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? '';
  const formatted = localPart
    .replace(/[._-]+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
  return formatted || 'Student';
}

export type AuthErrorCode =
  | 'config_error'
  | 'invalid_credentials'
  | 'email_not_confirmed'
  | 'user_already_registered'
  | 'weak_password'
  | 'rate_limited'
  | 'unknown';

export class AuthFlowError extends Error {
  code: AuthErrorCode;
  rawMessage: string;

  constructor(message: string, code: AuthErrorCode = 'unknown', rawMessage?: string) {
    super(message);
    this.name = 'AuthFlowError';
    this.code = code;
    this.rawMessage = rawMessage ?? message;
  }
}

export interface AuthConnectionDiagnostics extends SupabaseEnvDiagnostics {
  sessionStatus: string;
  gatewayKeyStatus: string;
}

function toAuthFlowError(
  operation: string,
  error: { message?: string; status?: number; code?: string }
): AuthFlowError {
  console.error(`[ExamSphere Auth] ${operation} error:`, error);

  const raw = (error.message || 'Authentication request failed.').trim();
  const lower = raw.toLowerCase();

  if (lower.includes('invalid api key')) {
    const diag = getSupabaseEnvDiagnostics();
    return new AuthFlowError(
      `Invalid API key (${raw}): Verify that VITE_SUPABASE_ANON_KEY belongs to "${diag.supabaseUrlHost ?? 'your Supabase project'}", has no surrounding quotes or extra spaces, and that you redeployed after saving environment variables.`,
      'config_error',
      raw
    );
  }

  if (lower.includes('email not confirmed')) {
    return new AuthFlowError(
      `Email not confirmed: ${raw}. Please check your inbox for the verification link or resend it below.`,
      'email_not_confirmed',
      raw
    );
  }

  if (lower.includes('invalid login credentials')) {
    return new AuthFlowError(
      `Invalid email or password (${raw}). Double-check your credentials or confirm your email if you just signed up.`,
      'invalid_credentials',
      raw
    );
  }

  if (lower.includes('user already registered') || lower.includes('already been registered')) {
    return new AuthFlowError(
      `An account with this email is already registered (${raw}). Try signing in or resetting your password.`,
      'user_already_registered',
      raw
    );
  }

  if (
    lower.includes('password') &&
    (lower.includes('weak') ||
      lower.includes('least') ||
      lower.includes('character') ||
      lower.includes('strength'))
  ) {
    return new AuthFlowError(`Weak password: ${raw}`, 'weak_password', raw);
  }

  if (
    error.status === 429 ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('security purposes')
  ) {
    return new AuthFlowError(
      `Too many authentication requests. Please wait a moment and try again (${raw}).`,
      'rate_limited',
      raw
    );
  }

  return new AuthFlowError(raw, 'unknown', raw);
}

export function mapSupabaseUserToProfile(supabaseUser: SupabaseUser): UserProfile {
  const metadata = (supabaseUser.user_metadata ?? {}) as Record<string, unknown>;
  const rawFullName = typeof metadata.full_name === 'string' ? metadata.full_name.trim() : '';
  const rawAcademicLevel =
    typeof metadata.academic_level === 'string' ? metadata.academic_level : '';
  const academicLevel: AcademicLevel = VALID_ACADEMIC_LEVELS.includes(
    rawAcademicLevel as AcademicLevel
  )
    ? (rawAcademicLevel as AcademicLevel)
    : 'Undergraduate';

  const email = supabaseUser.email ?? '';

  return {
    id: supabaseUser.id,
    fullName: rawFullName || (email ? formatNameFromEmail(email) : 'Student'),
    email,
    academicLevel,
    targetExam: 'Academic & Certification Prep',
    defaultDifficulty: 'Medium',
    defaultTimerMinutes: 40,
    studyStreakDays: 1,
    joinedAt: supabaseUser.created_at || new Date().toISOString(),
  };
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
      const parsed = JSON.parse(raw) as Partial<PersistedAppState>;
      if (parsed && Array.isArray(parsed.exams) && Array.isArray(parsed.attempts)) {
        return {
          exams: parsed.exams,
          attempts: parsed.attempts,
          previewBannerDismissed: Boolean(parsed.previewBannerDismissed),
        };
      }
    }
  } catch {
    // Fallback to seeded workspace state if storage is unavailable
  }

  return {
    exams: INITIAL_EXAMS,
    attempts: INITIAL_ATTEMPTS,
    previewBannerDismissed: false,
  };
}

export function saveAppState(state: PersistedAppState): void {
  try {
    const sanitized: PersistedAppState = {
      exams: state.exams,
      attempts: state.attempts,
      previewBannerDismissed: state.previewBannerDismissed,
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitized));
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

export const apiClient = {
  async checkAuthConnectionStatus(): Promise<AuthConnectionDiagnostics> {
    const envDiagnostics = getSupabaseEnvDiagnostics();
    const supabase = getSupabaseBrowserClient();

    if (!supabase) {
      const result: AuthConnectionDiagnostics = {
        ...envDiagnostics,
        sessionStatus: envDiagnostics.configError || 'Client unavailable',
        gatewayKeyStatus: 'Skipped (client not configured)',
      };
      console.info('[ExamSphere Auth Diagnostics]', result);
      return result;
    }

    const gatewayKeyStatus = await verifySupabaseGatewayKey();

    try {
      const { data, error } = await supabase.auth.getSession();
      const sessionStatus = error
        ? `Error: ${error.message}`
        : data.session
          ? `Active session (${data.session.user.email ?? data.session.user.id})`
          : 'No active session (getSession succeeded)';
      const result: AuthConnectionDiagnostics = {
        ...envDiagnostics,
        sessionStatus,
        gatewayKeyStatus,
      };
      console.info('[ExamSphere Auth Diagnostics]', result);
      return result;
    } catch (err) {
      const result: AuthConnectionDiagnostics = {
        ...envDiagnostics,
        sessionStatus: err instanceof Error ? `Exception: ${err.message}` : 'getSession threw',
        gatewayKeyStatus,
      };
      console.info('[ExamSphere Auth Diagnostics]', result);
      return result;
    }
  },

  async getAuthSession(): Promise<{ session: Session | null; user: UserProfile | null }> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return { session: null, user: null };
    }
    const { data, error } = await supabase.auth.getSession();
    if (error) {
      console.error('[ExamSphere Auth] getSession error:', error);
      throw new AuthFlowError(error.message, 'unknown', error.message);
    }
    const session = data.session ?? null;
    return {
      session,
      user: session?.user ? mapSupabaseUserToProfile(session.user) : null,
    };
  },

  onAuthStateChange(
    callback: (event: AuthChangeEvent, session: Session | null, user: UserProfile | null) => void
  ): () => void {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) {
      return () => {};
    }
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session, session?.user ? mapSupabaseUserToProfile(session.user) : null);
    });
    return () => {
      subscription.unsubscribe();
    };
  },

  async login(email: string, password: string): Promise<{ user: UserProfile; session: Session }> {
    const supabase = requireSupabaseBrowserClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (error) {
      throw toAuthFlowError('signInWithPassword', error);
    }
    if (!data.user || !data.session) {
      throw new AuthFlowError(
        'Sign-in completed without an active session. Please confirm your email or try again.',
        'email_not_confirmed'
      );
    }

    return {
      user: mapSupabaseUserToProfile(data.user),
      session: data.session,
    };
  },

  async loginDemo(): Promise<{ user: UserProfile }> {
    await sleep(300);
    return { user: DEMO_USER_PROFILE };
  },

  async register(payload: {
    fullName: string;
    email: string;
    password: string;
    academicLevel: UserProfile['academicLevel'];
  }): Promise<{
    user: UserProfile;
    session: Session | null;
    requiresEmailConfirmation: boolean;
  }> {
    const supabase = requireSupabaseBrowserClient();
    const trimmedName = payload.fullName.trim();
    const trimmedEmail = payload.email.trim();

    const { data, error } = await supabase.auth.signUp({
      email: trimmedEmail,
      password: payload.password,
      options: {
        data: {
          full_name: trimmedName,
          academic_level: payload.academicLevel,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw toAuthFlowError('signUp', error);
    }
    if (!data.user) {
      throw new AuthFlowError('Registration could not be completed. Please try again.');
    }

    if (Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      console.error('[ExamSphere Auth] signUp returned empty identities for existing email:', data.user);
      throw new AuthFlowError(
        'An account with this email is already registered. Please sign in or reset your password.',
        'user_already_registered'
      );
    }

    const mappedUser = mapSupabaseUserToProfile(data.user);
    return {
      user: {
        ...mappedUser,
        fullName: mappedUser.fullName || trimmedName,
        academicLevel: payload.academicLevel,
      },
      session: data.session ?? null,
      requiresEmailConfirmation: !data.session,
    };
  },

  async resendConfirmationEmail(email: string): Promise<void> {
    const supabase = requireSupabaseBrowserClient();
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: {
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    if (error) {
      throw toAuthFlowError('resendConfirmationEmail', error);
    }
  },

  async logout(): Promise<void> {
    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('[ExamSphere Auth] signOut error:', error);
      throw new AuthFlowError(error.message, 'unknown', error.message);
    }
  },

  async requestPasswordReset(email: string): Promise<{ sent: boolean }> {
    const supabase = requireSupabaseBrowserClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login`,
    });
    if (error) {
      throw toAuthFlowError('resetPasswordForEmail', error);
    }
    return { sent: true };
  },

  async generateExam(
    input: ExamGenerationInput,
    onStageChange?: (stageLabel: string) => void
  ): Promise<Exam> {
    onStageChange?.('Analyzing material and calibrating rubric...');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const supabase = getSupabaseBrowserClient();
    if (supabase) {
      const { data } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
      if (data.session?.access_token) {
        headers.Authorization = `Bearer ${data.session.access_token}`;
      }
    }

    let response: Response;
    try {
      onStageChange?.('Generating distinct questions & distractors via Gemini...');
      response = await fetch('/api/exams/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify(input),
      });
    } catch (err) {
      throw new Error(
        err instanceof Error
          ? `Unable to reach the AI exam generation server (/api/exams/generate): ${err.message}`
          : 'Unable to reach the AI exam generation server.'
      );
    }

    onStageChange?.('Validating answer key uniqueness & difficulty alignment...');

    const payload = (await response.json().catch(() => null)) as {
      exam?: Exam;
      error?: { code?: string; message?: string };
    } | null;

    if (!response.ok || !payload?.exam) {
      const serverMsg = payload?.error?.message;
      if (response.status === 404) {
        throw new Error(
          'AI exam generation backend (/api/exams/generate) is not available on this host. Deploy with the Node/Express server or configure a backend API endpoint.'
        );
      }
      throw new Error(
        serverMsg || `Exam generation failed with HTTP ${response.status}. Please check server configuration and try again.`
      );
    }

    return payload.exam;
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
