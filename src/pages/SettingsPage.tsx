import React, { useEffect, useState } from 'react';
import { RotateCcw, Save, ShieldAlert } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { useApp } from '../context/AppContext';
import { AcademicLevel, DifficultyLevel } from '../types/exam';

const ACADEMIC_LEVELS: AcademicLevel[] = [
  'High School',
  'Undergraduate',
  'Postgraduate',
  'Professional Certification',
];

const DIFFICULTIES: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Mixed'];

export function SettingsPage() {
  const { user, isDemoMode, updateProfile, resetDemoData } = useApp();

  const [fullName, setFullName] = useState(user.fullName);
  const [email, setEmail] = useState(user.email);
  const [academicLevel, setAcademicLevel] = useState<AcademicLevel>(user.academicLevel);
  const [targetExam, setTargetExam] = useState(user.targetExam);
  const [defaultDifficulty, setDefaultDifficulty] = useState<DifficultyLevel>(
    user.defaultDifficulty
  );
  const [defaultTimerMinutes, setDefaultTimerMinutes] = useState(user.defaultTimerMinutes);

  const [saving, setSaving] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);

  useEffect(() => {
    setFullName(user.fullName);
    setEmail(user.email);
    setAcademicLevel(user.academicLevel);
    setTargetExam(user.targetExam);
    setDefaultDifficulty(user.defaultDifficulty);
    setDefaultTimerMinutes(user.defaultTimerMinutes);
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({
        ...user,
        fullName: fullName.trim() || user.fullName,
        email: email.trim() || user.email,
        academicLevel,
        targetExam: targetExam.trim() || user.targetExam,
        defaultDifficulty,
        defaultTimerMinutes: Math.max(5, Math.min(180, defaultTimerMinutes)),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmReset = () => {
    resetDemoData();
    if (isDemoMode) {
      setFullName('Elena Rostova');
      setEmail('elena.rostova@university.edu');
      setAcademicLevel('Undergraduate');
      setTargetExam('STEM Honours & AWS Associate');
      setDefaultDifficulty('Medium');
      setDefaultTimerMinutes(40);
    }
    setResetOpen(false);
  };

  return (
    <AppShell title="Profile & Settings" breadcrumb="Workspace / Preferences">
      <div className="max-w-3xl space-y-6">
        <form onSubmit={handleSave} className="space-y-6">
          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">Student Profile</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Identity and academic calibration tier stored locally during Stage 1.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="set-name" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Full Name
                </label>
                <input
                  id="set-name"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="set-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <input
                  id="set-email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label htmlFor="set-level" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Academic Level
                </label>
                <select
                  id="set-level"
                  value={academicLevel}
                  onChange={(e) => setAcademicLevel(e.target.value as AcademicLevel)}
                  className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                >
                  {ACADEMIC_LEVELS.map((lvl) => (
                    <option key={lvl} value={lvl}>
                      {lvl}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="set-target" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Target Examination / Goal
                </label>
                <input
                  id="set-target"
                  type="text"
                  value={targetExam}
                  onChange={(e) => setTargetExam(e.target.value)}
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>
          </Card>

          <Card className="space-y-5">
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Default Exam Preferences
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Pre-filled when opening the Generate Examination studio.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <span className="block text-sm font-medium text-slate-700 mb-1.5">
                  Preferred Difficulty
                </span>
                <div className="grid grid-cols-4 gap-1 p-1 bg-slate-100 rounded-lg border border-slate-200">
                  {DIFFICULTIES.map((diff) => (
                    <button
                      key={diff}
                      type="button"
                      onClick={() => setDefaultDifficulty(diff)}
                      className={`h-8 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                        defaultDifficulty === diff
                          ? 'bg-indigo-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {diff}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label htmlFor="set-timer" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Default Timer (minutes)
                </label>
                <input
                  id="set-timer"
                  type="number"
                  min={5}
                  max={180}
                  value={defaultTimerMinutes}
                  onChange={(e) =>
                    setDefaultTimerMinutes(Math.max(5, Number(e.target.value) || 5))
                  }
                  className="w-full h-10 px-3.5 rounded-lg border border-slate-200 bg-white font-mono tabular-nums text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <Button
                type="submit"
                isLoading={saving}
                leftIcon={<Save className="w-4 h-4" />}
              >
                Save Preferences
              </Button>
            </div>
          </Card>
        </form>

        {/* Data Reset Controls */}
        <Card className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">
                Local Workspace Data Controls
              </h2>
              <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">
                Restore the original academic sample library (Linear Algebra, Organic Chemistry,
                AWS SAA-C03, AP Macroeconomics) and seeded attempt records.
              </p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button
              variant="secondary"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              onClick={() => setResetOpen(true)}
            >
              Reset Local Workspace Data
            </Button>
          </div>
        </Card>
      </div>

      <Modal
        isOpen={resetOpen}
        onClose={() => setResetOpen(false)}
        title="Reset Workspace to Seeded Demo State?"
        description="Any custom exams or attempts created in this browser session will be replaced with the default sample dataset."
        footer={
          <>
            <Button variant="secondary" onClick={() => setResetOpen(false)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleConfirmReset}>
              Confirm Reset
            </Button>
          </>
        }
      >
        <p className="text-sm text-slate-700">
          This action only clears browser localStorage for Stage 1 Preview Mode.
        </p>
      </Modal>
    </AppShell>
  );
}
