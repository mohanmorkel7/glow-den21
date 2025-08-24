import { RequestHandler } from "express";
import { query, paginatedQuery, transaction } from "../db/connection.js";
import { 
  DailyCount, 
  CreateDailyCountRequest, 
  UpdateDailyCountRequest,
  DailyCountListQuery,
  DailyCountStatistics,
  ApiResponse,
  PaginatedResponse,
  AuthUser
} from "@shared/types";

export const listDailyCounts: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const queryParams: DailyCountListQuery = req.query;

    const {
      userId,
      projectId,
      from,
      to,
      status,
      page = 1,
      limit = 20
    } = queryParams;

    let whereConditions = [];
    let queryValues = [];
    let paramCount = 0;

    // Filter by user assignments for regular users
    if (currentUser.role === 'user') {
      paramCount++;
      whereConditions.push(`dc.user_id = $${paramCount}`);
      queryValues.push(currentUser.id);
    } else if (userId) {
      paramCount++;
      whereConditions.push(`dc.user_id = $${paramCount}`);
      queryValues.push(userId);
    }

    if (projectId) {
      paramCount++;
      whereConditions.push(`dc.project_id = $${paramCount}`);
      queryValues.push(projectId);
    }

    if (from) {
      paramCount++;
      whereConditions.push(`dc.date >= $${paramCount}`);
      queryValues.push(from);
    }

    if (to) {
      paramCount++;
      whereConditions.push(`dc.date <= $${paramCount}`);
      queryValues.push(to);
    }

    if (status) {
      paramCount++;
      whereConditions.push(`dc.status = $${paramCount}`);
      queryValues.push(status);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const baseQuery = `
      SELECT dc.*, 
             u.name as user_name,
             p.name as project_name,
             approver.name as approved_by_name
      FROM daily_counts dc
      JOIN users u ON dc.user_id = u.id
      JOIN projects p ON dc.project_id = p.id
      LEFT JOIN users approver ON dc.approved_by_user_id = approver.id
      ${whereClause}
      ORDER BY dc.date DESC, dc.created_at DESC
    `;

    const countQuery = `
      SELECT COUNT(*) as count
      FROM daily_counts dc
      JOIN users u ON dc.user_id = u.id
      JOIN projects p ON dc.project_id = p.id
      ${whereClause}
    `;

    const result = await paginatedQuery(baseQuery, countQuery, queryValues, page, limit);

    // Get statistics
    const statsQuery = `
      SELECT 
        COALESCE(SUM(dc.target_count), 0) as total_target_files,
        COALESCE(SUM(dc.submitted_count), 0) as total_submitted_files,
        COALESCE(SUM(CASE WHEN dc.status = 'approved' THEN dc.submitted_count ELSE 0 END), 0) as total_completed_files,
        COALESCE(SUM(dc.target_count) - SUM(dc.submitted_count), 0) as total_balance_files,
        COUNT(CASE WHEN dc.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN dc.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN dc.status = 'rejected' THEN 1 END) as rejected_count
      FROM daily_counts dc
      JOIN users u ON dc.user_id = u.id
      JOIN projects p ON dc.project_id = p.id
      ${whereClause}
    `;

    const statsResult = await query(statsQuery, queryValues);
    const stats = statsResult.rows[0];

    const statistics: DailyCountStatistics = {
      totalTargetFiles: parseInt(stats.total_target_files),
      totalSubmittedFiles: parseInt(stats.total_submitted_files),
      totalCompletedFiles: parseInt(stats.total_completed_files),
      totalBalanceFiles: parseInt(stats.total_balance_files),
      pendingCount: parseInt(stats.pending_count),
      approvedCount: parseInt(stats.approved_count),
      rejectedCount: parseInt(stats.rejected_count),
      // Legacy compatibility
      totalTarget: parseInt(stats.total_target_files),
      totalSubmitted: parseInt(stats.total_submitted_files)
    };

    const dailyCounts = result.data.map(dc => ({
      id: dc.id,
      userId: dc.user_id,
      userName: dc.user_name,
      projectId: dc.project_id,
      projectName: dc.project_name,
      date: dc.date,
      targetCount: dc.target_count,
      submittedCount: dc.submitted_count,
      status: dc.status,
      notes: dc.notes,
      submittedAt: dc.submitted_at,
      approvedBy: dc.approved_by_user_id ? {
        id: dc.approved_by_user_id,
        name: dc.approved_by_name
      } : undefined,
      approvedAt: dc.approved_at,
      rejectionReason: dc.rejection_reason,
      createdAt: dc.created_at,
      updatedAt: dc.updated_at
    }));

    const response = {
      data: {
        dailyCounts,
        statistics,
        pagination: result.pagination
      }
    };

    res.json(response as ApiResponse);

  } catch (error) {
    console.error("List daily counts error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching daily counts"
      }
    } as ApiResponse);
  }
};

