# BPO Management Platform API Endpoints

## Authentication & Authorization

All endpoints except `/auth/login` require a valid JWT token in the Authorization header:

```
Authorization: Bearer <jwt_token>
```

Role-based access control (RBAC) is enforced on all endpoints based on user permissions.

## Base URL

```
/api
```

---

## 🔐 Authentication Endpoints

### POST /auth/login

Login user and get JWT token

```json
{
  "email": "admin@websyntactic.com",
  "password": "password123"
}
```

**Response:**

```json
{
  "token": "jwt_token_here",
  "user": {
    "id": "uuid",
    "name": "User Name",
    "email": "user@example.com",
    "role": "super_admin",
    "permissions": ["user_create", "project_read", ...]
  }
}
```

### POST /auth/logout

Logout and invalidate token

```json
{}
```

### POST /auth/refresh

Refresh JWT token

```json
{
  "refreshToken": "refresh_token_here"
}
```

### POST /auth/reset-password

Send password reset email

```json
{
  "email": "user@example.com"
}
```

---

## 👥 User Management Endpoints

### GET /users

List users with filtering and pagination
**Query Parameters:**

- `search` - Search by name or email
- `role` - Filter by role (super_admin, project_manager, user)
- `status` - Filter by status (active, inactive)
- `page` - Page number (default: 1)
- `limit` - Items per page (default: 20)

**Response:**

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@websyntactic.com",
      "phone": "+1-555-1234",
      "role": "project_manager",
      "status": "active",
      "department": "Operations",
      "jobTitle": "Senior Manager",
      "joinDate": "2024-01-01",
      "lastLogin": "2024-01-15T10:30:00Z",
      "projectsCount": 3
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20,
    "totalPages": 3
  }
}
```

### GET /users/:id

Get single user details
**Response:** Single user object

### POST /users

Create new user (super_admin only)

```json
{
  "name": "Jane Smith",
  "email": "jane@websyntactic.com",
  "phone": "+1-555-5678",
  "role": "user",
  "password": "securePassword123",
  "department": "Data Entry",
  "jobTitle": "Specialist"
}
```

### PUT /users/:id

Update user (super_admin or self for profile fields)

```json
{
  "name": "Jane Smith Updated",
  "phone": "+1-555-9999",
  "department": "Quality Assurance"
}
```

### PATCH /users/:id/status

Toggle user active/inactive status (super_admin only)

```json
{
  "status": "inactive"
}
```

### DELETE /users/:id

Delete user (super_admin only, cannot delete self)

### GET /users/:id/projects

Get projects assigned to user

### POST /users/:id/change-password

Change user password

```json
{
  "currentPassword": "oldPassword",
  "newPassword": "newSecurePassword"
}
```

---

## 📊 Project Management Endpoints

### GET /projects

List projects with filtering
**Query Parameters:**

- `search` - Search by name or description
- `status` - Filter by status
- `assignedUser` - Filter by assigned user ID
- `page`, `limit` - Pagination

**Response:**

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Data Entry Project Alpha",
      "description": "Process customer registration forms",
      "status": "active",
      "priority": "high",
      "startDate": "2024-01-01",
      "endDate": "2024-01-31",
      "targetCount": 5000,
      "currentCount": 4250,
      "progressPercentage": 85,
      "assignedUsersCount": 3,
      "createdBy": {
        "id": "uuid",
        "name": "Project Creator"
      },
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ],
  "pagination": {...}
}
```

### GET /projects/:id

Get single project with full details including assigned users

### POST /projects

Create new project (super_admin, project_manager)

```json
{
  "name": "New Project",
  "description": "Project description",
  "status": "planning",
  "priority": "medium",
  "startDate": "2024-02-01",
  "endDate": "2024-03-01",
  "targetCount": 1000,
  "assignedUsers": ["user_id_1", "user_id_2"]
}
```

### PUT /projects/:id

Update project

### DELETE /projects/:id

Delete project (super_admin only)

### POST /projects/:id/assign

Assign users to project

```json
{
  "userIds": ["user_id_1", "user_id_2"],
  "roleInProject": "member"
}
```

### DELETE /projects/:id/assign/:userId

Remove user from project

### GET /projects/:id/assignments

Get project team assignments

### GET /projects/:id/progress

Get detailed project progress metrics

---

## 📈 Daily Counts Endpoints

### GET /daily-counts

List daily count submissions
**Query Parameters:**

