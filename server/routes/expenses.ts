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
    const query = expenseQuerySchema.parse(req.query);

    // Mock expense data for demonstration
    const mockExpenses = [
      {
        id: "1",
        category: "Office Rent",
        description: "Monthly office rent payment",
        amount: 25000,
        date: "2024-01-01",
        month: "2024-01",
        type: "administrative",
        status: "approved",
        approvedBy: "Admin",
        createdAt: "2024-01-01T00:00:00Z",
        updatedAt: "2024-01-01T00:00:00Z",
        createdBy: {
          id: "admin-id",
          name: "Admin User",
        },
      },
      {
        id: "2",
        category: "Utilities",
        description: "Electricity and internet bills",
        amount: 5500,
        date: "2024-01-05",
        month: "2024-01",
        type: "utilities",
        status: "approved",
        approvedBy: "Admin",
        createdAt: "2024-01-05T00:00:00Z",
        updatedAt: "2024-01-05T00:00:00Z",
        createdBy: {
          id: "admin-id",
          name: "Admin User",
        },
      },
      {
        id: "3",
        category: "Software Licenses",
        description: "Annual software subscription renewals",
        amount: 8000,
        date: "2024-01-10",
        month: "2024-01",
        type: "operational",
        status: "approved",
        approvedBy: "Admin",
        createdAt: "2024-01-10T00:00:00Z",
        updatedAt: "2024-01-10T00:00:00Z",
        createdBy: {
          id: "admin-id",
          name: "Admin User",
        },
      },
      {
        id: "4",
        category: "Marketing",
        description: "Digital marketing campaigns",
        amount: 12000,
        date: "2024-01-15",
        month: "2024-01",
        type: "marketing",
        status: "pending",
        approvedBy: "",
        createdAt: "2024-01-15T00:00:00Z",
        updatedAt: "2024-01-15T00:00:00Z",
        createdBy: {
          id: "admin-id",
          name: "Admin User",
        },
      },
    ];

    // Apply filters
    let filteredExpenses = mockExpenses;

    if (query.type) {
      filteredExpenses = filteredExpenses.filter((e) => e.type === query.type);
    }

    if (query.status) {
      filteredExpenses = filteredExpenses.filter(
        (e) => e.status === query.status,
      );
    }

    if (query.category) {
      filteredExpenses = filteredExpenses.filter((e) =>
        e.category.toLowerCase().includes(query.category!.toLowerCase()),
      );
    }

    if (query.search) {
      const searchLower = query.search.toLowerCase();
      filteredExpenses = filteredExpenses.filter(
        (e) =>
          e.category.toLowerCase().includes(searchLower) ||
          e.description.toLowerCase().includes(searchLower),
      );
    }

    if (query.month) {
      filteredExpenses = filteredExpenses.filter(
        (e) => e.month === query.month,
      );
    }

    // Apply sorting
    filteredExpenses.sort((a, b) => {
      let aVal: any, bVal: any;

      switch (query.sortBy) {
        case "date":
          aVal = new Date(a.date);
          bVal = new Date(b.date);
          break;
        case "amount":
          aVal = a.amount;
          bVal = b.amount;
          break;
        case "category":
          aVal = a.category;
          bVal = b.category;
          break;
        case "type":
          aVal = a.type;
          bVal = b.type;
          break;
        default:
          aVal = new Date(a.date);
          bVal = new Date(b.date);
      }

      if (query.sortOrder === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Apply pagination
    const offset = (query.page - 1) * query.limit;
    const paginatedExpenses = filteredExpenses.slice(
      offset,
      offset + query.limit,
    );

    const statistics = {
      totalExpenses: filteredExpenses.reduce((sum, e) => sum + e.amount, 0),
      approvedCount: filteredExpenses.filter((e) => e.status === "approved")
        .length,
      pendingCount: filteredExpenses.filter((e) => e.status === "pending")
        .length,
      rejectedCount: filteredExpenses.filter((e) => e.status === "rejected")
        .length,
      entryCount: filteredExpenses.length,
    };

    res.json({
      data: paginatedExpenses,
      statistics,
      pagination: {
        total: filteredExpenses.length,
        page: query.page,
        limit: query.limit,
        totalPages: Math.ceil(filteredExpenses.length / query.limit),
      },
    });
  } catch (error) {
    console.error("Error fetching expenses:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch expenses",
      },
    });
  }
});

