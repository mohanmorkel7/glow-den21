import { Router, Request, Response } from "express";
import { z } from "zod";
import { query, transaction } from "../db/connection";
import bcrypt from "bcrypt";

const router = Router();

// ===== VALIDATION SCHEMAS =====
const createExpenseSchema = z.object({
  category: z.string().min(1).max(100),
  description: z.string().min(1).max(500),
  amount: z.number().positive(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  type: z.enum([
    "administrative",
    "operational",
    "marketing",
    "utilities",
    "miscellaneous",
  ]),
  frequency: z.enum(["monthly", "one-time"]).default("one-time"),
  receipt: z.string().optional(),
});

const updateExpenseSchema = z.object({
  category: z.string().min(1).max(100).optional(),
  description: z.string().min(1).max(500).optional(),
  amount: z.number().positive().optional(),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  type: z
    .enum([
      "administrative",
      "operational",
      "marketing",
      "utilities",
      "miscellaneous",
    ])
    .optional(),
  frequency: z.enum(["monthly", "one-time"]).optional(),
  receipt: z.string().optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
});

const updateSalaryConfigSchema = z.object({
  users: z
    .object({
      firstTierRate: z.number().positive().optional(),
      secondTierRate: z.number().positive().optional(),
      firstTierLimit: z.number().int().positive().optional(),
    })
    .optional(),
  projectManagers: z.record(z.string(), z.number().positive()).optional(),
});

const approveExpenseSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  notes: z.string().optional(),
});

const expenseQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().optional(),
  type: z
    .enum([
      "administrative",
      "operational",
      "marketing",
      "utilities",
      "miscellaneous",
    ])
    .optional(),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  category: z.string().optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/)
    .optional(),
  sortBy: z.enum(["date", "amount", "category", "type"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

// ===== EXPENSE ENDPOINTS =====

// GET /api/expenses - List expenses with filtering and pagination
router.get("/", async (req: Request, res: Response) => {
  try {
    const q = expenseQuerySchema.parse(req.query);

    const where: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (q.type) { where.push(`type = $${idx++}`); params.push(q.type); }
    if (q.status) { where.push(`status = $${idx++}`); params.push(q.status); }
    if (q.category) { where.push(`LOWER(category) LIKE $${idx++}`); params.push(`%${q.category.toLowerCase()}%`); }
    if (q.search) { where.push(`(LOWER(category) LIKE $${idx} OR LOWER(description) LIKE $${idx})`); params.push(`%${q.search.toLowerCase()}%`); idx++; }
    if (q.from) { where.push(`date >= $${idx++}`); params.push(q.from); }
    if (q.to) { where.push(`date <= $${idx++}`); params.push(q.to); }
    if (q.month) { where.push(`month = $${idx++}`); params.push(q.month); }
    const whereSql = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const sortCol = q.sortBy === 'amount' ? 'amount' : q.sortBy === 'category' ? 'category' : q.sortBy === 'type' ? 'type' : 'date';
    const sortDir = q.sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countSql = `SELECT COUNT(*)::INT AS count FROM expenses ${whereSql}`;
    const baseSql = `SELECT id, category, description, amount::FLOAT8 AS amount,
        TO_CHAR(date, 'YYYY-MM-DD') AS date, month, type, frequency, receipt, status,
        COALESCE(approved_by,'') AS approved_by,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
        created_by_user_id AS created_by
      FROM expenses ${whereSql} ORDER BY ${sortCol} ${sortDir}`;

    const { data, pagination } = await paginatedQuery(baseSql, countSql, params, q.page, q.limit);

    const rows = data.map((r: any) => ({
      id: r.id,
      category: r.category,
      description: r.description,
      amount: Number(r.amount),
      date: r.date,
      month: r.month,
      type: r.type,
      frequency: r.frequency,
      receipt: r.receipt || undefined,
      status: r.status,
      approvedBy: r.approved_by || "",
      createdAt: r.created_at,
      updatedAt: r.updated_at,
      createdBy: r.created_by ? { id: String(r.created_by), name: "" } : { id: "", name: "" },
    }));

    const statsRes = await query(
      `SELECT
         COALESCE(SUM(amount)::FLOAT8,0) AS total_amount,
         SUM(CASE WHEN status='approved' THEN 1 ELSE 0 END)::INT AS approved_count,
         SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END)::INT AS pending_count,
         SUM(CASE WHEN status='rejected' THEN 1 ELSE 0 END)::INT AS rejected_count
       FROM expenses ${whereSql}`,
      params,
    );
    const s = statsRes.rows[0] || { total_amount: 0, approved_count: 0, pending_count: 0, rejected_count: 0 };

    const statistics = {
      totalExpenses: Number(s.total_amount || 0),
      approvedCount: Number(s.approved_count || 0),
      pendingCount: Number(s.pending_count || 0),
      rejectedCount: Number(s.rejected_count || 0),
      entryCount: pagination.total,
    };

    res.json({ data: rows, statistics, pagination });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch expenses" } });
  }
});

// GET /api/expenses/:id - Get single expense
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const r = await query(
      `SELECT id, category, description, amount::FLOAT8 AS amount,
              TO_CHAR(date, 'YYYY-MM-DD') AS date,
              month, type, frequency, receipt, status,
              COALESCE(approved_by,'') AS approved_by,
              TO_CHAR(approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS approved_at,
              TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
              TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
              created_by_user_id AS created_by
         FROM expenses WHERE id = $1`,
      [id],
    );
    const row = r.rows[0];
    if (!row) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Expense not found" } });
    res.json({
      data: {
        id: row.id,
        category: row.category,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        month: row.month,
        type: row.type,
        frequency: row.frequency,
        receipt: row.receipt || undefined,
        status: row.status,
        approvedBy: row.approved_by || "",
        approvedAt: row.approved_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by ? { id: String(row.created_by), name: "" } : { id: "", name: "" },
      },
    });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch expense" } });
  }
});

// POST /api/expenses - Create new expense
router.post("/", async (req: Request, res: Response) => {
  try {
    const body = createExpenseSchema.parse(req.body);
    const currentUser: any = (req as any).user;

    const month = body.date.substring(0, 7);
    const sql = `INSERT INTO expenses
      (category, description, amount, date, month, type, frequency, receipt, status, approved_by, created_by_user_id)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'pending','', $9)
      RETURNING id, category, description, amount::FLOAT8 AS amount,
        TO_CHAR(date, 'YYYY-MM-DD') AS date, month, type, frequency, receipt,
        status, COALESCE(approved_by,'') AS approved_by,
        TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
        TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
        created_by_user_id AS created_by`;
    const r = await query(sql, [
      body.category,
      body.description,
      body.amount,
      body.date,
      month,
      body.type,
      body.frequency,
      body.receipt || null,
      currentUser?.id || null,
    ]);
    const row = r.rows[0];
    res.status(201).json({
      data: {
        id: row.id,
        category: row.category,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        month: row.month,
        type: row.type,
        frequency: row.frequency,
        receipt: row.receipt || undefined,
        status: row.status,
        approvedBy: row.approved_by || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by ? { id: String(row.created_by), name: "" } : { id: "", name: "" },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "Invalid expense data", details: error.errors },
      });
    }
    console.error("Error creating expense:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to create expense" } });
  }
});