- `userId` - Filter by user
- `projectId` - Filter by project
- `from`, `to` - Date range filter
- `status` - Filter by status
- `page`, `limit` - Pagination

**Response:**

```json
{
  "dailyCounts": [
    {
      "id": "uuid",
      "userId": "uuid",
      "userName": "John Doe",
      "projectId": "uuid",
      "projectName": "Data Entry Alpha",
      "date": "2024-01-15",
      "targetCount": 100,
      "submittedCount": 95,
      "status": "approved",
      "notes": "Completed all forms for the day",
      "submittedAt": "2024-01-15T17:30:00Z",
      "approvedBy": {
        "id": "uuid",
        "name": "Manager Name"
      },
      "approvedAt": "2024-01-15T18:00:00Z"
    }
  ],
  "statistics": {
    "totalTarget": 1500,
    "totalSubmitted": 1230,
    "pendingCount": 5,
    "approvedCount": 8
  },
  "pagination": {...}
}
```

### GET /daily-counts/:id

Get single daily count submission

### POST /daily-counts

Submit daily count

```json
{
  "projectId": "uuid",
  "date": "2024-01-15",
  "submittedCount": 95,
  "notes": "Additional notes"
}
```

### PUT /daily-counts/:id

Update daily count (before approval only)

### POST /daily-counts/:id/approve

Approve daily count submission (project_manager, super_admin)

```json
{
  "notes": "Approved - good work"
}
```

### POST /daily-counts/:id/reject

Reject daily count submission

```json
{
  "reason": "Count seems too high, please verify"
}
```

### GET /daily-counts/export

Export daily counts to CSV/Excel
**Query Parameters:** Same as list endpoint plus `format=csv|excel`

### POST /daily-counts/import

Bulk import daily counts (CSV upload)

---

## 📊 Reports & Analytics Endpoints

### GET /reports/dashboard-summary

Get dashboard summary statistics
**Query Parameters:**

- `period` - week|month|quarter|year

**Response:**

```json
{
  "overallEfficiency": 97.1,
  "totalCompleted": 8110,
  "activeProjects": 8,
  "teamPerformance": "Excellent",
  "growthRate": 18.5,
  "capacityUtilization": 94.2,
  "qualityScore": 9.1
}
```

### GET /reports/productivity

Get productivity time-series data
**Query Parameters:**

- `from`, `to` - Date range
- `projectId` - Optional project filter
- `groupBy` - day|week|month

**Response:**

```json
{
  "data": [
    {
      "date": "2024-01-15",
      "target": 1500,
      "actual": 1450,
      "efficiency": 96.7
    }
  ]
}
```

### GET /reports/projects/overview

Get project performance overview
**Response:**

```json
{
  "projects": [
    {
      "id": "uuid",
      "name": "Project Name",
      "completed": 4250,
      "target": 5000,
      "efficiency": 85,
      "status": "active"
    }
  ]
}
```

### GET /reports/team-performance

Get team performance metrics
**Response:**

```json
{
  "users": [
    {
      "id": "uuid",
      "name": "User Name",
      "completed": 1420,
      "target": 1500,
      "efficiency": 94.7,
      "projects": 2,
      "rating": "Excellent"
    }
  ]
}
```

### GET /reports/export

Export comprehensive report
**Query Parameters:**

- `type` - productivity|project|team
- `format` - csv|excel|pdf
- Other filters based on type

---

## 🔐 Permissions & Roles Endpoints

### GET /permissions

List all permissions
**Response:**

```json
{
  "permissions": [
    {
      "id": "user_create",
      "name": "Create Users",
      "description": "Ability to create new user accounts",
      "module": "User Management",
      "action": "create",
      "isActive": true,
      "usedInRoles": 1
    }
  ]
}
```

### PUT /permissions/:id/toggle

Toggle permission active status (super_admin only)

### GET /roles

List all roles with permissions

### GET /roles/:id

Get single role with detailed permissions

### POST /roles

Create new role (super_admin only)

```json
{
  "id": "quality_analyst",
  "name": "Quality Analyst",
  "description": "Review and analyze work quality",
  "permissions": ["project_read", "count_approve", "reports_view"]
}
```

### PUT /roles/:id

Update role

### DELETE /roles/:id

Delete role (super_admin only, cannot delete default roles)

### GET /role-assignments

List user role assignments

### POST /role-assignments

