import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export function PublicNavbar() {
  const { isAuthenticated } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Clean single-line brand wordmark */}
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-slate-900 font-bold text-lg tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" aria-hidden="true" />
          </span>
          <span>ExamSphere AI</span>
        </Link>

        {/* Zone 2: Concise single-line navigation links */}
        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600"
        >
          <a
            href="#workflow"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Workflow
          </a>
          <a
            href="#levels"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Academic Levels
          </a>
          <a
            href="#studio-preview"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Studio Preview
          </a>
          <a
            href="#architecture"
            className="hover:text-slate-900 hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
          >
            Architecture
          </a>
        </nav>

        {/* Zone 3: Actions */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">Open Workspace</Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 px-2 py-1.5"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button size="sm">Launch Workspace</Button>
              </Link>
            </>
          )}
        </div>

        {/* Mobile menu trigger */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile navigation drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-2 text-sm font-medium text-slate-700">
            <a
              href="#workflow"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Workflow
            </a>
            <a
              href="#levels"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Academic Levels
            </a>
            <a
              href="#studio-preview"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Studio Preview
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-slate-50"
            >
              Architecture
            </a>
          </nav>
          <div className="pt-3 border-t border-slate-200 flex flex-col gap-2">
            {isAuthenticated ? (
              <Link to="/dashboard" onClick={() => setMobileOpen(false)}>
                <Button className="w-full">Open Workspace</Button>
              </Link>
            ) : (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)}>
                  <Button variant="secondary" className="w-full">
                    Sign In
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full">Launch Workspace</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
