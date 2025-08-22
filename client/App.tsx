import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./pages/UserManagement";
import ProjectManagement from "./pages/ProjectManagement";
import FileProcess from "./pages/FileProcess";
import RequestFiles from "./pages/RequestFiles";
import DailyCounts from "./pages/DailyCounts";
import Billing from "./pages/Billing";
import Reports from "./pages/Reports";
import Permissions from "./pages/Permissions";
import Notifications from "./pages/Notifications";
import Settings from "./pages/Settings";
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import { Users, FolderOpen, Target, BarChart3, Shield, Mail } from "lucide-react";
import { createRoot } from "react-dom/client";

const queryClient = new QueryClient();

// Loading component
function LoadingSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
    </div>
  );
}

// Protected Route Component
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <Layout>{children}</Layout>;
}

// Public Route Component (for login)
function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />

        {/* Protected Routes */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } />

        <Route path="/users" element={
          <ProtectedRoute>
            <UserManagement />
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <ProjectManagement />
          </ProtectedRoute>
        } />

        <Route path="/file-process" element={
          <ProtectedRoute>
            <FileProcess />
          </ProtectedRoute>
        } />

        <Route path="/request-files" element={
          <ProtectedRoute>
            <RequestFiles />
          </ProtectedRoute>
        } />

        <Route path="/daily-counts" element={
          <ProtectedRoute>
            <DailyCounts />
          </ProtectedRoute>
        } />

        <Route path="/billing" element={
          <ProtectedRoute>
            <Billing />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <Reports />
          </ProtectedRoute>
        } />

        <Route path="/permissions" element={
          <ProtectedRoute>
            <Permissions />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <Notifications />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        } />

        {/* Redirect root to dashboard */}
        <Route path="/" element={<Navigate to="/dashboard" replace />} />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <AppRoutes />
        </AuthProvider>
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

createRoot(document.getElementById("root")!).render(<App />);
