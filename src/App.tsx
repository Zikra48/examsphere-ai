/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { ToastContainer } from './components/ui/ToastContainer';
import { AppProvider, useApp } from './context/AppContext';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { AttemptHistoryPage } from './pages/AttemptHistoryPage';
import { DashboardPage } from './pages/DashboardPage';
import { ExamAttemptPage } from './pages/ExamAttemptPage';
import { ExamEditPage } from './pages/ExamEditPage';
import { ExamLibraryPage } from './pages/ExamLibraryPage';
import { ExamResultsPage } from './pages/ExamResultsPage';
import { ForgotPasswordPage } from './pages/ForgotPasswordPage';
import { GenerateExamPage } from './pages/GenerateExamPage';
import { LandingPage } from './pages/LandingPage';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAuthLoading } = useApp();
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#080D19] flex items-center justify-center">
        <div className="text-sm font-medium text-[#9AA8BD]">Restoring session...</div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public & Auth Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Authenticated Student Workspace Routes */}
      <Route
        path="/dashboard"
        element={
          <RequireAuth>
            <DashboardPage />
          </RequireAuth>
        }
      />
      <Route
        path="/exams/new"
        element={
          <RequireAuth>
            <GenerateExamPage />
          </RequireAuth>
        }
      />
      <Route
        path="/exams/:id/edit"
        element={
          <RequireAuth>
            <ExamEditPage />
          </RequireAuth>
        }
      />
      <Route
        path="/exams/:id/attempt"
        element={
          <RequireAuth>
            <ExamAttemptPage />
          </RequireAuth>
        }
      />
      <Route
        path="/results/:attemptId"
        element={
          <RequireAuth>
            <ExamResultsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/exams"
        element={
          <RequireAuth>
            <ExamLibraryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/history"
        element={
          <RequireAuth>
            <AttemptHistoryPage />
          </RequireAuth>
        }
      />
      <Route
        path="/analytics"
        element={
          <RequireAuth>
            <AnalyticsPage />
          </RequireAuth>
        }
      />
      <Route
        path="/settings"
        element={
          <RequireAuth>
            <SettingsPage />
          </RequireAuth>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </AppProvider>
  );
}
