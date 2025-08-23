import "dotenv/config";
import express from "express";
import cors from "cors";
// import { handleDemo } from "./routes/demo";

// Temporarily comment out route imports to isolate the issue
/*
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
*/

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
  app.post("/api/auth/login", login);
  app.post("/api/auth/refresh", refresh);
  app.post("/api/auth/logout", logout);
  app.post("/api/auth/reset-password", resetPassword);

  // Temporarily remove problematic routes to isolate the issue
  // Will add them back one by one

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
