import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { query, transaction } from "../db/connection";
import {
  LoginRequest,
  LoginResponse,
  AuthUser,
  ApiResponse,
} from "@shared/types";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "24h";
const REFRESH_TOKEN_EXPIRES_IN = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

// Store refresh tokens in database (in production, use Redis or database table)
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
            !password && { field: "password", message: "Password is required" },
          ].filter(Boolean),
        },
      } as ApiResponse);
    }

    // Find user by email. Try full join first; fallback to simple query if role tables are missing
    let userResult;
    try {
      const userQuery = `
        SELECT u.*, r.name as role_name,
               ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL) as permissions
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE LOWER(u.email) = LOWER($1)
        GROUP BY u.id, r.name
      `;
      userResult = await query(userQuery, [email]);
    } catch (e) {
      const simpleQuery = `SELECT u.* FROM users u WHERE LOWER(u.email) = LOWER($1)`;
      userResult = await query(simpleQuery, [email]);
    }

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Invalid credentials",
        },
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    // Check if user is active
    if (user.status !== "active") {
      return res.status(401).json({
        error: {
          code: "ACCOUNT_DISABLED",
          message: "Your account has been disabled",
        },
      } as ApiResponse);
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(
      password,
      user.hashed_password,
    );
    if (!isValidPassword) {
      return res.status(401).json({
        error: {
          code: "AUTHENTICATION_FAILED",
          message: "Invalid credentials",
        },
      } as ApiResponse);
    }

    // Generate JWT tokens
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };

    const token = jwt.sign(authUser, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    // Store refresh token
    refreshTokenStore.add(refreshToken);

    // Update last login
    await query(
      "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1",
      [user.id],
    );

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
        jobTitle: user.job_title,
        joinDate: user.join_date,
        lastLogin: new Date().toISOString(),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    };

    res.json({
      data: response,
    } as ApiResponse<LoginResponse>);
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during login",
      },
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
          message: "Refresh token is required",
        },
      } as ApiResponse);
    }

    // Check if refresh token exists in store
    if (!refreshTokenStore.has(refreshToken)) {
      return res.status(401).json({
        error: {
          code: "INVALID_REFRESH_TOKEN",
          message: "Invalid or expired refresh token",
        },
      } as ApiResponse);
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, JWT_SECRET) as { userId: string };

    // Get user with permissions if available; fallback to simple users table
    let userResult;
    try {
      const userQuery = `
        SELECT u.*, r.name as role_name,
               ARRAY_AGG(p.name) FILTER (WHERE p.name IS NOT NULL) as permissions
        FROM users u
        LEFT JOIN user_roles ur ON u.id = ur.user_id
        LEFT JOIN roles r ON ur.role_id = r.id
        LEFT JOIN role_permissions rp ON r.id = rp.role_id
        LEFT JOIN permissions p ON rp.permission_id = p.id
        WHERE u.id = $1 AND u.status = 'active'
        GROUP BY u.id, r.name
      `;
      userResult = await query(userQuery, [decoded.userId]);
    } catch (e) {
      const simpleQuery = `SELECT u.* FROM users u WHERE u.id = $1 AND u.status = 'active'`;
      userResult = await query(simpleQuery, [decoded.userId]);
    }

    if (userResult.rows.length === 0) {
      refreshTokenStore.delete(refreshToken);
      return res.status(401).json({
        error: {
          code: "USER_NOT_FOUND",
          message: "User not found or inactive",
        },
      } as ApiResponse);
    }

    const user = userResult.rows[0];

    // Generate new tokens
    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      permissions: Array.isArray(user.permissions) ? user.permissions : [],
    };

    const newToken = jwt.sign(authUser, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });
    const newRefreshToken = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
    });

    // Remove old refresh token and add new one
    refreshTokenStore.delete(refreshToken);
    refreshTokenStore.add(newRefreshToken);

    res.json({
      data: {
        token: newToken,
        refreshToken: newRefreshToken,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Token refresh error:", error);
    res.status(401).json({
      error: {
        code: "INVALID_REFRESH_TOKEN",
        message: "Invalid or expired refresh token",
      },
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
      data: { message: "Logged out successfully" },
    } as ApiResponse);
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during logout",
      },
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
          message: "Email is required",
        },
      } as ApiResponse);
    }

    // Check if user exists
    const userResult = await query(
      "SELECT id, email FROM users WHERE LOWER(email) = LOWER($1) AND status = $2",
      [email, "active"],
    );

    if (userResult.rows.length === 0) {
      // Don't reveal whether email exists or not
      return res.json({
        data: {
          message: "If the email exists, a password reset link has been sent",
        },
      } as ApiResponse);
    }

    // In production:
    // 1. Generate password reset token and store in database with expiration
    // 2. Send email with reset link
    // 3. Implement reset confirmation endpoint

    console.log(`Password reset requested for user: ${email}`);

    res.json({
      data: {
        message: "If the email exists, a password reset link has been sent",
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Password reset error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred during password reset",
      },
    } as ApiResponse);
  }
};

// Middleware to authenticate JWT tokens
export const authenticateToken: RequestHandler = (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({
      error: {
        code: "AUTHENTICATION_REQUIRED",
        message: "Access token is required",
      },
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
        message: "Invalid or expired token",
      },
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
          message: "Authentication required",
        },
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
          message: `Permission '${permission}' required`,
        },
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
          message: "Authentication required",
        },
      } as ApiResponse);
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: `Role '${allowedRoles.join("' or '")}' required`,
        },
      } as ApiResponse);
    }

    next();
  };
};
