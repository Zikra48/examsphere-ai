import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  BookCheck,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Award,
  Building2,
} from 'lucide-react';
import { PublicNavbar } from '../components/layout/PublicNavbar';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useApp } from '../context/AppContext';

const SAMPLE_OPTIONS = [
  'All eigenvalues are strictly negative',
  'All eigenvalues of A are strictly positive (λᵢ > 0)',
  'det(A) equals zero for every basis',
  'The matrix trace is strictly less than one',
];

export function LandingPage() {
  const { isAuthenticated, loginDemo } = useApp();
  const navigate = useNavigate();
  const [selectedDemoOption, setSelectedDemoOption] = useState<number | null>(1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleInstantDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-medium text-indigo-900 bg-indigo-50 border border-indigo-200 rounded-md px-3 py-1">
                <span>Your Knowledge. Your Exam. Your Progress.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-slate-900 leading-[1.12] [text-wrap:balance]">
                Institutional-grade assessment studio built for deep mastery.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-xl">
                Transform lecture notes, textbooks, and certification blueprints into calibrated
                examinations. Simulate timed test conditions, inspect concept-level explanations,
                and measure longitudinal subject progress in one distraction-free workspace.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                {isAuthenticated ? (
                  <Link to="/dashboard">
                    <Button size="lg" rightIcon={<ArrowRight className="w-4 h-4" />}>
                      Enter Workspace
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Button
                      size="lg"
                      isLoading={demoLoading}
                      onClick={handleInstantDemo}
                      rightIcon={<ArrowRight className="w-4 h-4" />}
                    >
                      Launch Demo Workspace
                    </Button>
                    <Link to="/register">
                      <Button variant="secondary" size="lg">
                        Create Free Account
                      </Button>
                    </Link>
                  </>
                )}
              </div>

              <div className="pt-4 border-t border-slate-200 grid grid-cols-3 gap-4 max-w-lg">
                <div>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    5–50
                  </p>
                  <p className="text-xs text-slate-500">Calibrated questions</p>
                </div>
                <div>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    4 Levels
                  </p>
                  <p className="text-xs text-slate-500">School to Certs</p>
                </div>
                <div>
                  <p className="text-xl font-bold font-mono tabular-nums text-slate-900">
                    100%
                  </p>
                  <p className="text-xs text-slate-500">Editable blueprints</p>
                </div>
              </div>
            </div>

            {/* Interactive UI Preview Card */}
            <div id="studio-preview" className="lg:col-span-6">
              <Card padding="none" className="overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs text-slate-500 truncate">
                      Mathematics · Linear Algebra (Undergraduate)
                    </p>
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      Question 07 of 10
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="amber">Medium · 5 Marks</Badge>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-white border border-slate-200 font-mono tabular-nums text-xs font-semibold text-slate-800">
                      <Clock className="w-3.5 h-3.5 text-slate-500" aria-hidden="true" />
                      24:18
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-5">
                  <p className="text-base font-medium text-slate-900 leading-relaxed">
                    Which spectral condition guarantees that a real symmetric matrix A is strictly
                    positive definite?
                  </p>

                  <div className="space-y-2.5" role="radiogroup" aria-label="Sample exam question">
                    {SAMPLE_OPTIONS.map((option, idx) => {
                      const isSelected = selectedDemoOption === idx;
                      const isCorrect = idx === 1;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setSelectedDemoOption(idx)}
                          className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors flex items-center justify-between gap-3 cursor-pointer ${
                            isSelected
                              ? isCorrect
                                ? 'bg-emerald-50/70 border-emerald-500 text-slate-900'
                                : 'bg-rose-50/70 border-rose-400 text-slate-900'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:border-slate-300'
                          }`}
                        >
                          <span className="flex items-center gap-3 min-w-0">
                            <span
                              className={`w-6 h-6 rounded-md font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0 border ${
                                isSelected
                                  ? isCorrect
                                    ? 'bg-emerald-600 text-white border-emerald-600'
                                    : 'bg-rose-600 text-white border-rose-600'
                                  : 'bg-slate-50 text-slate-600 border-slate-200'
                              }`}
                            >
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span>{option}</span>
                          </span>
                          {isSelected && isCorrect && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-3">
                    <button
                      type="button"
                      onClick={() => setShowExplanation((prev) => !prev)}
                      className="inline-flex items-center gap-2 text-xs font-semibold text-violet-700 hover:text-violet-800 cursor-pointer"
                    >
                      <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>
                        {showExplanation
                          ? 'Hide AI Concept Explanation'
                          : 'Inspect AI Concept Explanation'}
                      </span>
                    </button>
                    <span className="text-xs text-slate-400">Interactive sample</span>
                  </div>

                  {showExplanation && (
                    <div className="p-4 rounded-xl bg-violet-50 border border-violet-200 space-y-1.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-violet-700">
                        <Sparkles className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>AI Concept Explanation</span>
                      </div>
                      <p className="text-xs sm:text-sm text-slate-700 leading-relaxed">
                        A real symmetric matrix satisfies xᵀAx &gt; 0 for all nonzero vectors x if
                        and only if every eigenvalue λᵢ is strictly positive. Checking det(A) &gt; 0
                        alone fails when an even number of eigenvalues are negative.
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          </div>
        </section>

        {/* 3-Step Workflow Showcase */}
        <section id="workflow" className="bg-white border-y border-slate-200 py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold text-indigo-900 mb-2">Assessment Workflow</p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
                From raw syllabus notes to calibrated mastery in three disciplined steps.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-900">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    01. Ingest Material
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Provide a structured topic prompt, paste lecture notes directly, or attach
                    syllabus documents (.pdf, .docx, .txt) to scope exact chapter boundaries.
                  </p>
                </div>
                <p className="text-xs font-mono text-slate-500 pt-3 border-t border-slate-100">
                  Topic Prompts · Notes · Document Upload
                </p>
              </Card>

              <Card className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-900">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    02. Calibrate &amp; Edit Exam
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Inspect every generated question, edit distractors, adjust mark weights,
                    reorder items, or refine explanations before locking your exam blueprint.
                  </p>
                </div>
                <p className="text-xs font-mono text-slate-500 pt-3 border-t border-slate-100">
                  MCQ &amp; True/False · Inline Editor · Mark Weights
                </p>
              </Card>

              <Card className="flex flex-col justify-between space-y-4">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-indigo-900">
                    <BookCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">
                    03. Simulate &amp; Master
                  </h3>
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Enter distraction-free focus mode with live countdown timers, question
                    flagging, instant rubric grading, and longitudinal topic mastery analytics.
                  </p>
                </div>
                <p className="text-xs font-mono text-slate-500 pt-3 border-t border-slate-100">
                  Focus Mode · Question Palette · Mastery Trajectory
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Supported Academic Levels */}
        <section id="levels" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold text-indigo-900 mb-2">Calibration Tiers</p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
              Tailored cognitive rigor across four academic and professional tracks.
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                icon: GraduationCap,
                level: 'High School',
                examples: 'AP Macroeconomics, IB Physics, SAT Quantitative Prep',
                focus: 'Core principle recall and structured problem solving',
              },
              {
                icon: Building2,
                level: 'Undergraduate',
                examples: 'Linear Algebra, Organic Chemistry, Data Structures',
                focus: 'Multi-step derivations, proofs, and conceptual edge cases',
              },
              {
                icon: Layers,
                level: 'Postgraduate',
                examples: 'Statistical Learning, Biochemistry, Econometrics',
                focus: 'Methodological synthesis and boundary-condition rigor',
              },
              {
                icon: Award,
                level: 'Professional Certification',
                examples: 'AWS SAA-C03, CFA Level I, CISSP, PMP',
                focus: 'Scenario-based trade-off analysis under strict timing',
              },
            ].map((tier) => {
              const Icon = tier.icon;
              return (
                <Card key={tier.level} className="space-y-3">
                  <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-900 flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-slate-900">{tier.level}</h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{tier.examples}</p>
                  <p className="text-sm text-slate-700 leading-relaxed pt-2 border-t border-slate-100">
                    {tier.focus}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Architecture & Stage-1 Transparency */}
        <section
          id="architecture"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
        >
          <Card padding="lg" className="bg-white">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-indigo-900">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Stage-1 Foundation &amp; Production Boundary</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
                  Honest local preview today. Secure Cloud Run + Gemini + Supabase ready tomorrow.
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Every workflow—exam generation, inline editing, timed focus attempts, grading, and
                  longitudinal analytics—runs interactively in local state with zero client-side
                  API keys or hidden secrets. Backend endpoints are cleanly isolated behind the
                  service abstraction layer for Stage-2 deployment.
                </p>
              </div>
              <div className="lg:col-span-4 flex lg:justify-end">
                <Button
                  size="lg"
                  isLoading={demoLoading}
                  onClick={handleInstantDemo}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                >
                  Explore Student Studio
                </Button>
              </div>
            </div>
          </Card>
        </section>
      </main>

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800">ExamSphere AI</span>
            <span aria-hidden="true">·</span>
            <span>Your Knowledge. Your Exam. Your Progress.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-900">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900">
              Create Account
            </Link>
            <Link to="/forgot-password" className="hover:text-slate-900">
              Reset Password
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
