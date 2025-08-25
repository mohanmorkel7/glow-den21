// Shared types for BPO Management Platform API
// Used by both client and server for type safety

// ===== USER TYPES =====
export type UserRole = 'super_admin' | 'project_manager' | 'user';
export type UserStatus = 'active' | 'inactive';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: UserStatus;
  department?: string;
  jobTitle?: string;
  avatarUrl?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notificationsEnabled?: boolean;
  joinDate: string;
  lastLogin?: string;
  projectsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
  department?: string;
  jobTitle?: string;
}

export interface UpdateUserRequest {
  name?: string;
  phone?: string;
  role?: UserRole;
  department?: string;
  jobTitle?: string;
  theme?: 'light' | 'dark' | 'system';
  language?: string;
  notificationsEnabled?: boolean;
}

export interface ChangePasswordRequest {
  currentPassword?: string;
  newPassword: string;
}

// ===== PROJECT TYPES =====
export type ProjectStatus = 'planning' | 'active' | 'on_hold' | 'completed';
export type ProjectPriority = 'low' | 'medium' | 'high';
export type ProjectType = 'monthly' | 'weekly' | 'both';

export interface FileTargets {
  monthly?: number;
  weekly?: number;
  dailyCapacity: number;
}

export interface FileCounts {
  monthlyCompleted: number;
  weeklyCompleted: number;
  dailyCompleted: number;
  totalCompleted: number;
}

export interface ProjectRates {
  ratePerFile: number; // USD per file
  currency: 'USD';
}

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  type: ProjectType;
  startDate?: string;
  endDate?: string;

  // File-based tracking
  fileTargets: FileTargets;
  fileCounts: FileCounts;
  rates: ProjectRates;

  // Legacy counts for compatibility
  targetCount: number;
  currentCount: number;
  progressPercentage: number;

  assignedUsersCount: number;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ProjectDetails extends Project {
  assignedUsers: User[];
}

export interface CreateProjectRequest {
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  type: ProjectType;
  startDate?: string;
  endDate?: string;
  fileTargets: FileTargets;
  rates: ProjectRates;
  assignedUsers: string[];
  // Legacy for compatibility
  targetCount?: number;
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  type?: ProjectType;
  startDate?: string;
  endDate?: string;
  fileTargets?: FileTargets;
  rates?: ProjectRates;
  assignedUsers?: string[];
  // Legacy for compatibility
  targetCount?: number;
}

export interface ProjectAssignmentRequest {
  userIds: string[];
  roleInProject?: string;
}

// ===== DAILY COUNT TYPES =====
export type DailyCountStatus = 'pending' | 'submitted' | 'approved' | 'rejected';

export interface DailyCount {
  id: string;
  userId: string;
  userName: string;
  projectId: string;
  projectName: string;
  date: string;

  // File-based counts
  targetFileCount: number;
  submittedFileCount: number;
  completedFileCount: number;
  balanceFileCount: number;

  // Legacy counts for compatibility
  targetCount: number;
  submittedCount: number;

  status: DailyCountStatus;
  notes?: string;
  submittedAt?: string;
  autoSubmittedAt?: string; // For automatic daily updates
  approvedBy?: {
    id: string;
    name: string;
  };
  approvedAt?: string;
  rejectionReason?: string;
}

export interface CreateDailyCountRequest {
  projectId: string;
  date: string;
  submittedFileCount: number;
  completedFileCount: number;
  notes?: string;
  // Legacy for compatibility
  submittedCount?: number;
}

export interface UpdateDailyCountRequest {
  submittedFileCount?: number;
  completedFileCount?: number;
  notes?: string;
  // Legacy for compatibility
  submittedCount?: number;
}

export interface ApproveDailyCountRequest {
  notes?: string;
}

export interface RejectDailyCountRequest {
  reason: string;
}

export interface DailyCountStatistics {
  totalTargetFiles: number;
  totalSubmittedFiles: number;
  totalCompletedFiles: number;
  totalBalanceFiles: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  // Legacy for compatibility
  totalTarget: number;
  totalSubmitted: number;
}

