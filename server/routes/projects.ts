import { RequestHandler } from "express";
import { query, paginatedQuery, transaction } from "../db/connection";
import {
  Project,
  CreateProjectRequest,
  UpdateProjectRequest,
  ProjectListQuery,
  ApiResponse,
  PaginatedResponse,
  AuthUser,
} from "@shared/types";

export const listProjects: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const queryParams: ProjectListQuery = req.query;

    const {
      search = "",
      status,
      assignedUser,
      page = 1,
      limit = 20,
    } = queryParams;

    let whereConditions = [];
    let queryValues = [];
    let paramCount = 0;

    // Build WHERE conditions
    if (search) {
      paramCount++;
      whereConditions.push(
        `(p.name ILIKE $${paramCount} OR p.description ILIKE $${paramCount} OR p.project_code ILIKE $${paramCount})`,
      );
      queryValues.push(`%${search}%`);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`p.status = $${paramCount}`);
      queryValues.push(status);
    }

    if (assignedUser) {
      paramCount++;
      whereConditions.push(
        `EXISTS (SELECT 1 FROM user_projects up WHERE up.project_id = p.id AND up.user_id = $${paramCount})`,
      );
      queryValues.push(assignedUser);
    }

    // Filter by user assignments if not admin/PM
    if (currentUser.role === "user") {
      paramCount++;
      whereConditions.push(
        `EXISTS (SELECT 1 FROM user_projects up WHERE up.project_id = p.id AND up.user_id = $${paramCount})`,
      );
      queryValues.push(currentUser.id);
    }

    const whereClause =
      whereConditions.length > 0
        ? `WHERE ${whereConditions.join(" AND ")}`
        : "";

    const baseQuery = `
      SELECT p.*, 
             u.name as created_by_name,
             COUNT(DISTINCT up.user_id) as assigned_users_count,
             CASE 
               WHEN p.target_count > 0 THEN (p.current_count::FLOAT / p.target_count * 100)
               ELSE 0 
             END as progress_percentage
      FROM projects p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN user_projects up ON p.id = up.project_id
      ${whereClause}
      GROUP BY p.id, u.name
      ORDER BY p.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(DISTINCT p.id) as count
      FROM projects p
      LEFT JOIN user_projects up ON p.id = up.project_id
      ${whereClause}
    `;

    const result = await paginatedQuery(
      baseQuery,
      countQuery,
      queryValues,
      page,
      limit,
    );

    const projects = result.data.map((project) => ({
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.start_date,
      endDate: project.end_date,
      targetCount: project.target_count,
      currentCount: project.current_count,
      progressPercentage: parseFloat(project.progress_percentage),
      assignedUsersCount: parseInt(project.assigned_users_count),
      createdBy: {
        id: project.created_by_user_id,
        name: project.created_by_name,
      },
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      projectCode: project.project_code ?? null,
      ratePerFileUSD: project.rate_per_file_usd ?? null,
    }));

    const response: PaginatedResponse<Project> = {
      data: projects,
      pagination: result.pagination,
    };

    res.json({
      data: response,
    } as ApiResponse<PaginatedResponse<Project>>);
  } catch (error) {
    console.error("List projects error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching projects",
      },
    } as ApiResponse);
  }
};

export const getProject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const projectQuery = `
      SELECT p.*, 
             u.name as created_by_name,
             COUNT(DISTINCT up.user_id) as assigned_users_count,
             CASE 
               WHEN p.target_count > 0 THEN (p.current_count::FLOAT / p.target_count * 100)
               ELSE 0 
             END as progress_percentage
      FROM projects p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN user_projects up ON p.id = up.project_id
      WHERE p.id = $1
      GROUP BY p.id, u.name
    `;

    const projectResult = await query(projectQuery, [id]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      } as ApiResponse);
    }

    const project = projectResult.rows[0];

    // Check if user has access to this project
    if (currentUser.role === "user") {
      const accessQuery = `
        SELECT 1 FROM user_projects 
        WHERE project_id = $1 AND user_id = $2
      `;
      const accessResult = await query(accessQuery, [id, currentUser.id]);

      if (accessResult.rows.length === 0) {
        return res.status(403).json({
          error: {
            code: "AUTHORIZATION_FAILED",
            message: "You don't have access to this project",
          },
        } as ApiResponse);
      }
    }

    // Get assigned users
    const usersQuery = `
      SELECT u.id, u.name, u.email, u.role, up.role_in_project, up.assigned_at
      FROM user_projects up
      JOIN users u ON up.user_id = u.id
      WHERE up.project_id = $1
      ORDER BY up.assigned_at DESC
    `;

    const usersResult = await query(usersQuery, [id]);

    const projectData = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.start_date,
      endDate: project.end_date,
      targetCount: project.target_count,
      currentCount: project.current_count,
      progressPercentage: parseFloat(project.progress_percentage),
      assignedUsersCount: parseInt(project.assigned_users_count),
      assignedUsers: usersResult.rows,
      createdBy: {
        id: project.created_by_user_id,
        name: project.created_by_name,
      },
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      projectCode: project.project_code ?? null,
      ratePerFileUSD: project.rate_per_file_usd ?? null,
    };

    res.json({
      data: projectData,
    } as ApiResponse);
  } catch (error) {
    console.error("Get project error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching project",
      },
    } as ApiResponse);
  }
};

