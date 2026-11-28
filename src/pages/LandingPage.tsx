import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight,
  Award,
  BookCheck,
  Building2,
  CheckCircle2,
  Clock,
  GraduationCap,
  Layers,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
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
  const { isAuthenticated, loginDemo, addToast } = useApp();
  const navigate = useNavigate();
  const [selectedDemoOption, setSelectedDemoOption] = useState<number | null>(1);
  const [showExplanation, setShowExplanation] = useState(true);
  const [demoLoading, setDemoLoading] = useState(false);

  const handleInstantDemo = async () => {
    setDemoLoading(true);
    try {
      await loginDemo();
      navigate('/dashboard');
    } catch (err) {
      addToast({
        title: 'Demo Launch Failed',
        description: err instanceof Error ? err.message : 'Unable to launch demo workspace.',
        variant: 'error',
      });
    } finally {
      setDemoLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F1F5FC] flex flex-col">
      <PublicNavbar />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 -top-24 h-[460px] bg-[radial-gradient(ellipse_at_top,rgba(100,139,255,0.14),transparent_65%)]"
          />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-16 lg:pt-20 lg:pb-24">
            <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-center">
              <div className="lg:col-span-6 space-y-6">
                <div className="inline-flex items-center gap-2 text-xs font-medium text-[#9BB6FF] bg-[#648BFF]/10 border border-[#648BFF]/25 rounded-md px-3 py-1">
                  <span>Your Knowledge. Your Exam. Your Progress.</span>
                </div>

                <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-[#F1F5FC] leading-[1.12] [text-wrap:balance]">
                  Institutional-grade assessment studio built for deep mastery.
                </h1>

                <p className="text-base sm:text-lg text-[#9AA8BD] leading-relaxed max-w-xl">
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

                <div className="pt-5 border-t border-white/[0.08] grid grid-cols-3 gap-4 max-w-lg">
                  <div>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#F1F5FC]">
                      5–50
                    </p>
                    <p className="text-xs text-[#9AA8BD]">Calibrated questions</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#F1F5FC]">
                      4 Levels
                    </p>
                    <p className="text-xs text-[#9AA8BD]">School to Certs</p>
                  </div>
                  <div>
                    <p className="text-xl font-bold font-mono tabular-nums text-[#F1F5FC]">
                      100%
                    </p>
                    <p className="text-xs text-[#9AA8BD]">Editable blueprints</p>
                  </div>
                </div>
              </div>

              {/* Interactive UI Preview Card */}
              <div id="studio-preview" className="lg:col-span-6">
                <Card padding="none" className="overflow-hidden border-[#648BFF]/20">
                  <div className="px-5 py-3.5 bg-[#151F30] border-b border-white/[0.08] flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-xs text-[#9AA8BD] truncate">
                        Mathematics · Linear Algebra (Undergraduate)
                      </p>
                      <p className="text-sm font-semibold text-[#F1F5FC] truncate">
                        Question 07 of 10
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="amber">Medium · 5 Marks</Badge>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#080D19] border border-white/[0.08] font-mono tabular-nums text-xs font-semibold text-[#F1F5FC]">
                        <Clock className="w-3.5 h-3.5 text-[#648BFF]" aria-hidden="true" />
                        24:18
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-5">
                    <p className="text-base font-medium text-[#F1F5FC] leading-relaxed">
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
                                  ? 'bg-emerald-500/12 border-emerald-400/50 text-[#F1F5FC]'
                                  : 'bg-rose-500/12 border-rose-400/50 text-[#F1F5FC]'
                                : 'bg-[#151F30] border-white/[0.08] text-[#9AA8BD] hover:text-[#F1F5FC] hover:border-[#648BFF]/35'
                            }`}
                          >
                            <span className="flex items-center gap-3 min-w-0">
                              <span
                                className={`w-6 h-6 rounded-md font-mono tabular-nums text-xs font-semibold flex items-center justify-center shrink-0 border ${
                                  isSelected
                                    ? isCorrect
                                      ? 'bg-emerald-500 text-[#080D19] border-emerald-400'
                                      : 'bg-rose-500 text-white border-rose-400'
                                    : 'bg-[#080D19] text-[#9AA8BD] border-white/[0.1]'
                                }`}
                              >
                                {String.fromCharCode(65 + idx)}
                              </span>
                              <span>{option}</span>
                            </span>
                            {isSelected && isCorrect && (
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="pt-2 flex items-center justify-between gap-3">
                      <button
                        type="button"
                        onClick={() => setShowExplanation((prev) => !prev)}
                        className="inline-flex items-center gap-2 text-xs font-semibold text-[#C1B0FF] hover:text-[#F1F5FC] cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#9275F5]" aria-hidden="true" />
                        <span>
                          {showExplanation
                            ? 'Hide AI Concept Explanation'
                            : 'Inspect AI Concept Explanation'}
                        </span>
                      </button>
                      <span className="text-xs text-[#9AA8BD]">Interactive sample</span>
                    </div>

                    {showExplanation && (
                      <div className="p-4 rounded-xl bg-[#9275F5]/10 border border-[#9275F5]/25 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#C1B0FF]">
                          <Sparkles className="w-3.5 h-3.5 text-[#9275F5]" aria-hidden="true" />
                          <span>AI Concept Explanation</span>
                        </div>
                        <p className="text-xs sm:text-sm text-[#F1F5FC]/90 leading-relaxed">
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
          </div>
        </section>

        {/* 3-Step Workflow Showcase */}
        <section id="workflow" className="bg-[#101827]/60 border-y border-white/[0.08] py-16 lg:py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="max-w-2xl mb-12">
              <p className="text-xs font-semibold uppercase tracking-wider text-[#648BFF] mb-2">
                Assessment Workflow
              </p>
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5FC]">
                From raw syllabus notes to calibrated mastery in three disciplined steps.
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <Card className="flex flex-col justify-between space-y-4 bg-[#151F30]">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/25 flex items-center justify-center text-[#648BFF]">
                    <Layers className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F1F5FC]">
                    01. Ingest Material
                  </h3>
                  <p className="text-sm text-[#9AA8BD] leading-relaxed">
                    Provide a structured topic prompt, paste lecture notes directly, or attach
                    syllabus documents (.pdf, .docx, .txt) to scope exact chapter boundaries.
                  </p>
                </div>
                <p className="text-xs font-mono text-[#9AA8BD] pt-3 border-t border-white/[0.08]">
                  Topic Prompts · Notes · Document Upload
                </p>
              </Card>

              <Card className="flex flex-col justify-between space-y-4 bg-[#151F30]">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/25 flex items-center justify-center text-[#648BFF]">
                    <SlidersHorizontal className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F1F5FC]">
                    02. Calibrate &amp; Edit Exam
                  </h3>
                  <p className="text-sm text-[#9AA8BD] leading-relaxed">
                    Inspect every generated question, edit distractors, adjust mark weights,
                    reorder items, or refine explanations before locking your exam blueprint.
                  </p>
                </div>
                <p className="text-xs font-mono text-[#9AA8BD] pt-3 border-t border-white/[0.08]">
                  MCQ &amp; True/False · Inline Editor · Mark Weights
                </p>
              </Card>

              <Card className="flex flex-col justify-between space-y-4 bg-[#151F30]">
                <div className="space-y-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9275F5]/15 border border-[#9275F5]/25 flex items-center justify-center text-[#9275F5]">
                    <BookCheck className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F1F5FC]">
                    03. Simulate &amp; Master
                  </h3>
                  <p className="text-sm text-[#9AA8BD] leading-relaxed">
                    Enter distraction-free focus mode with live countdown timers, question
                    flagging, instant rubric grading, and longitudinal topic mastery analytics.
                  </p>
                </div>
                <p className="text-xs font-mono text-[#9AA8BD] pt-3 border-t border-white/[0.08]">
                  Focus Mode · Question Palette · Mastery Trajectory
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Supported Academic Levels */}
        <section id="levels" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-20">
          <div className="max-w-2xl mb-10">
            <p className="text-xs font-semibold uppercase tracking-wider text-[#648BFF] mb-2">
              Calibration Tiers
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#F1F5FC]">
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
                  <div className="w-9 h-9 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/25 text-[#648BFF] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-semibold text-[#F1F5FC]">{tier.level}</h3>
                  <p className="text-xs text-[#9AA8BD] leading-relaxed">{tier.examples}</p>
                  <p className="text-sm text-[#F1F5FC]/85 leading-relaxed pt-2 border-t border-white/[0.08]">
                    {tier.focus}
                  </p>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Architecture & Security */}
        <section
          id="architecture"
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20"
        >
          <Card padding="lg" className="bg-[#151F30] border-[#648BFF]/20">
            <div className="grid lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-8 space-y-3">
                <div className="inline-flex items-center gap-2 text-xs font-semibold text-[#648BFF]">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Server-Side AI &amp; Supabase Authentication</span>
                </div>
                <h2 className="text-xl sm:text-2xl font-bold text-[#F1F5FC]">
                  Structured Gemini question synthesis paired with verified session security.
                </h2>
                <p className="text-sm text-[#9AA8BD] leading-relaxed">
                  All AI exam synthesis runs behind server-side endpoints with schema validation,
                  option uniqueness enforcement, and zero client-exposed secret keys. Authentication
                  is powered by Supabase Auth, with an isolated Demo Mode for immediate evaluation.
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

      <footer className="bg-[#101827] border-t border-white/[0.08] py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#9AA8BD]">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-[#F1F5FC]">ExamSphere AI</span>
            <span aria-hidden="true">·</span>
            <span>Your Knowledge. Your Exam. Your Progress.</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-[#F1F5FC]">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-[#F1F5FC]">
              Create Account
            </Link>
            <Link to="/forgot-password" className="hover:text-[#F1F5FC]">
              Reset Password
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
