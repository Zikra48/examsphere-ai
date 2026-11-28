import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_USER_PROFILE, INITIAL_ATTEMPTS, INITIAL_EXAMS } from '../data/mockData';
import { isBrowserSupabaseConfigured } from '../lib/supabase';
import {
  apiClient,
  computeSubjectProgress,
  GUEST_USER_PROFILE,
  loadInitialState,
  PersistedAppState,
  saveAppState,
} from '../services/apiClient';
import {
  Attempt,
  Exam,
  ExamGenerationInput,
  SubjectProgress,
  ToastMessage,
  UserProfile,
} from '../types/exam';

type AuthMode = 'supabase' | 'demo' | null;

interface AppContextValue {
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  isDemoMode: boolean;
  user: UserProfile;
  exams: Exam[];
  attempts: Attempt[];
  subjectProgress: SubjectProgress[];
  previewBannerDismissed: boolean;
  toasts: ToastMessage[];
  addToast: (toast: Omit<ToastMessage, 'id'>) => void;
  removeToast: (id: string) => void;
  dismissPreviewBanner: () => void;
  login: (email: string, password: string) => Promise<void>;
  loginDemo: () => Promise<void>;
  register: (payload: {
    fullName: string;
    email: string;
    password: string;
    academicLevel: UserProfile['academicLevel'];
  }) => Promise<{ requiresEmailConfirmation: boolean }>;
  logout: () => Promise<void>;
  generateExam: (
    input: ExamGenerationInput,
    onStageChange?: (stage: string) => void
  ) => Promise<Exam>;
  saveExam: (exam: Exam) => Promise<Exam>;
  deleteExam: (examId: string) => Promise<void>;
  submitAttempt: (payload: {
    exam: Exam;
    selections: Record<string, number | null>;
    flaggedIds: Set<string>;
    startedAt: string;
    durationTakenSeconds: number;
  }) => Promise<Attempt>;
  updateProfile: (profile: UserProfile) => Promise<void>;
  resetDemoData: () => void;
}

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedAppState>(() => loadInitialState());
  const [authMode, setAuthMode] = useState<AuthMode>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(() => isBrowserSupabaseConfigured());
  const [supabaseUser, setSupabaseUser] = useState<UserProfile | null>(null);
  const [demoUser, setDemoUser] = useState<UserProfile>(DEMO_USER_PROFILE);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

  useEffect(() => {
    let active = true;

    async function restoreSession() {
      if (!isBrowserSupabaseConfigured()) {
        if (active) setIsAuthLoading(false);
        return;
      }

      try {
        const { session, user } = await apiClient.getAuthSession();
        if (!active) return;
        if (session && user) {
          setSupabaseUser(user);
          setAuthMode('supabase');
        }
      } catch {
        // Leave unauthenticated if session restoration fails
      } finally {
        if (active) setIsAuthLoading(false);
      }
    }

    restoreSession();

    const unsubscribe = apiClient.onAuthStateChange((_event, session, user) => {
      if (!active) return;
      if (session && user) {
        setSupabaseUser(user);
        setAuthMode('supabase');
      } else {
        setSupabaseUser(null);
        setAuthMode((prev) => (prev === 'supabase' ? null : prev));
      }
      setIsAuthLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (toast: Omit<ToastMessage, 'id'>) => {
      const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      setToasts((prev) => [...prev.slice(-3), { ...toast, id }]);
      setTimeout(() => {
        removeToast(id);
      }, 4800);
    },
    [removeToast]
  );

  const dismissPreviewBanner = useCallback(() => {
    setState((prev) => ({ ...prev, previewBannerDismissed: true }));
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const { user } = await apiClient.login(email, password);
      setSupabaseUser(user);
      setAuthMode('supabase');
      addToast({
        title: 'Signed In',
        description: `Welcome back, ${user.fullName}.`,
        variant: 'success',
      });
    },
    [addToast]
  );

  const loginDemo = useCallback(async () => {
    if (authMode === 'supabase') {
      await apiClient.logout().catch(() => {});
    }
    const { user } = await apiClient.loginDemo();
    setSupabaseUser(null);
    setDemoUser(user);
    setAuthMode('demo');
    addToast({
      title: 'Demo Student Workspace Loaded',
      description: 'Exploring Elena Rostova’s sample exam library & analytics (not signed in to Supabase).',
      variant: 'info',
    });
  }, [addToast, authMode]);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      password: string;
      academicLevel: UserProfile['academicLevel'];
    }) => {
      const result = await apiClient.register(payload);
      if (!result.requiresEmailConfirmation && result.session) {
        setSupabaseUser(result.user);
        setAuthMode('supabase');
        addToast({
          title: 'Account Created',
          description: 'Your Supabase account is active and ready.',
          variant: 'success',
        });
      } else {
        addToast({
          title: 'Confirm Your Email',
          description: 'Check your inbox for a verification link before signing in.',
          variant: 'info',
        });
      }
      return { requiresEmailConfirmation: result.requiresEmailConfirmation };
    },
    [addToast]
  );

  const logout = useCallback(async () => {
    if (authMode === 'supabase') {
      await apiClient.logout();
    }
    setSupabaseUser(null);
    setAuthMode(null);
    addToast({
      title: 'Signed Out',
      description: 'Your session has ended.',
      variant: 'info',
    });
  }, [addToast, authMode]);

  const generateExam = useCallback(
    async (input: ExamGenerationInput, onStageChange?: (stage: string) => void) => {
      const generated = await apiClient.generateExam(input, onStageChange);
      setState((prev) => ({
        ...prev,
        exams: [generated, ...prev.exams],
      }));
      addToast({
        title: 'AI Exam Generated',
        description: `Created ${generated.questionCount} calibrated questions for ${generated.subject}.`,
        variant: 'success',
      });
      return generated;
    },
    [addToast]
  );

  const saveExam = useCallback(
    async (exam: Exam) => {
      const saved = await apiClient.saveExam(exam);
      setState((prev) => {
        const exists = prev.exams.some((e) => e.id === saved.id);
        return {
          ...prev,
          exams: exists
            ? prev.exams.map((e) => (e.id === saved.id ? saved : e))
            : [saved, ...prev.exams],
        };
      });
      addToast({
        title: 'Examination Saved to Library',
        description: 'Changes stored in browser local state.',
        variant: 'success',
      });
      return saved;
    },
    [addToast]
  );

  const deleteExam = useCallback(
    async (examId: string) => {
      await apiClient.deleteExam(examId);
      setState((prev) => ({
        ...prev,
        exams: prev.exams.filter((e) => e.id !== examId),
      }));
      addToast({
        title: 'Examination Removed',
        description: 'Deleted from your local library.',
        variant: 'info',
      });
    },
    [addToast]
  );

  const submitAttempt = useCallback(
    async (payload: {
      exam: Exam;
      selections: Record<string, number | null>;
      flaggedIds: Set<string>;
      startedAt: string;
      durationTakenSeconds: number;
    }) => {
      const attempt = await apiClient.submitAttempt(payload);
      setState((prev) => ({
        ...prev,
        attempts: [...prev.attempts, attempt],
        exams: prev.exams.map((e) =>
          e.id === payload.exam.id ? { ...e, lastScorePercent: attempt.scorePercent } : e
        ),
      }));
      addToast({
        title: `Assessment Graded: ${attempt.scorePercent}%`,
        description: 'Results recorded locally. Detailed concept explanations ready.',
        variant: attempt.passed ? 'success' : 'warning',
      });
      return attempt;
    },
    [addToast]
  );

  const updateProfile = useCallback(
    async (profile: UserProfile) => {
      const updated = await apiClient.updateProfile(profile);
      if (authMode === 'supabase') {
        setSupabaseUser(updated);
      } else if (authMode === 'demo') {
        setDemoUser(updated);
      }
      addToast({
        title: 'Preferences Saved',
        description: 'Profile preferences updated for your current session.',
        variant: 'success',
      });
    },
    [addToast, authMode]
  );

  const resetDemoData = useCallback(() => {
    const fresh: PersistedAppState = {
      exams: INITIAL_EXAMS,
      attempts: INITIAL_ATTEMPTS,
      previewBannerDismissed: false,
    };
    setState(fresh);
    setDemoUser(DEMO_USER_PROFILE);
    addToast({
      title: 'Workspace Reset to Seeded Data',
      description: 'Restored default academic exams and historical attempts.',
      variant: 'info',
    });
  }, [addToast]);

  const subjectProgress = useMemo(
    () => computeSubjectProgress(state.exams, state.attempts),
    [state.exams, state.attempts]
  );

  const isAuthenticated = authMode === 'supabase' || authMode === 'demo';
  const isDemoMode = authMode === 'demo';
  const activeUser =
    authMode === 'supabase' && supabaseUser
      ? supabaseUser
      : authMode === 'demo'
        ? demoUser
        : GUEST_USER_PROFILE;

  const value: AppContextValue = {
    isAuthenticated,
    isAuthLoading,
    isDemoMode,
    user: activeUser,
    exams: state.exams,
    attempts: state.attempts,
    subjectProgress,
    previewBannerDismissed: state.previewBannerDismissed,
    toasts,
    addToast,
    removeToast,
    dismissPreviewBanner,
    login,
    loginDemo,
    register,
    logout,
    generateExam,
    saveExam,
    deleteExam,
    submitAttempt,
    updateProfile,
    resetDemoData,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useApp must be used inside AppProvider');
  }
  return ctx;
}
