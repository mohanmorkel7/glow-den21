// Expense Management Types for BPO Platform
// Types for salary management, administrative expenses, and financial reporting

// ===== SALARY MANAGEMENT TYPES =====
export interface SalaryConfig {
  users: {
    firstTierRate: number;     // Rate for first N files (in currency)
    secondTierRate: number;    // Rate after first tier (in currency)
    firstTierLimit: number;    // Number of files for first tier (e.g., 500)
  };
  projectManagers: {
    [pmId: string]: number;    // Individual monthly salaries by PM ID
  };
  currency: 'USD' | 'INR';
  updatedAt: string;
  updatedBy: {
    id: string;
    name: string;
  };
}

export interface UserSalaryData {
  id: string;
  name: string;
  role: string;
  
  // File counts (resets daily)
  todayFiles: number;
  weeklyFiles: number;
  monthlyFiles: number;
  
  // Earnings based on file counts
  todayEarnings: number;
  weeklyEarnings: number;
  monthlyEarnings: number;
  
  // Performance metrics
  attendanceRate: number;
  lastActive: string;
  
  // Daily breakdown for detailed view
  dailyBreakdown?: SalaryBreakdown[];
}

export interface ProjectManagerSalaryData {
  id: string;
  name: string;
  role: string;
  monthlySalary: number;     // Fixed monthly amount
  attendanceRate: number;
  lastActive: string;
  department?: string;
}

export interface SalaryBreakdown {
  period: string;           // Date or period label
  files: number;            // Total files processed
  tier1Files: number;       // Files in first tier
  tier1Rate: number;        // Rate for first tier
  tier1Amount: number;      // Earnings from first tier
  tier2Files: number;       // Files in second tier
  tier2Rate: number;        // Rate for second tier
  tier2Amount: number;      // Earnings from second tier
  totalAmount: number;      // Total earnings for period
}

export interface UpdateSalaryConfigRequest {
  users?: {
    firstTierRate?: number;
    secondTierRate?: number;
    firstTierLimit?: number;
  };
  projectManagers?: {
    [pmId: string]: number;
  };
}

// ===== ADMINISTRATIVE EXPENSES TYPES =====
export type ExpenseType = 'administrative' | 'operational' | 'marketing' | 'utilities' | 'miscellaneous';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

export interface ExpenseEntry {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;              // YYYY-MM-DD format
  month: string;            // YYYY-MM format
  type: ExpenseType;
  receipt?: string;         // File path or URL
  approvedBy: string;       // User name or ID
  status: ExpenseStatus;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface CreateExpenseRequest {
  category: string;
  description: string;
  amount: number;
  date: string;
  type: ExpenseType;
  receipt?: string;
}

export interface UpdateExpenseRequest {
  category?: string;
  description?: string;
  amount?: number;
  date?: string;
  type?: ExpenseType;
  receipt?: string;
  status?: ExpenseStatus;
}

export interface ApproveExpenseRequest {
  status: 'approved' | 'rejected';
  notes?: string;
}

// ===== PROFIT & LOSS TYPES =====
export interface ProfitLossData {
  month: string;            // YYYY-MM format
  revenue: number;
  salaryExpense: number;    // Total salary costs
  adminExpense: number;     // Total administrative expenses
  totalExpense: number;     // All expenses combined
  netProfit: number;        // Revenue - Total Expense
  profitMargin: number;     // (Net Profit / Revenue) * 100
}

export interface MonthlyFinancialSummary {
  month: string;
  
  // Revenue breakdown
  projectRevenue: number;
  otherRevenue: number;
  totalRevenue: number;
  
  // Expense breakdown
  userSalaries: number;
  pmSalaries: number;
  totalSalaries: number;
  
  adminExpenses: number;
  operationalExpenses: number;
  marketingExpenses: number;
  utilitiesExpenses: number;
  miscExpenses: number;
  totalAdminExpenses: number;
  
  totalExpenses: number;
  netProfit: number;
  profitMargin: number;
  
