import { RequestHandler } from "express";
import bcrypt from "bcrypt";
import { query, paginatedQuery } from "../db/connection";
import {
  User,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserListQuery,
  ApiResponse,
  PaginatedResponse,
  AuthUser,
} from "@shared/types";

// Map DB row to API User type
const mapRowToUser = (row: any): User => ({
  id: String(row.id),
  name: row.name,
  email: row.email,
  phone: row.phone ?? undefined,
  role: row.role,
  status: row.status,
  department: row.department ?? undefined,
  jobTitle: row.job_title ?? undefined,
  avatarUrl: row.avatar_url ?? undefined,
  theme: row.theme ?? undefined,
  language: row.language ?? undefined,
  notificationsEnabled:
    typeof row.notifications_enabled === "boolean"
      ? row.notifications_enabled
      : undefined,
  joinDate: row.join_date ?? new Date().toISOString().split("T")[0],
  lastLogin: row.last_login ?? undefined,
  projectsCount:
    typeof row.projects_count === "number" ? row.projects_count : undefined,
  createdAt: row.created_at ?? new Date().toISOString(),
  updatedAt: row.updated_at ?? new Date().toISOString(),
});

export const listUsers: RequestHandler = async (req, res) => {
  try {
    const queryParams: UserListQuery = req.query as any;
    const { search = "", role, status, page = 1, limit = 20 } = queryParams;

    const where: string[] = [];
    const params: any[] = [];

    if (search) {
      params.push(`%${String(search).toLowerCase()}%`);
      where.push(
        "(LOWER(name) LIKE $" +
          params.length +
          " OR LOWER(email) LIKE $" +
          params.length +
          ")",
      );
    }
    if (role) {
      params.push(role);
      where.push("role = $" + params.length);
    }
    if (status) {
      params.push(status);
      where.push("status = $" + params.length);
    }

    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    // Note: selecting raw timestamps; client expects strings. We cast to text for safety.
    const baseQuery = `
      SELECT 
        id,
        name,
        email,
        phone,
        role,
        status,
        department,
        job_title,
        avatar_url,
        theme,
        language,
        notifications_enabled,
        TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date,
        TO_CHAR(COALESCE(last_login, NOW()) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login,
        COALESCE((SELECT COUNT(*) FROM user_projects up WHERE up.user_id = users.id), 0) AS projects_count,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
    `;

    const countQuery = `SELECT COUNT(*) FROM users ${whereSql}`;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      params,
      Number(page),
      Number(limit),
    );

    const users: User[] = result.data.map(mapRowToUser);

    const response: PaginatedResponse<User> = {
      data: users,
      pagination: result.pagination,
    };

    res.json({ data: response } as ApiResponse<PaginatedResponse<User>>);
  } catch (error) {
    console.error("List users error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching users",
      },
    } as ApiResponse);
  }
};

export const getUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const userResult = await query(
      `SELECT 
        id,
        name,
        email,
        phone,
        role,
        status,
        department,
        job_title,
        avatar_url,
        theme,
        language,
        notifications_enabled,
        TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date,
        TO_CHAR(last_login AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login,
        COALESCE((SELECT COUNT(*) FROM user_projects up WHERE up.user_id = users.id), 0) AS projects_count,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
      FROM users WHERE id = $1`,
      [id],
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      } as ApiResponse);
    }

    // Users can only view their own profile unless they have permission
    if (
      currentUser.id !== id &&
      !currentUser.permissions.includes("user_read") &&
      !currentUser.permissions.includes("all")
    ) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only view your own profile",
        },
      } as ApiResponse);
    }

    const user = mapRowToUser(userResult.rows[0]);
    res.json({ data: user } as ApiResponse<User>);
  } catch (error) {
    console.error("Get user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching user",
      },
    } as ApiResponse);
  }
};

export const createUser: RequestHandler = async (req, res) => {
  try {
    const userRequest: CreateUserRequest = req.body;

    const { name, email, password } = userRequest;
    const role = userRequest.role || ("user" as const);

    if (!name || !email || !password) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Name, email, and password are required",
          details: [
            !name && { field: "name", message: "Name is required" },
            !email && { field: "email", message: "Email is required" },
            !password && { field: "password", message: "Password is required" },
          ].filter(Boolean),
        },
      } as ApiResponse);
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid email format" },
      } as ApiResponse);
    }

    // Password strength
    if (password.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Password must be at least 8 characters long",
        },
      } as ApiResponse);
    }

    // Check uniqueness
    const exists = await query(
      "SELECT 1 FROM users WHERE LOWER(email) = LOWER($1)",
      [email],
    );
    if (exists.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: "EMAIL_ALREADY_EXISTS",
          message: "A user with this email already exists",
        },
      } as ApiResponse);
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertQuery = `
      INSERT INTO users (
        name, email, phone, hashed_password, role, status, department, job_title,
        avatar_url, theme, language, notifications_enabled, join_date, last_login,
        created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5, 'active', $6, $7,
        NULL, 'system', 'English', TRUE, CURRENT_DATE, NULL,
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      )
      RETURNING 
        id, name, email, phone, role, status, department, job_title, avatar_url,
        theme, language, notifications_enabled,
        TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date,
        TO_CHAR(last_login AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login,
        COALESCE((SELECT COUNT(*) FROM user_projects up WHERE up.user_id = users.id), 0) AS projects_count,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at
    `;

    const values = [
      name,
      email,
      userRequest.phone || null,
      hashedPassword,
      role,
      userRequest.department || null,
      userRequest.jobTitle || null,
    ];

    const result = await query(insertQuery, values);

    const newUser = mapRowToUser(result.rows[0]);
    res.status(201).json({ data: newUser } as ApiResponse<User>);
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while creating user",
      },
    } as ApiResponse);
  }
};

