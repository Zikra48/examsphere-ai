import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Compass } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';
import { getSupabaseBrowserConfigError } from '../lib/supabase';
import { AcademicLevel } from '../types/exam';

const ACADEMIC_LEVELS: AcademicLevel[] = [
  'High School',
  'Undergraduate',
  'Postgraduate',
  'Professional Certification',
];

function evaluatePasswordStrength(password: string): {
  score: number;
  label: string;
  barClass: string;
} {
  if (!password) return { score: 0, label: 'Enter password', barClass: 'bg-[#1B263B]' };
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  if (score <= 1) return { score: 1, label: 'Weak', barClass: 'bg-rose-500' };
  if (score === 2) return { score: 2, label: 'Fair', barClass: 'bg-amber-400' };
  if (score === 3) return { score: 3, label: 'Good', barClass: 'bg-[#648BFF]' };
  return { score: 4, label: 'Strong', barClass: 'bg-emerald-400' };
}

export function RegisterPage() {
  const { register } = useApp();
  const navigate = useNavigate();
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>('Undergraduate');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmationEmail, setConfirmationEmail] = useState<string | null>(null);

  const configError = getSupabaseBrowserConfigError();
  const strength = useMemo(() => evaluatePasswordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (configError) {
      setError(configError);
      return;
    }
    if (!fullName.trim() || !email.trim() || password.length < 6) {
      setError('Please enter your full name, a valid email, and a password of at least 6 characters.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        academicLevel,
      });
      if (result.requiresEmailConfirmation) {
        setConfirmationEmail(email.trim());
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('[ExamSphere RegisterPage] Registration failed:', err);
      setError(
        err instanceof Error ? err.message : 'Unable to create account. Please try again.'
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
          {confirmationEmail ? (
            <div className="text-center space-y-4 py-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h1 className="text-xl font-bold text-[#F1F5FC]">Confirm your email address</h1>
              <p className="text-sm text-[#9AA8BD] leading-relaxed">
                We sent a verification link to{' '}
                <span className="font-semibold text-[#F1F5FC]">{confirmationEmail}</span>.
                Confirm your email to activate your account, then sign in.
              </p>
              <div className="pt-2">
                <Link to="/login">
                  <Button className="w-full">Go to Sign In</Button>
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-[#F1F5FC] tracking-tight">
                  Create your study account
                </h1>
                <p className="mt-1.5 text-sm text-[#9AA8BD]">
                  Configure your academic track to calibrate exam difficulty and benchmarks.
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
                  <label htmlFor="reg-name" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Full name
                  </label>
                  <input
                    id="reg-name"
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Jordan Vance"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="reg-email" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Email address
                  </label>
                  <input
                    id="reg-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jordan.vance@university.edu"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
                  />
                </div>

                <div>
                  <label htmlFor="reg-level" className="block text-sm font-medium text-[#F1F5FC] mb-1.5">
                    Educational level
                  </label>
                  <select
                    id="reg-level"
                    value={academicLevel}
                    onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                    className="w-full h-10 px-3 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
                  >
                    {ACADEMIC_LEVELS.map((lvl) => (
                      <option key={lvl} value={lvl}>
                        {lvl}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label htmlFor="reg-password" className="block text-sm font-medium text-[#F1F5FC]">
                      Password
                    </label>
                    {password && (
                      <span className="text-xs font-medium text-[#9AA8BD]">{strength.label}</span>
                    )}
                  </div>
                  <input
                    id="reg-password"
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full h-10 px-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF] focus:border-transparent"
                  />
                  <div className="mt-2 grid grid-cols-4 gap-1.5" aria-hidden="true">
                    {[1, 2, 3, 4].map((step) => (
                      <div
                        key={step}
                        className={`h-1.5 rounded-full transition-colors ${
                          strength.score >= step ? strength.barClass : 'bg-[#151F30]'
                        }`}
                      />
                    ))}
                  </div>
                </div>

                <Button type="submit" isLoading={submitting} className="w-full mt-2">
                  Create Workspace Account
                </Button>
              </form>

              <p className="mt-6 pt-5 border-t border-white/[0.08] text-center text-sm text-[#9AA8BD]">
                Already registered?{' '}
                <Link to="/login" className="font-semibold text-[#648BFF] hover:text-[#9BB6FF]">
                  Sign in
                </Link>
              </p>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
