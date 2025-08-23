import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";

// Import authentication routes
import {
  login,
  refresh,
  logout,
  resetPassword,
  authenticateToken,
  requirePermission,
  requireRole
} from "./routes/auth";

// Import user management routes
import {
  listUsers,
  getUser,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  changePassword,
  getUserProjects
} from "./routes/users";

// Import dashboard routes
import {
  getDashboardSummary,
  getRecentProjects,
  getTeamPerformance,
  getRecentAlerts,
  getProductivityTrend,
  getUserDashboard
} from "./routes/dashboard";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Health check
  app.get("/api/health", (_req, res) => {
    res.json({
      status: "healthy",
      database: "connected",
      version: "1.0.0",
      uptime: process.uptime()
    });
  });

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // ===== AUTHENTICATION ROUTES =====
  // Temporarily comment out to test
  /*
  app.post("/api/auth/login", login);
  app.post("/api/auth/refresh", refresh);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/reset-password", resetPassword);
  */

  // ===== CUSTOM ROUTES TEMPORARILY DISABLED FOR DEBUGGING =====
  // Let's test with just the basic routes to isolate the issue

  // ===== PROJECT ROUTES =====
  // Placeholder for project routes - would include:
  // app.get("/api/projects", authenticateToken, requirePermission("project_read"), listProjects);
  // app.post("/api/projects", authenticateToken, requirePermission("project_create"), createProject);
  // etc.

  // ===== DAILY COUNTS ROUTES =====
  // Placeholder for daily counts routes - would include:
  // app.get("/api/daily-counts", authenticateToken, listDailyCounts);
  // app.post("/api/daily-counts", authenticateToken, requirePermission("count_submit"), createDailyCount);
  // etc.

  // ===== NOTIFICATION ROUTES =====
  // Placeholder for notification routes

  // ===== PERMISSION & ROLE ROUTES =====
  // Placeholder for permission and role management routes

  // ===== SETTINGS ROUTES =====
  // Placeholder for settings routes

  // ===== REPORT ROUTES =====
  // Placeholder for reporting routes

  // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred"
      }
    });
  });

  // 404 handler for API routes
  app.use("/api/*", (_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "API endpoint not found"
      }
    });
  });

  return app;
}