// PUT /api/expenses/:id - Update expense
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const body = updateExpenseSchema.parse(req.body);

    const sets: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (body.category !== undefined) { sets.push(`category = $${idx++}`); params.push(body.category); }
    if (body.description !== undefined) { sets.push(`description = $${idx++}`); params.push(body.description); }
    if (body.amount !== undefined) { sets.push(`amount = $${idx++}`); params.push(body.amount); }
    if (body.date !== undefined) { sets.push(`date = $${idx++}`); params.push(body.date); }
    if (body.type !== undefined) { sets.push(`type = $${idx++}`); params.push(body.type); }
    if (body.frequency !== undefined) { sets.push(`frequency = $${idx++}`); params.push(body.frequency); }
    if (body.receipt !== undefined) { sets.push(`receipt = $${idx++}`); params.push(body.receipt); }
    if (body.status !== undefined) { sets.push(`status = $${idx++}`); params.push(body.status); }

    if (sets.length === 0) {
      return res.status(400).json({ error: { code: "NO_CHANGES", message: "No fields to update" } });
    }

    if (body.date !== undefined) {
      sets.push(`month = SUBSTRING($${idx-1}::text, 1, 7)`);
    }
    sets.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `UPDATE expenses SET ${sets.join(", ")} WHERE id = $${idx} RETURNING id, category, description, amount::FLOAT8 AS amount,
      TO_CHAR(date, 'YYYY-MM-DD') AS date, month, type, frequency, receipt, status, COALESCE(approved_by,'') AS approved_by,
      TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
      TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
      created_by_user_id AS created_by`;
    const r = await query(sql, [...params, id]);
    const row = r.rows[0];
    if (!row) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Expense not found" } });

    res.json({
      data: {
        id: row.id,
        category: row.category,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        month: row.month,
        type: row.type,
        frequency: row.frequency,
        receipt: row.receipt || undefined,
        status: row.status,
        approvedBy: row.approved_by || "",
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by ? { id: String(row.created_by), name: "" } : { id: "", name: "" },
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid expense data", details: error.errors } });
    }
    console.error("Error updating expense:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to update expense" } });
  }
});

// POST /api/expenses/:id/approve - Approve/reject expense
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = approveExpenseSchema.parse(req.body);
    const currentUser: any = (req as any).user;

    const sql = `UPDATE expenses SET status = $1, approved_by = $2, approved_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE id = $3
                 RETURNING id, category, description, amount::FLOAT8 AS amount, TO_CHAR(date,'YYYY-MM-DD') AS date, month, type, frequency, receipt, status,
                   COALESCE(approved_by,'') AS approved_by,
                   TO_CHAR(approved_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS approved_at,
                   TO_CHAR(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS created_at,
                   TO_CHAR(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS updated_at,
                   created_by_user_id AS created_by`;
    const r = await query(sql, [status, currentUser?.name || "Current User", id]);
    const row = r.rows[0];
    if (!row) return res.status(404).json({ error: { code: "NOT_FOUND", message: "Expense not found" } });

    res.json({
      data: {
        id: row.id,
        category: row.category,
        description: row.description,
        amount: Number(row.amount),
        date: row.date,
        month: row.month,
        type: row.type,
        frequency: row.frequency,
        receipt: row.receipt || undefined,
        status: row.status,
        approvedBy: row.approved_by || "",
        approvedAt: row.approved_at || null,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        createdBy: row.created_by ? { id: String(row.created_by), name: "" } : { id: "", name: "" },
        approvalNotes: notes,
        rejectionReason: status === "rejected" ? notes : undefined,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "Invalid approval data", details: error.errors } });
    }
    console.error("Error approving expense:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to approve expense" } });
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    await query(`DELETE FROM expenses WHERE id = $1`, [id]);
    res.json({ success: true, message: "Expense deleted successfully" });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to delete expense" } });
  }
});

// ===== SALARY MANAGEMENT ENDPOINTS =====

// GET /api/expenses/salary/config - Get salary configuration
router.get("/salary/config", async (req: Request, res: Response) => {
  try {
    const result = await query(
      `SELECT id, first_tier_rate, second_tier_rate, first_tier_limit, currency, updated_at, updated_by_user_id FROM salary_config WHERE id = 1`,
    );
    const row = result.rows[0] || null;
    if (!row) {
      return res.json({
        data: {
          users: {
            firstTierRate: 0.5,
            secondTierRate: 0.6,
            firstTierLimit: 500,
          },
          projectManagers: {},
          currency: "INR",
        },
      });
    }

    // Fetch updated by user name if present
    let updatedBy = null;
    if (row.updated_by_user_id) {
      const u = await query(`SELECT id, name FROM users WHERE id = $1`, [
        row.updated_by_user_id,
      ]);
      if (u.rows[0]) updatedBy = { id: u.rows[0].id, name: u.rows[0].name };
    }

    // Build PM salaries mapping
    const pmMap: Record<string, number> = {};
    try {
      const pmRes = await query(
        `SELECT id, monthly_salary FROM pm_salaries WHERE is_active = true`,
      );
      for (const r of pmRes.rows) pmMap[r.id] = Number(r.monthly_salary || 0);
    } catch (_) {}

    const data = {
      users: {
        firstTierRate: Number(row.first_tier_rate),
        secondTierRate: Number(row.second_tier_rate),
        firstTierLimit: Number(row.first_tier_limit),
      },
      projectManagers: pmMap,
      currency: row.currency,
      updatedAt: row.updated_at,
      updatedBy,
    };
    res.json({ data });
  } catch (error) {
    console.error("Error fetching salary config:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch salary configuration",
      },
    });
  }
});