Assign role to user

```json
{
  "userId": "uuid",
  "roleId": "project_manager"
}
```

---

## 🔔 Notifications Endpoints

### GET /notifications

List notifications for current user
**Query Parameters:**

- `category` - Filter by category
- `type` - Filter by type
- `unreadOnly` - boolean
- `page`, `limit` - Pagination

**Response:**

```json
{
  "notifications": [
    {
      "id": "uuid",
      "title": "Daily Target Warning",
      "message": "3 users are below today's target",
      "type": "warning",
      "category": "user",
      "isRead": false,
      "createdBy": {
        "id": "uuid",
        "name": "System"
      },
      "createdAt": "2024-01-15T09:30:00Z",
      "expiresAt": "2024-01-15T18:00:00Z"
    }
  ],
  "unreadCount": 3,
  "pagination": {...}
}
```

### GET /notifications/:id

Get single notification

### POST /notifications

Create and send notification (super_admin, project_manager)

```json
{
  "title": "System Maintenance",
  "message": "Scheduled maintenance tonight",
  "type": "info",
  "category": "system",
  "recipients": ["all_users"],
  "expiresAt": "2024-01-16T00:00:00Z"
}
```

### PATCH /notifications/:id/read

Mark notification as read

### POST /notifications/mark-all-read

Mark all notifications as read for current user

### DELETE /notifications/:id

Delete notification (super_admin only)

### GET /notification-settings

Get current user's notification preferences

### PUT /notification-settings

Update notification preferences

```json
{
  "emailEnabled": true,
  "pushEnabled": true,
  "smsEnabled": false,
  "categories": {
    "system": {
      "email": true,
      "push": true,
      "sms": false
    }
  }
}
```

---

## ⚙️ Settings Endpoints

### GET /settings/profile

Get current user's profile

### PUT /settings/profile

Update current user's profile

```json
{
  "name": "Updated Name",
  "phone": "+1-555-9999",
  "department": "New Department",
  "jobTitle": "New Title",
  "theme": "dark",
  "language": "English"
}
```

### GET /settings/company

Get company settings (super_admin, project_manager)

### PUT /settings/company

Update company settings (super_admin only)

```json
{
  "name": "Company Name",
  "address": "123 Business Ave",
  "phone": "+1-555-1234",
  "email": "contact@company.com",
  "website": "https://company.com",
  "timezone": "America/New_York",
  "currency": "USD",
  "dateFormat": "MM/DD/YYYY",
  "workingHours": {
    "start": "09:00",
    "end": "17:00"
  }
}
```

### GET /settings/system

Get system settings (super_admin only)

### PUT /settings/system

Update system settings (super_admin only)

```json
{
  "maxFileSize": 50,
  "sessionTimeout": 30,
  "backupFrequency": "daily",
  "maintenanceMode": false,
  "debugMode": false,
  "apiRateLimit": 1000,
  "allowRegistration": true,
  "requireEmailVerification": true
}
```

### GET /settings/security

Get security settings (super_admin only)

### PUT /settings/security

Update security settings (super_admin only)

```json
{
  "passwordMinLength": 8,
  "passwordRequireSpecialChars": true,
  "passwordRequireNumbers": true,
  "passwordRequireUppercase": true,
  "maxLoginAttempts": 5,
  "lockoutDuration": 15,
  "twoFactorEnabled": false,
  "sessionSecurity": "enhanced"
}
```

---

## 🔗 Integration Endpoints

### GET /integrations/email

Get email integration settings (super_admin only)

### PUT /integrations/email

Update email integration settings (super_admin only)

```json
{
  "smtpServer": "smtp.gmail.com",
  "smtpPort": 587,
  "smtpSecurity": "tls",
  "smtpUsername": "your-email@gmail.com",
  "smtpPassword": "app-password"
}
```

### POST /integrations/email/test

Test email configuration

---

## 💰 Expense Management Endpoints

### GET /expenses

List expenses with filtering and pagination
**Query Parameters:**

