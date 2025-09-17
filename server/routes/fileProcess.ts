import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../db/connection";
import fs from "fs";
import path from "path";
import readline from "readline";

// List file processes (simple list)
export const listFileProcesses: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT
         p.*,
         COALESCE(
           (
             SELECT COUNT(DISTINCT fr.user_id)
             FROM file_requests fr
             WHERE fr.file_process_id = p.id
               AND fr.status IN ('assigned','in_progress','pending_verification')
           ), 0
         ) AS active_users
       FROM file_processes p
       ORDER BY p.created_at DESC
       LIMIT $1`,
      [100],
    );
    res.json({ data: result.rows });
  } catch (error) {
    console.error("List file processes error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list file processes",
      },
    });
  }
};

export const getFileProcess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await query("SELECT * FROM file_processes WHERE id = $1", [
      id,
    ]);
    if (result.rows.length === 0)
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File process not found" },
      });
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Get file process error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to get file process",
      },
    });
  }
};

export const createFileProcess: RequestHandler = async (req, res) => {
  try {
    const {
      name,
      projectId,
      projectName,
      fileName,
      totalRows,
      type = "manual",
      dailyTarget,
      automationConfig,
    } = req.body;

    if (!name) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Name is required" },
      });
    }

    const id = `fp_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

    const insert = `INSERT INTO file_processes (id, name, project_id, project_name, file_name, total_rows, processed_rows, available_rows, status, created_by, active_users, type, daily_target, automation_config, created_at, updated_at) VALUES ($1,$2,$3,$4,$5,$6,0,$6,'active',NULL,0,$7,$8,$9,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`;

    const values = [
      id,
      name,
      projectId || null,
      projectName || null,
      fileName || null,
      totalRows || 0,
      type,
      dailyTarget || null,
      automationConfig ? JSON.stringify(automationConfig) : null,
    ];

    const result = await query(insert, values);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Create file process error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create file process",
      },
    });
  }
};

