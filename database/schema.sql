-- Web Syntactic Solutions BPO Management Platform Database Schema
-- PostgreSQL DDL for complete data model

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create custom types/enums
CREATE TYPE user_status AS ENUM ('active', 'inactive');
CREATE TYPE user_role AS ENUM ('super_admin', 'project_manager', 'user');
CREATE TYPE project_status AS ENUM ('planning', 'active', 'on_hold', 'completed');
CREATE TYPE project_priority AS ENUM ('low', 'medium', 'high');
CREATE TYPE daily_count_status AS ENUM ('pending', 'submitted', 'approved', 'rejected');
CREATE TYPE notification_type AS ENUM ('info', 'warning', 'error', 'success');
CREATE TYPE notification_category AS ENUM ('system', 'project', 'user', 'deadline');
CREATE TYPE recipient_type AS ENUM ('user', 'group');
CREATE TYPE session_security AS ENUM ('basic', 'enhanced', 'strict');

-- ====================
-- CORE USER & ROLE TABLES
-- ====================

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    hashed_password VARCHAR(255) NOT NULL,
    role user_role NOT NULL DEFAULT 'user',
    status user_status NOT NULL DEFAULT 'active',
    department VARCHAR(100),
    job_title VARCHAR(100),
    avatar_url TEXT,
    theme VARCHAR(20) DEFAULT 'system',
    language VARCHAR(10) DEFAULT 'English',
    notifications_enabled BOOLEAN DEFAULT true,
    join_date DATE NOT NULL DEFAULT CURRENT_DATE,
    last_login TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Permissions table
CREATE TABLE permissions (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'user_create', 'project_read'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    module VARCHAR(50) NOT NULL, -- e.g., 'User Management', 'Projects'
    action VARCHAR(20) NOT NULL, -- e.g., 'create', 'read', 'update', 'delete'
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Roles table
CREATE TABLE roles (
    id VARCHAR(50) PRIMARY KEY, -- e.g., 'super_admin', 'project_manager'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    is_default BOOLEAN NOT NULL DEFAULT false,
    user_count INTEGER NOT NULL DEFAULT 0, -- denormalized for performance
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Role-Permission mapping (many-to-many)
CREATE TABLE role_permissions (
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    permission_id VARCHAR(50) REFERENCES permissions(id) ON DELETE CASCADE,
    PRIMARY KEY (role_id, permission_id)
);

-- User-Role assignment (for future multi-role support)
CREATE TABLE user_roles (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role_id VARCHAR(50) REFERENCES roles(id) ON DELETE CASCADE,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, role_id)
);

-- ====================
-- PROJECT MANAGEMENT
-- ====================

-- Projects table
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status project_status NOT NULL DEFAULT 'planning',
    priority project_priority NOT NULL DEFAULT 'medium',
    start_date DATE,
    end_date DATE,
    target_count INTEGER NOT NULL DEFAULT 0,
    current_count INTEGER NOT NULL DEFAULT 0, -- computed from daily_counts
    created_by_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Project-User assignments (many-to-many)
CREATE TABLE user_projects (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    role_in_project VARCHAR(50), -- optional: 'lead', 'member', etc.
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID REFERENCES users(id),
    PRIMARY KEY (user_id, project_id)
);

-- ====================
-- DAILY COUNT TRACKING
-- ====================

-- Daily count submissions
CREATE TABLE daily_counts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    target_count INTEGER NOT NULL,
    submitted_count INTEGER NOT NULL DEFAULT 0,
    status daily_count_status NOT NULL DEFAULT 'pending',
    notes TEXT,
    submitted_at TIMESTAMP,
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    rejection_reason TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Unique constraint: one submission per user+project+date
    UNIQUE(user_id, project_id, date)
);

-- ====================
-- NOTIFICATIONS SYSTEM
-- ====================

-- Notifications table
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type NOT NULL DEFAULT 'info',
    category notification_category NOT NULL DEFAULT 'system',
    created_by_user_id UUID REFERENCES users(id),
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Notification recipients (supports users and groups)
CREATE TABLE notification_recipients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    recipient_type recipient_type NOT NULL,
    recipient_value VARCHAR(100) NOT NULL, -- user_id or group name like 'all_users'
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Per-user notification read state
CREATE TABLE user_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    notification_id UUID REFERENCES notifications(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    is_read BOOLEAN NOT NULL DEFAULT false,
    read_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(notification_id, user_id)
);