- `search` - Search by category or description
- `type` - Filter by expense type (administrative, operational, marketing, utilities, miscellaneous)
- `status` - Filter by status (pending, approved, rejected)
- `category` - Filter by category name
- `from`, `to` - Date range filter (YYYY-MM-DD)
- `month` - Filter by month (YYYY-MM)
- `sortBy` - Sort field (date, amount, category, type)
- `sortOrder` - Sort order (asc, desc)
- `page`, `limit` - Pagination

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "category": "Office Rent",
      "description": "Monthly office rent payment",
      "amount": 25000,
      "date": "2024-01-01",
      "month": "2024-01",
      "type": "administrative",
      "receipt": "/uploads/receipts/rent-jan-2024.pdf",
      "status": "approved",
      "approvedBy": "Admin User",
      "approvedAt": "2024-01-02T10:00:00Z",
      "createdBy": {
        "id": "uuid",
        "name": "Creator Name"
      },
      "createdAt": "2024-01-01T00:00:00Z",
      "updatedAt": "2024-01-02T10:00:00Z"
    }
  ],
  "statistics": {
    "totalExpenses": 50500,
    "approvedCount": 8,
    "pendingCount": 2,
    "rejectedCount": 1,
    "entryCount": 11
  },
  "pagination": {...}
}
```

### GET /expenses/:id

Get single expense details

### POST /expenses

Create new expense entry

```json
{
  "category": "Office Supplies",
  "description": "Stationery and equipment purchase",
  "amount": 2500,
  "date": "2024-01-15",
  "type": "administrative",
  "receipt": "/uploads/receipts/supplies-jan-2024.pdf"
}
```

### PUT /expenses/:id

Update expense entry

```json
{
  "category": "Updated Category",
  "description": "Updated description",
  "amount": 3000,
  "status": "approved"
}
```

### POST /expenses/:id/approve

Approve or reject expense

```json
{
  "status": "approved",
  "notes": "Expense approved for payment"
}
```

### DELETE /expenses/:id

Delete expense entry (admin only)

### GET /expenses/export

Export expenses report
**Query Parameters:**

- `format` - Export format (csv, excel, pdf)
- `month` - Filter by month
- `type` - Filter by expense type

---

## 💵 Salary Management Endpoints

### GET /expenses/salary/config

Get current salary configuration
**Response:**

```json
{
  "data": {
    "users": {
      "firstTierRate": 0.5,
      "secondTierRate": 0.6,
      "firstTierLimit": 500
    },
    "projectManagers": {
      "pm_1": 30000,
      "pm_2": 20000
    },
    "currency": "INR",
    "updatedAt": "2024-01-15T10:00:00Z",
    "updatedBy": {
      "id": "uuid",
      "name": "Admin User"
    }
  }
}
```

### PUT /expenses/salary/config

Update salary configuration (super_admin only)

```json
{
  "users": {
    "firstTierRate": 0.55,
    "secondTierRate": 0.65,
    "firstTierLimit": 600
  },
  "projectManagers": {
    "pm_1": 32000,
    "pm_2": 22000
  }
}
```

### GET /expenses/salary/users

Get user salary data and file processing statistics
**Query Parameters:**

- `month` - Target month (YYYY-MM, default: current month)

**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Sarah Johnson",
      "role": "user",
      "todayFiles": 750,
      "weeklyFiles": 4200,
      "monthlyFiles": 15200,
      "todayEarnings": 400.0,
      "weeklyEarnings": 2320.0,
      "monthlyEarnings": 8320.0,
      "attendanceRate": 95.2,
      "lastActive": "2024-01-21T14:30:00Z"
    }
  ],
  "summary": {
    "totalMonthlyEarnings": 31960.0,
    "averageMonthlyEarnings": 7990.0,
    "totalTodayFiles": 2700,
    "totalMonthlyFiles": 58100,
    "activeUsers": 4
  },
  "month": "2024-01"
}
```

### GET /expenses/salary/project-managers

Get project manager salary data
**Response:**

```json
{
  "data": [
    {
      "id": "pm_1",
      "name": "Emily Wilson",
      "role": "project_manager",
      "monthlySalary": 30000,
      "attendanceRate": 98.5,
      "lastActive": "2024-01-21T17:30:00Z",
      "department": "Operations"
    }
  ],
  "summary": {
    "totalMonthlySalaries": 50000,
    "averageMonthlySalary": 25000,
    "activePMs": 2
  }
}
```

---

## 📊 Financial Analytics Endpoints

### GET /expenses/analytics/dashboard

Get expense dashboard analytics
**Query Parameters:**

- `month` - Target month (YYYY-MM, default: current month)

**Response:**