// ===== NOTIFICATION TYPES =====
export type NotificationType = 'info' | 'warning' | 'error' | 'success';
export type NotificationCategory = 'system' | 'project' | 'user' | 'deadline';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  isRead: boolean;
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  expiresAt?: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  category: NotificationCategory;
  recipients: string[];
  expiresAt?: string;
}

export interface NotificationSettings {
  emailEnabled: boolean;
  pushEnabled: boolean;
  smsEnabled: boolean;
  categories: {
    [key in NotificationCategory]: {
      email: boolean;
      push: boolean;
      sms: boolean;
    };
  };
}

// ===== PERMISSION & ROLE TYPES =====
export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: string;
  isActive: boolean;
  usedInRoles?: number;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];
  userCount: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateRoleRequest {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
}

export interface RoleAssignment {
  userId: string;
  userName: string;
  email: string;
  currentRole: string;
  assignedProjects: number;
  lastLogin?: string;
}

export interface RoleAssignmentRequest {
  userId: string;
  roleId: string;
}

// ===== SETTINGS TYPES =====
export interface CompanySettings {
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  workingHours: {
    start: string;
    end: string;
  };
  // Daily update configuration
  dailyUpdateTime: string; // HH:MM format (e.g., '20:00' for 8 PM)
  dailyUpdateTimezone: string; // e.g., 'Asia/Kolkata'
  autoUpdateEnabled: boolean;
  // Currency conversion
  usdToInrRate: number;
}

export interface SystemSettings {
  maxFileSize: number;
  sessionTimeout: number;
  backupFrequency: string;
  maintenanceMode: boolean;
  debugMode: boolean;
  apiRateLimit: number;
  allowRegistration: boolean;
  requireEmailVerification: boolean;
}

export interface SecuritySettings {
  passwordMinLength: number;
  passwordRequireSpecialChars: boolean;
  passwordRequireNumbers: boolean;
  passwordRequireUppercase: boolean;
  maxLoginAttempts: number;
  lockoutDuration: number;
  twoFactorEnabled: boolean;
  sessionSecurity: 'basic' | 'enhanced' | 'strict';
}

export interface EmailIntegrationSettings {
  smtpServer?: string;
  smtpPort: number;
  smtpSecurity: 'none' | 'tls' | 'ssl';
  smtpUsername?: string;
  smtpPassword?: string;
  isConfigured: boolean;
  lastTestedAt?: string;
}

// ===== REPORT TYPES =====
export interface DashboardSummary {
  overallEfficiency: number;
  totalCompleted: number;
  activeProjects: number;
  teamPerformance: string;
  growthRate?: number;
  capacityUtilization?: number;
  qualityScore?: number;
}

export interface ProductivityData {
  date: string;
  target: number;
  actual: number;
  efficiency: number;
}

export interface ProjectPerformance {
  id: string;
  name: string;
  completed: number;
  target: number;
  efficiency: number;
  status: ProjectStatus;
}

export interface UserPerformance {
  id: string;
  name: string;
  completed: number;
  target: number;
  efficiency: number;
  projects: number;
  rating: string;
}

export interface MonthlyTrend {
  month: string;
  projects: number;
  users: number;
  efficiency: number;
}

// ===== AUTHENTICATION TYPES =====
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  permissions: string[];
}

// ===== API RESPONSE TYPES =====
export interface ApiResponse<T = any> {
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any[];
  };
}

export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ListResponse<T = any> extends ApiResponse<PaginatedResponse<T>> {}

// ===== QUERY PARAMETERS =====
export interface PaginationQuery {
  page?: number;
  limit?: number;
}

export interface SearchQuery extends PaginationQuery {
  search?: string;
}

export interface UserListQuery extends SearchQuery {
  role?: UserRole;
  status?: UserStatus;
}

export interface ProjectListQuery extends SearchQuery {
  status?: ProjectStatus;
  assignedUser?: string;
}

export interface DailyCountListQuery extends SearchQuery {
  userId?: string;
  projectId?: string;
  from?: string;
  to?: string;
  status?: DailyCountStatus;
}

export interface NotificationListQuery extends SearchQuery {
  category?: NotificationCategory;
  type?: NotificationType;
  unreadOnly?: boolean;
}

