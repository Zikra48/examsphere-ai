import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Compass } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Button } from '../ui/Button';

export function PublicNavbar() {
  const { isAuthenticated } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-[#080D19]/90 backdrop-blur-md border-b border-white/[0.08]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2.5 text-[#F1F5FC] font-bold text-lg tracking-tight whitespace-nowrap shrink-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#648BFF] rounded-md"
        >
          <span className="w-8 h-8 rounded-lg bg-[#648BFF] text-[#080D19] flex items-center justify-center shrink-0">
            <Compass className="w-4 h-4" aria-hidden="true" />
          </span>
          <span>ExamSphere AI</span>
        </Link>

        <nav
          aria-label="Primary navigation"
          className="hidden md:flex items-center gap-7 text-sm font-medium text-[#9AA8BD]"
        >
          <a
            href="#workflow"
            className="hover:text-[#F1F5FC] transition-colors whitespace-nowrap shrink-0"
          >
            Workflow
          </a>
          <a
            href="#levels"
            className="hover:text-[#F1F5FC] transition-colors whitespace-nowrap shrink-0"
          >
            Academic Levels
          </a>
          <a
            href="#studio-preview"
            className="hover:text-[#F1F5FC] transition-colors whitespace-nowrap shrink-0"
          >
            Studio Preview
          </a>
          <a
            href="#architecture"
            className="hover:text-[#F1F5FC] transition-colors whitespace-nowrap shrink-0"
          >
            Architecture
          </a>
        </nav>

        <div className="hidden md:flex items-center gap-3 shrink-0">
          {isAuthenticated ? (
            <Link to="/dashboard">
              <Button size="sm">Open Workspace</Button>
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-medium text-[#9AA8BD] hover:text-[#F1F5FC] transition-colors whitespace-nowrap shrink-0 px-3 py-1.5"
              >
                Sign In
              </Link>
              <Link to="/register">
                <Button size="sm">Launch Workspace</Button>
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileOpen}
          className="md:hidden p-2 rounded-lg text-[#9AA8BD] hover:text-[#F1F5FC] hover:bg-[#151F30] cursor-pointer"
        >
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/[0.08] bg-[#101827] px-4 py-4 space-y-3">
          <nav className="flex flex-col gap-1.5 text-sm font-medium text-[#9AA8BD]">
            <a
              href="#workflow"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F30] hover:text-[#F1F5FC]"
            >
              Workflow
            </a>
            <a
              href="#levels"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F30] hover:text-[#F1F5FC]"
            >
              Academic Levels
            </a>
            <a
              href="#studio-preview"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F30] hover:text-[#F1F5FC]"
            >
              Studio Preview
            </a>
            <a
              href="#architecture"
              onClick={() => setMobileOpen(false)}
              className="px-3 py-2 rounded-lg hover:bg-[#151F30] hover:text-[#F1F5FC]"
            >
              Architecture
            </a>
          </nav>
          <div className="pt-3 border-t border-white/[0.08] flex flex-col gap-2">
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