-- User notification preferences
CREATE TABLE notification_settings (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Category-specific notification preferences
CREATE TABLE notification_category_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    category notification_category NOT NULL,
    email_enabled BOOLEAN NOT NULL DEFAULT true,
    push_enabled BOOLEAN NOT NULL DEFAULT true,
    sms_enabled BOOLEAN NOT NULL DEFAULT false,
    
    UNIQUE(user_id, category)
);

-- ====================
-- SYSTEM SETTINGS
-- ====================

-- Company settings (singleton table)
CREATE TABLE company_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    name VARCHAR(255) NOT NULL DEFAULT 'Web Syntactic Solutions',
    address TEXT,
    phone VARCHAR(50),
    email VARCHAR(255),
    website VARCHAR(255),
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    currency VARCHAR(10) DEFAULT 'USD',
    date_format VARCHAR(20) DEFAULT 'MM/DD/YYYY',
    working_hours_start TIME DEFAULT '09:00:00',
    working_hours_end TIME DEFAULT '17:00:00',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System configuration (singleton table)
CREATE TABLE system_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    max_file_size INTEGER NOT NULL DEFAULT 50, -- MB
    session_timeout INTEGER NOT NULL DEFAULT 30, -- minutes
    backup_frequency VARCHAR(20) NOT NULL DEFAULT 'daily',
    maintenance_mode BOOLEAN NOT NULL DEFAULT false,
    debug_mode BOOLEAN NOT NULL DEFAULT false,
    api_rate_limit INTEGER NOT NULL DEFAULT 1000, -- requests per hour
    allow_registration BOOLEAN NOT NULL DEFAULT true,
    require_email_verification BOOLEAN NOT NULL DEFAULT true,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Security settings (singleton table)
CREATE TABLE security_settings (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    password_min_length INTEGER NOT NULL DEFAULT 8,
    password_require_special_chars BOOLEAN NOT NULL DEFAULT true,
    password_require_numbers BOOLEAN NOT NULL DEFAULT true,
    password_require_uppercase BOOLEAN NOT NULL DEFAULT true,
    max_login_attempts INTEGER NOT NULL DEFAULT 5,
    lockout_duration INTEGER NOT NULL DEFAULT 15, -- minutes
    two_factor_enabled BOOLEAN NOT NULL DEFAULT false,
    session_security session_security NOT NULL DEFAULT 'enhanced',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- EXPENSE MANAGEMENT
-- ====================

-- Expense types and statuses
CREATE TYPE expense_type AS ENUM ('administrative', 'operational', 'marketing', 'utilities', 'miscellaneous');
CREATE TYPE expense_status AS ENUM ('pending', 'approved', 'rejected');

-- Salary configuration (singleton table)
CREATE TABLE salary_config (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    first_tier_rate DECIMAL(10,4) NOT NULL DEFAULT 0.50, -- Rate per file for first tier
    second_tier_rate DECIMAL(10,4) NOT NULL DEFAULT 0.60, -- Rate per file for second tier
    first_tier_limit INTEGER NOT NULL DEFAULT 500, -- File count limit for first tier
    currency VARCHAR(3) NOT NULL DEFAULT 'INR',
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id UUID REFERENCES users(id)
);

-- Project manager individual salaries
CREATE TABLE pm_salaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    monthly_salary DECIMAL(12,2) NOT NULL,
    effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_by_user_id UUID REFERENCES users(id)
);

-- User salary tracking (daily file counts and earnings)
CREATE TABLE user_salary_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,

    -- File counts
    files_processed INTEGER NOT NULL DEFAULT 0,

    -- Calculated earnings based on salary config
    tier1_files INTEGER NOT NULL DEFAULT 0,
    tier1_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    tier2_files INTEGER NOT NULL DEFAULT 0,
    tier2_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,
    total_earnings DECIMAL(10,2) NOT NULL DEFAULT 0,

    -- Metadata
    last_updated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id, date)
);

-- Administrative expenses
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    amount DECIMAL(12,2) NOT NULL,
    expense_date DATE NOT NULL,
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    type expense_type NOT NULL,
    receipt_path TEXT, -- File path for receipt
    status expense_status NOT NULL DEFAULT 'pending',

    -- Approval workflow
    approved_by_user_id UUID REFERENCES users(id),
    approved_at TIMESTAMP,
    approval_notes TEXT,
    rejection_reason TEXT,

    -- Metadata
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Expense categories configuration
CREATE TABLE expense_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL UNIQUE,
    type expense_type NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    default_budget DECIMAL(12,2),
    requires_approval BOOLEAN NOT NULL DEFAULT true,
    requires_receipt BOOLEAN NOT NULL DEFAULT false,
    max_amount DECIMAL(12,2), -- Optional spending limit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Monthly budget planning