```json
{
  "data": {
    "currentMonth": {
      "totalRevenue": 420000,
      "totalExpenses": 270460,
      "netProfit": 149540,
      "profitMargin": 35.6,
      "salaryExpenses": 81960,
      "adminExpenses": 50500
    },
    "trends": {
      "revenueGrowth": 12.5,
      "expenseGrowth": 8.3,
      "profitGrowth": 18.7
    },
    "alerts": [
      {
        "type": "budget_warning",
        "message": "Marketing expenses are 15% over budget",
        "severity": "medium"
      }
    ],
    "topExpenseCategories": [
      {
        "name": "Salaries",
        "value": 81960,
        "percentage": 72.8,
        "fill": "#3b82f6",
        "count": 4
      }
    ]
  }
}
```

### GET /expenses/analytics/profit-loss

Get historical profit & loss data
**Response:**

```json
{
  "data": [
    {
      "month": "2024-01",
      "revenue": 420000,
      "salaryExpense": 170000,
      "adminExpense": 50500,
      "totalExpense": 220500,
      "netProfit": 199500,
      "profitMargin": 47.5
    }
  ]
}
```

### GET /expenses/analytics/breakdown

Get detailed expense breakdown by category and type
**Query Parameters:**

- `period` - Time period (month, quarter, year)
- `from`, `to` - Date range

### GET /expenses/analytics/trends

Get expense trends and comparisons
**Query Parameters:**

- `period` - Comparison period (month, quarter, year)
- `type` - Expense type filter

---

## 💰 Budget Management Endpoints

### GET /expenses/budgets

List monthly budgets
**Query Parameters:**

- `month` - Target month (YYYY-MM)
- `type` - Expense type filter

### POST /expenses/budgets

Create monthly budget

```json
{
  "month": "2024-02",
  "categories": [
    {
      "type": "administrative",
      "amount": 30000
    },
    {
      "type": "operational",
      "amount": 15000
    }
  ]
}
```

### PUT /expenses/budgets/:id

Update budget allocation

### GET /expenses/budgets/alerts

Get budget alerts and warnings

---

## 📋 Expense Categories Endpoints

### GET /expenses/categories

List expense categories
**Response:**

```json
{
  "data": [
    {
      "id": "uuid",
      "name": "Office Rent",
      "type": "administrative",
      "description": "Monthly office space rental costs",
      "isActive": true,
      "defaultBudget": 25000,
      "requiresApproval": true,
      "requiresReceipt": true,
      "maxAmount": 50000,
      "createdAt": "2024-01-01T00:00:00Z"
    }
  ]
}
```

### POST /expenses/categories

Create expense category (super_admin only)

```json
{
  "name": "Training & Development",
  "type": "operational",
  "description": "Employee training and skill development",
  "defaultBudget": 5000,
  "requiresApproval": true,
  "requiresReceipt": false
}
```

### PUT /expenses/categories/:id

Update expense category

### DELETE /expenses/categories/:id

Delete expense category (super_admin only)

---

## 💾 Data Management Endpoints

### POST /data/backup

Create manual backup (super_admin only)

### GET /data/backups

List backup history

### GET /data/backup/:id/download

Download backup file

### POST /data/export

Export system data
**Query Parameters:**

- `type` - users|projects|counts|all
- `format` - csv|excel|json

### POST /data/import

Import system data (file upload)

---

## 📊 System Status Endpoints

### GET /health

System health check

```json
{
  "status": "healthy",
  "database": "connected",
  "version": "1.0.0",
  "uptime": 86400
}
```

### GET /stats

System statistics (super_admin only)

```json
{
  "totalUsers": 45,
  "totalProjects": 12,
  "totalDailyCounts": 1234,
  "databaseSize": "125 MB",
  "activeConnections": 5
}
```

---

## Error Responses

All endpoints return consistent error responses:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email is required"
      }
    ]
  }
}
```

### Common Error Codes

- `AUTHENTICATION_REQUIRED` - 401
- `AUTHORIZATION_FAILED` - 403
- `VALIDATION_ERROR` - 400
- `NOT_FOUND` - 404
- `CONFLICT` - 409
- `RATE_LIMIT_EXCEEDED` - 429
- `INTERNAL_SERVER_ERROR` - 500

---

## Rate Limiting

API endpoints are rate limited:

- Authentication: 5 requests per minute
- General API: 1000 requests per hour per user
- Reports/Export: 10 requests per minute
- File uploads: 5 requests per minute

Rate limit headers are included in responses:

```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1641024000
```
