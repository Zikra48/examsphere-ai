import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Compass, Mail } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { getSupabaseBrowserConfigError } from '../lib/supabase';
import { apiClient } from '../services/apiClient';

export function ForgotPasswordPage() {
  const { addToast } = useApp();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const configError = getSupabaseBrowserConfigError();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (configError) {
      setError(configError);
      return;
    }
    if (!email.trim()) return;
    setSubmitting(true);
    try {
      await apiClient.requestPasswordReset(email.trim());
      setSubmitted(true);
      addToast({
        title: 'Recovery Email Requested',
        description: 'Check your inbox for password reset instructions.',
        variant: 'info',
      });
    } catch (err) {
      console.error('[ExamSphere ForgotPasswordPage] Reset request failed:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to send password reset email.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const activeError = error || configError;

  return (
    <div className="min-h-screen bg-[#080D19] flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/login"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#9AA8BD] hover:text-[#F1F5FC]"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Sign In</span>
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
          {submitted ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#F1F5FC]">Check your inbox</h1>
              <p className="text-sm text-[#9AA8BD] leading-relaxed">
                If an account exists for <span className="font-semibold text-[#F1F5FC]">{email}</span>,
                password recovery instructions have been sent.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full">Back to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <div className="w-10 h-10 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/30 text-[#648BFF] flex items-center justify-center mb-4">
                  <Mail className="w-5 h-5" />
                </div>
                <h1 className="text-2xl font-bold text-[#F1F5FC] tracking-tight">
                  Reset your password
                </h1>
                <p className="mt-1.5 text-sm text-[#9AA8BD]">
                  Enter the email associated with your workspace to receive a recovery link.
                </p>
              </div>

              {activeError && (
                <div
                  role="alert"
                  className="mb-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/25 text-xs font-medium text-rose-300"
                >
                  {activeError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-sm font-medium text-[#F1F5FC] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
                  />
                </div>

                <Button type="submit" isLoading={submitting} className="w-full">
                  Send Recovery Link
                </Button>
              </form>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