export const getDailyCount: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: AuthUser = (req as any).user;

    const countQuery = `
      SELECT dc.*, 
             u.name as user_name,
             p.name as project_name,
             approver.name as approved_by_name
      FROM daily_counts dc
      JOIN users u ON dc.user_id = u.id
      JOIN projects p ON dc.project_id = p.id
      LEFT JOIN users approver ON dc.approved_by_user_id = approver.id
      WHERE dc.id = $1
    `;

    const countResult = await query(countQuery, [id]);

    if (countResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "DAILY_COUNT_NOT_FOUND",
          message: "Daily count not found"
        }
      } as ApiResponse);
    }

    const dc = countResult.rows[0];

    // Check access permissions
    if (currentUser.role === 'user' && dc.user_id !== currentUser.id) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only view your own daily counts"
        }
      } as ApiResponse);
    }

    const dailyCount = {
      id: dc.id,
      userId: dc.user_id,
      userName: dc.user_name,
      projectId: dc.project_id,
      projectName: dc.project_name,
      date: dc.date,
      targetCount: dc.target_count,
      submittedCount: dc.submitted_count,
      status: dc.status,
      notes: dc.notes,
      submittedAt: dc.submitted_at,
      approvedBy: dc.approved_by_user_id ? {
        id: dc.approved_by_user_id,
        name: dc.approved_by_name
      } : undefined,
      approvedAt: dc.approved_at,
      rejectionReason: dc.rejection_reason,
      createdAt: dc.created_at,
      updatedAt: dc.updated_at
    };

    res.json({
      data: dailyCount
    } as ApiResponse);

  } catch (error) {
    console.error("Get daily count error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching daily count"
      }
    } as ApiResponse);
  }
};

export const createDailyCount: RequestHandler = async (req, res) => {
  try {
    const countRequest: CreateDailyCountRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    const { projectId, date, submittedCount, notes } = countRequest;

    // Validate required fields
    if (!projectId || !date || submittedCount === undefined) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Project ID, date, and submitted count are required",
          details: [
            !projectId && { field: "projectId", message: "Project ID is required" },
            !date && { field: "date", message: "Date is required" },
            submittedCount === undefined && { field: "submittedCount", message: "Submitted count is required" }
          ].filter(Boolean)
        }
      } as ApiResponse);
    }

    // Validate submitted count
    if (submittedCount < 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Submitted count cannot be negative"
        }
      } as ApiResponse);
    }

    // Check if user is assigned to project
    const assignmentQuery = `
      SELECT 1 FROM user_projects 
      WHERE user_id = $1 AND project_id = $2
    `;
    const assignmentResult = await query(assignmentQuery, [currentUser.id, projectId]);

    if (assignmentResult.rows.length === 0) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You are not assigned to this project"
        }
      } as ApiResponse);
    }

    // Check if submission already exists for this user, project, and date
    const existingQuery = `
      SELECT id FROM daily_counts 
      WHERE user_id = $1 AND project_id = $2 AND date = $3
    `;
    const existingResult = await query(existingQuery, [currentUser.id, projectId, date]);

    if (existingResult.rows.length > 0) {
      return res.status(409).json({
        error: {
          code: "DAILY_COUNT_EXISTS",
          message: "Daily count already exists for this date and project"
        }
      } as ApiResponse);
    }

    // Get project target count for this user (could be dynamic in the future)
    const targetCount = submittedCount; // For now, use submitted as target

    // Create daily count
    const insertQuery = `
      INSERT INTO daily_counts (user_id, project_id, date, target_count, submitted_count, status, notes, submitted_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, CURRENT_TIMESTAMP)
      RETURNING *
    `;

    const result = await query(insertQuery, [
      currentUser.id, projectId, date, targetCount, submittedCount, 'submitted', notes
    ]);

    const dailyCount = result.rows[0];

    // Get user and project names
    const detailsQuery = `
      SELECT u.name as user_name, p.name as project_name
      FROM users u, projects p
      WHERE u.id = $1 AND p.id = $2
    `;
    const detailsResult = await query(detailsQuery, [currentUser.id, projectId]);
    const details = detailsResult.rows[0];

    const responseData = {
      id: dailyCount.id,
      userId: dailyCount.user_id,
      userName: details.user_name,
      projectId: dailyCount.project_id,
      projectName: details.project_name,
      date: dailyCount.date,
      targetCount: dailyCount.target_count,
      submittedCount: dailyCount.submitted_count,
      status: dailyCount.status,
      notes: dailyCount.notes,
      submittedAt: dailyCount.submitted_at,
      createdAt: dailyCount.created_at,
      updatedAt: dailyCount.updated_at
    };

    res.status(201).json({
      data: responseData
    } as ApiResponse);

  } catch (error) {
    console.error("Create daily count error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while creating daily count"
      }
    } as ApiResponse);
  }
};

