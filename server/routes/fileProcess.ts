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

export const syncCompletedRequests: RequestHandler = async (req, res) => {
  try {
    const currentUser: any = (req as any).user;
    const { userId } = req.body || {};

    const targetUserId =
      userId &&
      (currentUser?.role === "super_admin" ||
        currentUser?.role === "project_manager")
        ? userId
        : currentUser?.id;

    if (!targetUserId) {
      return res
        .status(400)
        .json({
          error: { code: "INVALID_REQUEST", message: "Missing userId" },
        });
    }

    const sql = `
      SELECT COALESCE(fr.project_id, NULL) as project_id, DATE(fr.completed_date) as date, SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)) as submitted_count
      FROM file_requests fr
      WHERE fr.user_id = $1 AND fr.status = 'completed' AND fr.completed_date IS NOT NULL
      GROUP BY COALESCE(fr.project_id, NULL), DATE(fr.completed_date)
    `;

    const result = await query(sql, [targetUserId]);

    for (const row of result.rows) {
      const projectId = row.project_id || null;
      const dateStr = row.date;
      const submitted = Number(row.submitted_count || 0);

      const existingQuery = projectId
        ? `SELECT id FROM daily_counts WHERE user_id = $1 AND project_id = $2 AND date = $3`
        : `SELECT id FROM daily_counts WHERE user_id = $1 AND project_id IS NULL AND date = $2`;

      const existingParams = projectId
        ? [targetUserId, projectId, dateStr]
        : [targetUserId, dateStr];
      const existing = await query(existingQuery, existingParams);

      if (existing.rows.length) {
        const id = existing.rows[0].id;
        await query(
          `UPDATE daily_counts SET submitted_count = $1, status = 'approved', approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
          [submitted, id],
        );
      } else {
        await query(
          `INSERT INTO daily_counts (user_id, project_id, date, target_count, submitted_count, status, notes, submitted_at, approved_at)
           VALUES ($1, $2, $3, 0, $4, 'approved', $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          [
            targetUserId,
            projectId,
            dateStr,
            submitted,
            "Synced from file_requests",
          ],
        );
      }
    }

    res.json({ data: { synced: result.rows.length } });
  } catch (error) {
    console.error("Sync completed requests error:", error);
    res
      .status(500)
      .json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to sync completed requests",
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

// Storage helpers
const STORAGE_ROOT = path.join(process.cwd(), "storage", "file-processes");
const ensureDir = (dir: string) => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
};

// Upload the source file for a file process. Accepts raw bytes (application/octet-stream)
export const uploadFileForProcess: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    // Validate process exists
    const procRes = await query("SELECT * FROM file_processes WHERE id = $1", [
      id,
    ]);
    if (procRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File process not found" },
      });
    }

    const originalName = (req.headers["x-file-name"] as string) || "upload.csv";
    const safeName = originalName.replace(/[^a-zA-Z0-9_.\-]/g, "_");

    ensureDir(STORAGE_ROOT);
    const procDir = path.join(STORAGE_ROOT, id);
    ensureDir(procDir);

    const destPath = path.join(procDir, safeName);

    // Pipe request stream to file
    const writeStream = fs.createWriteStream(destPath);
    req.pipe(writeStream);

    writeStream.on("finish", async () => {
      await query(
        `UPDATE file_processes SET file_name = $1, upload_date = CURRENT_TIMESTAMP, status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
        [safeName, id],
      );
      res.json({
        data: {
          path: destPath.replace(process.cwd() + path.sep, ""),
          fileName: safeName,
        },
      });
    });

    writeStream.on("error", (err) => {
      console.error("Upload write error:", err);
      res.status(500).json({
        error: { code: "WRITE_ERROR", message: "Failed to save uploaded file" },
      });
    });
  } catch (error) {
    console.error("Upload file error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload file",
      },
    });
  }
};

// Download assigned slice for a file request as CSV, and set status to in_progress on first access
export const downloadAssignedSlice: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: any = (req as any).user;

    // Load request and process
    const reqRes = await query(
      `SELECT fr.*, fp.file_name, fp.header_rows FROM file_requests fr LEFT JOIN file_processes fp ON fr.file_process_id = fp.id WHERE fr.id = $1`,
      [id],
    );
    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File request not found" },
      });
    }

    const r = reqRes.rows[0];

    // Authorization: only assigned user, PM, or admin
    const isOwner =
      currentUser?.id && String(currentUser.id) === String(r.user_id);
    const isManager = ["super_admin", "project_manager"].includes(
      currentUser?.role,
    );
    if (!isOwner && !isManager) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "Not allowed to download this file",
        },
      });
    }

    if (!r.file_process_id || !r.file_name) {
      return res.status(400).json({
        error: {
          code: "NO_SOURCE",
          message: "No source file associated with this process",
        },
      });
    }

    const ext = String(r.file_name).toLowerCase();
    if (!ext.endsWith(".csv")) {
      return res.status(415).json({
        error: {
          code: "UNSUPPORTED_FORMAT",
          message:
            "Only CSV source files are supported for slicing at this time",
        },
      });
    }

    const procDir = path.join(STORAGE_ROOT, r.file_process_id);
    const srcPath = path.join(procDir, r.file_name);
    if (!fs.existsSync(srcPath)) {
      return res.status(404).json({
        error: {
          code: "SOURCE_NOT_FOUND",
          message: "Source file not found on server",
        },
      });
    }

    const startRow = Number(r.start_row || 0);
    const endRow = Number(r.end_row || 0);
    const headerRows = Number(r.header_rows || 0);

    // Prepare output filename
    const safe = (s: string) =>
      String(s || "")
        .toLowerCase()
        .replace(/\s+/g, "_")
        .replace(/[^a-z0-9_\-]/g, "");
    const outName = `${safe(r.user_name || "user")}_${safe(r.file_process_id)}_${startRow}_${endRow}.csv`;

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${outName}"`);

    // Stream read the source and write selected rows
    const srcStream = fs.createReadStream(srcPath, { encoding: "utf8" });
    const rl = readline.createInterface({
      input: srcStream,
      crlfDelay: Infinity,
    });

    let lineIndex = 0;
    let writtenHeader = false;

    const writeLine = (line: string) => {
      res.write(
        line.endsWith("\n") || line.endsWith("\r") ? line : line + "\n",
      );
    };

    rl.on("line", (line) => {
      lineIndex++;
      // Capture header from first line(s)
      if (headerRows > 0 && lineIndex <= headerRows) {
        if (!writtenHeader) {
          writeLine(line);
          writtenHeader = true;
        }
        return;
      }
      const dataRowIndex = lineIndex - headerRows; // 1-based
      if (dataRowIndex >= startRow && dataRowIndex <= endRow) {
        if (!writtenHeader && headerRows === 0 && dataRowIndex === startRow) {
          // No explicit header known; do not fabricate a header
        }
        writeLine(line);
      }
    });

    rl.on("close", async () => {
      // On first download, set status to in_progress if assigned
      if (r.status === "assigned") {
        try {
          await query(
            `UPDATE file_requests SET status = 'in_progress', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
            [id],
          );
        } catch (e) {
          console.warn("Failed to set in_progress on download:", e);
        }
      }
      res.end();
    });

    rl.on("error", (err) => {
      console.error("Readline error:", err);
      if (!res.headersSent) res.status(500);
      res.end();
    });
  } catch (error) {
    console.error("Download slice error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate download",
      },
    });
  }
};

// Storage for uploaded completed work (per request)
const REQUEST_UPLOAD_ROOT = path.join(
  process.cwd(),
  "storage",
  "file-requests",
);

// User uploads completed ZIP for a request -> set status to in_review
export const uploadCompletedForRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: any = (req as any).user;

    // Load request to verify ownership and fetch related info
    const reqRes = await query(
      `SELECT fr.*, fp.project_id FROM file_requests fr LEFT JOIN file_processes fp ON fr.file_process_id = fp.id WHERE fr.id = $1`,
      [id],
    );
    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File request not found" },
      });
    }
    const r = reqRes.rows[0];

    const isOwner =
      currentUser?.id && String(currentUser.id) === String(r.user_id);
    const isManager = ["super_admin", "project_manager"].includes(
      currentUser?.role,
    );
    if (!isOwner && !isManager) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "Not allowed to upload for this request",
        },
      });
    }

    const originalName =
      (req.headers["x-file-name"] as string) || "completed.zip";
    const safeName = originalName.replace(/[^a-zA-Z0-9_.\-]/g, "_");
    const lower = safeName.toLowerCase();
    if (!lower.endsWith(".zip")) {
      return res.status(415).json({
        error: {
          code: "UNSUPPORTED_FORMAT",
          message: "Only ZIP uploads are allowed",
        },
      });
    }

    // Write to disk
    if (!fs.existsSync(REQUEST_UPLOAD_ROOT))
      fs.mkdirSync(REQUEST_UPLOAD_ROOT, { recursive: true });
    const reqDir = path.join(REQUEST_UPLOAD_ROOT, id);
    if (!fs.existsSync(reqDir)) fs.mkdirSync(reqDir, { recursive: true });
    const destPath = path.join(reqDir, safeName);

    const writeStream = fs.createWriteStream(destPath);
    req.pipe(writeStream);

    writeStream.on("finish", async () => {
      // Persist request status -> in_review and set metadata
      await query(
        `UPDATE file_requests
         SET uploaded_file_name = $1,
             uploaded_file_path = $2,
             status = 'in_review',
             verification_status = 'pending',
             completed_date = COALESCE(completed_date, CURRENT_TIMESTAMP),
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [safeName, destPath.replace(process.cwd() + path.sep, ""), id],
      );
      res.json({ data: { fileName: safeName } });
    });

    writeStream.on("error", (err) => {
      console.error("Completed upload write error:", err);
      res.status(500).json({
        error: { code: "WRITE_ERROR", message: "Failed to save uploaded file" },
      });
    });
  } catch (error) {
    console.error("Upload completed file error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to upload completed file",
      },
    });
  }
};