// PUT /api/expenses/salary/config - Update salary configuration
router.put("/salary/config", async (req: Request, res: Response) => {
  try {
    const configData = updateSalaryConfigSchema.parse(req.body);
    const currentUser: any = (req as any).user;

    const updateFields: string[] = [];
    const params: any[] = [];
    let idx = 1;
    if (configData.users?.firstTierRate !== undefined) {
      updateFields.push(`first_tier_rate = $${idx++}`);
      params.push(configData.users.firstTierRate);
    }
    if (configData.users?.secondTierRate !== undefined) {
      updateFields.push(`second_tier_rate = $${idx++}`);
      params.push(configData.users.secondTierRate);
    }
    if (configData.users?.firstTierLimit !== undefined) {
      updateFields.push(`first_tier_limit = $${idx++}`);
      params.push(configData.users.firstTierLimit);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({
        error: {
          code: "NO_CHANGES",
          message: "No configuration fields provided",
        },
      });
    }

    // set updated_by and updated_at
    updateFields.push(`updated_by_user_id = $${idx++}`);
    params.push(currentUser?.id || null);

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

    const sql = `UPDATE salary_config SET ${updateFields.join(", ")} WHERE id = 1 RETURNING *`;
    const result = await query(sql, params);
    const row = result.rows[0];

    // If project manager salaries provided, update pm_salaries rows
    if (configData.projectManagers) {
      for (const [pmId, salary] of Object.entries(configData.projectManagers)) {
        try {
          await query(
            `UPDATE pm_salaries SET monthly_salary = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
            [salary, pmId],
          );
        } catch (err) {
          console.warn(`Failed to update pm_salaries for id ${pmId}:`, err);
        }
      }
    }

    // Build response
    let updatedBy = null;
    if (row.updated_by_user_id) {
      const u = await query(`SELECT id, name FROM users WHERE id = $1`, [
        row.updated_by_user_id,
      ]);
      if (u.rows[0]) updatedBy = { id: u.rows[0].id, name: u.rows[0].name };
    }

    // Fetch refreshed PM salaries mapping
    const pmMap: Record<string, number> = {};
    try {
      const pmRes = await query(
        `SELECT id, monthly_salary FROM pm_salaries WHERE is_active = true`,
      );
      for (const r of pmRes.rows) pmMap[r.id] = Number(r.monthly_salary || 0);
    } catch (_) {}

    const data = {
      users: {
        firstTierRate: Number(row.first_tier_rate),
        secondTierRate: Number(row.second_tier_rate),
        firstTierLimit: Number(row.first_tier_limit),
      },
      projectManagers: pmMap,
      currency: row.currency,
      updatedAt: row.updated_at,
      updatedBy,
    };

    res.json({ data });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid salary configuration",
          details: error.errors,
        },
      });
    } else {
      console.error("Error updating salary config:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update salary configuration",
        },
      });
    }
  }
});

// GET /api/expenses/salary/users - Get user salary data from file_requests (completed)
router.get("/salary/users", async (req: Request, res: Response) => {
  try {
    const { month } = req.query as any;
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const monthStart = `${targetMonth}-01`;
    const nextMonthDate = new Date(monthStart);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().substring(0, 10);

    // Load salary configuration for tiered calculation
    const cfgRes = await query(
      `SELECT first_tier_rate, second_tier_rate, first_tier_limit FROM salary_config WHERE id = 1`,
    );
    const cfg = cfgRes.rows[0] || {
      first_tier_rate: 0.5,
      second_tier_rate: 0.6,
      first_tier_limit: 500,
    };
    const firstTierRate = Number(cfg.first_tier_rate || 0);
    const secondTierRate = Number(cfg.second_tier_rate || 0);
    const firstTierLimit = Number(cfg.first_tier_limit || 0);

    // Aggregate files from file_requests with status completed in the month range
    const sql = `
      SELECT u.id as user_id, u.name as user_name,
             COALESCE(SUM(CASE WHEN DATE(fr.completed_date) = CURRENT_DATE THEN COALESCE(fr.assigned_count, fr.requested_count, 0) ELSE 0 END),0) as today_files,
             COALESCE(SUM(CASE WHEN DATE(fr.completed_date) >= (CURRENT_DATE - INTERVAL '6 day') THEN COALESCE(fr.assigned_count, fr.requested_count, 0) ELSE 0 END),0) as weekly_files,
             COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) as monthly_files
      FROM file_requests fr
      JOIN users u ON u.id::text = fr.user_id
      WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
      GROUP BY u.id, u.name
      ORDER BY u.name
    `;

    const result = await query(sql, [monthStart, nextMonth]);

    const calc = (files: number) => {
      const tier1 = Math.min(files, firstTierLimit);
      const tier2 = Math.max(0, files - firstTierLimit);
      return tier1 * firstTierRate + tier2 * secondTierRate;
    };

    // Fetch per-user performance from daily_counts (today), based on targets of tagged projects
    const users = [] as any[];
    for (const r of result.rows) {
      const userId = r.user_id;
      const todayFiles = Number(r.today_files || 0);
      const weeklyFiles = Number(r.weekly_files || 0);
      const monthlyFiles = Number(r.monthly_files || 0);

      // Calculate performance: user's completed count vs overall project totals for current month
      const projUserRes = await query(
        `SELECT fp.project_id AS project_id,
                SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)) AS user_completed
           FROM file_requests fr
           JOIN file_processes fp ON fp.id = fr.file_process_id
          WHERE fr.status = 'completed'
            AND fr.completed_date >= $1 AND fr.completed_date < $2
            AND fr.user_id::text = $3
          GROUP BY fp.project_id`,
        [monthStart, nextMonth, String(userId)],
      );

      const projectIds = projUserRes.rows
        .map((r: any) => String(r.project_id || ""))
        .filter(Boolean);

      let performancePct = 0;
      if (projectIds.length) {
        const totalsRes = await query(
          `SELECT fp.project_id, SUM(fp.total_rows) AS total_rows
             FROM file_processes fp
            WHERE fp.project_id = ANY($1)
              AND EXISTS (
                SELECT 1 FROM file_requests fr2
                 WHERE fr2.file_process_id = fp.id
                   AND fr2.status = 'completed'
                   AND fr2.completed_date >= $2 AND fr2.completed_date < $3
              )
            GROUP BY fp.project_id`,
          [projectIds, monthStart, nextMonth],
        );
        const totalsMap = new Map<string, number>();
        for (const row of totalsRes.rows) {
          totalsMap.set(
            String((row as any).project_id),
            Number((row as any).total_rows || 0),
          );
        }
        const userCompletedSum = projUserRes.rows.reduce(
          (s: number, r: any) => s + Number(r.user_completed || 0),
          0,
        );
        const projectTotalRows = projectIds.reduce(
          (s, pid) => s + (totalsMap.get(pid) || 0),
          0,
        );
        if (projectTotalRows > 0) {
          performancePct = Math.max(
            0,
            Math.min(
              100,
              Math.round((userCompletedSum / projectTotalRows) * 100),
            ),
          );
        }
      }

      // Fallbacks when monthly project data is insufficient
      if (performancePct === 0) {
        const perfRes = await query(
          `SELECT COALESCE(SUM(dc.target_count),0) AS target_today,
                  COALESCE(SUM(dc.submitted_count),0) AS submitted_today
             FROM daily_counts dc
            WHERE dc.date = CURRENT_DATE AND dc.user_id::text = $1`,
          [String(userId)],
        );
        const assignedRes = await query(
          `SELECT COALESCE(SUM(assigned_count),0) AS assigned_today
             FROM file_requests
            WHERE user_id::text = $1 AND DATE(assigned_date) = CURRENT_DATE`,
          [String(userId)],
        );
        const pr = perfRes.rows[0] || { target_today: 0, submitted_today: 0 };
        const targetToday = Number(pr.target_today || 0);
        const submittedToday = Number(pr.submitted_today || 0);
        const assignedToday = Number(assignedRes.rows[0]?.assigned_today || 0);
        if (assignedToday > 0) {
          performancePct = Math.max(
            0,
            Math.min(100, Math.round((todayFiles / assignedToday) * 100)),
          );
        } else if (targetToday > 0) {
          performancePct = Math.max(
            0,
            Math.min(100, Math.round((submittedToday / targetToday) * 100)),
          );
        } else if (firstTierLimit > 0) {
          performancePct = Math.max(
            0,
            Math.min(100, Math.round((todayFiles / firstTierLimit) * 100)),
          );
        }
      }

      // Determine last active from recent activity (completed or assigned)
      let lastActive: string | null = null;
      try {
        const la = await query(
          `SELECT TO_CHAR(MAX(ts) AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS"Z"') AS last_ts FROM (
             SELECT MAX(completed_date) AS ts FROM file_requests WHERE user_id::text = $1
             UNION ALL
             SELECT MAX(assigned_date) AS ts FROM file_requests WHERE user_id::text = $1
             UNION ALL
             SELECT MAX(requested_date) AS ts FROM file_requests WHERE user_id::text = $1
           ) t`,
          [String(userId)],
        );
        lastActive = la.rows[0]?.last_ts || null;
      } catch (_) {}

      users.push({
        id: userId,
        name: r.user_name,
        role: "user",
        todayFiles,
        weeklyFiles,
        monthlyFiles,
        todayEarnings: calc(todayFiles),
        weeklyEarnings: calc(weeklyFiles),
        monthlyEarnings: calc(monthlyFiles),
        attendanceRate: performancePct,
        lastActive,
      });
    }

    const summary = {
      totalMonthlyEarnings: users.reduce(
        (s: number, u: any) => s + (u.monthlyEarnings || 0),
        0,
      ),
      averageMonthlyEarnings: users.length
        ? users.reduce((s: number, u: any) => s + (u.monthlyEarnings || 0), 0) /
          users.length
        : 0,
      totalTodayFiles: users.reduce(
        (s: number, u: any) => s + (u.todayFiles || 0),
        0,
      ),
      totalMonthlyFiles: users.reduce(
        (s: number, u: any) => s + (u.monthlyFiles || 0),
        0,
      ),
      activeUsers: users.length,
    };

    res.json({ data: users, summary, month: targetMonth });
  } catch (error) {
    console.error("Error fetching user salary data:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch user salary data",
      },
    });
  }
});

// GET /api/expenses/salary/project-managers - Get PM salary data
router.get("/salary/project-managers", async (req: Request, res: Response) => {
  try {
    const { month } = req.query as any;
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const monthStart = `${targetMonth}-01`;

    // Get active PM salaries effective on or before end of target month
    const nextMonthDate = new Date(monthStart);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().substring(0, 10);

    const sql = `
      SELECT ps.id, ps.user_id, ps.monthly_salary, u.name
      FROM pm_salaries ps
      JOIN users u ON u.id::text = ps.user_id::text
      WHERE ps.is_active = true AND ps.effective_from < $1
      ORDER BY u.name
    `;
    const result = await query(sql, [nextMonth]);
    const pms = result.rows.map((r: any) => ({
      id: r.id,
      name: r.name,
      role: "project_manager",
      monthlySalary: Number(r.monthly_salary || 0),
      attendanceRate: 0,
      lastActive: null,
      department: null,
    }));

    const summary = {
      totalMonthlySalaries: pms.reduce(
        (s: number, p: any) => s + (p.monthlySalary || 0),
        0,
      ),
      averageMonthlySalary: pms.length
        ? pms.reduce((s: number, p: any) => s + (p.monthlySalary || 0), 0) /
          pms.length
        : 0,
      activePMs: pms.length,
    };

    res.json({ data: pms, summary });
  } catch (error) {
    console.error("Error fetching PM salary data:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch PM salary data",
      },
    });
  }
});

// GET /api/expenses/salary/breakdown - Per-user salary breakdown for a period
router.get("/salary/breakdown", async (req: Request, res: Response) => {
  try {
    const { userId, period = "daily", month } = req.query as any;
    if (!userId) {
      return res.status(400).json({
        error: { code: "VALIDATION_ERROR", message: "userId is required" },
      });
    }

    // Load salary configuration
    const cfgRes = await query(
      `SELECT first_tier_rate, second_tier_rate, first_tier_limit FROM salary_config WHERE id = 1`,
    );
    const cfg = cfgRes.rows[0] || {
      first_tier_rate: 0.5,
      second_tier_rate: 0.6,
      first_tier_limit: 500,
    };
    const firstTierRate = Number(cfg.first_tier_rate || 0);
    const secondTierRate = Number(cfg.second_tier_rate || 0);
    const firstTierLimit = Number(cfg.first_tier_limit || 0);

    // Determine date range
    const today = new Date();
    let from: Date;
    let to: Date;
    if (period === "weekly") {
      from = new Date(today);
      from.setDate(today.getDate() - 6);
      to = today;
    } else if (period === "monthly") {
      const target = (month as string) || today.toISOString().substring(0, 7);
      const monthStart = new Date(`${target}-01T00:00:00Z`);
      from = monthStart;
      to = new Date(monthStart);
      to.setMonth(to.getMonth() + 1);
      to.setDate(to.getDate() - 1); // last day of month
    } else {
      from = new Date(today.toISOString().substring(0, 10));
      to = new Date(today.toISOString().substring(0, 10));
    }

    const fromStr = from.toISOString().substring(0, 10);
    // upper bound exclusive for query convenience
    const toNext = new Date(to);
    toNext.setDate(toNext.getDate() + 1);
    const toNextStr = toNext.toISOString().substring(0, 10);

    // Query completed files per day in range for the user
    const rowsRes = await query(
      `SELECT DATE(completed_date) AS d, SUM(COALESCE(assigned_count, requested_count, 0)) AS files
         FROM file_requests
        WHERE user_id::text = $1 AND status = 'completed' AND completed_date >= $2 AND completed_date < $3
        GROUP BY DATE(completed_date)
        ORDER BY DATE(completed_date)`,
      [String(userId), fromStr, toNextStr],
    );

    // Build a map for quick lookup
    const byDate = new Map<string, number>();
    for (const r of rowsRes.rows) {
      const d = (r as any).d as string;
      byDate.set(d, Number((r as any).files || 0));
    }

    // Iterate each day in range to build breakdown, including zero-file days
    const items: any[] = [];
    for (let dt = new Date(fromStr); dt <= to; dt.setDate(dt.getDate() + 1)) {
      const dStr = dt.toISOString().substring(0, 10);
      const files = byDate.get(dStr) || 0;
      const tier1Files = Math.min(files, firstTierLimit);
      const tier2Files = Math.max(0, files - firstTierLimit);
      const tier1Amount = tier1Files * firstTierRate;
      const tier2Amount = tier2Files * secondTierRate;

      items.push({
        period: dStr,
        files,
        tier1Files,
        tier1Rate: firstTierRate,
        tier1Amount,
        tier2Files,
        tier2Rate: secondTierRate,
        tier2Amount,
        totalAmount: tier1Amount + tier2Amount,
      });
    }

    res.json({ data: items });
  } catch (error) {
    console.error("Error fetching salary breakdown:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch salary breakdown",
      },
    });
  }
});

// POST /api/expenses/salary/project-managers - Create or update PM salary by name/email
router.post("/salary/project-managers", async (req: Request, res: Response) => {
  try {
    const { name, email, monthlySalary } = req.body as any;
    if (!name || !monthlySalary) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "name and monthlySalary are required",
        },
      });
    }

    // Try to find user by email, otherwise by name
    let userId: string | null = null;
    if (email) {
      const u = await query(`SELECT id FROM users WHERE email = $1`, [email]);
      if (u.rows[0]) userId = u.rows[0].id;
    }
    if (!userId) {
      const u2 = await query(`SELECT id FROM users WHERE name = $1`, [name]);
      if (u2.rows[0]) userId = u2.rows[0].id;
    }

    // If user not found, create a lightweight project_manager user
    if (!userId) {
      const genEmail = (nameStr: string) =>
        `${nameStr.toLowerCase().replace(/[^a-z0-9]+/g, ".")}@example.local`;
      const newEmail = email || genEmail(name + Date.now());

      // generate random password hash
      const randomPwd = Math.random().toString(36).slice(2);
      const hashed = await bcrypt.hash(randomPwd, 10);

      const insertUser = `INSERT INTO users (name,email,hashed_password,role,created_at,updated_at) VALUES ($1,$2,$3,'project_manager',CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING id`;
      const created = await query(insertUser, [name, newEmail, hashed]);
      userId = created.rows[0].id;
    }

    // Insert pm_salaries row
    const insertPm = `INSERT INTO pm_salaries (user_id, monthly_salary, effective_from, is_active, created_at, updated_at) VALUES ($1,$2,CURRENT_DATE,true,CURRENT_TIMESTAMP,CURRENT_TIMESTAMP) RETURNING *`;
    const pmRes = await query(insertPm, [userId, monthlySalary]);
    const pmRow = pmRes.rows[0];

    res.status(201).json({
      data: {
        id: pmRow.id,
        userId: pmRow.user_id,
        monthlySalary: Number(pmRow.monthly_salary),
      },
    });
  } catch (error) {
    console.error("Error creating PM salary:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to create PM salary",
      },
    });
  }
});

// ===== BILLING ENDPOINTS =====

// GET /api/expenses/billing/summary - Monthly billing summary (last N months or specific month)
router.get("/billing/summary", async (req: Request, res: Response) => {
  try {
    const { month, months = "6" } = req.query as any;

    // Determine range of months to include
    const summaries: any[] = [];
    const count = Math.max(1, Math.min(24, parseInt(String(months)) || 6));

    const buildMonthKey = (d: Date) => d.toISOString().substring(0, 7);

    const monthKeys: string[] = [];
    if (month) {
      monthKeys.push(String(month));
    } else {
      const now = new Date();
      // last count months including current
      for (let i = 0; i < count; i++) {
        const dt = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
        );
        monthKeys.push(buildMonthKey(dt));
      }
      monthKeys.reverse();
    }

    // Preload project rates
    const projRatesRes = await query(
      `SELECT id, name, COALESCE(rate_per_file_usd, 0) AS rate_per_file_usd FROM projects`,
    );
    const projectRates = new Map<string, { name: string; rate: number }>();
    for (const r of projRatesRes.rows) {
      projectRates.set(String(r.id), {
        name: r.name,
        rate: Number(r.rate_per_file_usd || 0),
      });
    }

    // Iterate months and compute billing
    for (const m of monthKeys) {
      const monthStart = `${m}-01`;
      const next = new Date(`${m}-01T00:00:00Z`);
      next.setUTCMonth(next.getUTCMonth() + 1);
      const nextStr = next.toISOString().substring(0, 10);

      // Load completed file requests joined with file processes and projects
      const sqlManual = `
        SELECT
          fr.file_process_id,
          COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)), 0) AS completed_files,
          MAX(DATE(fr.completed_date)) AS last_completed_date,
          fp.name AS process_name,
          fp.type AS process_type,
          fp.total_rows AS total_rows,
          fp.project_id AS project_id,
          fp.project_name AS project_name,
          fp.file_name AS file_name
        FROM file_requests fr
        JOIN file_processes fp ON fp.id = fr.file_process_id
        WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
        GROUP BY fr.file_process_id, fp.name, fp.type, fp.total_rows, fp.project_id, fp.project_name, fp.file_name
      `;
      const sqlAutomation = `
        SELECT
          fp.id AS file_process_id,
          COALESCE(SUM((d->>'completed')::INT), 0) AS completed_files,
          MAX((d->>'date')::DATE) AS last_completed_date,
          fp.name AS process_name,
          fp.type AS process_type,
          fp.total_rows AS total_rows,
          fp.project_id AS project_id,
          fp.project_name AS project_name,
          NULL::TEXT AS file_name
        FROM file_processes fp
        JOIN LATERAL jsonb_array_elements(fp.automation_config->'dailyCompletions') AS d ON TRUE
        WHERE fp.type = 'automation'
          AND fp.automation_config IS NOT NULL
          AND (d->>'date')::DATE >= $1 AND (d->>'date')::DATE < $2
        GROUP BY fp.id, fp.name, fp.type, fp.total_rows, fp.project_id, fp.project_name
      `;
      const [rowsManual, rowsAuto] = await Promise.all([
        query(sqlManual, [monthStart, nextStr]),
        query(sqlAutomation, [monthStart, nextStr]),
      ]);
      const allRows = [...rowsManual.rows, ...rowsAuto.rows];

      // Group by project
      const byProject = new Map<string, any[]>();
      for (const r of allRows) {
        const pId = String((r as any).project_id || "");
        if (!pId) continue;
        if (!byProject.has(pId)) byProject.set(pId, []);
        byProject.get(pId)!.push(r);
      }

      const conversionRate = 83.0; // Default INR per USD
      const projects: any[] = [];
      let totalFilesCompleted = 0;
      let totalAmountUSD = 0;
      let totalAmountINR = 0;
      let automationProcesses = 0;
      let manualProcesses = 0;

      for (const [projectId, items] of byProject.entries()) {
        const rate = projectRates.get(projectId)?.rate || 0;
        const projectName =
          projectRates.get(projectId)?.name ||
          (items[0] as any).project_name ||
          "Project";

        const fileProcesses = items.map((it: any) => {
          const completedFiles = Number(it.completed_files || 0);
          const totalFiles = Number(it.total_rows || 0);
          const processType =
            (it.process_type as string) === "automation"
              ? "automation"
              : "manual";
          if (processType === "automation") automationProcesses++;
          else manualProcesses++;
          return {
            processId: String(it.file_process_id),
            processName: it.process_name,
            fileName: it.file_name || null,
            type: processType,
            totalFiles,
            completedFiles,
            progressPercentage:
              totalFiles > 0
                ? Math.min(100, (completedFiles / totalFiles) * 100)
                : 0,
            completedDate: it.last_completed_date
              ? String(it.last_completed_date)
              : null,
          };
        });

        const projectCompleted = fileProcesses.reduce(
          (s: number, fp: any) => s + (fp.completedFiles || 0),
          0,
        );
        const amountUSD = projectCompleted * rate;
        const amountINR = amountUSD * conversionRate;

        totalFilesCompleted += projectCompleted;
        totalAmountUSD += amountUSD;
        totalAmountINR += amountINR;

        projects.push({
          projectId,
          projectName,
          client: "",
          month: m,
          fileProcesses,
          totalFilesCompleted: projectCompleted,
          ratePerFile: rate,
          amountUSD,
          amountINR,
          conversionRate,
          status: "finalized",
          createdAt: new Date().toISOString(),
          type: "project",
        });
      }

      const summary = {
        month: m,
        totalFilesCompleted,
        totalAmountUSD,
        totalAmountINR,
        conversionRate,
        itemsCount: projects.length,
        projects,
        automationProcesses,
        manualProcesses,
      };
      // Only add months that have at least one project
      if (projects.length > 0) summaries.push(summary);
    }

    res.json({ data: summaries });
  } catch (error) {
    console.error("Error building billing summary:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to build billing summary",
      },
    });
  }
});

// GET /api/expenses/billing/export - Export billing as CSV (optionally for a month)
router.get("/billing/export", async (req: Request, res: Response) => {
  try {
    const { month, months, rate } = req.query as any;
    const conversionRate =
      Number(rate) && isFinite(Number(rate)) ? Number(rate) : 83.0;

    // Preload project rates
    const projRatesRes = await query(
      `SELECT id, name, COALESCE(rate_per_file_usd, 0) AS rate_per_file_usd FROM projects`,
    );
    const projectRates = new Map<string, { name: string; rate: number }>();
    for (const r of projRatesRes.rows) {
      projectRates.set(String(r.id), {
        name: r.name,
        rate: Number(r.rate_per_file_usd || 0),
      });
    }

    const buildMonthKey = (d: Date) => d.toISOString().substring(0, 7);

    if (!month) {
      // Export monthly summary for the last N months (default 6)
      const count = Math.max(1, Math.min(24, parseInt(String(months)) || 6));
      const now = new Date();
      const monthKeys: string[] = [];
      for (let i = 0; i < count; i++) {
        const dt = new Date(
          Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1),
        );
        monthKeys.push(buildMonthKey(dt));
      }
      monthKeys.reverse();

      const header = [
        "Month",
        "Items (Projects)",
        "Completed Files",
        "Amount USD",
        "Amount INR",
        "Conversion Rate (₹/USD)",
      ];
      const lines = [header.join(",")];

      for (const mKey of monthKeys) {
        const monthStart = `${mKey}-01`;
        const next = new Date(`${mKey}-01T00:00:00Z`);
        next.setUTCMonth(next.getUTCMonth() + 1);
        const nextStr = next.toISOString().substring(0, 10);

        const sqlManual = `
          SELECT
            fr.file_process_id,
            COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)), 0) AS completed_files,
            fp.project_id AS project_id
          FROM file_requests fr
          JOIN file_processes fp ON fp.id = fr.file_process_id
          WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
          GROUP BY fr.file_process_id, fp.project_id
        `;
        const sqlAutomation = `
          SELECT
            fp.id AS file_process_id,
            COALESCE(SUM((d->>'completed')::INT), 0) AS completed_files,
            fp.project_id AS project_id
          FROM file_processes fp
          JOIN LATERAL jsonb_array_elements(fp.automation_config->'dailyCompletions') AS d ON TRUE
          WHERE fp.type = 'automation'
            AND fp.automation_config IS NOT NULL
            AND (d->>'date')::DATE >= $1 AND (d->>'date')::DATE < $2
          GROUP BY fp.id, fp.project_id
        `;
        const [rowsManual, rowsAuto] = await Promise.all([
          query(sqlManual, [monthStart, nextStr]),
          query(sqlAutomation, [monthStart, nextStr]),
        ]);
        const allRows = [...rowsManual.rows, ...rowsAuto.rows];

        // Aggregate per project
        const byProject = new Map<string, number>();
        for (const r of allRows) {
          const pId = String((r as any).project_id || "");
          if (!pId) continue;
          const completed = Number((r as any).completed_files || 0);
          byProject.set(pId, (byProject.get(pId) || 0) + completed);
        }

        let totalFilesCompleted = 0;
        let totalAmountUSD = 0;
        for (const [pId, completed] of byProject.entries()) {
          const rateUSD = projectRates.get(pId)?.rate || 0;
          totalFilesCompleted += completed;
          totalAmountUSD += completed * rateUSD;
        }
        const totalAmountINR = totalAmountUSD * conversionRate;

        const line = [
          mKey,
          String(byProject.size),
          String(totalFilesCompleted),
          String(totalAmountUSD),
          String(totalAmountINR),
          String(conversionRate),
        ];
        lines.push(line.join(","));
      }

      const csv = lines.join("\n");
      res.setHeader("Content-Type", "text/csv");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="billing_summary.csv"`,
      );
      return res.send(csv);
    }

    // Detailed export for a specific month, include automation and INR
    const m = String(month);
    const monthStart = `${m}-01`;
    const next = new Date(`${m}-01T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const nextStr = next.toISOString().substring(0, 10);

    const sqlManual = `
      SELECT fr.file_process_id, fp.name AS process_name, fp.type AS process_type, fp.total_rows,
             fp.project_id, fp.project_name,
             COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) AS completed_files
        FROM file_requests fr
        JOIN file_processes fp ON fp.id = fr.file_process_id
       WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
       GROUP BY fr.file_process_id, fp.name, fp.type, fp.total_rows, fp.project_id, fp.project_name
    `;
    const sqlAutomation = `
      SELECT fp.id AS file_process_id, fp.name AS process_name, fp.type AS process_type, fp.total_rows,
             fp.project_id, fp.project_name,
             COALESCE(SUM((d->>'completed')::INT), 0) AS completed_files
        FROM file_processes fp
        JOIN LATERAL jsonb_array_elements(fp.automation_config->'dailyCompletions') AS d ON TRUE
       WHERE fp.type = 'automation' AND fp.automation_config IS NOT NULL
         AND (d->>'date')::DATE >= $1 AND (d->>'date')::DATE < $2
       GROUP BY fp.id, fp.name, fp.type, fp.total_rows, fp.project_id, fp.project_name
    `;
    const [rowsManual, rowsAuto] = await Promise.all([
      query(sqlManual, [monthStart, nextStr]),
      query(sqlAutomation, [monthStart, nextStr]),
    ]);
    const rows = [...rowsManual.rows, ...rowsAuto.rows];

    const header = [
      "Month",
      "Project ID",
      "Project Name",
      "Process ID",
      "Process Name",
      "Type",
      "Completed Files",
      "Rate Per File (USD)",
      "Amount USD",
      "Amount INR",
      "Conversion Rate (₹/USD)",
    ];
    const lines = [header.join(",")];

    for (const r of rows) {
      const pId = String((r as any).project_id || "");
      const rateUSD = projectRates.get(pId)?.rate || 0;
      const completed = Number((r as any).completed_files || 0);
      const amountUSD = completed * rateUSD;
      const amountINR = amountUSD * conversionRate;
      const line = [
        m,
        pId,
        (r as any).project_name || "",
        String((r as any).file_process_id),
        (r as any).process_name || "",
        (r as any).process_type || "",
        String(completed),
        String(rateUSD),
        String(amountUSD),
        String(amountINR),
        String(conversionRate),
      ];
      lines.push(line.join(","));
    }

    const csv = lines.join("\n");
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="billing_${m}.csv"`,
    );
    res.send(csv);
  } catch (error) {
    console.error("Billing export error:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export billing data",
      },
    });
  }
});

