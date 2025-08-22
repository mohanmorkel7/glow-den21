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

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  priority: ProjectPriority;
  startDate?: string;
  endDate?: string;
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
  startDate?: string;
  endDate?: string;
  targetCount: number;
  assignedUsers: string[];
}

export interface UpdateProjectRequest {
  name?: string;
  description?: string;
  status?: ProjectStatus;
  priority?: ProjectPriority;
  startDate?: string;
  endDate?: string;
  targetCount?: number;
  assignedUsers?: string[];
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
  targetCount: number;
  submittedCount: number;
  status: DailyCountStatus;
  notes?: string;
  submittedAt?: string;
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
  submittedCount: number;
  notes?: string;
}

export interface UpdateDailyCountRequest {
  submittedCount?: number;
  notes?: string;
}

export interface ApproveDailyCountRequest {
  notes?: string;
}

export interface RejectDailyCountRequest {
  reason: string;
}

export interface DailyCountStatistics {
  totalTarget: number;
  totalSubmitted: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
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