export const updateDailyCount: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const countRequest: UpdateDailyCountRequest = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Check if daily count exists
    const existingQuery = `
      SELECT * FROM daily_counts 
      WHERE id = $1
    `;
    const existingResult = await query(existingQuery, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "DAILY_COUNT_NOT_FOUND",
          message: "Daily count not found"
        }
      } as ApiResponse);
    }

    const existingCount = existingResult.rows[0];

    // Check permissions
    if (currentUser.role === 'user' && existingCount.user_id !== currentUser.id) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "You can only update your own daily counts"
        }
      } as ApiResponse);
    }

    // Check if count is already approved (cannot be updated)
    if (existingCount.status === 'approved') {
      return res.status(400).json({
        error: {
          code: "DAILY_COUNT_APPROVED",
          message: "Cannot update an approved daily count"
        }
      } as ApiResponse);
    }

    // Validate submitted count if provided
    if (countRequest.submittedCount !== undefined && countRequest.submittedCount < 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Submitted count cannot be negative"
        }
      } as ApiResponse);
    }

    // Build update query dynamically
    const updateFields = [];
    const updateValues = [];
    let paramCount = 0;

    Object.entries(countRequest).forEach(([key, value]) => {
      if (value !== undefined) {
        paramCount++;
        const dbField = key === 'submittedCount' ? 'submitted_count' : 
                       key === 'targetCount' ? 'target_count' : key;
        updateFields.push(`${dbField} = $${paramCount}`);
        updateValues.push(value);
      }
    });

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid fields to update"
        }
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
      UPDATE daily_counts 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramCount}
      RETURNING *
    `;

    const result = await query(updateQuery, updateValues);
    const updatedCount = result.rows[0];

    // Get user and project names
    const detailsQuery = `
      SELECT u.name as user_name, p.name as project_name
      FROM users u, projects p
      WHERE u.id = $1 AND p.id = $2
    `;
    const detailsResult = await query(detailsQuery, [updatedCount.user_id, updatedCount.project_id]);
    const details = detailsResult.rows[0];

    const responseData = {
      id: updatedCount.id,
      userId: updatedCount.user_id,
      userName: details.user_name,
      projectId: updatedCount.project_id,
      projectName: details.project_name,
      date: updatedCount.date,
      targetCount: updatedCount.target_count,
      submittedCount: updatedCount.submitted_count,
      status: updatedCount.status,
      notes: updatedCount.notes,
      submittedAt: updatedCount.submitted_at,
      createdAt: updatedCount.created_at,
      updatedAt: updatedCount.updated_at
    };

    res.json({
      data: responseData
    } as ApiResponse);

  } catch (error) {
    console.error("Update daily count error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while updating daily count"
      }
    } as ApiResponse);
  }
};

export const approveDailyCount: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { notes } = req.body;
    const currentUser: AuthUser = (req as any).user;

    // Check if daily count exists
    const existingQuery = `
      SELECT dc.*, p.name as project_name, u.name as user_name
      FROM daily_counts dc
      JOIN projects p ON dc.project_id = p.id
      JOIN users u ON dc.user_id = u.id
      WHERE dc.id = $1
    `;
    const existingResult = await query(existingQuery, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "DAILY_COUNT_NOT_FOUND",
          message: "Daily count not found"
        }
      } as ApiResponse);
    }

    const existingCount = existingResult.rows[0];

    // Check if already processed
    if (existingCount.status !== 'submitted' && existingCount.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: "DAILY_COUNT_ALREADY_PROCESSED",
          message: `Daily count is already ${existingCount.status}`
        }
      } as ApiResponse);
    }

    // Approve the daily count
    const updateQuery = `
      UPDATE daily_counts 
      SET status = 'approved', 
          approved_by_user_id = $1, 
          approved_at = CURRENT_TIMESTAMP,
          notes = COALESCE($2, notes),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [currentUser.id, notes, id]);
    const approvedCount = result.rows[0];

    const responseData = {
      id: approvedCount.id,
      userId: approvedCount.user_id,
      userName: existingCount.user_name,
      projectId: approvedCount.project_id,
      projectName: existingCount.project_name,
      date: approvedCount.date,
      targetCount: approvedCount.target_count,
      submittedCount: approvedCount.submitted_count,
      status: approvedCount.status,
      notes: approvedCount.notes,
      submittedAt: approvedCount.submitted_at,
      approvedBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      approvedAt: approvedCount.approved_at,
      createdAt: approvedCount.created_at,
      updatedAt: approvedCount.updated_at
    };

    res.json({
      data: responseData,
      message: "Daily count approved successfully"
    } as ApiResponse);

  } catch (error) {
    console.error("Approve daily count error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while approving daily count"
      }
    } as ApiResponse);
  }
};