export const createProject: RequestHandler = async (req, res) => {
  try {
    const projectRequest: CreateProjectRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    const {
      name,
      description,
      status = "planning",
      priority = "medium",
      startDate,
      endDate,
      targetCount = 0,
      assignedUsers = [],
    } = projectRequest;

    // Validate required fields
    if (!name) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Project name is required",
          details: [{ field: "name", message: "Name is required" }],
        },
      } as ApiResponse);
    }

    // Validate dates
    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Start date cannot be after end date",
        },
      } as ApiResponse);
    }

    const result = await transaction(async (client) => {
      // Create project
      const insertQuery = `
        INSERT INTO projects (name, description, project_code, status, priority, start_date, end_date, target_count, created_by_user_id, rate_per_file_usd)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING *
      `;

      const projectResult = await client.query(insertQuery, [
        name,
        description,
        (projectRequest as any).projectCode ?? null,
        status,
        priority,
        startDate,
        endDate,
        targetCount,
        currentUser.id,
        (projectRequest as any).ratePerFileUSD ?? null,
      ]);

      const project = projectResult.rows[0];

      // Assign users to project
      if (assignedUsers.length > 0) {
        const assignmentQuery = `
          INSERT INTO user_projects (user_id, project_id, assigned_by)
          VALUES ($1, $2, $3)
        `;

        for (const userId of assignedUsers) {
          await client.query(assignmentQuery, [
            userId,
            project.id,
            currentUser.id,
          ]);
        }
      }

      return project;
    });

    const responseProject = {
      id: result.id,
      name: result.name,
      description: result.description,
      status: result.status,
      priority: result.priority,
      startDate: result.start_date,
      endDate: result.end_date,
      targetCount: result.target_count,
      currentCount: result.current_count,
      progressPercentage: 0,
      assignedUsersCount: assignedUsers.length,
      createdBy: {
        id: currentUser.id,
        name: currentUser.name,
      },
      createdAt: result.created_at,
      updatedAt: result.updated_at,
      ratePerFileUSD: result.rate_per_file_usd ?? null,
    };

    res.status(201).json({
      data: responseProject,
    } as ApiResponse);
  } catch (error) {
    console.error("Create project error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while creating project",
      },
    } as ApiResponse);
  }
};