// GET /api/expenses/:id - Get single expense
router.get("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Mock single expense data
    const mockExpense = {
      id: id,
      category: "Office Rent",
      description: "Monthly office rent payment",
      amount: 25000,
      date: "2024-01-01",
      month: "2024-01",
      type: "administrative",
      receipt: "/uploads/receipts/office-rent-jan-2024.pdf",
      status: "approved",
      approvedBy: "Admin",
      approvedAt: "2024-01-02T10:00:00Z",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-02T10:00:00Z",
      createdBy: {
        id: "admin-id",
        name: "Admin User",
      },
    };

    res.json({ data: mockExpense });
  } catch (error) {
    console.error("Error fetching expense:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch expense",
      },
    });
  }
});

// POST /api/expenses - Create new expense
router.post("/", async (req: Request, res: Response) => {
  try {
    const expenseData = createExpenseSchema.parse(req.body);

    // Mock creation
    const newExpense = {
      id: Date.now().toString(),
      ...expenseData,
      month: expenseData.date.substring(0, 7), // Extract YYYY-MM
      status: "pending" as const,
      approvedBy: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: "current-user-id",
        name: "Current User",
      },
    };

    res.status(201).json({ data: newExpense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense data",
          details: error.errors,
        },
      });
    } else {
      console.error("Error creating expense:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create expense",
        },
      });
    }
  }
});

// PUT /api/expenses/:id - Update expense
router.put("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const expenseData = updateExpenseSchema.parse(req.body);

    // Mock update
    const updatedExpense = {
      id: id,
      category: expenseData.category || "Office Rent",
      description: expenseData.description || "Monthly office rent payment",
      amount: expenseData.amount || 25000,
      date: expenseData.date || "2024-01-01",
      month: (expenseData.date || "2024-01-01").substring(0, 7),
      type: expenseData.type || "administrative",
      receipt: expenseData.receipt,
      status: expenseData.status || "pending",
      approvedBy: "Admin",
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: "admin-id",
        name: "Admin User",
      },
    };

    res.json({ data: updatedExpense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid expense data",
          details: error.errors,
        },
      });
    } else {
      console.error("Error updating expense:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update expense",
        },
      });
    }
  }
});

// POST /api/expenses/:id/approve - Approve/reject expense
router.post("/:id/approve", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, notes } = approveExpenseSchema.parse(req.body);

    // Mock approval
    const approvedExpense = {
      id: id,
      category: "Office Rent",
      description: "Monthly office rent payment",
      amount: 25000,
      date: "2024-01-01",
      month: "2024-01",
      type: "administrative",
      status: status,
      approvedBy: "Current User",
      approvedAt: new Date().toISOString(),
      approvalNotes: notes,
      rejectionReason: status === "rejected" ? notes : undefined,
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: new Date().toISOString(),
      createdBy: {
        id: "admin-id",
        name: "Admin User",
      },
    };

    res.json({ data: approvedExpense });
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: "Invalid approval data",
          details: error.errors,
        },
      });
    } else {
      console.error("Error approving expense:", error);
      res.status(500).json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to approve expense",
        },
      });
    }
  }
});

