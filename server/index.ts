import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";

import { handleDemo } from "./routes/demo";
import { ensureFileProcessTables } from "./startup/migrateFileProcess";
import { ensureTutorialTables } from "./startup/migrateTutorials";
import { ensureExpenseTables } from "./startup/migrateExpenses";

import {
  login,
  refresh,
  logout,
  resetPassword,
  authenticateToken,
  requirePermission,
  requireRole,
} from "./routes/auth";

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

import {
  listDailyCounts,
  getDailyCount,
  createDailyCount,
  updateDailyCount,
  approveDailyCount,
  rejectDailyCount,
  getDailyCountStatistics,
} from "./routes/dailyCounts";

import {
  getDashboardSummary,
  getRecentProjects,
  getTeamPerformance,
  getRecentAlerts,
  getProductivityTrend,
  getUserDashboard,
} from "./routes/dashboard";

import expenseRoutes from "./routes/expenses";
import tutorialsRoutes from "./routes/tutorials";
import * as fileProcess from "./routes/fileProcess";

import { isDbConfigured } from "./db/connection";
import { initDatabase } from "./startup/initDatabase";

export async function createServer() {
  const app = express();

  // Disable ETag to prevent 304 caching during development/API usage
  app.set("etag", false);

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Serve static files from dist folder (optional)
  const distPath = path.join(process.cwd(), "dist");
  app.use(express.static(distPath));

  if (isDbConfigured()) {
    try {
      await initDatabase();
      console.log("✅ Database initialized, starting server...");
    } catch (err) {
      console.error("❌ Failed to initialize database:", err);
      process.exit(1);
    }
  } else {
    console.warn("Database not configured. Skipping startup DB tasks.");
  }

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
  app.use("/api/users", authenticateToken);

  app.get("/api/users", requirePermission("user_read"), listUsers);
  app.get("/api/users/:id", getUser);
  app.post("/api/users", requirePermission("user_create"), createUser);
  app.put("/api/users/:id", updateUser);
  app.patch("/api/users/:id/status", requirePermission("user_update"), updateUserStatus);
  app.delete("/api/users/:id", requirePermission("user_delete"), deleteUser);
  app.post("/api/users/:id/change-password", changePassword);
  app.get("/api/users/:id/projects", getUserProjects);

  // ===== PROJECT MANAGEMENT ROUTES =====
  app.use("/api/projects", authenticateToken);

  app.get("/api/projects", requirePermission("project_read"), listProjects);
  app.get("/api/projects/:id", getProject);
  app.post("/api/projects", requirePermission("project_create"), createProject);
  app.put("/api/projects/:id", requirePermission("project_update"), updateProject);
  app.delete("/api/projects/:id", requirePermission("project_delete"), deleteProject);
  app.post("/api/projects/:id/assign", requirePermission("project_update"), assignUsers);
  app.delete("/api/projects/:id/assign/:userId", requirePermission("project_update"), removeUser);
  app.get("/api/projects/:id/progress", getProjectProgress);

  // ===== DAILY COUNTS ROUTES =====
  app.use("/api/daily-counts", authenticateToken);

  app.get("/api/daily-counts", listDailyCounts);
  app.get("/api/daily-counts/statistics", getDailyCountStatistics);
  app.get("/api/daily-counts/:id", getDailyCount);
  app.post("/api/daily-counts", requirePermission("count_submit"), createDailyCount);
  app.put("/api/daily-counts/:id", updateDailyCount);
  app.post("/api/daily-counts/:id/approve", requirePermission("count_approve"), approveDailyCount);
  app.post("/api/daily-counts/:id/reject", requirePermission("count_approve"), rejectDailyCount);

  // ===== DASHBOARD ROUTES =====
  app.use("/api/dashboard", authenticateToken);

  app.get("/api/dashboard/summary", getDashboardSummary);
  app.get("/api/dashboard/recent-projects", getRecentProjects);
  app.get("/api/dashboard/team-performance", requireRole(["super_admin", "project_manager", "admin"]), getTeamPerformance);
  app.get("/api/dashboard/recent-alerts", getRecentAlerts);
  app.get("/api/dashboard/productivity-trend", getProductivityTrend);
  app.get("/api/dashboard/user", getUserDashboard);

  // ===== FILE PROCESS ROUTES =====
  app.use("/api/file-processes", authenticateToken);
  app.get("/api/file-processes", fileProcess.listFileProcesses as any);
  app.get("/api/file-processes/:id", fileProcess.getFileProcess as any);
  app.post("/api/file-processes", fileProcess.createFileProcess as any);
  app.put("/api/file-processes/:id", fileProcess.updateFileProcess as any);
  app.delete("/api/file-processes/:id", fileProcess.deleteFileProcess as any);
  app.post(
    "/api/file-processes/:id/upload",
    requireRole(["super_admin", "project_manager"]),
    express.raw({ type: "application/octet-stream", limit: "200mb" }),
    fileProcess.uploadFileForProcess as any,
  );

  app.use("/api/file-requests", authenticateToken);
  app.get("/api/file-requests", fileProcess.listFileRequests as any);
  app.post("/api/file-requests", fileProcess.createFileRequest as any);
  app.put("/api/file-requests/:id", fileProcess.updateFileRequest as any);
  app.post("/api/file-requests/:id/approve", fileProcess.approveFileRequest as any);
  app.post("/api/file-requests/sync", fileProcess.syncCompletedRequests as any);
  app.get("/api/file-requests/:id/download", fileProcess.downloadAssignedSlice as any);
  app.post(
    "/api/file-requests/:id/upload-completed",
    requireRole(["user", "project_manager", "super_admin"]),
    express.raw({ type: "application/octet-stream", limit: "500mb" }),
    fileProcess.uploadCompletedForRequest as any,
  );
  app.get("/api/file-requests/:id/uploaded", fileProcess.downloadCompletedForRequest as any);
  app.post(
    "/api/file-requests/:id/verify",
    requireRole(["project_manager", "super_admin"]),
    fileProcess.verifyCompletedRequest as any,
  );

  // ===== TUTORIAL ROUTES =====
  app.use("/api/tutorials", authenticateToken, tutorialsRoutes);

  // ===== EXPENSE MANAGEMENT ROUTES =====
  app.use("/api/expenses", authenticateToken, expenseRoutes);

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

  // 404 handler for API routes
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