// ===== FINANCIAL ANALYTICS ENDPOINTS =====

// GET /api/expenses/analytics/dashboard - Get expense dashboard data
router.get("/analytics/dashboard", async (req: Request, res: Response) => {
  try {
    const { month } = req.query as any;
    const targetMonth = String(month || new Date().toISOString().substring(0, 7));
    const monthStart = `${targetMonth}-01`;
    const next = new Date(`${targetMonth}-01T00:00:00Z`);
    next.setUTCMonth(next.getUTCMonth() + 1);
    const nextStr = next.toISOString().substring(0, 10);

    const projRatesRes = await query(`SELECT id, COALESCE(rate_per_file_usd,0) AS rate FROM projects`);
    const rateMap = new Map<string, number>();
    for (const r of projRatesRes.rows) rateMap.set(String((r as any).id), Number((r as any).rate || 0));

    const sqlManual = `
      SELECT fp.project_id, COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) AS completed
        FROM file_requests fr
        JOIN file_processes fp ON fp.id = fr.file_process_id
       WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
       GROUP BY fp.project_id`;
    const sqlAutomation = `
      SELECT fp.project_id, COALESCE(SUM((d->>'completed')::INT),0) AS completed
        FROM file_processes fp
        JOIN LATERAL jsonb_array_elements(fp.automation_config->'dailyCompletions') AS d ON TRUE
       WHERE fp.type = 'automation' AND fp.automation_config IS NOT NULL
         AND (d->>'date')::DATE >= $1 AND (d->>'date')::DATE < $2
       GROUP BY fp.project_id`;
    const [rowsManual, rowsAuto] = await Promise.all([
      query(sqlManual, [monthStart, nextStr]),
      query(sqlAutomation, [monthStart, nextStr]),
    ]);

    const byProject = new Map<string, number>();
    for (const r of [...rowsManual.rows, ...rowsAuto.rows]) {
      const p = String((r as any).project_id || '');
      const c = Number((r as any).completed || 0);
      if (!p) continue; byProject.set(p, (byProject.get(p) || 0) + c);
    }

    const conversionRate = 83.0;
    let totalRevenueUSD = 0;
    for (const [pId, completed] of byProject.entries()) {
      const rateUSD = rateMap.get(pId) || 0;
      totalRevenueUSD += completed * rateUSD;
    }
    const totalRevenue = totalRevenueUSD * conversionRate;

    const cfgRes = await query(`SELECT first_tier_rate, second_tier_rate, first_tier_limit FROM salary_config WHERE id = 1`);
    const cfg = cfgRes.rows[0] || { first_tier_rate: 0.5, second_tier_rate: 0.6, first_tier_limit: 500 };
    const fRate = Number(cfg.first_tier_rate || 0);
    const sRate = Number(cfg.second_tier_rate || 0);
    const fLimit = Number(cfg.first_tier_limit || 0);

    const userFilesRes = await query(
      `SELECT COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) AS files
         FROM file_requests fr WHERE fr.status='completed' AND fr.completed_date >= $1 AND fr.completed_date < $2`,
      [monthStart, nextStr]
    );
    const monthlyFiles = Number(userFilesRes.rows[0]?.files || 0);
    const t1 = Math.min(monthlyFiles, fLimit);
    const t2 = Math.max(0, monthlyFiles - fLimit);
    const userSalaries = t1 * fRate + t2 * sRate;

    const pmRes = await query(`SELECT COALESCE(SUM(monthly_salary)::FLOAT8,0) AS total FROM pm_salaries WHERE is_active = true AND effective_from < $1`, [nextStr]);
    const pmSalaries = Number(pmRes.rows[0]?.total || 0);

    const salaryExpenses = userSalaries + pmSalaries;

    const adminRes = await query(`SELECT COALESCE(SUM(amount)::FLOAT8,0) AS total FROM expenses WHERE month = $1 AND status <> 'rejected'`, [targetMonth]);
    const adminExpenses = Number(adminRes.rows[0]?.total || 0);

    const totalExpenses = salaryExpenses + adminExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const catRows = await query(
      `SELECT type, COUNT(*)::INT AS count, COALESCE(SUM(amount)::FLOAT8,0) AS total FROM expenses WHERE month = $1 AND status <> 'rejected' GROUP BY type ORDER BY total DESC LIMIT 5`,
      [targetMonth]
    );
    const topExpenseCategories = [
      { name: 'Salaries', value: salaryExpenses, percentage: 0, fill: '#3b82f6', count: 0 },
      ...catRows.rows.map((r: any) => ({ name: String(r.type), value: Number(r.total || 0), percentage: 0, fill: '#ef4444', count: Number(r.count || 0) })),
    ];
    const catSum = topExpenseCategories.reduce((s, c) => s + c.value, 0);
    for (const c of topExpenseCategories) c.percentage = catSum > 0 ? (c.value / catSum) * 100 : 0;

    const data = {
      currentMonth: { totalRevenue, totalExpenses, netProfit, profitMargin, salaryExpenses, adminExpenses },
      trends: { revenueGrowth: 0, expenseGrowth: 0, profitGrowth: 0 },
      alerts: [],
      topExpenseCategories,
    };

    res.json({ data });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch dashboard analytics" } });
  }
});