  // Metrics
  salaryToRevenueRatio: number;
  expenseToRevenueRatio: number;
  growthRate?: number;        // Compared to previous month
}

// ===== EXPENSE ANALYTICS TYPES =====
export interface ExpenseBreakdown {
  name: string;             // Category name
  value: number;            // Amount
  percentage: number;       // Percentage of total
  fill: string;            // Color for charts
  count: number;           // Number of entries
}

export interface ExpenseAnalytics {
  month: string;
  totalExpenses: number;
  breakdown: ExpenseBreakdown[];
  trends: {
    vs_previous_month: number;    // Percentage change
    vs_previous_year: number;     // Percentage change
  };
  topCategories: {
    category: string;
    amount: number;
    count: number;
  }[];
}

// ===== EXPENSE REPORTING TYPES =====
export interface ExpenseReportRequest {
  from: string;             // YYYY-MM-DD
  to: string;               // YYYY-MM-DD
  type?: ExpenseType;
  status?: ExpenseStatus;
  category?: string;
  format: 'csv' | 'excel' | 'pdf';
  includeSalaries?: boolean;
}

export interface ExpenseReportData {
  period: {
    from: string;
    to: string;
  };
  summary: {
    totalExpenses: number;
    totalSalaries: number;
    totalAdminExpenses: number;
    netAmount: number;
    entryCount: number;
  };
  expenses: ExpenseEntry[];
  salaryData?: {
    userSalaries: UserSalaryData[];
    pmSalaries: ProjectManagerSalaryData[];
    totalSalaryAmount: number;
  };
  analytics: ExpenseAnalytics;
}

// ===== BUDGET MANAGEMENT TYPES =====
export interface BudgetCategory {
  id: string;
  name: string;
  type: ExpenseType;
  monthlyBudget: number;
  currentSpent: number;
  remainingBudget: number;
  percentageUsed: number;
  status: 'on_track' | 'warning' | 'over_budget';
  lastUpdated: string;
}

export interface MonthlyBudget {
  month: string;            // YYYY-MM format
  totalBudget: number;
  totalSpent: number;
  remainingBudget: number;
  categories: BudgetCategory[];
  projectedOverage: number;
  recommendations: string[];
}

export interface SetBudgetRequest {
  month: string;
  categories: {
    type: ExpenseType;
    amount: number;
  }[];
}

// ===== EXPENSE QUERIES =====
export interface ExpenseListQuery {
  page?: number;
  limit?: number;
  search?: string;
  type?: ExpenseType;
  status?: ExpenseStatus;
  category?: string;
  from?: string;           // Date filter
  to?: string;             // Date filter
  month?: string;          // YYYY-MM format
  sortBy?: 'date' | 'amount' | 'category' | 'type';
  sortOrder?: 'asc' | 'desc';
}

export interface SalaryQuery {
  month?: string;          // YYYY-MM format
  userId?: string;
  includeBreakdown?: boolean;
  period?: 'daily' | 'weekly' | 'monthly';
}

export interface FinancialReportQuery {
  period: 'month' | 'quarter' | 'year';
  from?: string;
  to?: string;
  includeProjections?: boolean;
  includeComparisons?: boolean;
}

// ===== DASHBOARD DATA TYPES =====
export interface ExpenseDashboardData {
  currentMonth: {
    totalRevenue: number;
    totalExpenses: number;
    netProfit: number;
    profitMargin: number;
    salaryExpenses: number;
    adminExpenses: number;
  };
  trends: {
    revenueGrowth: number;    // Month-over-month percentage
    expenseGrowth: number;
    profitGrowth: number;
  };
  alerts: {
    type: 'budget_warning' | 'expense_spike' | 'profit_decline';
    message: string;
    severity: 'low' | 'medium' | 'high';
  }[];
  topExpenseCategories: ExpenseBreakdown[];
  recentExpenses: ExpenseEntry[];
}

// ===== TAX AND COMPLIANCE TYPES =====
export interface TaxConfiguration {
  taxYear: number;
  taxRate: number;         // Percentage
  taxableCategories: ExpenseType[];
  deductibleCategories: ExpenseType[];
  reportingCurrency: 'USD' | 'INR';
  fiscalYearStart: string; // MM-DD format
}

export interface TaxReport {
  year: number;
  totalRevenue: number;
  totalDeductibleExpenses: number;
  totalTaxableExpenses: number;
  taxableIncome: number;
  estimatedTax: number;
  quarterlyBreakdown: {
    quarter: number;
    revenue: number;
    expenses: number;
    taxableIncome: number;
    estimatedTax: number;
  }[];
}

// ===== VALIDATION & ERROR TYPES =====
export interface ExpenseValidationError {
  field: string;
  message: string;
  code: 'REQUIRED' | 'INVALID_FORMAT' | 'OUT_OF_RANGE' | 'DUPLICATE';
}

export interface BulkExpenseImportResult {
  successful: number;
  failed: number;
  errors: {
    row: number;
    errors: ExpenseValidationError[];
  }[];
  createdExpenses: ExpenseEntry[];
}

// ===== EXPENSE CATEGORIES CONFIGURATION =====
export interface ExpenseCategory {
  id: string;
  name: string;
  type: ExpenseType;
  description?: string;
  isActive: boolean;
  defaultBudget?: number;
  requiresApproval: boolean;
  requiresReceipt: boolean;
  maxAmount?: number;       // Optional spending limit
  createdAt: string;
}

export interface CreateExpenseCategoryRequest {
  name: string;
  type: ExpenseType;
  description?: string;
  defaultBudget?: number;
  requiresApproval?: boolean;
  requiresReceipt?: boolean;
  maxAmount?: number;
}

// Type guards
export const isExpenseType = (type: string): type is ExpenseType => {
  return ['administrative', 'operational', 'marketing', 'utilities', 'miscellaneous'].includes(type);
};

export const isExpenseStatus = (status: string): status is ExpenseStatus => {
  return ['pending', 'approved', 'rejected'].includes(status);
};

// Utility functions
export const calculateSalaryBreakdown = (
  fileCount: number,
  config: SalaryConfig['users']
): SalaryBreakdown => {
  const tier1Files = Math.min(fileCount, config.firstTierLimit);
  const tier2Files = Math.max(0, fileCount - config.firstTierLimit);
  const tier1Amount = tier1Files * config.firstTierRate;
  const tier2Amount = tier2Files * config.secondTierRate;
  
  return {
    period: 'calculated',
    files: fileCount,
    tier1Files,
    tier1Rate: config.firstTierRate,
    tier1Amount,
    tier2Files,
    tier2Rate: config.secondTierRate,
    tier2Amount,
    totalAmount: tier1Amount + tier2Amount
  };
};

export const formatCurrency = (
  amount: number,
  currency: 'USD' | 'INR' = 'INR'
): string => {
  const symbol = currency === 'USD' ? '$' : '₹';
  const locale = currency === 'USD' ? 'en-US' : 'en-IN';
  
  return `${symbol}${amount.toLocaleString(locale, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};