CREATE TABLE monthly_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month VARCHAR(7) NOT NULL, -- YYYY-MM format
    type expense_type NOT NULL,
    budgeted_amount DECIMAL(12,2) NOT NULL,
    spent_amount DECIMAL(12,2) NOT NULL DEFAULT 0, -- Computed from expenses
    created_by_user_id UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(month, type)
);

-- Financial summary cache (for performance)
CREATE TABLE monthly_financial_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month VARCHAR(7) NOT NULL UNIQUE, -- YYYY-MM format

    -- Revenue data
    project_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    other_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_revenue DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Salary expenses
    user_salaries DECIMAL(15,2) NOT NULL DEFAULT 0,
    pm_salaries DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_salaries DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Administrative expenses by type
    admin_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    operational_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    marketing_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    utilities_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    misc_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    total_admin_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,

    -- Calculated fields
    total_expenses DECIMAL(15,2) NOT NULL DEFAULT 0,
    net_profit DECIMAL(15,2) NOT NULL DEFAULT 0,
    profit_margin DECIMAL(5,2) NOT NULL DEFAULT 0, -- Percentage

    -- Metadata
    last_calculated TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    calculation_version INTEGER NOT NULL DEFAULT 1
);

-- ====================
-- INTEGRATIONS & LOGS
-- ====================

-- Email integration settings
CREATE TABLE email_integration (
    id INTEGER PRIMARY KEY DEFAULT 1 CHECK (id = 1), -- singleton
    smtp_server VARCHAR(255),
    smtp_port INTEGER DEFAULT 587,
    smtp_security VARCHAR(10) DEFAULT 'tls', -- 'none', 'tls', 'ssl'
    smtp_username VARCHAR(255),
    smtp_password_encrypted TEXT, -- store encrypted
    is_configured BOOLEAN NOT NULL DEFAULT false,
    last_tested_at TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- System backups log
CREATE TABLE backups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename VARCHAR(255) NOT NULL,
    file_size BIGINT, -- bytes
    backup_type VARCHAR(50) DEFAULT 'full', -- 'full', 'incremental'
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed'
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    error_message TEXT,
    created_by_user_id UUID REFERENCES users(id)
);

-- Activity/audit logs
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id),
    action VARCHAR(100) NOT NULL, -- e.g., 'user_created', 'project_updated'
    entity_type VARCHAR(50), -- e.g., 'user', 'project', 'daily_count'
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- ====================
-- INDEXES FOR PERFORMANCE
-- ====================

-- User indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_last_login ON users(last_login);

-- Project indexes
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_priority ON projects(priority);
CREATE INDEX idx_projects_end_date ON projects(end_date);
CREATE INDEX idx_projects_created_by ON projects(created_by_user_id);

-- Daily counts indexes (critical for reporting)
CREATE INDEX idx_daily_counts_date ON daily_counts(date);
CREATE INDEX idx_daily_counts_user_date ON daily_counts(user_id, date);
CREATE INDEX idx_daily_counts_project_date ON daily_counts(project_id, date);
CREATE INDEX idx_daily_counts_status ON daily_counts(status);
CREATE INDEX idx_daily_counts_submitted_at ON daily_counts(submitted_at);

-- User-project assignment indexes
CREATE INDEX idx_user_projects_user ON user_projects(user_id);
CREATE INDEX idx_user_projects_project ON user_projects(project_id);

-- Notification indexes
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_expires_at ON notifications(expires_at);
CREATE INDEX idx_notification_recipients_value ON notification_recipients(recipient_value);
CREATE INDEX idx_user_notifications_user_read ON user_notifications(user_id, is_read);

-- Activity logs indexes
CREATE INDEX idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);
CREATE INDEX idx_activity_logs_entity ON activity_logs(entity_type, entity_id);

-- Expense management indexes
CREATE INDEX idx_expenses_date ON expenses(expense_date);
CREATE INDEX idx_expenses_month ON expenses(month);
CREATE INDEX idx_expenses_type ON expenses(type);
CREATE INDEX idx_expenses_status ON expenses(status);
CREATE INDEX idx_expenses_created_by ON expenses(created_by_user_id);
CREATE INDEX idx_expenses_approved_by ON expenses(approved_by_user_id);

