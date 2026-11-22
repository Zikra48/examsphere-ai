import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { DEMO_USER_PROFILE, INITIAL_ATTEMPTS, INITIAL_EXAMS } from '../data/mockData';
import {
  apiClient,
  computeSubjectProgress,
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

interface AppContextValue {
  isAuthenticated: boolean;
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
    academicLevel: UserProfile['academicLevel'];
  }) => Promise<void>;
  logout: () => void;
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
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    saveAppState(state);
  }, [state]);

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
      setState((prev) => ({ ...prev, isAuthenticated: true, user }));
      addToast({
        title: 'Signed in to Stage-1 Workspace',
        description: 'Session active in local state. Supabase Auth connects in Stage 2.',
        variant: 'success',
      });
    },
    [addToast]
  );

  const loginDemo = useCallback(async () => {
    const { user } = await apiClient.loginDemo();
    setState((prev) => ({ ...prev, isAuthenticated: true, user }));
    addToast({
      title: 'Demo Student Workspace Loaded',
      description: 'Exploring Elena Rostova’s calibrated exam library & analytics.',
      variant: 'info',
    });
  }, [addToast]);

  const register = useCallback(
    async (payload: {
      fullName: string;
      email: string;
      academicLevel: UserProfile['academicLevel'];
    }) => {
      const { user } = await apiClient.register(payload);
      setState((prev) => ({ ...prev, isAuthenticated: true, user }));
      addToast({
        title: 'Account Created (Local Session)',
        description: 'Profile initialized locally. Supabase registration connects in Stage 2.',
        variant: 'success',
      });
    },
    [addToast]
  );

  const logout = useCallback(() => {
    setState((prev) => ({ ...prev, isAuthenticated: false }));
    addToast({
      title: 'Signed Out',
      description: 'Your local session exams and attempts remain preserved.',
      variant: 'info',
    });
  }, [addToast]);

  const generateExam = useCallback(
    async (input: ExamGenerationInput, onStageChange?: (stage: string) => void) => {
      const generated = await apiClient.generateExam(input, onStageChange);
      setState((prev) => ({
        ...prev,
        exams: [generated, ...prev.exams],
      }));
      addToast({
        title: 'Exam Blueprint Drafted',
        description: 'Simulated local generator created your questions. Server-side Gemini API connects in Stage 2.',
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
        description: 'Changes stored in browser local state (Supabase DB sync ready).',
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
      setState((prev) => ({ ...prev, user: updated }));
      addToast({
        title: 'Preferences Saved',
        description: 'Profile and exam defaults updated in local state.',
        variant: 'success',
      });
    },
    [addToast]
  );

  const resetDemoData = useCallback(() => {
    const fresh: PersistedAppState = {
      isAuthenticated: state.isAuthenticated,
      user: DEMO_USER_PROFILE,
      exams: INITIAL_EXAMS,
      attempts: INITIAL_ATTEMPTS,
      previewBannerDismissed: false,
    };
    setState(fresh);
    addToast({
      title: 'Workspace Reset to Seeded Data',
      description: 'Restored default academic exams and historical attempts.',
      variant: 'info',
    });
  }, [addToast, state.isAuthenticated]);

  const subjectProgress = useMemo(
    () => computeSubjectProgress(state.exams, state.attempts),
    [state.exams, state.attempts]
  );

  const value: AppContextValue = {
    isAuthenticated: state.isAuthenticated,
    user: state.user,
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
