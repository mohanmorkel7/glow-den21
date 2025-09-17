import { RequestHandler } from "express";
import { RequestHandler } from "express";
import { v4 as uuidv4 } from "uuid";
import { query, transaction } from "../db/connection";

// List file processes (simple list)
export const listFileProcesses: RequestHandler = async (req, res) => {
  try {
    const result = await query(
      `SELECT * FROM file_processes ORDER BY created_at DESC LIMIT $1`,
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
    const result = await query(
      "SELECT * FROM file_requests ORDER BY requested_date DESC LIMIT $1",
      [200],
    );
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
    const { assignedCount, processId, startRow, endRow, assignedBy } = req.body;

    // Update request record
    await transaction(async (client) => {
      await client.query(
        `UPDATE file_requests SET status = $1, assigned_count = $2, assigned_date = CURRENT_TIMESTAMP, assigned_by = $3, start_row = $4, end_row = $5 WHERE id = $6`,
        [
          "assigned",
          assignedCount,
          assignedBy || null,
          startRow || null,
          endRow || null,
          id,
        ],
      );

      // Update file_processes processed_rows and available_rows
      await client.query(
        `UPDATE file_processes SET processed_rows = processed_rows + $1, available_rows = GREATEST(total_rows - (processed_rows + $1), 0) WHERE id = $2`,
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
        error: { code: "VALIDATION_ERROR", message: "No valid fields to update" },
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