// GET /api/expenses/analytics/profit-loss - Get profit & loss data
router.get("/analytics/profit-loss", async (req: Request, res: Response) => {
  try {
    const months: string[] = [];
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const dt = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - i, 1));
      months.push(dt.toISOString().substring(0, 7));
    }

    const projRatesRes = await query(`SELECT id, COALESCE(rate_per_file_usd,0) AS rate FROM projects`);
    const rateMap = new Map<string, number>();
    for (const r of projRatesRes.rows) rateMap.set(String((r as any).id), Number((r as any).rate || 0));

    const conversionRate = 83.0;

    const cfgRes = await query(`SELECT first_tier_rate, second_tier_rate, first_tier_limit FROM salary_config WHERE id = 1`);
    const cfg = cfgRes.rows[0] || { first_tier_rate: 0.5, second_tier_rate: 0.6, first_tier_limit: 500 };
    const fRate = Number(cfg.first_tier_rate || 0);
    const sRate = Number(cfg.second_tier_rate || 0);
    const fLimit = Number(cfg.first_tier_limit || 0);

    const calcEarning = (files: number) => {
      const t1 = Math.min(files, fLimit);
      const t2 = Math.max(0, files - fLimit);
      return t1 * fRate + t2 * sRate;
    };

    const result: any[] = [];

    for (const m of months) {
      const monthStart = `${m}-01`;
      const next = new Date(`${m}-01T00:00:00Z`);
      next.setUTCMonth(next.getUTCMonth() + 1);
      const nextStr = next.toISOString().substring(0, 10);

      const sqlManual = `
        SELECT fp.project_id, COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) AS completed
          FROM file_requests fr JOIN file_processes fp ON fp.id = fr.file_process_id
         WHERE fr.status = 'completed' AND fr.completed_date >= $1 AND fr.completed_date < $2
         GROUP BY fp.project_id`;
      const sqlAutomation = `
        SELECT fp.project_id, COALESCE(SUM((d->>'completed')::INT),0) AS completed
          FROM file_processes fp
          JOIN LATERAL jsonb_array_elements(fp.automation_config->'dailyCompletions') AS d ON TRUE
         WHERE fp.type = 'automation' AND fp.automation_config IS NOT NULL
           AND (d->>'date')::DATE >= $1 AND (d->>'date')::DATE < $2
         GROUP BY fp.project_id`;
      const [rowsManual, rowsAuto] = await Promise.all([
        query(sqlManual, [monthStart, nextStr]),
        query(sqlAutomation, [monthStart, nextStr]),
      ]);
      const byProject = new Map<string, number>();
      for (const r of [...rowsManual.rows, ...rowsAuto.rows]) {
        const p = String((r as any).project_id || '');
        const c = Number((r as any).completed || 0);
        if (!p) continue; byProject.set(p, (byProject.get(p) || 0) + c);
      }
      let revenueUSD = 0;
      for (const [pId, completed] of byProject.entries()) revenueUSD += completed * (rateMap.get(pId) || 0);
      const revenue = revenueUSD * conversionRate;

      const userFilesRes = await query(
        `SELECT COALESCE(SUM(COALESCE(fr.assigned_count, fr.requested_count, 0)),0) AS files
           FROM file_requests fr WHERE fr.status='completed' AND fr.completed_date >= $1 AND fr.completed_date < $2`,
        [monthStart, nextStr]
      );
      const monthlyFiles = Number(userFilesRes.rows[0]?.files || 0);
      const userSalaries = calcEarning(monthlyFiles);

      const pmRes = await query(`SELECT COALESCE(SUM(monthly_salary)::FLOAT8,0) AS total FROM pm_salaries WHERE is_active = true AND effective_from < $1`, [nextStr]);
      const pmSalaries = Number(pmRes.rows[0]?.total || 0);
      const salaryExpense = userSalaries + pmSalaries;

      const adminRes = await query(`SELECT COALESCE(SUM(amount)::FLOAT8,0) AS total FROM expenses WHERE month=$1 AND status <> 'rejected'`, [m]);
      const adminExpense = Number(adminRes.rows[0]?.total || 0);

      const totalExpense = salaryExpense + adminExpense;
      const netProfit = revenue - totalExpense;
      const profitMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;

      result.push({ month: m, revenue, salaryExpense, adminExpense, totalExpense, netProfit, profitMargin });
    }

    res.json({ data: result });
  } catch (error) {
    console.error("Error fetching profit & loss data:", error);
    res.status(500).json({ error: { code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch profit & loss data" } });
  }
});

// GET /api/expenses/export - Export expenses report
router.get("/export", async (req: Request, res: Response) => {
  try {
    const { format = "csv", month, type } = req.query;

    // Mock CSV generation
    const csvData = [
      [
        "Date",
        "Category",
        "Type",
        "Description",
        "Amount",
        "Status",
        "Approved By",
      ],
      [
        "2024-01-01",
        "Office Rent",
        "administrative",
        "Monthly office rent payment",
        "25000",
        "approved",
        "Admin",
      ],
      [
        "2024-01-05",
        "Utilities",
        "utilities",
        "Electricity and internet bills",
        "5500",
        "approved",
        "Admin",
      ],
      [
        "2024-01-10",
        "Software Licenses",
        "operational",
        "Annual software subscription renewals",
        "8000",
        "approved",
        "Admin",
      ],
      [
        "2024-01-15",
        "Marketing",
        "marketing",
        "Digital marketing campaigns",
        "12000",
        "pending",
        "",
      ],
    ];

    const csvContent = csvData.map((row) => row.join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="expense-report-${month || "current"}.csv"`,
    );
    res.send(csvContent);
  } catch (error) {
    console.error("Error exporting expenses:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to export expenses",
      },
    });
  }
});

export default router;
