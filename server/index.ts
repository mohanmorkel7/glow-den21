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
  requireRole,
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
  getUserProjects,
} from "./routes/users";

// Import project management routes
import {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  assignUsers,
  removeUser,
  getProjectProgress,
} from "./routes/projects";

// Import daily counts routes
import {
  listDailyCounts,
  getDailyCount,
  createDailyCount,
  updateDailyCount,
  approveDailyCount,
  rejectDailyCount,
  getDailyCountStatistics,
} from "./routes/dailyCounts";

// Import dashboard routes
import {
  getDashboardSummary,
  getRecentProjects,
  getTeamPerformance,
  getRecentAlerts,
  getProductivityTrend,
  getUserDashboard,
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
      uptime: process.uptime(),
    });
  });

  // Legacy routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });
  app.get("/api/demo", handleDemo);

  // ===== AUTHENTICATION ROUTES =====
  app.post("/api/auth/login", login);
  app.post("/api/auth/refresh", refresh);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/reset-password", resetPassword);

  // ===== USER MANAGEMENT ROUTES =====
  // All user routes require authentication
  app.use("/api/users", authenticateToken);

  app.get("/api/users", requirePermission("user_read"), listUsers);
  app.get("/api/users/:id", getUser); // Self or with permission check inside
  app.post("/api/users", requirePermission("user_create"), createUser);
  app.put("/api/users/:id", updateUser); // Self or with permission check inside
  app.patch(
    "/api/users/:id/status",
    requirePermission("user_update"),
    updateUserStatus,
  );
  app.delete("/api/users/:id", requirePermission("user_delete"), deleteUser);
  app.post("/api/users/:id/change-password", changePassword); // Self or admin
  app.get("/api/users/:id/projects", getUserProjects); // Self or with permission

  // ===== PROJECT MANAGEMENT ROUTES =====
  // All project routes require authentication
  app.use("/api/projects", authenticateToken);

  app.get("/api/projects", requirePermission("project_read"), listProjects);
  app.get("/api/projects/:id", getProject);
  app.post("/api/projects", requirePermission("project_create"), createProject);
  app.put(
    "/api/projects/:id",
    requirePermission("project_update"),
    updateProject,
  );
  app.delete(
    "/api/projects/:id",
    requirePermission("project_delete"),
    deleteProject,
  );
  app.post(
    "/api/projects/:id/assign",
    requirePermission("project_update"),
    assignUsers,
  );
  app.delete(
    "/api/projects/:id/assign/:userId",
    requirePermission("project_update"),
    removeUser,
  );
  app.get("/api/projects/:id/progress", getProjectProgress);

  // ===== DAILY COUNTS ROUTES =====
  // All daily counts routes require authentication
  app.use("/api/daily-counts", authenticateToken);

  app.get("/api/daily-counts", listDailyCounts);
  app.get("/api/daily-counts/statistics", getDailyCountStatistics);
  app.get("/api/daily-counts/:id", getDailyCount);
  app.post(
    "/api/daily-counts",
    requirePermission("count_submit"),
    createDailyCount,
  );
  app.put("/api/daily-counts/:id", updateDailyCount);
  app.post(
    "/api/daily-counts/:id/approve",
    requirePermission("count_approve"),
    approveDailyCount,
  );
  app.post(
    "/api/daily-counts/:id/reject",
    requirePermission("count_approve"),
    rejectDailyCount,
  );

  // ===== DASHBOARD ROUTES =====
  // All dashboard routes require authentication
  app.use("/api/dashboard", authenticateToken);

  app.get("/api/dashboard/summary", getDashboardSummary);
  app.get("/api/dashboard/recent-projects", getRecentProjects);
  app.get(
    "/api/dashboard/team-performance",
    requireRole(["super_admin", "project_manager"]),
    getTeamPerformance,
  );
  app.get("/api/dashboard/recent-alerts", getRecentAlerts);
  app.get("/api/dashboard/productivity-trend", getProductivityTrend);
  app.get("/api/dashboard/user", getUserDashboard);

  // Error handling middleware
  app.use((err: any, _req: any, res: any, _next: any) => {
    console.error("Unhandled error:", err);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An unexpected error occurred",
      },
    });
  });

  // 404 handler for API routes - use regex pattern for proper wildcard handling
  app.use(/^\/api\/.*/, (_req, res) => {
    res.status(404).json({
      error: {
        code: "NOT_FOUND",
        message: "API endpoint not found",
      },
    });
  });

  return app;
}