CREATE INDEX idx_user_salary_tracking_user_date ON user_salary_tracking(user_id, date);
CREATE INDEX idx_user_salary_tracking_date ON user_salary_tracking(date);

CREATE INDEX idx_pm_salaries_user ON pm_salaries(user_id);
CREATE INDEX idx_pm_salaries_active ON pm_salaries(is_active);
CREATE INDEX idx_pm_salaries_effective_from ON pm_salaries(effective_from);

CREATE INDEX idx_monthly_budgets_month ON monthly_budgets(month);
CREATE INDEX idx_monthly_budgets_type ON monthly_budgets(type);

CREATE INDEX idx_expense_categories_type ON expense_categories(type);
CREATE INDEX idx_expense_categories_active ON expense_categories(is_active);

-- ====================
-- VIEWS FOR COMMON QUERIES
-- ====================

-- User profile with role information
CREATE VIEW user_profiles AS
SELECT 
    u.id,
    u.name,
    u.email,
    u.phone,
    u.role,
    u.status,
    u.department,
    u.job_title,
    u.avatar_url,
    u.theme,
    u.language,
    u.notifications_enabled,
    u.join_date,
    u.last_login,
    COUNT(DISTINCT up.project_id) AS projects_count,
    u.created_at,
    u.updated_at
FROM users u
LEFT JOIN user_projects up ON u.id = up.user_id
GROUP BY u.id;

-- Project summary with assignment counts
CREATE VIEW project_summary AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.status,
    p.priority,
    p.start_date,
    p.end_date,
    p.target_count,
    p.current_count,
    CASE 
        WHEN p.target_count > 0 THEN (p.current_count::FLOAT / p.target_count * 100)
        ELSE 0 
    END AS progress_percentage,
    COUNT(DISTINCT up.user_id) AS assigned_users_count,
    p.created_by_user_id,
    u.name AS created_by_name,
    p.created_at,
    p.updated_at
FROM projects p
LEFT JOIN user_projects up ON p.id = up.project_id
LEFT JOIN users u ON p.created_by_user_id = u.id
GROUP BY p.id, u.name;

-- Daily dashboard statistics
CREATE VIEW dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM projects WHERE status = 'active') AS active_projects,
    (SELECT COUNT(*) FROM users WHERE status = 'active') AS active_users,
    (SELECT COALESCE(SUM(target_count), 0) FROM daily_counts WHERE date = CURRENT_DATE) AS today_target,
    (SELECT COALESCE(SUM(submitted_count), 0) FROM daily_counts WHERE date = CURRENT_DATE AND status IN ('submitted', 'approved')) AS today_submitted,
    (SELECT COUNT(*) FROM daily_counts WHERE date = CURRENT_DATE AND status = 'approved') AS completed_today,
    (SELECT COUNT(*) FROM daily_counts WHERE date = CURRENT_DATE AND status = 'pending') AS pending_tasks,
    (SELECT COUNT(*) FROM notifications n 
     LEFT JOIN user_notifications un ON n.id = un.notification_id 
     WHERE un.is_read = false OR un.is_read IS NULL) AS unread_notifications;

-- ====================
-- FUNCTIONS & TRIGGERS
-- ====================

