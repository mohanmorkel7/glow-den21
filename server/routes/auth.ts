import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { LoginRequest, LoginResponse, AuthUser, ApiResponse } from "@shared/types";

// Mock database - in production, replace with actual database queries
const mockUsers = [
  {
    id: "1",
    name: "Super Admin",
    email: "admin@websyntactic.com",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu", // "admin123"
    role: "super_admin" as const,
    status: "active" as const,
    permissions: ["all"],
    phone: "+1 (555) 123-4567",
    department: "Administration",
    jobTitle: "System Administrator",
    joinDate: "2024-01-01",
    lastLogin: null,
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z"
  },
  {
    id: "2", 
    name: "John Smith",
    email: "john.smith@websyntactic.com",
    hashedPassword: "$2b$10$K9p1qGQqXYZ5Z9Z9Z9Z9Zu", // "admin123"
    role: "project_manager" as const,
    status: "active" as const,
    permissions: ["project_create", "project_read", "project_update", "user_read", "count_approve", "reports_view"],
    phone: "+1 (555) 234-5678",
    department: "Operations",
    jobTitle: "Project Manager",
    joinDate: "2024-01-02",
    lastLogin: "2024-01-15T09:15:00Z",
    createdAt: "2024-01-02T00:00:00Z",
    updatedAt: "2024-01-15T09:15:00Z"
  }
];

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Store refresh tokens in memory (use Redis in production)
const refreshTokenStore = new Set<string>();

export const login: RequestHandler = async (req, res) => {
  try {
    const { email, password }: LoginRequest = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email and password are required",
          details: [
            !email && { field: "email", message: "Email is required" },
            !password && { field: "password", message: "Password is required" }
          ].filter(Boolean)
        }
      } as ApiResponse);
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Invalid credentials"
        }
      } as ApiResponse);
    }

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_DISABLED",
          message: "Your account has been disabled"
        }
      } as ApiResponse);
    }

    // Verify password (mock comparison - use bcrypt.compare in production)
    const isValidPassword = password === "admin123"; // Mock password check
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Invalid credentials"
        }
      } as ApiResponse);
    }

    // Generate JWT tokens
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // Store refresh token
    refreshTokenStore.add(refreshToken);

    // Update last login (in production, update database)
    user.lastLogin = new Date().toISOString();

    const response: LoginResponse = {
      token,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        status: user.status,
        department: user.department,
        jobTitle: user.jobTitle,
        joinDate: user.joinDate,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    };

    res.json({
      data: response
    } as ApiResponse<LoginResponse>);

  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during login"
      }
    } as ApiResponse);
  }
};

export const refresh: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Refresh token is required"
        }
      } as ApiResponse);
    }

    // Check if refresh token exists in store
    if (!refreshTokenStore.has(refreshToken)) {
      return res.status(401).json({
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid or expired refresh token"
        }
      } as ApiResponse);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };
    const user = mockUsers.find(u => u.id === decoded.userId);

    if (!user || user.status !== "active") {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found or inactive"
        }
      } as ApiResponse);
    }

    // Generate new tokens
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: user.permissions
    };

    const newToken = jwt.sign(authUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: REFRESH_TOKEN_EXPIRES_IN });

    // Remove old refresh token and add new one
    refreshTokenStore.delete(refreshToken);
    refreshTokenStore.add(newRefreshToken);

    res.json({
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    } as ApiResponse);

  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token"
      }
    } as ApiResponse);
  }
};

export const logout: RequestHandler = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      refreshTokenStore.delete(refreshToken);
    }

    res.json({
      data: { message: "Logged out successfully" }
    } as ApiResponse);

  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during logout"
      }
    } as ApiResponse);
  }
};

export const resetPassword: RequestHandler = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Email is required"
        }
      } as ApiResponse);
    }

    // Find user by email
    const user = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      // Don't reveal whether email exists or not
      return res.json({
        data: { message: "If the email exists, a password reset link has been sent" }
      } as ApiResponse);
    }

    // In production:
    // 1. Generate password reset token
    // 2. Store token with expiration
    // 3. Send email with reset link
    // 4. Implement reset confirmation endpoint

    console.log(`Password reset requested for user: ${user.email}`);

    res.json({
      data: { message: "If the email exists, a password reset link has been sent" }
    } as ApiResponse);

  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during password reset"
      }
    } as ApiResponse);
  }
};

// Middleware to authenticate JWT tokens
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Access token is required"
      }
    } as ApiResponse);
  }

  try {
    const user = jwt.verify(token, JWT_SECRET) as AuthUser;
    (req as any).user = user;
    next();
  } catch (error) {
    return res.status(403).json({
      error: {
        code: "INVALID_TOKEN",
        message: "Invalid or expired token"
      }
    } as ApiResponse);
  }
};

// Middleware to check user permissions
export const requirePermission = (permission: string) => {
  return (req: any, res: any, next: any) => {
    const user: AuthUser = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required"
        }
      } as ApiResponse);
    }

    // Super admin has all permissions
    if (user.role === "super_admin" || user.permissions.includes("all")) {
      return next();
    }

    // Check specific permission
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: `Permission '${permission}' required`
        }
      } as ApiResponse);
    }

    next();
  };
};

// Middleware to check user role
export const requireRole = (roles: string | string[]) => {
  return (req: any, res: any, next: any) => {
    const user: AuthUser = req.user;

    if (!user) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_REQUIRED",
          message: "Authentication required"
        }
      } as ApiResponse);
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: `Role '${allowedRoles.join("' or '")}' required`
        }
      } as ApiResponse);
    }

    next();
  };
};