export const rejectDailyCount: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const currentUser: AuthUser = (req as any).user;

    if (!reason) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Rejection reason is required"
        }
      } as ApiResponse);
    }

    // Check if daily count exists
    const existingQuery = `
      SELECT dc.*, p.name as project_name, u.name as user_name
      FROM daily_counts dc
      JOIN projects p ON dc.project_id = p.id
      JOIN users u ON dc.user_id = u.id
      WHERE dc.id = $1
    `;
    const existingResult = await query(existingQuery, [id]);

    if (existingResult.rows.length === 0) {
      return res.status(404).json({
        error: {
          code: "DAILY_COUNT_NOT_FOUND",
          message: "Daily count not found"
        }
      } as ApiResponse);
    }

    const existingCount = existingResult.rows[0];

    // Check if already processed
    if (existingCount.status !== 'submitted' && existingCount.status !== 'pending') {
      return res.status(400).json({
        error: {
          code: "DAILY_COUNT_ALREADY_PROCESSED",
          message: `Daily count is already ${existingCount.status}`
        }
      } as ApiResponse);
    }

    // Reject the daily count
    const updateQuery = `
      UPDATE daily_counts 
      SET status = 'rejected', 
          approved_by_user_id = $1, 
          approved_at = CURRENT_TIMESTAMP,
          rejection_reason = $2,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = $3
      RETURNING *
    `;

    const result = await query(updateQuery, [currentUser.id, reason, id]);
    const rejectedCount = result.rows[0];

    const responseData = {
      id: rejectedCount.id,
      userId: rejectedCount.user_id,
      userName: existingCount.user_name,
      projectId: rejectedCount.project_id,
      projectName: existingCount.project_name,
      date: rejectedCount.date,
      targetCount: rejectedCount.target_count,
      submittedCount: rejectedCount.submitted_count,
      status: rejectedCount.status,
      notes: rejectedCount.notes,
      submittedAt: rejectedCount.submitted_at,
      approvedBy: {
        id: currentUser.id,
        name: currentUser.name
      },
      approvedAt: rejectedCount.approved_at,
      rejectionReason: rejectedCount.rejection_reason,
      createdAt: rejectedCount.created_at,
      updatedAt: rejectedCount.updated_at
    };

    res.json({
      data: responseData,
      message: "Daily count rejected successfully"
    } as ApiResponse);

  } catch (error) {
    console.error("Reject daily count error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while rejecting daily count"
      }
    } as ApiResponse);
  }
};