// DELETE /api/expenses/:id - Delete expense
router.delete("/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Mock deletion
    res.json({
      success: true,
      message: "Expense deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting expense:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to delete expense",
      },
    });
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

    const data = {
      users: {
        firstTierRate: Number(row.first_tier_rate),
        secondTierRate: Number(row.second_tier_rate),
        firstTierLimit: Number(row.first_tier_limit),
      },
      projectManagers: {},
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

// GET /api/expenses/salary/users - Get user salary data
router.get("/salary/users", async (req: Request, res: Response) => {
  try {
    const { month } = req.query as any;
    const targetMonth = month || new Date().toISOString().substring(0, 7);
    const monthStart = `${targetMonth}-01`;
    const nextMonthDate = new Date(monthStart);
    nextMonthDate.setMonth(nextMonthDate.getMonth() + 1);
    const nextMonth = nextMonthDate.toISOString().substring(0, 10);

    // Aggregate monthly data and earnings per user (today, weekly, monthly)
    const sql = `
      SELECT u.id as user_id, u.name as user_name,
             SUM(ust.files_processed) as monthly_files,
             COALESCE(SUM(CASE WHEN ust.date = CURRENT_DATE THEN ust.files_processed ELSE 0 END),0) as today_files,
             COALESCE(SUM(CASE WHEN ust.date >= (CURRENT_DATE - INTERVAL '6 day') THEN ust.files_processed ELSE 0 END),0) as weekly_files,
             COALESCE(SUM(ust.total_earnings),0) as monthly_earnings,
             COALESCE(SUM(CASE WHEN ust.date = CURRENT_DATE THEN ust.total_earnings ELSE 0 END),0) as today_earnings,
             COALESCE(SUM(CASE WHEN ust.date >= (CURRENT_DATE - INTERVAL '6 day') THEN ust.total_earnings ELSE 0 END),0) as weekly_earnings
      FROM user_salary_tracking ust
      JOIN users u ON ust.user_id = u.id
      WHERE ust.date >= $1 AND ust.date < $2
      GROUP BY u.id, u.name
      ORDER BY u.name
    `;
    const result = await query(sql, [monthStart, nextMonth]);
    const users = result.rows.map((r: any) => ({
      id: r.user_id,
      name: r.user_name,
      role: "user",
      todayFiles: Number(r.today_files || 0),
      weeklyFiles: Number(r.weekly_files || 0),
      monthlyFiles: Number(r.monthly_files || 0),
      todayEarnings: Number(r.today_earnings || 0),
      weeklyEarnings: Number(r.weekly_earnings || 0),
      monthlyEarnings: Number(r.monthly_earnings || 0),
      attendanceRate: 0,
      lastActive: null,
    }));

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

    // Get active PM salaries effective on or before target month
    const sql = `
      SELECT ps.id, ps.user_id, ps.monthly_salary, u.name
      FROM pm_salaries ps
      JOIN users u ON ps.user_id = u.id
      WHERE ps.is_active = true AND ps.effective_from <= $1
      ORDER BY u.name
    `;
    const result = await query(sql, [monthStart]);
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

// POST /api/expenses/salary/project-managers - Create or update PM salary by name/email
router.post("/salary/project-managers", async (req: Request, res: Response) => {
  try {
    const { name, email, monthlySalary } = req.body as any;
    if (!name || !monthlySalary) {
      return res
        .status(400)
        .json({
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

    res
      .status(201)
      .json({
        data: {
          id: pmRow.id,
          userId: pmRow.user_id,
          monthlySalary: Number(pmRow.monthly_salary),
        },
      });
  } catch (error) {
    console.error("Error creating PM salary:", error);
    res
      .status(500)
      .json({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create PM salary",
        },
      });
  }
});

// ===== FINANCIAL ANALYTICS ENDPOINTS =====

// GET /api/expenses/analytics/dashboard - Get expense dashboard data
router.get("/analytics/dashboard", async (req: Request, res: Response) => {
  try {
    const { month = "2024-01" } = req.query;

    const mockDashboardData = {
      currentMonth: {
        totalRevenue: 420000,
        totalExpenses: 270460,
        netProfit: 149540,
        profitMargin: 35.6,
        salaryExpenses: 81960,
        adminExpenses: 50500,
      },
      trends: {
        revenueGrowth: 12.5,
        expenseGrowth: 8.3,
        profitGrowth: 18.7,
      },
      alerts: [
        {
          type: "budget_warning",
          message: "Marketing expenses are 15% over budget for this month",
          severity: "medium",
        },
      ],
      topExpenseCategories: [
        {
          name: "Salaries",
          value: 81960,
          percentage: 72.8,
          fill: "#3b82f6",
          count: 4,
        },
        {
          name: "Administrative",
          value: 25000,
          percentage: 22.2,
          fill: "#ef4444",
          count: 1,
        },
        {
          name: "Operational",
          value: 8000,
          percentage: 7.1,
          fill: "#f59e0b",
          count: 1,
        },
        {
          name: "Marketing",
          value: 12000,
          percentage: 10.7,
          fill: "#10b981",
          count: 1,
        },
        {
          name: "Utilities",
          value: 5500,
          percentage: 4.9,
          fill: "#8b5cf6",
          count: 1,
        },
      ],
    };

    res.json({ data: mockDashboardData });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch dashboard analytics",
      },
    });
  }
});

// GET /api/expenses/analytics/profit-loss - Get profit & loss data
router.get("/analytics/profit-loss", async (req: Request, res: Response) => {
  try {
    const mockProfitLossData = [
      {
        month: "2023-10",
        revenue: 285000,
        salaryExpense: 145000,
        adminExpense: 45000,
        totalExpense: 190000,
        netProfit: 95000,
        profitMargin: 33.3,
      },
      {
        month: "2023-11",
        revenue: 320000,
        salaryExpense: 152000,
        adminExpense: 48000,
        totalExpense: 200000,
        netProfit: 120000,
        profitMargin: 37.5,
      },
      {
        month: "2023-12",
        revenue: 375000,
        salaryExpense: 165000,
        adminExpense: 52000,
        totalExpense: 217000,
        netProfit: 158000,
        profitMargin: 42.1,
      },
      {
        month: "2024-01",
        revenue: 420000,
        salaryExpense: 170000,
        adminExpense: 50500,
        totalExpense: 220500,
        netProfit: 199500,
        profitMargin: 47.5,
      },
    ];

    res.json({ data: mockProfitLossData });
  } catch (error) {
    console.error("Error fetching profit & loss data:", error);
    res.status(500).json({
      error: {
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to fetch profit & loss data",
      },
    });
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
