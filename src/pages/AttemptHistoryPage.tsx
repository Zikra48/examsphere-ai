import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowUpRight, CheckCircle2, History, Search } from 'lucide-react';
import { AppShell } from '../components/layout/AppShell';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { useApp } from '../context/AppContext';
import { formatDurationReadable, formatShortDate } from '../utils/formatters';

export function AttemptHistoryPage() {
  const { attempts } = useApp();
  const navigate = useNavigate();

  const [search, setSearch] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('All');

  const subjects = useMemo(() => {
    const set = new Set(attempts.map((a) => a.subject));
    return ['All', ...Array.from(set).sort()];
  }, [attempts]);

  const sortedFiltered = useMemo(() => {
    return [...attempts]
      .sort(
        (a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      )
      .filter((att) => {
        const q = search.trim().toLowerCase();
        const matchesSearch =
          !q ||
          att.examTitle.toLowerCase().includes(q) ||
          att.subject.toLowerCase().includes(q);
        const matchesSub = subjectFilter === 'All' || att.subject === subjectFilter;
        return matchesSearch && matchesSub;
      });
  }, [attempts, search, subjectFilter]);

  return (
    <AppShell
      title="Attempt History"
      breadcrumb="Assessment Studio / Submission Log"
    >
      <div className="space-y-6">
        <Card padding="sm">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="w-4 h-4 text-[#9AA8BD] absolute left-3.5 top-1/2 -translate-y-1/2"
                aria-hidden="true"
              />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter attempts by exam title or subject..."
                aria-label="Search attempt history"
                className="w-full h-10 pl-10 pr-3.5 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] placeholder:text-[#9AA8BD]/60 focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
              />
            </div>
            <select
              aria-label="Filter attempts by subject"
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="h-10 px-3 rounded-lg border border-white/[0.1] bg-[#080D19] text-sm text-[#F1F5FC] focus:outline-none focus:ring-2 focus:ring-[#648BFF]"
            >
              {subjects.map((sub) => (
                <option key={sub} value={sub}>
                  {sub === 'All' ? 'All Subjects' : sub}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {sortedFiltered.length === 0 ? (
          <EmptyState
            icon={<History className="w-5 h-5" />}
            title="No attempt records match your filter"
            description="Complete a timed simulation from your library or clear the active search filter."
            action={
              <Link to="/exams">
                <Button>Browse Examinations</Button>
              </Link>
            }
          />
        ) : (
          <Card padding="none" className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#151F30] border-b border-white/[0.08] text-xs font-semibold text-[#9AA8BD]">
                    <th className="py-3.5 px-5 whitespace-nowrap">Date</th>
                    <th className="py-3.5 px-5">Examination Title</th>
                    <th className="py-3.5 px-5 whitespace-nowrap">Subject</th>
                    <th className="py-3.5 px-5 text-right whitespace-nowrap">Score</th>
                    <th className="py-3.5 px-5 text-right whitespace-nowrap">Duration</th>
                    <th className="py-3.5 px-5 text-right whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.08] text-sm">
                  {sortedFiltered.map((att) => (
                    <tr
                      key={att.id}
                      className="hover:bg-[#151F30]/60 transition-colors"
                    >
                      <td className="py-3.5 px-5 text-xs font-mono tabular-nums text-[#9AA8BD] whitespace-nowrap">
                        {formatShortDate(att.completedAt)}
                      </td>
                      <td className="py-3.5 px-5 font-medium text-[#F1F5FC] min-w-[240px]">
                        {att.examTitle}
                      </td>
                      <td className="py-3.5 px-5 text-[#9AA8BD] whitespace-nowrap">
                        {att.subject}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          <span className="text-xs font-mono tabular-nums text-[#9AA8BD]">
                            {att.earnedMarks}/{att.totalMarks}
                          </span>
                          <Badge
                            variant={att.passed ? 'emerald' : 'amber'}
                            icon={<CheckCircle2 className="w-3 h-3" />}
                          >
                            <span className="font-mono tabular-nums">{att.scorePercent}%</span>
                          </Badge>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 text-right font-mono tabular-nums text-xs text-[#9AA8BD] whitespace-nowrap">
                        {formatDurationReadable(att.durationTakenSeconds)}
                      </td>
                      <td className="py-3.5 px-5 text-right whitespace-nowrap">
                        <Button
                          size="sm"
                          variant="secondary"
                          rightIcon={<ArrowUpRight className="w-3.5 h-3.5" />}
                          onClick={() => navigate(`/results/${att.id}`)}
                        >
                          Review Breakdown
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>
    </AppShell>
  );
}