// Download the uploaded completed ZIP (PM/Admin or owner)
export const downloadCompletedForRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const currentUser: any = (req as any).user;

    const result = await query(
      `SELECT uploaded_file_name, uploaded_file_path, user_id FROM file_requests WHERE id = $1`,
      [id],
    );
    if (result.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File request not found" },
      });
    }
    const r = result.rows[0];
    const isOwner =
      currentUser?.id && String(currentUser.id) === String(r.user_id);
    const isManager = ["super_admin", "project_manager"].includes(
      currentUser?.role,
    );
    if (!isOwner && !isManager) {
      return res.status(403).json({
        error: { code: "AUTHORIZATION_FAILED", message: "Not allowed" },
      });
    }

    if (!r.uploaded_file_path || !fs.existsSync(r.uploaded_file_path)) {
      return res.status(404).json({
        error: { code: "FILE_NOT_FOUND", message: "No uploaded file found" },
      });
    }

    const fileName = r.uploaded_file_name || `completed_${id}.zip`;
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
    fs.createReadStream(r.uploaded_file_path).pipe(res);
  } catch (error) {
    console.error("Download completed file error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to download file",
      },
    });
  }
};

// Approve or reject uploaded work; updates status and daily performance counts
export const verifyCompletedRequest: RequestHandler = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, notes } = req.body as {
      action: "approve" | "reject";
      notes?: string;
    };
    const currentUser: any = (req as any).user;

    if (!action || !["approve", "reject"].includes(action)) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "action must be 'approve' or 'reject'",
        },
      });
    }

    // Only PM/Admin can verify
    const isManager = ["super_admin", "project_manager"].includes(
      currentUser?.role,
    );
    if (!isManager) {
      return res.status(403).json({
        error: {
          code: "AUTHORIZATION_FAILED",
          message: "Only managers can verify",
        },
      });
    }

    // Load request with process for project id
    const reqRes = await query(
      `SELECT fr.*, fp.project_id FROM file_requests fr LEFT JOIN file_processes fp ON fr.file_process_id = fp.id WHERE fr.id = $1`,
      [id],
    );
    if (reqRes.rows.length === 0) {
      return res.status(404).json({
        error: { code: "NOT_FOUND", message: "File request not found" },
      });
    }
    const r = reqRes.rows[0];

    const now = new Date().toISOString();

    if (action === "approve") {
      await transaction(async (client) => {
        // Update request status to completed and mark verification
        await client.query(
          `UPDATE file_requests
             SET status = 'completed',
                 verification_status = 'approved',
                 verified_by = $1,
                 verified_at = CURRENT_TIMESTAMP,
                 notes = COALESCE($2, notes),
                 updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [currentUser?.name || currentUser?.id || null, notes || null, id],
        );

        // Upsert daily count for user/project for today
        const dateStr = now.substring(0, 10);
        const existing = await client.query(
          `SELECT id, submitted_count, status FROM daily_counts WHERE user_id = $1 AND project_id = $2 AND date = $3`,
          [r.user_id, r.project_id, dateStr],
        );
        if (existing.rows.length) {
          const dc = existing.rows[0];
          await client.query(
            `UPDATE daily_counts SET submitted_count = $1, status = 'approved', approved_by_user_id = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3`,
            [
              Number(dc.submitted_count || 0) + Number(r.assigned_count || 0),
              currentUser?.id || null,
              dc.id,
            ],
          );
        } else {
          await client.query(
            `INSERT INTO daily_counts (user_id, project_id, date, target_count, submitted_count, status, notes, submitted_at, approved_by_user_id, approved_at)
             VALUES ($1,$2,$3,0,$4,'approved',$5,CURRENT_TIMESTAMP,$6,CURRENT_TIMESTAMP)`,
            [
              r.user_id,
              r.project_id,
              dateStr,
              Number(r.assigned_count || 0),
              notes || null,
              currentUser?.id || null,
            ],
          );
        }
      });
    } else {
      // reject -> set to rework and increment rework_count; also record a rejected daily count entry
      await transaction(async (client) => {
        await client.query(
          `UPDATE file_requests
             SET status = 'rework',
                 verification_status = 'rejected',
                 verified_by = $1,
                 verified_at = CURRENT_TIMESTAMP,
                 notes = COALESCE($2, notes),
                 rework_count = COALESCE(rework_count, 0) + 1,
                 updated_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [currentUser?.name || currentUser?.id || null, notes || null, id],
        );

        const dateStr = now.substring(0, 10);
        if (r.project_id) {
          await client.query(
            `INSERT INTO daily_counts (user_id, project_id, date, target_count, submitted_count, status, notes, submitted_at, approved_by_user_id)
             VALUES ($1,$2,$3,0,$4,'rejected',$5,CURRENT_TIMESTAMP,$6)`,
            [
              r.user_id,
              r.project_id,
              dateStr,
              Number(r.assigned_count || 0),
              notes || "Rework required",
              currentUser?.id || null,
            ],
          );
        }
      });
    }

    const updated = await query(`SELECT * FROM file_requests WHERE id = $1`, [
      id,
    ]);
    res.json({ data: updated.rows[0] });
  } catch (error) {
    console.error("Verify completed request error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to verify request",
      },
    });
  }
};
