import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, ChevronDown, Compass, MailCheck, RefreshCw, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { getSupabaseBrowserConfigError } from '../lib/supabase';
import {
  apiClient,
  AuthConnectionDiagnostics,
  AuthFlowError,
} from '../services/apiClient';

export function LoginPage() {
  const { login, loginDemo, addToast } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [canResendConfirmation, setCanResendConfirmation] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const [debugOpen, setDebugOpen] = useState(false);
  const [diagnostics, setDiagnostics] = useState<AuthConnectionDiagnostics | null>(null);
  const [checkingDiagnostics, setCheckingDiagnostics] = useState(false);

  const configError = getSupabaseBrowserConfigError();

  const runDiagnostics = useCallback(async () => {
    setCheckingDiagnostics(true);
    try {
      const result = await apiClient.checkAuthConnectionStatus();
      setDiagnostics(result);
    } finally {
      setCheckingDiagnostics(false);
    }
  }, []);

  useEffect(() => {
    void runDiagnostics();
  }, [runDiagnostics]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setCanResendConfirmation(false);
    setResendSuccess('');

    if (configError) {
      setError(configError);
      return;
    }

    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }

    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } catch (err) {
      console.error('[ExamSphere LoginPage] Sign-in failed:', err);
      const isUnconfirmed =
        (err instanceof AuthFlowError && err.code === 'email_not_confirmed') ||
        (err instanceof Error && err.message.toLowerCase().includes('email not confirmed'));
      setCanResendConfirmation(isUnconfirmed);
      setError(
        err instanceof Error ? err.message : 'Unable to sign in. Please check your credentials.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email.trim()) {
      setError('Enter your email address above before resending confirmation.');
      return;
    }
    setResending(true);
    setResendSuccess('');
    try {
      await apiClient.resendConfirmationEmail(email.trim());
      const msg = `Confirmation email resent to ${email.trim()}. Check your inbox and spam folder.`;
      setResendSuccess(msg);
      addToast({
        title: 'Confirmation Email Sent',
        description: msg,
        variant: 'info',
      });
    } catch (err) {
      console.error('[ExamSphere LoginPage] Resend confirmation failed:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to resend confirmation email.'
      );
    } finally {
      setResending(false);
    }
  };

  const handleDemoLogin = async () => {
    setError('');
    setCanResendConfirmation(false);
    setResendSuccess('');
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      console.error('[ExamSphere LoginPage] Demo login failed:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to load the demo workspace.'
      );
    } finally {
      setDemoLoading(false);
    }
  };

  const activeError = error || configError;

  return (
    <div className="min-h-screen bg-[#080D19] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9AA8BD] hover:text-[#F1F5FC]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-[#F1F5FC]">
          <span className="w-7 h-7 rounded-lg bg-[#648BFF] text-[#080D19] flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </span>
          <span>ExamSphere AI</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-[#F1F5FC] tracking-tight">
              Sign in to ExamSphere AI
            </h1>
            <p className="mt-1.5 text-sm text-[#9AA8BD]">
              Access your calibrated exam library, timed focus mode, and progress analytics.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full mb-5"
            isLoading={demoLoading}
            onClick={handleDemoLogin}
            leftIcon={<UserCheck className="w-4 h-4 text-[#648BFF]" />}
          >
            Continue with Demo Student Account
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-white/[0.08]" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-[#101827] px-3 text-[#9AA8BD]">or sign in with email</span>
            </div>
          </div>

          {activeError && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-300 space-y-2"
            >
              <p>{activeError}</p>
              {canResendConfirmation && (
                <Button
                  type="button"
                  size="sm"
                  variant="secondary"
                  isLoading={resending}
                  onClick={handleResendConfirmation}
                  leftIcon={<MailCheck className="w-3.5 h-3.5" />}
                >
                  Resend confirmation email
                </Button>
              )}
            </div>
          )}

          {resendSuccess && (
            <div
              role="status"
              className="mb-4 p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-xs font-medium text-emerald-300"
            >
              {resendSuccess}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena.rostova@university.edu"
                className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-[#F1F5FC]">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-[#648BFF] hover:text-[#9BB6FF]"
                >
                  Forgot password?
                </Link>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-[#9AA8BD] cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-white/20 bg-[#080D19] accent-[#648BFF]"
              />
              <span>Remember me on this browser</span>
            </label>

            <Button type="submit" isLoading={submitting} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 pt-5 border-t border-white/[0.08] text-center text-sm text-[#9AA8BD]">
            New to ExamSphere AI?{' '}
            <Link to="/register" className="font-semibold text-[#648BFF] hover:text-[#9BB6FF]">
              Create an account
            </Link>
          </p>

          <div className="mt-4 pt-3 border-t border-white/[0.06]">
            <button
              type="button"
              onClick={() => setDebugOpen((prev) => !prev)}
              aria-expanded={debugOpen}
              className="w-full flex items-center justify-between text-xs text-[#9AA8BD] hover:text-[#F1F5FC] cursor-pointer"
            >
              <span>Connection status</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform ${debugOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {debugOpen && (
              <div className="mt-2.5 p-3 rounded-lg bg-[#080D19] border border-white/[0.08] text-[11px] font-mono text-[#9AA8BD] space-y-1">
                <div className="flex items-center justify-between gap-2 pb-1 border-b border-white/[0.08]">
                  <span className="font-semibold text-[#F1F5FC]">Auth Diagnostics</span>
                  <button
                    type="button"
                    onClick={() => void runDiagnostics()}
                    disabled={checkingDiagnostics}
                    className="inline-flex items-center gap-1 text-[#648BFF] hover:text-[#9BB6FF] cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${checkingDiagnostics ? 'animate-spin' : ''}`} />
                    <span>Recheck</span>
                  </button>
                </div>
                <p>
                  VITE_SUPABASE_URL:{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {String(Boolean(diagnostics?.hasViteSupabaseUrl))}
                  </span>
                </p>
                <p>
                  VITE_SUPABASE_ANON_KEY:{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {String(Boolean(diagnostics?.hasViteSupabaseAnonKey))}
                  </span>
                </p>
                <p>
                  Supabase host:{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {diagnostics?.supabaseUrlHost ?? 'not configured'}
                  </span>
                </p>
                <p>
                  Key format:{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {diagnostics?.keyFormat ?? 'checking...'}
                  </span>
                </p>
                <p>
                  Gateway key check:{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {diagnostics?.gatewayKeyStatus ?? 'checking...'}
                  </span>
                </p>
                <p>
                  getSession():{' '}
                  <span className="font-semibold text-[#F1F5FC]">
                    {diagnostics?.sessionStatus ?? 'checking...'}
                  </span>
                </p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