export const getDailyCountStatistics: RequestHandler = async (req, res) => {
  try {
    const currentUser: AuthUser = (req as any).user;
    const { userId, projectId, from, to } = req.query;

    let whereConditions = [];
    let queryValues = [];
    let paramCount = 0;

    // Filter by user assignments for regular users
    if (currentUser.role === 'user') {
      paramCount++;
      whereConditions.push(`dc.user_id = $${paramCount}`);
      queryValues.push(currentUser.id);
    } else if (userId) {
      paramCount++;
      whereConditions.push(`dc.user_id = $${paramCount}`);
      queryValues.push(userId);
    }

    if (projectId) {
      paramCount++;
      whereConditions.push(`dc.project_id = $${paramCount}`);
      queryValues.push(projectId);
    }

    if (from) {
      paramCount++;
      whereConditions.push(`dc.date >= $${paramCount}`);
      queryValues.push(from);
    }

    if (to) {
      paramCount++;
      whereConditions.push(`dc.date <= $${paramCount}`);
      queryValues.push(to);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const statsQuery = `
      SELECT 
        COALESCE(SUM(dc.target_count), 0) as total_target_files,
        COALESCE(SUM(dc.submitted_count), 0) as total_submitted_files,
        COALESCE(SUM(CASE WHEN dc.status = 'approved' THEN dc.submitted_count ELSE 0 END), 0) as total_completed_files,
        COALESCE(SUM(dc.target_count) - SUM(dc.submitted_count), 0) as total_balance_files,
        COUNT(CASE WHEN dc.status = 'pending' THEN 1 END) as pending_count,
        COUNT(CASE WHEN dc.status = 'submitted' THEN 1 END) as submitted_count,
        COUNT(CASE WHEN dc.status = 'approved' THEN 1 END) as approved_count,
        COUNT(CASE WHEN dc.status = 'rejected' THEN 1 END) as rejected_count,
        COUNT(DISTINCT dc.user_id) as unique_users,
        COUNT(DISTINCT dc.project_id) as unique_projects,
        AVG(CASE WHEN dc.target_count > 0 THEN (dc.submitted_count::FLOAT / dc.target_count * 100) ELSE 0 END) as avg_efficiency
      FROM daily_counts dc
      ${whereClause}
    `;

    const result = await query(statsQuery, queryValues);
    const stats = result.rows[0];

    const statistics: DailyCountStatistics = {
      totalTargetFiles: parseInt(stats.total_target_files),
      totalSubmittedFiles: parseInt(stats.total_submitted_files),
      totalCompletedFiles: parseInt(stats.total_completed_files),
      totalBalanceFiles: parseInt(stats.total_balance_files),
      pendingCount: parseInt(stats.pending_count) + parseInt(stats.submitted_count),
      approvedCount: parseInt(stats.approved_count),
      rejectedCount: parseInt(stats.rejected_count),
      // Legacy compatibility
      totalTarget: parseInt(stats.total_target_files),
      totalSubmitted: parseInt(stats.total_submitted_files),
      // Additional statistics
      uniqueUsers: parseInt(stats.unique_users),
      uniqueProjects: parseInt(stats.unique_projects),
      averageEfficiency: parseFloat(stats.avg_efficiency) || 0
    };

    res.json({
      data: statistics
    } as ApiResponse<DailyCountStatistics>);

  } catch (error) {
    console.error("Get daily count statistics error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "An error occurred while fetching statistics"
      }
    } as ApiResponse);
  }
};
