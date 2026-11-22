import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Compass, UserCheck } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';

export function LoginPage() {
  const { login, loginDemo } = useApp();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!email.trim() || !password) {
      setError('Enter both your email address and password.');
      return;
    }
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/dashboard');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDemoLogin = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 px-4 sm:px-6">
      <div className="sm:mx-auto sm:w-full sm:max-w-md mb-6 flex items-center justify-between">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Home</span>
        </Link>
        <Link to="/" className="inline-flex items-center gap-2 font-bold text-slate-900">
          <span className="w-7 h-7 rounded-lg bg-indigo-900 text-white flex items-center justify-center">
            <Compass className="w-4 h-4" />
          </span>
          <span>ExamSphere AI</span>
        </Link>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <Card padding="lg">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Sign in to ExamSphere AI
            </h1>
            <p className="mt-1.5 text-sm text-slate-500">
              Access your calibrated exam library, timed focus mode, and progress analytics.
            </p>
          </div>

          <Button
            variant="secondary"
            className="w-full mb-5"
            isLoading={demoLoading}
            onClick={handleDemoLogin}
            leftIcon={<UserCheck className="w-4 h-4 text-indigo-900" />}
          >
            Continue with Demo Student Account
          </Button>

          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3 text-slate-400">or sign in with email</span>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs font-medium text-rose-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="elena.rostova@university.edu"
                className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700">
                  Password
                </label>
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-indigo-900 hover:text-indigo-600"
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
                className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:border-transparent"
              />
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-600 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 text-indigo-900 focus:ring-indigo-600"
              />
              <span>Remember me on this browser</span>
            </label>

            <Button type="submit" isLoading={submitting} className="w-full">
              Sign In
            </Button>
          </form>

          <p className="mt-6 pt-5 border-t border-slate-200 text-center text-sm text-slate-600">
            New to ExamSphere AI?{' '}
            <Link to="/register" className="font-semibold text-indigo-900 hover:text-indigo-600">
              Create an account
            </Link>
          </p>
        </Card>
      </div>
    </div>
  );
}