export const updateFileProcess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;
    for (const [k, v] of Object.entries(body)) {
      // Only allow certain fields
      if (
        [
          "name",
          "file_name",
          "total_rows",
          "processed_rows",
          "available_rows",
          "status",
          "daily_target",
          "automation_config",
          "project_id",
          "project_name",
        ].includes(k)
      ) {
        fields.push(`${k} = $${idx}`);
        values.push(v);
        idx++;
      }
    }
    if (fields.length === 0)
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid fields to update",
        },
      });
    values.push(id);
    const sql = `UPDATE file_processes SET ${fields.join(",")} , updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Update file process error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update file process",
      },
    });
  }
};

export const deleteFileProcess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    await query("DELETE FROM file_processes WHERE id = $1", [id]);
    res.status(204).send();
  } catch (error) {
    console.error("Delete file process error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete file process",
      },
    });
  }
};

// Requests
export const listFileRequests: RequestHandler = async (req, res) => {
  try {
    const { processId, file_process_id, status, userId, user_id, limit } =
      req.query as any;

    const where: string[] = [];
    const values: any[] = [];

    if (processId || file_process_id) {
      const requestedProcessId = processId || file_process_id;
      // Try to build a heuristic pattern based on process name for download_link matching
      let clause = "";
      try {
        const procRes = await query(
          "SELECT name FROM file_processes WHERE id = $1",
          [requestedProcessId],
        );
        const name = procRes.rows[0]?.name as string | undefined;
        if (name) {
          const slug = name
            .toLowerCase()
            .replace(/\s+/g, "_")
            .replace(/[^a-z0-9_\-]/g, "");
          values.push(requestedProcessId);
          values.push(`%_${slug}_%`);
          clause = `((file_process_id = $${values.length - 1}) OR (download_link ILIKE $${values.length}))`;
        }
      } catch {
        // ignore and fallback to strict filter
      }

      if (!clause) {
        values.push(requestedProcessId);
        clause = `file_process_id = $${values.length}`;
      }

      where.push(clause);
    }
    if (status) {
      values.push(status);
      where.push(`status = $${values.length}`);
    }
    if (userId || user_id) {
      values.push(userId || user_id);
      where.push(`user_id = $${values.length}`);
    }

    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const limitNum = Math.min(
      Math.max(parseInt(limit as string) || 200, 1),
      1000,
    );

    const sql = `SELECT * FROM file_requests ${whereClause} ORDER BY requested_date DESC LIMIT $${values.length + 1}`;
    const result = await query(sql, [...values, limitNum]);

    res.json({ data: result.rows });
  } catch (error) {
    console.error("List file requests error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to list file requests",
      },
    });
  }
};

export const createFileRequest: RequestHandler = async (req, res) => {
  try {
    const id = `fr_${uuidv4()}`;
    const { userId, userName, fileProcessId, requestedCount, notes } = req.body;

    const insert = `INSERT INTO file_requests (id,user_id,user_name,file_process_id,requested_count,requested_date,status,notes,created_at) VALUES ($1,$2,$3,$4,$5,CURRENT_TIMESTAMP,'pending',$6,CURRENT_TIMESTAMP) RETURNING *`;
    const values = [
      id,
      userId || null,
      userName || null,
      fileProcessId,
      requestedCount || 0,
      notes || null,
    ];
    const result = await query(insert, values);
    res.status(201).json({ data: result.rows[0] });
  } catch (error) {
    console.error("Create file request error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create file request",
      },
    });
  }
};

export const approveFileRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { assignedCount: rawAssignedCount, processId, assignedBy } = req.body;

    // Validate process
    const procRes = await query(
      "SELECT id, name, total_rows, processed_rows FROM file_processes WHERE id = $1",
      [processId],
    );
    if (procRes.rows.length === 0) {
      return res.status(400).json({
        error: { code: "INVALID_PROCESS", message: "File process not found" },
      });
    }
    const proc = procRes.rows[0];
    const processedRows = Number(proc.processed_rows || 0);
    const totalRows = Number(proc.total_rows || 0);
    const remaining = Math.max(0, totalRows - processedRows);

    let assignedCount = Math.max(0, Number(rawAssignedCount || 0));
    if (assignedCount > remaining) {
      assignedCount = remaining;
    }
    if (assignedCount <= 0) {
      return res.status(400).json({
        error: {
          code: "NO_CAPACITY",
          message: "No remaining rows available to assign",
        },
      });
    }

    const startRow = processedRows + 1;
    const endRow = processedRows + assignedCount;

    await transaction(async (client) => {
      // Update request with allocation
      await client.query(
        `UPDATE file_requests
         SET status = $1,
             assigned_count = $2,
             assigned_date = CURRENT_TIMESTAMP,
             assigned_by = $3,
             start_row = $4,
             end_row = $5,
             file_process_id = $6
         WHERE id = $7`,
        [
          "assigned",
          assignedCount,
          assignedBy || null,
          startRow,
          endRow,
          processId,
          id,
        ],
      );

      // Set API download link that will stream exact rows
      const apiDownloadLink = `/api/file-requests/${id}/download`;
      await client.query(
        `UPDATE file_requests SET download_link = $1 WHERE id = $2`,
        [apiDownloadLink, id],
      );

      // Update file process counters
      await client.query(
        `UPDATE file_processes
           SET processed_rows = processed_rows + $1,
               available_rows = GREATEST(total_rows - (processed_rows + $1), 0)
         WHERE id = $2`,
        [assignedCount, processId],
      );
    });

    const result = await query("SELECT * FROM file_requests WHERE id = $1", [
      id,
    ]);
    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Approve file request error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to approve file request",
      },
    });
  }
};

export const updateFileRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const allowedFields = new Set([
      "status",
      "notes",
      "download_link",
      "assigned_by",
      "assigned_count",
      "start_row",
      "end_row",
      // allow setting completed_date explicitly if provided
      "completed_date",
    ]);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    for (const [key, value] of Object.entries(req.body || {})) {
      if (allowedFields.has(key)) {
        fields.push(`${key} = $${idx}`);
        values.push(value);
        idx++;
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "No valid fields to update",
        },
      });
    }

    values.push(id);
    const sql = `UPDATE file_requests SET ${fields.join(", ")}, updated_at = CURRENT_TIMESTAMP WHERE id = $${idx} RETURNING *`;
    const result = await query(sql, values);

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File request not found" },
      });
    }

    res.json({ data: result.rows[0] });
  } catch (error) {
    console.error("Update file request error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to update file request",
      },
    });
  }
};