-- Function to update project current_count from daily_counts
CREATE OR REPLACE FUNCTION update_project_current_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Recalculate current_count for the affected project
    UPDATE projects 
    SET current_count = (
        SELECT COALESCE(SUM(submitted_count), 0)
        FROM daily_counts 
        WHERE project_id = COALESCE(NEW.project_id, OLD.project_id)
        AND status = 'approved'
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE id = COALESCE(NEW.project_id, OLD.project_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update project current_count
CREATE TRIGGER trigger_update_project_current_count
    AFTER INSERT OR UPDATE OR DELETE ON daily_counts
    FOR EACH ROW
    EXECUTE FUNCTION update_project_current_count();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_roles_updated_at BEFORE UPDATE ON roles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_daily_counts_updated_at BEFORE UPDATE ON daily_counts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON expenses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_pm_salaries_updated_at BEFORE UPDATE ON pm_salaries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_monthly_budgets_updated_at BEFORE UPDATE ON monthly_budgets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trigger_expense_categories_updated_at BEFORE UPDATE ON expense_categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update monthly budget spent amounts
CREATE OR REPLACE FUNCTION update_monthly_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
    -- Update spent amount for the affected month and type
    UPDATE monthly_budgets
    SET spent_amount = (
        SELECT COALESCE(SUM(amount), 0)
        FROM expenses
        WHERE month = COALESCE(NEW.month, OLD.month)
        AND type = COALESCE(NEW.type, OLD.type)
        AND status = 'approved'
    ),
    updated_at = CURRENT_TIMESTAMP
    WHERE month = COALESCE(NEW.month, OLD.month)
    AND type = COALESCE(NEW.type, OLD.type);

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update monthly budget spent amounts
CREATE TRIGGER trigger_update_monthly_budget_spent
    AFTER INSERT OR UPDATE OR DELETE ON expenses
    FOR EACH ROW
    EXECUTE FUNCTION update_monthly_budget_spent();

-- Function to calculate and cache monthly financial summary
CREATE OR REPLACE FUNCTION update_monthly_financial_summary(target_month VARCHAR(7))
RETURNS VOID AS $$
DECLARE
    summary_data RECORD;
BEGIN
    -- Calculate all financial data for the month
    SELECT
        -- Revenue (placeholder - would come from project billing)
        420000.00 as project_revenue,
        0.00 as other_revenue,
        420000.00 as total_revenue,

        -- User salaries (from user_salary_tracking)
        COALESCE((SELECT SUM(total_earnings) FROM user_salary_tracking
                  WHERE DATE_TRUNC('month', date) = (target_month || '-01')::DATE), 0) as user_salaries,

        -- PM salaries (from pm_salaries)
        COALESCE((SELECT SUM(ps.monthly_salary) FROM pm_salaries ps
                  WHERE ps.is_active = true
                  AND ps.effective_from <= (target_month || '-01')::DATE), 0) as pm_salaries,

        -- Administrative expenses by type
        COALESCE((SELECT SUM(amount) FROM expenses WHERE month = target_month AND type = 'administrative' AND status = 'approved'), 0) as admin_expenses,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE month = target_month AND type = 'operational' AND status = 'approved'), 0) as operational_expenses,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE month = target_month AND type = 'marketing' AND status = 'approved'), 0) as marketing_expenses,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE month = target_month AND type = 'utilities' AND status = 'approved'), 0) as utilities_expenses,
        COALESCE((SELECT SUM(amount) FROM expenses WHERE month = target_month AND type = 'miscellaneous' AND status = 'approved'), 0) as misc_expenses
    INTO summary_data;

    -- Calculate totals
    summary_data.total_salaries := summary_data.user_salaries + summary_data.pm_salaries;
    summary_data.total_admin_expenses := summary_data.admin_expenses + summary_data.operational_expenses +
                                        summary_data.marketing_expenses + summary_data.utilities_expenses + summary_data.misc_expenses;
    summary_data.total_expenses := summary_data.total_salaries + summary_data.total_admin_expenses;
    summary_data.net_profit := summary_data.total_revenue - summary_data.total_expenses;
    summary_data.profit_margin := CASE
        WHEN summary_data.total_revenue > 0 THEN (summary_data.net_profit / summary_data.total_revenue * 100)
        ELSE 0
    END;

    -- Insert or update the summary
    INSERT INTO monthly_financial_summary (
        month, project_revenue, other_revenue, total_revenue,
        user_salaries, pm_salaries, total_salaries,
        admin_expenses, operational_expenses, marketing_expenses, utilities_expenses, misc_expenses, total_admin_expenses,
        total_expenses, net_profit, profit_margin
    ) VALUES (
        target_month, summary_data.project_revenue, summary_data.other_revenue, summary_data.total_revenue,
        summary_data.user_salaries, summary_data.pm_salaries, summary_data.total_salaries,
        summary_data.admin_expenses, summary_data.operational_expenses, summary_data.marketing_expenses,
        summary_data.utilities_expenses, summary_data.misc_expenses, summary_data.total_admin_expenses,
        summary_data.total_expenses, summary_data.net_profit, summary_data.profit_margin
    )
    ON CONFLICT (month) DO UPDATE SET
        project_revenue = EXCLUDED.project_revenue,
        other_revenue = EXCLUDED.other_revenue,
        total_revenue = EXCLUDED.total_revenue,
        user_salaries = EXCLUDED.user_salaries,
        pm_salaries = EXCLUDED.pm_salaries,
        total_salaries = EXCLUDED.total_salaries,
        admin_expenses = EXCLUDED.admin_expenses,
        operational_expenses = EXCLUDED.operational_expenses,
        marketing_expenses = EXCLUDED.marketing_expenses,
        utilities_expenses = EXCLUDED.utilities_expenses,
        misc_expenses = EXCLUDED.misc_expenses,
        total_admin_expenses = EXCLUDED.total_admin_expenses,
        total_expenses = EXCLUDED.total_expenses,
        net_profit = EXCLUDED.net_profit,
        profit_margin = EXCLUDED.profit_margin,
        last_calculated = CURRENT_TIMESTAMP,
        calculation_version = monthly_financial_summary.calculation_version + 1;