export interface ReportQuery {
  period?: 'week' | 'month' | 'quarter' | 'year';
  from?: string;
  to?: string;
  projectId?: string;
  groupBy?: 'day' | 'week' | 'month';
}

// ===== BACKUP & DATA MANAGEMENT =====
export interface BackupInfo {
  id: string;
  filename: string;
  fileSize: number;
  backupType: 'full' | 'incremental';
  status: 'in_progress' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
  createdBy: {
    id: string;
    name: string;
  };
}

export interface SystemStats {
  totalUsers: number;
  totalProjects: number;
  totalDailyCounts: number;
  databaseSize: string;
  activeConnections: number;
  uptime: number;
}

export interface HealthCheck {
  status: 'healthy' | 'degraded' | 'unhealthy';
  database: 'connected' | 'disconnected';
  version: string;
  uptime: number;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail';
      message?: string;
    };
  };
}

// ===== ERROR TYPES =====
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ValidationError[];
  statusCode?: number;
}

// ===== EXPORT TYPES =====
export interface ExportRequest {
  type: 'users' | 'projects' | 'counts' | 'all';
  format: 'csv' | 'excel' | 'json';
  from?: string;
  to?: string;
  filters?: Record<string, any>;
}

export interface ImportResult {
  success: boolean;
  imported: number;
  failed: number;
  errors: string[];
}

// ===== ACTIVITY LOG TYPES =====
export interface ActivityLog {
  id: string;
  userId?: string;
  userName?: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

// ===== BILLING TYPES =====
export interface ProjectBilling {
  projectId: string;
  projectName: string;
  month: string; // YYYY-MM format
  filesCompleted: number;
  ratePerFile: number;
  amountUSD: number;
  amountINR: number;
  conversionRate: number;
  status: 'draft' | 'finalized' | 'paid';
  createdAt: string;
}

export interface MonthlyBillingSummary {
  month: string;
  totalFilesCompleted: number;
  totalAmountUSD: number;
  totalAmountINR: number;
  conversionRate: number;
  projectsCount: number;
  projects: ProjectBilling[];
}

export interface BillingExportRequest {
  month?: string;
  projectId?: string;
  format: 'csv' | 'excel' | 'pdf';
  currency: 'USD' | 'INR' | 'both';
}

// ===== CHART DATA TYPES =====
export interface ChartDataPoint {
  label: string;
  value: number;
  date?: string;
}

export interface ProductivityChartData {
  daily: ChartDataPoint[];
  weekly: ChartDataPoint[];
  monthly: ChartDataPoint[];
}

export interface ProjectProgressChart {
  projectId: string;
  projectName: string;
  targetFiles: number;
  completedFiles: number;
  dailyProgress: ChartDataPoint[];
  weeklyProgress: ChartDataPoint[];
}

// ===== FILE PROCESSING TYPES =====
export type FileProcessingJobType = 'mo_monthly' | 'mo_weekly';
export type AssignmentType = 'automation' | 'manual';
export type FileProcessingJobStatus = 'draft' | 'active' | 'paused' | 'completed' | 'cancelled';
export type JobAssignmentStatus = 'pending' | 'assigned' | 'in_progress' | 'completed';

export interface FileProcessingJob {
  id: string;
  name: string;
  type: FileProcessingJobType;
  description?: string;

  // File and billing details
  totalFileCount: number;
  completedFileCount: number;
  ratePerFile: number; // USD per file
  totalValue: number; // totalFileCount * ratePerFile

  // Timeline
  startDate: string;
  targetEndDate: string;
  actualEndDate?: string;

  // Assignment
  assignmentType: AssignmentType;
  assignedUsers: string[]; // User IDs for manual assignment
  automationSettings?: {
    dailyCapacity: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: number[]; // 0-6 (Sunday-Saturday)
  };

  // Progress tracking
  dailyTargets: {
    date: string;
    targetFiles: number;
    completedFiles: number;
    assignedTo?: string; // User ID or 'automation'
  }[];

  status: FileProcessingJobStatus;
  progress: number; // 0-100
  estimatedCompletionDate?: string;