export const updateProject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const projectRequest: UpdateProjectRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Check if project exists
    const existingResult = await query("SELECT * FROM projects WHERE id = $1", [
      id,
    ]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      } as ApiResponse);
    }

    const existingProject = existingResult.rows[0];

    // Validate dates if provided
    const startDate = projectRequest.startDate || existingProject.start_date;
    const endDate = projectRequest.endDate || existingProject.end_date;

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Start date cannot be after end date",
        },
      } as ApiResponse);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.entries(projectRequest).forEach(([key, value]) => {
      if (value !== undefined && key !== "assignedUsers") {
        paramCount++;
        const dbField =
          key === "startDate"
            ? "start_date"
            : key === "endDate"
              ? "end_date"
              : key === "targetCount"
                ? "target_count"
                : key === "ratePerFileUSD"
                  ? "rate_per_file_usd"
                  : key === "projectCode"
                    ? "project_code"
                    : key;
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid fields to update",
        },
      } as ApiResponse);
    }

    // Add updated_at
    paramCount++;
    updateFields.push(`updated_at = $${paramCount}`);
    updateValues.push(new Date().toISOString());

    // Add WHERE clause
    paramCount++;
    updateValues.push(id);

    const updateQuery = `
      UPDATE projects 
      SET ${updateFields.join(", ")}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedProject = result.rows[0];

    // Handle user assignments if provided
    if (projectRequest.assignedUsers) {
      await transaction(async (client) => {
        // Remove existing assignments
        await client.query("DELETE FROM user_projects WHERE project_id = $1", [
          id,
        ]);

        // Add new assignments
        if (projectRequest.assignedUsers.length > 0) {
          const assignmentQuery = `
            INSERT INTO user_projects (user_id, project_id, assigned_by)
            VALUES ($1, $2, $3)
          `;

          for (const userId of projectRequest.assignedUsers) {
            await client.query(assignmentQuery, [userId, id, currentUser.id]);
          }
        }
      });
    }

    // Get updated project with counts
    const projectQuery = `
      SELECT p.*, 
             u.name as created_by_name,
             COUNT(DISTINCT up.user_id) as assigned_users_count,
             CASE 
               WHEN p.target_count > 0 THEN (p.current_count::FLOAT / p.target_count * 100)
               ELSE 0 
             END as progress_percentage
      FROM projects p
      LEFT JOIN users u ON p.created_by_user_id = u.id
      LEFT JOIN user_projects up ON p.id = up.project_id
      WHERE p.id = $1
      GROUP BY p.id, u.name
    `;

    const finalResult = await query(projectQuery, [id]);
    const project = finalResult.rows[0];

    const responseProject = {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      priority: project.priority,
      startDate: project.start_date,
      endDate: project.end_date,
      targetCount: project.target_count,
      currentCount: project.current_count,
      progressPercentage: parseFloat(project.progress_percentage),
      assignedUsersCount: parseInt(project.assigned_users_count),
      createdBy: {
        id: project.created_by_user_id,
        name: project.created_by_name,
      },
      createdAt: project.created_at,
      updatedAt: project.updated_at,
      projectCode: project.project_code ?? null,
      ratePerFileUSD: project.rate_per_file_usd ?? null,
    };

    res.json({
      data: responseProject,
    } as ApiResponse);
  } catch (error) {
    console.error("Update project error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating project",
      },
    } as ApiResponse);
  }
};

export const deleteProject: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if project exists
    const existingResult = await query(
      "SELECT id FROM projects WHERE id = $1",
      [id],
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      } as ApiResponse);
    }

    // Check if project has daily counts (prevent deletion)
    const countsResult = await query(
      "SELECT COUNT(*) as count FROM daily_counts WHERE project_id = $1",
      [id],
    );
    const countsCount = parseInt(countsResult.rows[0].count);

    if (countsCount > 0) {
      return res.status(400).json({
        error: {
          code: "PROJECT_HAS_DATA",
          message: `Cannot delete project with existing daily counts (${countsCount} records)`,
        },
      } as ApiResponse);
    }

    await transaction(async (client) => {
      // Delete user assignments first
      await client.query("DELETE FROM user_projects WHERE project_id = $1", [
        id,
      ]);

      // Delete project
      await client.query("DELETE FROM projects WHERE id = $1", [id]);
    });

    res.status(204).send();
  } catch (error) {
    console.error("Delete project error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while deleting project",
      },
    } as ApiResponse);
  }
};

export const assignUsers: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { userIds, roleInProject } = req.body;
    const currentUser: AuthUser = (req as any).user;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "User IDs array is required",
        },
      } as ApiResponse);
    }

    // Check if project exists
    const projectResult = await query("SELECT id FROM projects WHERE id = $1", [
      id,
    ]);

    if (projectResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      } as ApiResponse);
    }

    // Verify all users exist
    const usersQuery = `SELECT id FROM users WHERE id = ANY($1) AND status = 'active'`;
    const usersResult = await query(usersQuery, [userIds]);

    if (usersResult.rows.length !== userIds.length) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Some users not found or inactive",
        },
      } as ApiResponse);
    }

    // Assign users
    const assignmentQuery = `
      INSERT INTO user_projects (user_id, project_id, role_in_project, assigned_by)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, project_id) 
      DO UPDATE SET 
        role_in_project = EXCLUDED.role_in_project,
        assigned_at = CURRENT_TIMESTAMP,
        assigned_by = EXCLUDED.assigned_by
    `;

    for (const userId of userIds) {
      await query(assignmentQuery, [userId, id, roleInProject, currentUser.id]);
    }

    res.json({
      data: {
        message: `Successfully assigned ${userIds.length} users to project`,
      },
    } as ApiResponse);
  } catch (error) {
    console.error("Assign users error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while assigning users",
      },
    } as ApiResponse);
  }
};

export const removeUser: RequestHandler = async (req, res) => {
  try {
    const { id, userId } = req.params;

    // Check if assignment exists
    const assignmentResult = await query(
      "SELECT 1 FROM user_projects WHERE project_id = $1 AND user_id = $2",
      [id, userId],
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "ASSIGNMENT_NOT_FOUND",
          message: "User assignment not found",
        },
      } as ApiResponse);
    }

    // Remove assignment
    await query(
      "DELETE FROM user_projects WHERE project_id = $1 AND user_id = $2",
      [id, userId],
    );

    res.status(204).send();
  } catch (error) {
    console.error("Remove user error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while removing user",
      },
    } as ApiResponse);
  }
};

export const getProjectProgress: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    // Check project access
    if (currentUser.role === "user") {
      const accessQuery = `
        SELECT 1 FROM user_projects 
        WHERE project_id = $1 AND user_id = $2
      `;
      const accessResult = await query(accessQuery, [id, currentUser.id]);

      if (accessResult.rows.length === 0) {
        return res.status(403).json({
          error: {
            code: "AUTHORIZATION_FAILED",
            message: "You don't have access to this project",
          },
        } as ApiResponse);
      }
    }

    // Get project progress data
    const progressQuery = `
      SELECT 
        DATE(dc.date) as date,
        SUM(dc.target_count) as daily_target,
        SUM(CASE WHEN dc.status = 'approved' THEN dc.submitted_count ELSE 0 END) as daily_completed,
        COUNT(DISTINCT dc.user_id) as users_submitted,
        AVG(CASE WHEN dc.target_count > 0 THEN (dc.submitted_count::FLOAT / dc.target_count * 100) ELSE 0 END) as avg_efficiency
      FROM daily_counts dc
      WHERE dc.project_id = $1
      GROUP BY DATE(dc.date)
      ORDER BY date DESC
      LIMIT 30
    `;

    const progressResult = await query(progressQuery, [id]);

    // Get overall project stats
    const statsQuery = `
      SELECT 
        p.name,
        p.target_count,
        p.current_count,
        COUNT(DISTINCT up.user_id) as assigned_users,
        COUNT(DISTINCT dc.user_id) as active_users,
        SUM(CASE WHEN dc.status = 'pending' THEN 1 ELSE 0 END) as pending_submissions,
        AVG(CASE WHEN dc.target_count > 0 THEN (dc.submitted_count::FLOAT / dc.target_count * 100) ELSE 0 END) as overall_efficiency
      FROM projects p
      LEFT JOIN user_projects up ON p.id = up.project_id
      LEFT JOIN daily_counts dc ON p.id = dc.project_id
      WHERE p.id = $1
      GROUP BY p.id, p.name, p.target_count, p.current_count
    `;

    const statsResult = await query(statsQuery, [id]);

    if (statsResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "PROJECT_NOT_FOUND",
          message: "Project not found",
        },
      } as ApiResponse);
    }

    const stats = statsResult.rows[0];

    const progressData = {
      projectName: stats.name,
      targetCount: stats.target_count,
      currentCount: stats.current_count,
      progressPercentage:
        stats.target_count > 0
          ? (stats.current_count / stats.target_count) * 100
          : 0,
      assignedUsers: parseInt(stats.assigned_users),
      activeUsers: parseInt(stats.active_users),
      pendingSubmissions: parseInt(stats.pending_submissions),
      overallEfficiency: parseFloat(stats.overall_efficiency) || 0,
      dailyProgress: progressResult.rows.map((row) => ({
        date: row.date,
        target: parseInt(row.daily_target),
        completed: parseInt(row.daily_completed),
        usersSubmitted: parseInt(row.users_submitted),
        efficiency: parseFloat(row.avg_efficiency) || 0,
      })),
    };

    res.json({
      data: progressData,
    } as ApiResponse);
  } catch (error) {
    console.error("Get project progress error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching project progress",
      },
    } as ApiResponse);
  }
};
