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
import PlaceholderPage from "./pages/PlaceholderPage";
import NotFound from "./pages/NotFound";
import { Users, FolderOpen, Target, BarChart3, Shield, Mail, Settings } from "lucide-react";
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
            <PlaceholderPage
              title="User Management"
              description="Manage users, roles, and permissions for your organization."
              icon={Users}
            />
          </ProtectedRoute>
        } />

        <Route path="/projects" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Project Management"
              description="Create, manage, and track project progress and assignments."
              icon={FolderOpen}
            />
          </ProtectedRoute>
        } />

        <Route path="/daily-counts" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Daily Count Management"
              description="Track and manage daily count submissions and targets."
              icon={Target}
            />
          </ProtectedRoute>
        } />

        <Route path="/reports" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Reports & Analytics"
              description="View detailed reports and analytics for projects and performance."
              icon={BarChart3}
            />
          </ProtectedRoute>
        } />

        <Route path="/permissions" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Permissions Management"
              description="Configure role-based access control and permissions."
              icon={Shield}
            />
          </ProtectedRoute>
        } />

        <Route path="/notifications" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Notifications"
              description="Manage email alerts and in-app notifications."
              icon={Mail}
            />
          </ProtectedRoute>
        } />

        <Route path="/settings" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Settings"
              description="Configure application settings and preferences."
              icon={Settings}
            />
          </ProtectedRoute>
        } />

        <Route path="/profile" element={
          <ProtectedRoute>
            <PlaceholderPage
              title="Profile Settings"
              description="Update your profile information and account settings."
              icon={Users}
            />
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