export const updateUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const userRequest: UpdateUserRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Fetch existing user
    const existing = await query("SELECT * FROM users WHERE id = $1", [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      } as ApiResponse);
    }

    const isOwnProfile = currentUser.id === id;
    const canUpdateUsers =
      currentUser.permissions.includes("user_update") ||
      currentUser.permissions.includes("all") ||
      currentUser.role === "super_admin";

    if (!isOwnProfile && !canUpdateUsers) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only update your own profile",
        },
      } as ApiResponse);
    }

    // If trying to change role without permission
    if (userRequest.role && !canUpdateUsers) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You cannot change user roles",
        },
      } as ApiResponse);
    }

    // Build dynamic update
    const fields: string[] = [];
    const values: any[] = [];

    if (userRequest.name !== undefined) {
      if (userRequest.name.trim().length === 0) {
        return res.status(400).json({
          error: { code: "VALIDATION_ERROR", message: "Name cannot be empty" },
        } as ApiResponse);
      }
      values.push(userRequest.name);
      fields.push(`name = $${values.length}`);
    }
    if (userRequest.phone !== undefined) {
      values.push(userRequest.phone || null);
      fields.push(`phone = $${values.length}`);
    }
    if (userRequest.role !== undefined) {
      values.push(userRequest.role);
      fields.push(`role = $${values.length}`);
    }
    if (userRequest.department !== undefined) {
      values.push(userRequest.department || null);
      fields.push(`department = $${values.length}`);
    }
    if (userRequest.jobTitle !== undefined) {
      values.push(userRequest.jobTitle || null);
      fields.push(`job_title = $${values.length}`);
    }
    if (userRequest.theme !== undefined) {
      values.push(userRequest.theme);
      fields.push(`theme = $${values.length}`);
    }
    if (userRequest.language !== undefined) {
      values.push(userRequest.language);
      fields.push(`language = $${values.length}`);
    }
    if (userRequest.notificationsEnabled !== undefined) {
      values.push(Boolean(userRequest.notificationsEnabled));
      fields.push(`notifications_enabled = $${values.length}`);
    }

    values.push(id);
    const sql = `UPDATE users SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${values.length} RETURNING 
      id, name, email, phone, role, status, department, job_title, avatar_url,
      theme, language, notifications_enabled,
      TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date,
      TO_CHAR(last_login AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login,
      COALESCE(projects_count, 0) AS projects_count,
      TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at`;

    const result = await query(sql, values);
    const updated = mapRowToUser(result.rows[0]);

    res.json({ data: updated } as ApiResponse<User>);
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating user",
      },
    } as ApiResponse);
  }
};

export const updateUserStatus: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body as { status: "active" | "inactive" };
    const currentUser: AuthUser = (req as any).user;

    if (!["active", "inactive"].includes(String(status))) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Status must be 'active' or 'inactive'",
        },
      } as ApiResponse);
    }

    if (currentUser.id === id) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot deactivate your own account",
        },
      } as ApiResponse);
    }

    const result = await query(
      `UPDATE users SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING 
        id, name, email, phone, role, status, department, job_title, avatar_url,
        theme, language, notifications_enabled,
        TO_CHAR(join_date, 'YYYY-MM-DD') AS join_date,
        TO_CHAR(last_login AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_login,
        COALESCE((SELECT COUNT(*) FROM user_projects up WHERE up.user_id = users.id), 0) AS projects_count,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at`,
      [status, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      } as ApiResponse);
    }

    const user = mapRowToUser(result.rows[0]);
    res.json({ data: user } as ApiResponse<User>);
  } catch (error) {
    console.error("Update user status error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating user status",
      },
    } as ApiResponse);
  }
};

export const deleteUser: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    if (currentUser.id === id) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "You cannot delete your own account",
        },
      } as ApiResponse);
    }

    const result = await query("DELETE FROM users WHERE id = $1", [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      } as ApiResponse);
    }

    res.status(204).send();
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while deleting user",
      },
    } as ApiResponse);
  }
};

export const changePassword: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword }: ChangePasswordRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    const userResult = await query(
      "SELECT id, hashed_password FROM users WHERE id = $1",
      [id],
    );
    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: { code: "USER_NOT_FOUND", message: "User not found" },
      } as ApiResponse);
    }

    if (currentUser.id !== id && currentUser.role !== "super_admin") {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only change your own password",
        },
      } as ApiResponse);
    }

    if (!newPassword) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password is required",
        },
      } as ApiResponse);
    }
    if (newPassword.length < 8) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "New password must be at least 8 characters long",
        },
      } as ApiResponse);
    }

    // Verify current password if changing own password
    if (currentUser.id === id) {
      if (!currentPassword) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Current password is required",
          },
        } as ApiResponse);
      }

      const isValid = await bcrypt.compare(
        currentPassword,
        userResult.rows[0].hashed_password,
      );
      if (!isValid) {
        return res.status(400).json({
          error: {
            code: "VALIDATION_ERROR",
            message: "Current password is incorrect",
          },
        } as ApiResponse);
      }
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await query(
      "UPDATE users SET hashed_password = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2",
      [hashed, id],
    );

    res.json({
      data: { message: "Password changed successfully" },
    } as ApiResponse);
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while changing password",
      },
    } as ApiResponse);
  }
};

export const getUserProjects: RequestHandler = async (_req, res) => {
  try {
    // Implement project listing per user when schema is available
    res.json({ data: [] } as ApiResponse);
  } catch (error) {
    console.error("Get user projects error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching user projects",
      },
    } as ApiResponse);
  }
};
