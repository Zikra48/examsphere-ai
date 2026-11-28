import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3, FilePlus2, Sparkles, Target } from 'lucide-react';
import {
  DifficultyAccuracyChart,
  ScoreTrajectoryChart,
  SubjectMasteryChart,
} from '../components/analytics/AnalyticsCharts';
import { AppShell } from '../components/layout/AppShell';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useApp } from '../context/AppContext';

export function AnalyticsPage() {
  const { attempts, subjectProgress } = useApp();

  const weakTopicRecommendations = useMemo(() => {
    const topicAgg = new Map<
      string,
      { subject: string; correct: number; total: number }
    >();

    for (const att of attempts) {
      for (const tb of att.topicBreakdown) {
        const key = `${att.subject}::${tb.topic}`;
        const prev = topicAgg.get(key) ?? {
          subject: att.subject,
          correct: 0,
          total: 0,
        };
        topicAgg.set(key, {
          subject: att.subject,
          correct: prev.correct + tb.correct,
          total: prev.total + tb.total,
        });
      }
    }

    return Array.from(topicAgg.entries())
      .map(([key, stats]) => {
        const topic = key.split('::')[1];
        const accuracy = Math.round((stats.correct / Math.max(1, stats.total)) * 100);
        return {
          subject: stats.subject,
          topic,
          accuracy,
          missed: stats.total - stats.correct,
          total: stats.total,
        };
      })
      .filter((item) => item.accuracy < 85)
      .sort((a, b) => a.accuracy - b.accuracy)
      .slice(0, 4);
  }, [attempts]);

  return (
    <AppShell
      title="Analytics & Progress"
      breadcrumb="Overview / Mastery Telemetry"
      actions={
        <Link to="/exams/new">
          <Button size="sm" leftIcon={<FilePlus2 className="w-4 h-4" />}>
            Target Practice Exam
          </Button>
        </Link>
      }
    >
      {attempts.length === 0 ? (
        <EmptyState
          icon={<BarChart3 className="w-5 h-5" />}
          title="No analytics data recorded yet"
          description="Complete your first examination attempt to unlock score trajectories, difficulty benchmarks, and AI focus recommendations."
          action={
            <Link to="/exams">
              <Button>Choose an Exam to Attempt</Button>
            </Link>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Score Trajectory + Subject Mastery */}
          <div className="grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#F1F5FC]">
                  Score Trajectory Over Time
                </h2>
                <p className="text-xs text-[#9AA8BD] mt-0.5">
                  Hover or select any attempt node to inspect date and score ratio
                </p>
              </div>
              <ScoreTrajectoryChart attempts={attempts} />
            </Card>

            <Card className="lg:col-span-5 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#F1F5FC]">
                  Subject Mastery Breakdown
                </h2>
                <p className="text-xs text-[#9AA8BD] mt-0.5">
                  Weighted index combining historical average and latest performance
                </p>
              </div>
              <SubjectMasteryChart subjects={subjectProgress} />
            </Card>
          </div>

          {/* Difficulty Comparison + AI Study Focus Recommendations */}
          <div className="grid lg:grid-cols-12 gap-6">
            <Card className="lg:col-span-7 space-y-4">
              <div>
                <h2 className="text-base font-semibold text-[#F1F5FC]">
                  Difficulty Accuracy Comparison
                </h2>
                <p className="text-xs text-[#9AA8BD] mt-0.5">
                  Average accuracy segmented by calibrated exam difficulty tier
                </p>
              </div>
              <DifficultyAccuracyChart attempts={attempts} />
            </Card>

            <Card className="lg:col-span-5 bg-[#151F30] border-[#9275F5]/25 space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#C1B0FF]">
                    <Sparkles className="w-3.5 h-3.5 text-[#9275F5]" />
                    <span>AI Study Focus Recommendations</span>
                  </p>
                  <h2 className="mt-1 text-base font-semibold text-[#F1F5FC]">
                    Highest-Leverage Review Topics
                  </h2>
                </div>
                <Target className="w-5 h-5 text-[#9275F5] shrink-0" aria-hidden="true" />
              </div>

              {weakTopicRecommendations.length === 0 ? (
                <p className="text-sm text-[#9AA8BD] leading-relaxed">
                  All tested topics are currently above 85% accuracy. Consider generating a Hard or
                  Mixed exam to challenge upper-bound synthesis.
                </p>
              ) : (
                <div className="space-y-3">
                  {weakTopicRecommendations.map((rec) => (
                    <div
                      key={`${rec.subject}-${rec.topic}`}
                      className="p-3.5 rounded-xl bg-[#101827] border border-white/[0.08] flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-medium text-[#C1B0FF]">{rec.subject}</p>
                        <p className="text-sm font-semibold text-[#F1F5FC] truncate">
                          {rec.topic}
                        </p>
                        <p className="text-xs text-[#9AA8BD] mt-0.5">
                          Missed {rec.missed} of {rec.total} tested{' '}
                          {rec.total === 1 ? 'item' : 'items'}
                        </p>
                      </div>
                      <span className="font-mono tabular-nums text-sm font-bold text-rose-400 shrink-0">
                        {rec.accuracy}%
                      </span>
                    </div>
                  ))}
                </div>
              )}

              <div className="pt-1">
                <Link to="/exams/new">
                  <Button variant="violet" size="sm" className="w-full">
                    Generate Targeted Drill Exam
                  </Button>
                </Link>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