END;
$$ LANGUAGE plpgsql;

-- ====================
-- INITIAL DATA SEEDING
-- ====================

-- Insert default permissions
INSERT INTO permissions (id, name, description, module, action) VALUES
('user_create', 'Create Users', 'Ability to create new user accounts', 'User Management', 'create'),
('user_read', 'View Users', 'Ability to view user information', 'User Management', 'read'),
('user_update', 'Edit Users', 'Ability to modify user accounts', 'User Management', 'update'),
('user_delete', 'Delete Users', 'Ability to delete user accounts', 'User Management', 'delete'),
('project_create', 'Create Projects', 'Ability to create new projects', 'Project Management', 'create'),
('project_read', 'View Projects', 'Ability to view project information', 'Project Management', 'read'),
('project_update', 'Edit Projects', 'Ability to modify projects', 'Project Management', 'update'),
('project_delete', 'Delete Projects', 'Ability to delete projects', 'Project Management', 'delete'),
('count_submit', 'Submit Counts', 'Ability to submit daily counts', 'Daily Counts', 'create'),
('count_approve', 'Approve Counts', 'Ability to approve/reject daily counts', 'Daily Counts', 'approve'),
('reports_view', 'View Reports', 'Ability to access reports and analytics', 'Reports', 'read'),
('permissions_manage', 'Manage Permissions', 'Ability to configure roles and permissions', 'Permissions', 'manage'),
('notifications_manage', 'Manage Notifications', 'Ability to send and manage notifications', 'Notifications', 'manage'),
('settings_manage', 'Manage Settings', 'Ability to configure system settings', 'Settings', 'manage');

-- Insert default roles
INSERT INTO roles (id, name, description, is_default) VALUES
('super_admin', 'Super Administrator', 'Full system access with all permissions', true),
('project_manager', 'Project Manager', 'Manage projects and team performance', true),
('user', 'User', 'Basic user with limited access', true);

-- Assign permissions to roles
-- Super Admin gets all permissions
INSERT INTO role_permissions (role_id, permission_id)
SELECT 'super_admin', id FROM permissions;

-- Project Manager permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('project_manager', 'project_create'),
('project_manager', 'project_read'),
('project_manager', 'project_update'),
('project_manager', 'user_read'),
('project_manager', 'count_approve'),
('project_manager', 'reports_view'),
('project_manager', 'notifications_manage');

-- User permissions
INSERT INTO role_permissions (role_id, permission_id) VALUES
('user', 'project_read'),
('user', 'count_submit');

-- Insert default company settings
INSERT INTO company_settings DEFAULT VALUES;

-- Insert default system settings
INSERT INTO system_settings DEFAULT VALUES;

-- Insert default security settings
INSERT INTO security_settings DEFAULT VALUES;

-- Insert default email integration (unconfigured)
INSERT INTO email_integration DEFAULT VALUES;

-- Comments for documentation
COMMENT ON TABLE users IS 'Core user accounts with authentication and profile information';
COMMENT ON TABLE projects IS 'Project definitions with progress tracking';
COMMENT ON TABLE daily_counts IS 'Daily work count submissions and approvals';
COMMENT ON TABLE notifications IS 'System notifications and alerts';
COMMENT ON TABLE permissions IS 'Granular permission definitions for RBAC';
COMMENT ON TABLE roles IS 'User roles with associated permissions';
COMMENT ON VIEW dashboard_stats IS 'Real-time dashboard statistics computed from current data';
COMMENT ON VIEW project_summary IS 'Project overview with assignment and progress information';
COMMENT ON VIEW user_profiles IS 'Enhanced user information with computed project counts';
