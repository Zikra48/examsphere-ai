import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  BookOpen,
  Compass,
  FilePlus2,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  PanelLeftClose,
  PanelLeftOpen,
  Settings,
  X,
  FlaskConical,
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

const NAV_ITEMS = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/exams/new', label: 'Generate Exam', icon: FilePlus2 },
  { to: '/exams', label: 'My Library', icon: BookOpen },
  { to: '/history', label: 'Attempt History', icon: History },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/settings', label: 'Profile & Settings', icon: Settings },
];

export function AppShell({ title, breadcrumb, actions, children }: AppShellProps) {
  const { user, logout, previewBannerDismissed, dismissPreviewBanner } = useApp();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col shrink-0 bg-white border-r border-slate-200 transition-[width] duration-200 ${
          collapsed ? 'w-[76px]' : 'w-64'
        }`}
      >
        <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2.5 font-bold text-slate-900 tracking-tight whitespace-nowrap overflow-hidden"
          >
            <span className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4" aria-hidden="true" />
            </span>
            {!collapsed && <span className="text-base">ExamSphere AI</span>}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((prev) => !prev)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
          >
            {collapsed ? (
              <PanelLeftOpen className="w-4 h-4" />
            ) : (
              <PanelLeftClose className="w-4 h-4" />
            )}
          </button>
        </div>

        <nav aria-label="Workspace navigation" className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
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
                      ? 'bg-indigo-900 text-white'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`
                }
              >
                <Icon className="w-4 h-4 shrink-0" aria-hidden="true" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </NavLink>
            );
          })}
        </nav>

        <div className="p-3 border-t border-slate-200 space-y-2">
          <Link
            to="/settings"
            className={`flex items-center gap-3 p-2 rounded-lg hover:bg-slate-50 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-xs flex items-center justify-center shrink-0">
              {getInitials(user.fullName)}
            </div>
            {!collapsed && (
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate">
                  {user.academicLevel}
                </p>
              </div>
            )}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            title="Sign Out"
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium text-slate-600 hover:text-rose-700 hover:bg-rose-50 transition-colors cursor-pointer ${
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
            className="fixed inset-0 bg-slate-900/40"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative z-10 w-72 max-w-[82vw] bg-white h-full border-r border-slate-200 flex flex-col">
            <div className="h-16 px-4 flex items-center justify-between border-b border-slate-200">
              <Link
                to="/dashboard"
                onClick={() => setMobileOpen(false)}
                className="inline-flex items-center gap-2.5 font-bold text-slate-900 tracking-tight"
              >
                <span className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center">
                  <Compass className="w-4 h-4" />
                </span>
                <span>ExamSphere AI</span>
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                aria-label="Close drawer"
                className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 p-3 space-y-1">
              {NAV_ITEMS.map((item) => {
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
                          ? 'bg-indigo-900 text-white'
                          : 'text-slate-700 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                );
              })}
            </nav>

            <div className="p-4 border-t border-slate-200">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-900 font-semibold text-xs flex items-center justify-center">
                  {getInitials(user.fullName)}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-slate-900 truncate">
                    {user.fullName}
                  </p>
                  <p className="text-xs text-slate-500 truncate">{user.email}</p>
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
        <header className="sticky top-0 z-30 h-16 bg-white/95 backdrop-blur-xs border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 rounded-lg text-slate-600 hover:bg-slate-100 cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              {breadcrumb && (
                <p className="text-xs text-slate-500 truncate">{breadcrumb}</p>
              )}
              <h1 className="text-base sm:text-lg font-semibold text-slate-900 truncate">
                {title}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            {!previewBannerDismissed && (
              <div className="hidden md:inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-violet-50 border border-violet-200 text-violet-700 text-xs font-medium whitespace-nowrap shrink-0">
                <FlaskConical className="w-3.5 h-3.5 shrink-0" aria-hidden="true" />
                <span>Stage 1 Preview Mode — Simulated Data & Local State</span>
                <button
                  type="button"
                  onClick={dismissPreviewBanner}
                  aria-label="Dismiss preview mode indicator"
                  className="ml-0.5 p-0.5 rounded-full hover:bg-violet-100 text-violet-600 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {actions}
          </div>
        </header>

        {/* Compact mobile preview mode strip */}
        {!previewBannerDismissed && (
          <div className="md:hidden bg-violet-50 border-b border-violet-200 px-4 py-1.5 flex items-center justify-between gap-2 text-xs text-violet-800">
            <span className="inline-flex items-center gap-1.5 truncate font-medium">
              <FlaskConical className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Stage 1 Preview Mode — Simulated Data & Local State</span>
            </span>
            <button
              type="button"
              onClick={dismissPreviewBanner}
              aria-label="Dismiss preview notice"
              className="p-1 text-violet-600 hover:text-violet-900 shrink-0 cursor-pointer"
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
