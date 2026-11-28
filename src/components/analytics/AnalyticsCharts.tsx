import React, { useState } from 'react';
import { Attempt, DifficultyLevel, SubjectProgress } from '../../types/exam';
import { formatShortDate } from '../../utils/formatters';

interface ScoreTrajectoryChartProps {
  attempts: Attempt[];
}

export function ScoreTrajectoryChart({ attempts }: ScoreTrajectoryChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const sorted = [...attempts].sort(
    (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
  );

  if (sorted.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-sm text-[#9AA8BD]">
        Complete at least one exam attempt to visualize score trajectory.
      </div>
    );
  }

  const width = 680;
  const height = 240;
  const padLeft = 42;
  const padRight = 24;
  const padTop = 20;
  const padBottom = 34;
  const plotW = width - padLeft - padRight;
  const plotH = height - padTop - padBottom;

  const points = sorted.map((attempt, idx) => {
    const x =
      sorted.length === 1
        ? padLeft + plotW / 2
        : padLeft + (idx / (sorted.length - 1)) * plotW;
    const y = padTop + ((100 - attempt.scorePercent) / 100) * plotH;
    return { x, y, attempt };
  });

  const linePath = points
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} L ${points[0].x.toFixed(1)} ${(padTop + plotH).toFixed(1)} Z`
      : '';

  const activePoint = hoveredIdx !== null ? points[hoveredIdx] : points[points.length - 1];

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#9AA8BD] bg-[#151F30] border border-white/[0.08] rounded-lg px-3.5 py-2">
        <span className="font-medium text-[#F1F5FC] truncate max-w-md">
          {activePoint.attempt.examTitle}
        </span>
        <div className="flex items-center gap-3 font-mono tabular-nums shrink-0">
          <span>{formatShortDate(activePoint.attempt.completedAt)}</span>
          <span className="font-semibold text-[#648BFF]">
            {activePoint.attempt.scorePercent}% ({activePoint.attempt.earnedMarks}/
            {activePoint.attempt.totalMarks})
          </span>
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto min-w-[460px]"
          role="img"
          aria-label="Exam score trajectory chart"
        >
          <defs>
            <linearGradient id="scoreAreaGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#648BFF" stopOpacity="0.24" />
              <stop offset="100%" stopColor="#648BFF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {[0, 25, 50, 75, 100].map((tick) => {
            const y = padTop + ((100 - tick) / 100) * plotH;
            return (
              <g key={tick}>
                <line
                  x1={padLeft}
                  y1={y}
                  x2={width - padRight}
                  y2={y}
                  stroke={tick === 0 ? 'rgba(148,163,184,0.22)' : 'rgba(148,163,184,0.1)'}
                  strokeDasharray={tick === 0 ? undefined : '4 4'}
                  strokeWidth="1"
                />
                <text
                  x={padLeft - 8}
                  y={y + 4}
                  textAnchor="end"
                  className="fill-[#9AA8BD] text-[10px] font-mono tabular-nums"
                >
                  {tick}%
                </text>
              </g>
            );
          })}

          {areaPath && <path d={areaPath} fill="url(#scoreAreaGrad)" />}

          {points.length > 1 && (
            <path
              d={linePath}
              fill="none"
              stroke="#648BFF"
              strokeWidth="2.25"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          )}

          {points.map((pt, idx) => {
            const isActive =
              hoveredIdx === idx || (hoveredIdx === null && idx === points.length - 1);
            return (
              <g
                key={pt.attempt.id}
                className="cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
                onClick={() => setHoveredIdx(idx)}
              >
                {isActive && (
                  <line
                    x1={pt.x}
                    y1={padTop}
                    x2={pt.x}
                    y2={padTop + plotH}
                    stroke="rgba(100,139,255,0.4)"
                    strokeWidth="1"
                    strokeDasharray="3 3"
                  />
                )}
                <circle
                  cx={pt.x}
                  cy={pt.y}
                  r={isActive ? 6 : 4}
                  fill={isActive ? '#9275F5' : '#101827'}
                  stroke="#648BFF"
                  strokeWidth="2"
                />
                <text
                  x={pt.x}
                  y={height - 10}
                  textAnchor="middle"
                  className="fill-[#9AA8BD] text-[10px] font-mono tabular-nums"
                >
                  #{idx + 1}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}

interface SubjectMasteryChartProps {
  subjects: SubjectProgress[];
}

export function SubjectMasteryChart({ subjects }: SubjectMasteryChartProps) {
  if (subjects.length === 0) {
    return (
      <div className="h-48 flex items-center justify-center text-sm text-[#9AA8BD]">
        No subject mastery records available yet.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {subjects.map((sub) => (
        <div key={sub.subject} className="space-y-1.5">
          <div className="flex items-center justify-between gap-3 text-sm">
            <div className="min-w-0">
              <span className="font-medium text-[#F1F5FC]">{sub.subject}</span>
              <span className="ml-2 text-xs text-[#9AA8BD]">
                {sub.examsCompleted} {sub.examsCompleted === 1 ? 'attempt' : 'attempts'}
              </span>
            </div>
            <div className="flex items-center gap-3 font-mono tabular-nums text-xs shrink-0">
              <span className="text-[#9AA8BD]">Avg {sub.averageScore}%</span>
              <span className="font-semibold text-[#648BFF]">
                Mastery {sub.masteryPercent}%
              </span>
            </div>
          </div>
          <div className="h-2 w-full rounded-full bg-[#151F30] overflow-hidden border border-white/[0.05]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#648BFF] to-[#9275F5] transition-all duration-300"
              style={{ width: `${Math.max(4, sub.masteryPercent)}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

interface DifficultyAccuracyChartProps {
  attempts: Attempt[];
}

export function DifficultyAccuracyChart({ attempts }: DifficultyAccuracyChartProps) {
  const levels: DifficultyLevel[] = ['Easy', 'Medium', 'Hard', 'Mixed'];
  const stats = levels.map((level) => {
    const matching = attempts.filter((a) => a.difficulty === level);
    const avg =
      matching.length > 0
        ? Math.round(matching.reduce((sum, a) => sum + a.scorePercent, 0) / matching.length)
        : 0;
    return { level, count: matching.length, avg };
  });

  const barColor: Record<DifficultyLevel, string> = {
    Easy: 'bg-emerald-500',
    Medium: 'bg-amber-400',
    Hard: 'bg-rose-500',
    Mixed: 'bg-[#648BFF]',
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
      {stats.map((item) => (
        <div
          key={item.level}
          className="p-4 rounded-xl border border-white/[0.08] bg-[#151F30] flex flex-col justify-between"
        >
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-[#F1F5FC]">{item.level}</span>
            <span className="font-mono tabular-nums text-[#9AA8BD]">
              {item.count}x
            </span>
          </div>

          <div className="my-4 h-28 flex items-end">
            <div className="w-full h-full bg-[#080D19]/80 border border-white/[0.06] rounded-lg flex items-end overflow-hidden p-1">
              <div
                className={`w-full rounded-md transition-all duration-300 ${barColor[item.level]}`}
                style={{ height: `${item.count > 0 ? Math.max(10, item.avg) : 4}%` }}
              />
            </div>
          </div>

          <div className="flex items-baseline justify-between">
            <span className="text-xs text-[#9AA8BD]">Accuracy</span>
            <span className="text-base font-bold font-mono tabular-nums text-[#F1F5FC]">
              {item.count > 0 ? `${item.avg}%` : '—'}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
