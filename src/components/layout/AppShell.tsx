import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Compass,
  FilePlus2,
  FlaskConical,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { getInitials } from '../../utils/formatters';
import { Button } from '../ui/Button';

interface AppShellProps {
  title: string;
  breadcrumb?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    heading: 'Overview',
    items: [
      { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { to: '/analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    heading: 'Assessment Studio',
    items: [
      { to: '/exams/new', label: 'Generate Exam', icon: FilePlus2 },
      { to: '/exams', label: 'Exam Library', icon: BookOpen },
      { to: '/history', label: 'Attempt History', icon: History },
    ],
  },
  {
    heading: 'Account',
    items: [{ to: '/settings', label: 'Profile & Settings', icon: Settings }],
  },
];

export function AppShell({ title, breadcrumb, actions, children }: AppShellProps) {
  const { user, isDemoMode, logout, addToast, previewBannerDismissed, dismissPreviewBanner } =
    useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      addToast({
        title: 'Sign Out Failed',
        description: err instanceof Error ? err.message : 'Unable to sign out right now.',
        variant: 'error',
      });
    }
  };

  return (
    <div className="min-h-screen bg-[#080D19] text-[#F1F5FC] flex">
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-[#101827] border-r border-white/[0.08] transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2.5 font-bold text-[#F1F5FC] tracking-tight whitespace-nowrap overflow-hidden"
          >
            <span className="w-8 h-8 rounded-lg bg-[#648BFF] text-[#080D19] flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </span>
            {!collapsed && <span className="text-base">ExamSphere AI</span>}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="flex-1 p-3 space-y-5 overflow-y-auto">
          {NAV_GROUPS.map((group) => (
            <div key={group.heading} className="space-y-1">
              {!collapsed && (
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#9AA8BD]/70">
                  {group.heading}
                </p>
              )}
              {group.items.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.to === '/exams'}
                    title={collapsed ? item.label : undefined}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
                        isActive
                          ? 'bg-[#648BFF]/15 text-[#F1F5FC] border border-[#648BFF]/35'
                          : 'text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-[#151F30] border border-transparent'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon
                          className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#648BFF]' : ''}`}
                          aria-hidden="true"
                        />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="p-3 border-t border-white/[0.08] space-y-2">
          <Link
            to="/settings"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-[#151F30] transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/30 text-[#9BB6FF] font-semibold text-xs flex items-center justify-center shrink-0">
              {getInitials(user.fullName)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-[#F1F5FC] truncate">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-[#9AA8BD] truncate">
                  {user.academicLevel}
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-[#9AA8BD] hover:text-rose-300 hover:bg-rose-500/10 transition-colors cursor-pointer ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" aria-hidden="true" />
            {!collapsed && <span>Sign Out</span>}
          </button>
        </div>
      </aside>

      {/* Mobile Navigation Drawer */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden flex"
          role="dialog"
          aria-modal="true"
          aria-label="Mobile workspace navigation"
        >
          <div
            className="fixed inset-0 bg-[#04070F]/70 backdrop-blur-xs"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[82vw] bg-[#101827] h-full border-r border-white/[0.08] flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-white/[0.08]">
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2.5 font-bold text-[#F1F5FC] tracking-tight"
              >
                <span className="w-8 h-8 rounded-lg bg-[#648BFF] text-[#080D19] flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </span>
                <span>ExamSphere AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-white/[0.06] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-5 overflow-y-auto">
              {NAV_GROUPS.map((group) => (
                <div key={group.heading} className="space-y-1">
                  <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-[#9AA8BD]/70">
                    {group.heading}
                  </p>
                  {group.items.map((item) => {
                    const Icon = item.icon;
                    return (
                      <NavLink
                        key={item.to}
                        to={item.to}
                        end={item.to === '/exams'}
                        onClick={() => setMobileOpen(false)}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                            isActive
                              ? 'bg-[#648BFF]/15 text-[#F1F5FC] border border-[#648BFF]/35'
                              : 'text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-[#151F30] border border-transparent'
                          }`
                        }
                      >
                        {({ isActive }) => (
                          <>
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#648BFF]' : ''}`} />
                            <span>{item.label}</span>
                          </>
                        )}
                      </NavLink>
                    );
                  })}
                </div>
              ))}
            </nav>

            <div className="p-4 border-t border-white/[0.08]">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-[#648BFF]/15 border border-[#648BFF]/30 text-[#9BB6FF] font-semibold text-xs flex items-center justify-center">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#F1F5FC] truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-[#9AA8BD] truncate">{user.email || user.academicLevel}</p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                leftIcon={<LogOut className="w-3.5 h-3.5" />}
                onClick={handleLogout}
              >
                Sign Out
              </Button>
            </div>
          </aside>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Bar */}
        <header className="sticky top-0 z-30 h-16 bg-[#080D19]/90 backdrop-blur-md border-b border-white/[0.08] px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-[#151F30] cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              {breadcrumb && (
                <p className="text-xs text-[#9AA8BD] truncate">{breadcrumb}</p>
              )}
              <h1 className="text-base sm:text-lg font-semibold text-[#F1F5FC] truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!previewBannerDismissed && (
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#151F30] border border-[#9275F5]/25 text-[#C1B0FF] text-xs font-medium whitespace-nowrap shrink-0">
                <FlaskConical className="w-3.5 h-3.5 shrink-0 text-[#9275F5]" aria-hidden="true" />
                <span>
                  {isDemoMode
                    ? 'Demo Workspace · Local State'
                    : 'Supabase Auth Active'}
                </span>
                <button
                  type="button"
                  onClick={dismissPreviewBanner}
                  aria-label="Dismiss mode indicator"
                  className="ml-0.5 p-0.5 rounded hover:bg-white/[0.08] text-[#9AA8BD] hover:text-[#F1F5FC] cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            <Link
              to="/settings"
              title="Profile & Settings"
              className="hidden sm:flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-lg bg-[#101827] border border-white/[0.08] hover:border-[#648BFF]/35 transition-colors"
            >
              <span className="w-6 h-6 rounded-md bg-[#648BFF]/20 text-[#9BB6FF] text-[11px] font-semibold flex items-center justify-center">
                {getInitials(user.fullName)}
              </span>
              <span className="text-xs font-medium text-[#F1F5FC] max-w-[120px] truncate">
                {user.fullName}
              </span>
            </Link>
            {actions}
          </div>
        </header>

        {/* Compact mobile mode strip */}
        {!previewBannerDismissed && (
          <div className="md:hidden bg-[#101827] border-b border-white/[0.08] px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-[#C1B0FF]">
            <span className="inline-flex items-center gap-1.5 truncate font-medium">
              <FlaskConical className="w-3.5 h-3.5 shrink-0 text-[#9275F5]" />
              <span className="truncate">
                {isDemoMode
                  ? 'Demo Workspace · Local State'
                  : 'Supabase Auth Active'}
              </span>
            </span>
            <button
              type="button"
              onClick={dismissPreviewBanner}
              aria-label="Dismiss mode notice"
              className="p-1 text-[#9AA8BD] hover:text-[#F1F5FC] shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          {children}
        </main>
      </div>
    </div>
  );
}