  // Metadata
  createdBy: {
    id: string;
    name: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface CreateFileProcessingJobRequest {
  name: string;
  type: FileProcessingJobType;
  description?: string;
  totalFileCount: number;
  targetEndDate: string;
  assignmentType: AssignmentType;
  assignedUsers?: string[];
  automationSettings?: {
    dailyCapacity: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: number[];
  };
}

export interface UpdateFileProcessingJobRequest {
  name?: string;
  description?: string;
  totalFileCount?: number;
  targetEndDate?: string;
  assignmentType?: AssignmentType;
  assignedUsers?: string[];
  automationSettings?: {
    dailyCapacity: number;
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: number[];
  };
  status?: FileProcessingJobStatus;
}

export interface FileProcessingAssignment {
  id: string;
  jobId: string;
  jobName: string;
  userId?: string; // null for automation
  userName?: string;
  assignmentType: AssignmentType;

  // File allocation
  allocatedFiles: number;
  completedFiles: number;
  remainingFiles: number;

  // Timeline
  assignedDate: string;
  dueDate: string;
  completedDate?: string;

  status: JobAssignmentStatus;
  progress: number;

  // Daily breakdown
  dailyProgress: {
    date: string;
    targetFiles: number;
    completedFiles: number;
    efficiency: number;
  }[];
}

export interface FileProcessingDailyUpdate {
  id: string;
  jobId: string;
  assignmentId?: string;
  userId?: string; // null for automation
  date: string;

  targetFiles: number;
  completedFiles: number;
  balanceFiles: number;

  notes?: string;
  submittedAt: string;
  approvedAt?: string;
  approvedBy?: {
    id: string;
    name: string;
  };

  status: DailyCountStatus;
}

export interface FileProcessingBilling {
  jobId: string;
  jobName: string;
  jobType: FileProcessingJobType;

  totalFiles: number;
  completedFiles: number;
  ratePerFile: number;

  amountUSD: number;
  amountINR: number;
  conversionRate: number;

  period: string; // YYYY-MM format
  status: 'draft' | 'finalized' | 'invoiced' | 'paid';

  createdAt: string;
  updatedAt: string;
}

// ===== UTILITY TYPES =====
export type SortOrder = 'asc' | 'desc';

export interface SortQuery {
  sortBy?: string;
  sortOrder?: SortOrder;
}

export interface DateRangeQuery {
  from?: string;
  to?: string;
}

export interface FilterQuery extends PaginationQuery, SortQuery, DateRangeQuery {
  [key: string]: any;
}

// ===== EXPENSE MANAGEMENT TYPES =====
export type ExpenseType = 'administrative' | 'operational' | 'marketing' | 'utilities' | 'miscellaneous';
export type ExpenseStatus = 'pending' | 'approved' | 'rejected';

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

export interface ProfitLossData {
  month: string;            // YYYY-MM format
  revenue: number;
  salaryExpense: number;    // Total salary costs
  adminExpense: number;     // Total administrative expenses
  totalExpense: number;     // All expenses combined
  netProfit: number;        // Revenue - Total Expense
  profitMargin: number;     // (Net Profit / Revenue) * 100
}

export interface ExpenseBreakdown {
  name: string;             // Category name
  value: number;            // Amount
  percentage: number;       // Percentage of total
  fill: string;            // Color for charts
  count: number;           // Number of entries
}

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
}

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

// Type guards for runtime type checking
export const isUserRole = (role: string): role is UserRole => {
  return ['super_admin', 'project_manager', 'user'].includes(role);
};

export const isProjectStatus = (status: string): status is ProjectStatus => {
  return ['planning', 'active', 'on_hold', 'completed'].includes(status);
};

export const isDailyCountStatus = (status: string): status is DailyCountStatus => {
  return ['pending', 'submitted', 'approved', 'rejected'].includes(status);
};

export const isNotificationType = (type: string): type is NotificationType => {
  return ['info', 'warning', 'error', 'success'].includes(type);
};

export const isNotificationCategory = (category: string): category is NotificationCategory => {
  return ['system', 'project', 'user', 'deadline'].includes(category);
};
