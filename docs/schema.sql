--
-- PostgreSQL database dump
--

-- Dumped from database version 15.8 (Ubuntu 15.8-1.pgdg22.04+1)
-- Dumped by pg_dump version 15.8 (Ubuntu 15.8-1.pgdg22.04+1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: daily_count_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.daily_count_status AS ENUM (
    'pending',
    'submitted',
    'approved',
    'rejected'
);


--
-- Name: expense_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.expense_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


--
-- Name: expense_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.expense_type AS ENUM (
    'administrative',
    'operational',
    'marketing',
    'utilities',
    'miscellaneous'
);


--
-- Name: notification_category; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_category AS ENUM (
    'system',
    'project',
    'user',
    'deadline'
);


--
-- Name: notification_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.notification_type AS ENUM (
    'info',
    'warning',
    'error',
    'success'
);


--
-- Name: project_priority; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_priority AS ENUM (
    'low',
    'medium',
    'high'
);


--
-- Name: project_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.project_status AS ENUM (
    'planning',
    'active',
    'on_hold',
    'completed'
);


--
-- Name: recipient_type; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.recipient_type AS ENUM (
    'user',
    'group'
);


--
-- Name: session_security; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.session_security AS ENUM (
    'basic',
    'enhanced',
    'strict'
);


--
-- Name: user_role; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_role AS ENUM (
    'super_admin',
    'project_manager',
    'user'
);


--
-- Name: user_status; Type: TYPE; Schema: public; Owner: -
--

CREATE TYPE public.user_status AS ENUM (
    'active',
    'inactive'
);


--
-- Name: update_monthly_budget_spent(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_monthly_budget_spent() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_monthly_financial_summary(character varying); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_monthly_financial_summary(target_month character varying) RETURNS void
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_project_current_count(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_project_current_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
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
$$;


--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: activity_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.activity_logs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    action character varying(100) NOT NULL,
    entity_type character varying(50),
    entity_id uuid,
    old_values jsonb,
    new_values jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: backups; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.backups (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    filename character varying(255) NOT NULL,
    file_size bigint,
    backup_type character varying(50) DEFAULT 'full'::character varying,
    status character varying(20) DEFAULT 'in_progress'::character varying NOT NULL,
    started_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    completed_at timestamp without time zone,
    error_message text,
    created_by_user_id uuid
);


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id integer DEFAULT 1 NOT NULL,
    name character varying(255) DEFAULT 'Web Syntactic Solutions'::character varying NOT NULL,
    address text,
    phone character varying(50),
    email character varying(255),
    website character varying(255),
    timezone character varying(50) DEFAULT 'America/New_York'::character varying,
    currency character varying(10) DEFAULT 'USD'::character varying,
    date_format character varying(20) DEFAULT 'MM/DD/YYYY'::character varying,
    working_hours_start time without time zone DEFAULT '09:00:00'::time without time zone,
    working_hours_end time without time zone DEFAULT '17:00:00'::time without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT company_settings_id_check CHECK ((id = 1))
);


--
-- Name: daily_counts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_counts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    date date NOT NULL,
    target_count integer NOT NULL,
    submitted_count integer DEFAULT 0 NOT NULL,
    status public.daily_count_status DEFAULT 'pending'::public.daily_count_status NOT NULL,
    notes text,
    submitted_at timestamp without time zone,
    approved_by_user_id uuid,
    approved_at timestamp without time zone,
    rejection_reason text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE daily_counts; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.daily_counts IS 'Daily work count submissions and approvals';


--
-- Name: notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    title character varying(255) NOT NULL,
    message text NOT NULL,
    type public.notification_type DEFAULT 'info'::public.notification_type NOT NULL,
    category public.notification_category DEFAULT 'system'::public.notification_category NOT NULL,
    created_by_user_id uuid,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE notifications; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.notifications IS 'System notifications and alerts';


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    status public.project_status DEFAULT 'planning'::public.project_status NOT NULL,
    priority public.project_priority DEFAULT 'medium'::public.project_priority NOT NULL,
    start_date date,
    end_date date,
    target_count integer DEFAULT 0 NOT NULL,
    current_count integer DEFAULT 0 NOT NULL,
    created_by_user_id uuid,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    rate_per_file_usd numeric
);


--
-- Name: TABLE projects; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.projects IS 'Project definitions with progress tracking';


--
-- Name: user_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid,
    user_id uuid,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(255) NOT NULL,
    email character varying(255) NOT NULL,
    phone character varying(50),
    hashed_password character varying(255) NOT NULL,
    role public.user_role DEFAULT 'user'::public.user_role NOT NULL,
    status public.user_status DEFAULT 'active'::public.user_status NOT NULL,
    department character varying(100),
    job_title character varying(100),
    avatar_url text,
    theme character varying(20) DEFAULT 'system'::character varying,
    language character varying(10) DEFAULT 'English'::character varying,
    notifications_enabled boolean DEFAULT true,
    join_date date DEFAULT CURRENT_DATE NOT NULL,
    last_login timestamp without time zone,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE users; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.users IS 'Core user accounts with authentication and profile information';


--
-- Name: dashboard_stats; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.dashboard_stats AS
 SELECT ( SELECT count(*) AS count
           FROM public.projects
          WHERE (projects.status = 'active'::public.project_status)) AS active_projects,
    ( SELECT count(*) AS count
           FROM public.users
          WHERE (users.status = 'active'::public.user_status)) AS active_users,
    ( SELECT COALESCE(sum(daily_counts.target_count), (0)::bigint) AS "coalesce"
           FROM public.daily_counts
          WHERE (daily_counts.date = CURRENT_DATE)) AS today_target,
    ( SELECT COALESCE(sum(daily_counts.submitted_count), (0)::bigint) AS "coalesce"
           FROM public.daily_counts
          WHERE ((daily_counts.date = CURRENT_DATE) AND (daily_counts.status = ANY (ARRAY['submitted'::public.daily_count_status, 'approved'::public.daily_count_status])))) AS today_submitted,
    ( SELECT count(*) AS count
           FROM public.daily_counts
          WHERE ((daily_counts.date = CURRENT_DATE) AND (daily_counts.status = 'approved'::public.daily_count_status))) AS completed_today,
    ( SELECT count(*) AS count
           FROM public.daily_counts
          WHERE ((daily_counts.date = CURRENT_DATE) AND (daily_counts.status = 'pending'::public.daily_count_status))) AS pending_tasks,
    ( SELECT count(*) AS count
           FROM (public.notifications n
             LEFT JOIN public.user_notifications un ON ((n.id = un.notification_id)))
          WHERE ((un.is_read = false) OR (un.is_read IS NULL))) AS unread_notifications;


--
-- Name: VIEW dashboard_stats; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.dashboard_stats IS 'Real-time dashboard statistics computed from current data';


--
-- Name: email_integration; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.email_integration (
    id integer DEFAULT 1 NOT NULL,
    smtp_server character varying(255),
    smtp_port integer DEFAULT 587,
    smtp_security character varying(10) DEFAULT 'tls'::character varying,
    smtp_username character varying(255),
    smtp_password_encrypted text,
    is_configured boolean DEFAULT false NOT NULL,
    last_tested_at timestamp without time zone,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT email_integration_id_check CHECK ((id = 1))
);


--
-- Name: expense_categories; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expense_categories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name character varying(100) NOT NULL,
    type public.expense_type NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    default_budget numeric(12,2),
    requires_approval boolean DEFAULT true NOT NULL,
    requires_receipt boolean DEFAULT false NOT NULL,
    max_amount numeric(12,2),
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: expenses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.expenses (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    category character varying(100) NOT NULL,
    description text NOT NULL,
    amount numeric(12,2) NOT NULL,
    expense_date date NOT NULL,
    month character varying(7) NOT NULL,
    type public.expense_type NOT NULL,
    receipt_path text,
    status public.expense_status DEFAULT 'pending'::public.expense_status NOT NULL,
    approved_by_user_id uuid,
    approved_at timestamp without time zone,
    approval_notes text,
    rejection_reason text,
    created_by_user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    frequency text,
    date date,
    receipt text,
    approved_by text
);


--
-- Name: file_processes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_processes (
    id text NOT NULL,
    name text NOT NULL,
    project_id text,
    project_name text,
    file_name text,
    total_rows bigint DEFAULT 0,
    header_rows integer DEFAULT 0,
    processed_rows bigint DEFAULT 0,
    available_rows bigint DEFAULT 0,
    upload_date timestamp with time zone,
    status text DEFAULT 'pending'::text,
    created_by text,
    active_users integer DEFAULT 0,
    type text DEFAULT 'manual'::text,
    daily_target integer,
    automation_config jsonb,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: file_requests; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.file_requests (
    id text NOT NULL,
    user_id text,
    user_name text,
    file_process_id text,
    requested_count integer,
    requested_date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    status text DEFAULT 'pending'::text,
    assigned_by text,
    assigned_date timestamp with time zone,
    assigned_count integer,
    start_row bigint,
    end_row bigint,
    download_link text,
    completed_date timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    uploaded_file_name text,
    uploaded_file_path text,
    verification_status text,
    verified_by text,
    verified_at timestamp with time zone,
    rework_count integer DEFAULT 0,
    updated_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- Name: monthly_budgets; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_budgets (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    month character varying(7) NOT NULL,
    type public.expense_type NOT NULL,
    budgeted_amount numeric(12,2) NOT NULL,
    spent_amount numeric(12,2) DEFAULT 0 NOT NULL,
    created_by_user_id uuid NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: monthly_financial_summary; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.monthly_financial_summary (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    month character varying(7) NOT NULL,
    project_revenue numeric(15,2) DEFAULT 0 NOT NULL,
    other_revenue numeric(15,2) DEFAULT 0 NOT NULL,
    total_revenue numeric(15,2) DEFAULT 0 NOT NULL,
    user_salaries numeric(15,2) DEFAULT 0 NOT NULL,
    pm_salaries numeric(15,2) DEFAULT 0 NOT NULL,
    total_salaries numeric(15,2) DEFAULT 0 NOT NULL,
    admin_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    operational_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    marketing_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    utilities_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    misc_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    total_admin_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    total_expenses numeric(15,2) DEFAULT 0 NOT NULL,
    net_profit numeric(15,2) DEFAULT 0 NOT NULL,
    profit_margin numeric(5,2) DEFAULT 0 NOT NULL,
    last_calculated timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    calculation_version integer DEFAULT 1 NOT NULL
);


--
-- Name: notification_category_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_category_settings (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid,
    category public.notification_category NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL
);


--
-- Name: notification_recipients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_recipients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid,
    recipient_type public.recipient_type NOT NULL,
    recipient_value character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.notification_settings (
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.permissions (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE permissions; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.permissions IS 'Granular permission definitions for RBAC';


--
-- Name: pm_salaries; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pm_salaries (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    monthly_salary numeric(12,2) NOT NULL,
    effective_from date DEFAULT CURRENT_DATE NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by_user_id uuid
);


--
-- Name: project_summary; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.project_summary AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(255) AS name,
    NULL::text AS description,
    NULL::public.project_status AS status,
    NULL::public.project_priority AS priority,
    NULL::date AS start_date,
    NULL::date AS end_date,
    NULL::integer AS target_count,
    NULL::integer AS current_count,
    NULL::double precision AS progress_percentage,
    NULL::bigint AS assigned_users_count,
    NULL::uuid AS created_by_user_id,
    NULL::character varying(255) AS created_by_name,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS updated_at;


--
-- Name: VIEW project_summary; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.project_summary IS 'Project overview with assignment and progress information';


--
-- Name: role_permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.role_permissions (
    role_id character varying(50) NOT NULL,
    permission_id character varying(50) NOT NULL
);


--
-- Name: roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.roles (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    is_default boolean DEFAULT false NOT NULL,
    user_count integer DEFAULT 0 NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: TABLE roles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.roles IS 'User roles with associated permissions';


--
-- Name: salary_config; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.salary_config (
    id integer DEFAULT 1 NOT NULL,
    first_tier_rate numeric(10,4) DEFAULT 0.50 NOT NULL,
    second_tier_rate numeric(10,4) DEFAULT 0.60 NOT NULL,
    first_tier_limit integer DEFAULT 500 NOT NULL,
    currency character varying(3) DEFAULT 'INR'::character varying NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_by_user_id uuid,
    CONSTRAINT salary_config_id_check CHECK ((id = 1))
);


--
-- Name: security_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.security_settings (
    id integer DEFAULT 1 NOT NULL,
    password_min_length integer DEFAULT 8 NOT NULL,
    password_require_special_chars boolean DEFAULT true NOT NULL,
    password_require_numbers boolean DEFAULT true NOT NULL,
    password_require_uppercase boolean DEFAULT true NOT NULL,
    max_login_attempts integer DEFAULT 5 NOT NULL,
    lockout_duration integer DEFAULT 15 NOT NULL,
    two_factor_enabled boolean DEFAULT false NOT NULL,
    session_security public.session_security DEFAULT 'enhanced'::public.session_security NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT security_settings_id_check CHECK ((id = 1))
);


--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.system_settings (
    id integer DEFAULT 1 NOT NULL,
    max_file_size integer DEFAULT 50 NOT NULL,
    session_timeout integer DEFAULT 30 NOT NULL,
    backup_frequency character varying(20) DEFAULT 'daily'::character varying NOT NULL,
    maintenance_mode boolean DEFAULT false NOT NULL,
    debug_mode boolean DEFAULT false NOT NULL,
    api_rate_limit integer DEFAULT 1000 NOT NULL,
    allow_registration boolean DEFAULT true NOT NULL,
    require_email_verification boolean DEFAULT true NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT system_settings_id_check CHECK ((id = 1))
);


--
-- Name: tutorial_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorial_steps (
    id text NOT NULL,
    tutorial_id text NOT NULL,
    step_number integer NOT NULL,
    title text NOT NULL,
    description text,
    image_url text,
    video_timestamp integer,
    is_required boolean DEFAULT false
);


--
-- Name: tutorials; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tutorials (
    id text NOT NULL,
    title text NOT NULL,
    description text,
    category text DEFAULT 'getting_started'::text,
    status text DEFAULT 'published'::text,
    video_file_name text,
    video_file_path text,
    video_mime text,
    created_by_user_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    instructions text,
    target_roles text[] DEFAULT '{user}'::text[],
    is_required boolean DEFAULT false,
    tags text[] DEFAULT '{}'::text[],
    "order" integer DEFAULT 0,
    view_count integer DEFAULT 0,
    completion_count integer DEFAULT 0
);


--
-- Name: user_profiles; Type: VIEW; Schema: public; Owner: -
--

CREATE VIEW public.user_profiles AS
SELECT
    NULL::uuid AS id,
    NULL::character varying(255) AS name,
    NULL::character varying(255) AS email,
    NULL::character varying(50) AS phone,
    NULL::public.user_role AS role,
    NULL::public.user_status AS status,
    NULL::character varying(100) AS department,
    NULL::character varying(100) AS job_title,
    NULL::text AS avatar_url,
    NULL::character varying(20) AS theme,
    NULL::character varying(10) AS language,
    NULL::boolean AS notifications_enabled,
    NULL::date AS join_date,
    NULL::timestamp without time zone AS last_login,
    NULL::bigint AS projects_count,
    NULL::timestamp without time zone AS created_at,
    NULL::timestamp without time zone AS updated_at;


--
-- Name: VIEW user_profiles; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON VIEW public.user_profiles IS 'Enhanced user information with computed project counts';


--
-- Name: user_projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_projects (
    user_id uuid NOT NULL,
    project_id uuid NOT NULL,
    role_in_project character varying(50),
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by uuid
);


--
-- Name: user_roles; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_roles (
    user_id uuid NOT NULL,
    role_id character varying(50) NOT NULL,
    assigned_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    assigned_by uuid
);


--
-- Name: user_salary_tracking; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_salary_tracking (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    date date NOT NULL,
    files_processed integer DEFAULT 0 NOT NULL,
    tier1_files integer DEFAULT 0 NOT NULL,
    tier1_earnings numeric(10,2) DEFAULT 0 NOT NULL,
    tier2_files integer DEFAULT 0 NOT NULL,
    tier2_earnings numeric(10,2) DEFAULT 0 NOT NULL,
    total_earnings numeric(10,2) DEFAULT 0 NOT NULL,
    last_updated timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Data for Name: activity_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.activity_logs (id, user_id, action, entity_type, entity_id, old_values, new_values, ip_address, user_agent, created_at) FROM stdin;
\.


--
-- Data for Name: backups; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.backups (id, filename, file_size, backup_type, status, started_at, completed_at, error_message, created_by_user_id) FROM stdin;
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, name, address, phone, email, website, timezone, currency, date_format, working_hours_start, working_hours_end, updated_at) FROM stdin;
1	Web Syntactic Solutions	\N	\N	\N	\N	America/New_York	USD	MM/DD/YYYY	09:00:00	17:00:00	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: daily_counts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.daily_counts (id, user_id, project_id, date, target_count, submitted_count, status, notes, submitted_at, approved_by_user_id, approved_at, rejection_reason, created_at, updated_at) FROM stdin;
9b24aef0-1f43-4d8a-b360-8987bc321f30	d243a2a2-3afc-442e-b1cc-83977f32787d	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-18	0	515	approved	checked	2025-09-18 06:30:14.762701	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-18 08:02:07.223383	\N	2025-09-18 06:30:14.762701	2025-09-18 08:02:07.223383
f4e94554-88da-46d1-bada-97304a7f2111	29acdefe-44da-4114-a65a-f56a497ff6fe	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-18	0	515	approved	good work	2025-09-18 05:33:45.528171	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-18 08:02:12.843575	\N	2025-09-18 05:33:45.528171	2025-09-18 08:02:12.843575
495a5be1-4d10-49cc-a19d-0f3434b7955c	29acdefe-44da-4114-a65a-f56a497ff6fe	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-20	0	1000	approved	\N	2025-09-20 10:54:06.287137	dad1c730-8ff9-4a1c-ace0-5f20105e2d89	2025-09-20 10:54:06.287137	\N	2025-09-20 10:54:06.287137	2025-09-20 10:54:06.287137
0e244c4e-abef-4d37-b0df-7d76c36a8487	d243a2a2-3afc-442e-b1cc-83977f32787d	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-22	0	500	approved	\N	2025-09-22 07:05:50.893248	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-22 07:05:50.893248	\N	2025-09-22 07:05:50.893248	2025-09-22 07:05:50.893248
603dbcad-9803-4698-864f-6e275a30c48a	29acdefe-44da-4114-a65a-f56a497ff6fe	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-23	0	800	approved	\N	2025-09-23 06:28:44.042515	dad1c730-8ff9-4a1c-ace0-5f20105e2d89	2025-09-23 06:40:36.074374	\N	2025-09-23 06:28:44.042515	2025-09-23 06:40:36.074374
1b759271-36a0-4f93-8a29-cb38cea79718	d243a2a2-3afc-442e-b1cc-83977f32787d	e807c9b6-5f15-4432-bb4d-f495e2228de4	2025-09-23	0	500	approved	not good	2025-09-23 06:32:03.982635	3b5d3941-6b72-426e-99d6-30685f9ee583	2025-09-23 07:11:11.774347	not good	2025-09-23 06:32:03.982635	2025-09-23 07:11:11.774347
\.


--
-- Data for Name: email_integration; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.email_integration (id, smtp_server, smtp_port, smtp_security, smtp_username, smtp_password_encrypted, is_configured, last_tested_at, updated_at) FROM stdin;
1	\N	587	tls	\N	\N	f	\N	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: expense_categories; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expense_categories (id, name, type, description, is_active, default_budget, requires_approval, requires_receipt, max_amount, created_at, updated_at) FROM stdin;
b7bb414a-268a-4a64-94c4-01746a4cdbee	Office Rent	administrative	Monthly office space rental costs	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
d3cc55e0-26fc-408c-916c-bf821e40d29f	Utilities	utilities	Electricity, water, internet, and phone bills	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
48027015-88b7-47fe-95b2-a1c531142b86	Software Licenses	operational	Annual and monthly software subscription costs	t	\N	t	f	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
f8245f67-03d0-479f-ae14-c21edc00e6be	Marketing Campaigns	marketing	Digital marketing and advertising expenses	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
1606feb5-0fec-4804-b355-26475c50c9ed	Office Supplies	administrative	Stationery, equipment, and miscellaneous supplies	t	\N	f	f	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
f149a7b6-7979-423c-ac37-211933c307e3	Travel Expenses	administrative	Business travel and transportation costs	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
0a7cc40c-d4f7-40e3-8fec-41692bdbae7b	Equipment Purchase	operational	Computer hardware and office equipment	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
d101f37e-8bcd-4dac-9cb1-96f19a2525f6	Professional Services	operational	Consulting, legal, and accounting services	t	\N	t	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
70b03e05-a482-4ee7-8105-8bbcd16da233	Employee Benefits	administrative	Health insurance, retirement, and other benefits	t	\N	t	f	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
160adb5c-2a60-4236-be38-4ed14b352822	Maintenance	operational	Equipment and facility maintenance costs	t	\N	f	t	\N	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: expenses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.expenses (id, category, description, amount, expense_date, month, type, receipt_path, status, approved_by_user_id, approved_at, approval_notes, rejection_reason, created_by_user_id, created_at, updated_at, frequency, date, receipt, approved_by) FROM stdin;
673d2c98-2b72-46fd-86d8-d90b7b481ace	Office Rent	Office rent	28000.00	2025-09-20	2025-09	administrative	\N	approved	\N	\N	\N	\N	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-20 06:07:00.52286	2025-09-20 07:14:03.649876	monthly	\N	\N	\N
e8f0f91c-9027-44d7-ac68-235ac72eaf46	EB Bill	Eb Bill	3000.00	2025-09-22	2025-09	administrative	\N	approved	\N	\N	\N	\N	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-22 07:25:56.058091	2025-09-22 07:40:01.432404	monthly	\N	\N	
\.


--
-- Data for Name: file_processes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_processes (id, name, project_id, project_name, file_name, total_rows, header_rows, processed_rows, available_rows, upload_date, status, created_by, active_users, type, daily_target, automation_config, created_at, updated_at) FROM stdin;
fp_mfs45hcs_vftikk	MI project	e807c9b6-5f15-4432-bb4d-f495e2228de4	MI Project	Sample_1_1000.csv	1000	0	1000	0	2025-09-20 10:16:36.240922+00	active	\N	0	manual	\N	\N	2025-09-20 10:16:36.132904+00	2025-09-20 10:16:36.240922+00
fp_mfs58mgr_lf05my	Tool Process	f70c9884-8f0e-4dee-a65d-7400338917e3	SC Project	\N	10000	0	2000	8000	\N	active	\N	0	automation	1000	{"toolName": "Python Tool", "lastUpdate": "2025-09-20T10:48:24.989Z", "dailyCompletions": [{"date": "2025-09-20", "completed": 2000}]}	2025-09-20 10:47:02.167165+00	2025-09-20 10:48:48.638807+00
fp_mfus6i2w_erzngf	New Sep Project	e807c9b6-5f15-4432-bb4d-f495e2228de4	MI Project	Sample_1_1000.csv	1000	0	1000	0	2025-09-22 07:04:45.809244+00	active	\N	0	manual	\N	\N	2025-09-22 07:04:45.677186+00	2025-09-22 07:04:45.809244+00
fp_mfw62g50_fqz47w	New Sep Project Manual for Testinf	e807c9b6-5f15-4432-bb4d-f495e2228de4	MI Project	Sample_1_1000.csv	1000	0	600	400	2025-09-23 06:21:17.144347+00	active	\N	0	manual	\N	\N	2025-09-23 06:21:16.986857+00	2025-09-23 06:21:17.144347+00
\.


--
-- Data for Name: file_requests; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.file_requests (id, user_id, user_name, file_process_id, requested_count, requested_date, status, assigned_by, assigned_date, assigned_count, start_row, end_row, download_link, completed_date, notes, created_at, uploaded_file_name, uploaded_file_path, verification_status, verified_by, verified_at, rework_count, updated_at) FROM stdin;
fr_03e7d5f6-62b2-4809-ba7e-0450b5731ea9	d243a2a2-3afc-442e-b1cc-83977f32787d	user2	fp_mfw62g50_fqz47w	100	2025-09-23 06:29:26.050507+00	completed	Sulaiman	2025-09-23 06:29:42.386464+00	100	1	100	/api/file-requests/fr_03e7d5f6-62b2-4809-ba7e-0450b5731ea9/download	2025-09-23 06:31:40.854558+00	\N	2025-09-23 06:29:26.050507+00	mylabooknew13.zip	storage\\file-requests\\fr_03e7d5f6-62b2-4809-ba7e-0450b5731ea9\\mylabooknew13.zip	approved	Mari	2025-09-23 06:32:03.982635+00	0	2025-09-23 06:32:03.982635+00
fr_58e4cf77-6437-41e1-a8db-2409293bfac8	d243a2a2-3afc-442e-b1cc-83977f32787d	user2	fp_mfus6i2w_erzngf	500	2025-09-22 07:02:51.173234+00	completed	Super Admin	2025-09-22 07:04:50.825253+00	500	1	500	/api/file-requests/fr_58e4cf77-6437-41e1-a8db-2409293bfac8/download	2025-09-22 07:05:29.865263+00	\N	2025-09-22 07:02:51.173234+00	scraped_content__1_.zip	storage\\file-requests\\fr_58e4cf77-6437-41e1-a8db-2409293bfac8\\scraped_content__1_.zip	approved	Super Admin	2025-09-22 07:05:50.893248+00	0	2025-09-22 07:05:50.893248+00
fr_0a0c8982-7401-4eb6-964c-4ec4bece6818	d243a2a2-3afc-442e-b1cc-83977f32787d	user2	fp_mfw62g50_fqz47w	200	2025-09-23 06:37:25.346446+00	completed	Mari	2025-09-23 06:37:40.358407+00	200	201	400	/api/file-requests/fr_0a0c8982-7401-4eb6-964c-4ec4bece6818/download	2025-09-23 07:00:57.050133+00	good	2025-09-23 06:37:25.346446+00	scraped_content.zip	storage\\file-requests\\fr_0a0c8982-7401-4eb6-964c-4ec4bece6818\\scraped_content.zip	approved	Mari	2025-09-23 07:11:11.774347+00	1	2025-09-23 07:11:11.774347+00
fr_f0bcc0b5-759e-44ad-b172-638a86acc15d	29acdefe-44da-4114-a65a-f56a497ff6fe	user	fp_mfus6i2w_erzngf	500	2025-09-22 09:14:19.528117+00	completed	Mari	2025-09-22 09:15:01.836079+00	500	501	1000	/api/file-requests/fr_f0bcc0b5-759e-44ad-b172-638a86acc15d/download	2025-09-23 06:28:27.794544+00	\N	2025-09-22 09:14:19.528117+00	mylabooknew13__2_.zip	storage\\file-requests\\fr_f0bcc0b5-759e-44ad-b172-638a86acc15d\\mylabooknew13__2_.zip	approved	Super Admin	2025-09-23 06:28:44.042515+00	0	2025-09-23 06:28:44.042515+00
fr_790e8419-9c6c-44fe-a9fc-d0d91c8cfbec	29acdefe-44da-4114-a65a-f56a497ff6fe	user	fp_mfs45hcs_vftikk	500	2025-09-20 10:17:07.638541+00	completed	Super Admin	2025-09-20 10:17:24.763581+00	1000	1	1000	/api/file-requests/fr_790e8419-9c6c-44fe-a9fc-d0d91c8cfbec/download	2025-09-20 10:53:16.927284+00	\N	2025-09-20 10:17:07.638541+00	scraped_content__1_.zip	storage\\file-requests\\fr_790e8419-9c6c-44fe-a9fc-d0d91c8cfbec\\scraped_content__1_.zip	approved	Sulaiman	2025-09-20 10:54:06.287137+00	0	2025-09-20 10:54:06.287137+00
fr_d3aa07cd-244d-4784-a0d3-3f8c268e3dbf	29acdefe-44da-4114-a65a-f56a497ff6fe	user	fp_mfw62g50_fqz47w	200	2025-09-23 06:37:13.562426+00	completed	Mari	2025-09-23 06:37:43.8104+00	200	401	600	/api/file-requests/fr_d3aa07cd-244d-4784-a0d3-3f8c268e3dbf/download	2025-09-23 06:39:53.510394+00	Good	2025-09-23 06:37:13.562426+00	scraped_content.zip	storage\\file-requests\\fr_d3aa07cd-244d-4784-a0d3-3f8c268e3dbf\\scraped_content.zip	approved	Sulaiman	2025-09-23 06:40:36.074374+00	0	2025-09-23 06:40:36.074374+00
fr_d61fb834-363b-4cde-be12-ce2ff249ec7c	29acdefe-44da-4114-a65a-f56a497ff6fe	user	fp_mfw62g50_fqz47w	100	2025-09-23 06:29:11.398534+00	completed	Sulaiman	2025-09-23 06:29:45.354494+00	100	101	200	/api/file-requests/fr_d61fb834-363b-4cde-be12-ce2ff249ec7c/download	2025-09-23 06:31:01.238474+00	\N	2025-09-23 06:29:11.398534+00	mylabooknew13__3_.zip	storage\\file-requests\\fr_d61fb834-363b-4cde-be12-ce2ff249ec7c\\mylabooknew13__3_.zip	approved	Mari	2025-09-23 06:32:00.934513+00	0	2025-09-23 06:32:00.934513+00
\.


--
-- Data for Name: monthly_budgets; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monthly_budgets (id, month, type, budgeted_amount, spent_amount, created_by_user_id, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: monthly_financial_summary; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.monthly_financial_summary (id, month, project_revenue, other_revenue, total_revenue, user_salaries, pm_salaries, total_salaries, admin_expenses, operational_expenses, marketing_expenses, utilities_expenses, misc_expenses, total_admin_expenses, total_expenses, net_profit, profit_margin, last_calculated, calculation_version) FROM stdin;
\.


--
-- Data for Name: notification_category_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_category_settings (id, user_id, category, email_enabled, push_enabled, sms_enabled) FROM stdin;
\.


--
-- Data for Name: notification_recipients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_recipients (id, notification_id, recipient_type, recipient_value, created_at) FROM stdin;
\.


--
-- Data for Name: notification_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notification_settings (user_id, email_enabled, push_enabled, sms_enabled, updated_at) FROM stdin;
\.


--
-- Data for Name: notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.notifications (id, title, message, type, category, created_by_user_id, expires_at, created_at) FROM stdin;
\.


--
-- Data for Name: permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.permissions (id, name, description, module, action, is_active, created_at) FROM stdin;
user_create	Create Users	Ability to create new user accounts	User Management	create	t	2025-09-11 09:33:46.287806
user_read	View Users	Ability to view user information	User Management	read	t	2025-09-11 09:33:46.287806
user_update	Edit Users	Ability to modify user accounts	User Management	update	t	2025-09-11 09:33:46.287806
user_delete	Delete Users	Ability to delete user accounts	User Management	delete	t	2025-09-11 09:33:46.287806
project_create	Create Projects	Ability to create new projects	Project Management	create	t	2025-09-11 09:33:46.287806
project_read	View Projects	Ability to view project information	Project Management	read	t	2025-09-11 09:33:46.287806
project_update	Edit Projects	Ability to modify projects	Project Management	update	t	2025-09-11 09:33:46.287806
project_delete	Delete Projects	Ability to delete projects	Project Management	delete	t	2025-09-11 09:33:46.287806
count_submit	Submit Counts	Ability to submit daily counts	Daily Counts	create	t	2025-09-11 09:33:46.287806
count_approve	Approve Counts	Ability to approve/reject daily counts	Daily Counts	approve	t	2025-09-11 09:33:46.287806
reports_view	View Reports	Ability to access reports and analytics	Reports	read	t	2025-09-11 09:33:46.287806
permissions_manage	Manage Permissions	Ability to configure roles and permissions	Permissions	manage	t	2025-09-11 09:33:46.287806
notifications_manage	Manage Notifications	Ability to send and manage notifications	Notifications	manage	t	2025-09-11 09:33:46.287806
settings_manage	Manage Settings	Ability to configure system settings	Settings	manage	t	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: pm_salaries; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.pm_salaries (id, user_id, monthly_salary, effective_from, is_active, created_at, updated_at, updated_by_user_id) FROM stdin;
999957f0-3a97-4eaf-8083-6d89f8826473	3b5d3941-6b72-426e-99d6-30685f9ee583	30000.00	2025-09-19	t	2025-09-19 09:31:32.382962	2025-09-19 09:31:32.382962	\N
115d74e8-1dc0-4659-818b-f81f849c1b37	dad1c730-8ff9-4a1c-ace0-5f20105e2d89	20000.00	2025-09-19	t	2025-09-19 06:16:37.034253	2025-09-19 09:31:32.550949	\N
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, name, description, status, priority, start_date, end_date, target_count, current_count, created_by_user_id, created_at, updated_at, rate_per_file_usd) FROM stdin;
f70c9884-8f0e-4dee-a65d-7400338917e3	SC Project	South Carolina	active	medium	\N	\N	0	0	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-19 07:46:06.062534	2025-09-19 07:46:06.062534	0.008
e807c9b6-5f15-4432-bb4d-f495e2228de4	MI Project	Checking the project	active	medium	\N	\N	0	3830	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-17 06:24:32.519733	2025-09-23 07:11:11.774347	0.05
\.


--
-- Data for Name: role_permissions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.role_permissions (role_id, permission_id) FROM stdin;
super_admin	user_create
super_admin	user_read
super_admin	user_update
super_admin	user_delete
super_admin	project_create
super_admin	project_read
super_admin	project_update
super_admin	project_delete
super_admin	count_submit
super_admin	count_approve
super_admin	reports_view
super_admin	permissions_manage
super_admin	notifications_manage
super_admin	settings_manage
project_manager	project_create
project_manager	project_read
project_manager	project_update
project_manager	user_read
project_manager	count_approve
project_manager	reports_view
project_manager	notifications_manage
user	project_read
user	count_submit
\.


--
-- Data for Name: roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.roles (id, name, description, is_default, user_count, created_at, updated_at) FROM stdin;
super_admin	Super Administrator	Full system access with all permissions	t	0	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
project_manager	Project Manager	Manage projects and team performance	t	0	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
user	User	Basic user with limited access	t	0	2025-09-11 09:33:46.287806	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: salary_config; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.salary_config (id, first_tier_rate, second_tier_rate, first_tier_limit, currency, updated_at, updated_by_user_id) FROM stdin;
1	0.5000	0.6000	500	INR	2025-09-19 09:31:32.499247	6c3cfd14-4862-48bf-9a98-16f18286428d
\.


--
-- Data for Name: security_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.security_settings (id, password_min_length, password_require_special_chars, password_require_numbers, password_require_uppercase, max_login_attempts, lockout_duration, two_factor_enabled, session_security, updated_at) FROM stdin;
1	8	t	t	t	5	15	f	enhanced	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: system_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.system_settings (id, max_file_size, session_timeout, backup_frequency, maintenance_mode, debug_mode, api_rate_limit, allow_registration, require_email_verification, updated_at) FROM stdin;
1	50	30	daily	f	f	1000	t	t	2025-09-11 09:33:46.287806
\.


--
-- Data for Name: tutorial_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutorial_steps (id, tutorial_id, step_number, title, description, image_url, video_timestamp, is_required) FROM stdin;
\.


--
-- Data for Name: tutorials; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tutorials (id, title, description, category, status, video_file_name, video_file_path, video_mime, created_by_user_id, created_at, updated_at, instructions, target_roles, is_required, tags, "order", view_count, completion_count) FROM stdin;
tut_mfv0j1mv_lu0c3y	How to Use the Application (Step-by-Step Guide)	<h3 data-start="217" data-end="260">🏠 Step 1: Login and Access Dashboard</h3><h3 data-start="253" data-end="295">\n<p data-start="261" data-end="473"></p><ul><li>Login to the system with your credentials</li><li>You will land on the <span data-start="334" data-end="347" style="font-size: 1rem; color: rgb(2, 8, 23);"><b>Dashboard</b></span></li><li>View your performance, file requests, and current activity</li><li><span style="font-size: 1rem; color: rgb(2, 8, 23);">Navigate to </span><span data-start="431" data-end="448" style="font-size: 1rem; color: rgb(2, 8, 23);"><b>Request Files</b></span><span style="font-size: 1rem; color: rgb(2, 8, 23);"> to begin your daily task</span></li></ul><p></p>\n<hr data-start="475" data-end="478">\n</h3><h3 data-start="480" data-end="524">📂 Step 2: Navigate to "Request Files"</h3><h3 data-start="253" data-end="295">\n<p data-start="525" data-end="717"></p><ul><li>Click the <strong data-start="539" data-end="556">Request Files</strong> tab in the menu</li><li>Here, you can see all current and previous task requests</li><li><span style="font-size: 1rem; color: rgb(2, 8, 23);">Track the status: </span><strong data-start="660" data-end="671" style="font-size: 1rem; color: rgb(2, 8, 23);">Pending</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);">, </span><strong data-start="673" data-end="685" style="font-size: 1rem; color: rgb(2, 8, 23);">Assigned</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);">, </span><strong data-start="687" data-end="700" style="font-size: 1rem; color: rgb(2, 8, 23);">Completed</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);">, or </span><strong data-start="705" data-end="717" style="font-size: 1rem; color: rgb(2, 8, 23);">Verified</strong></li></ul><p></p>\n<hr data-start="719" data-end="722">\n</h3><h3 data-start="724" data-end="759">✍️ Step 3: Request a New File</h3><h3 data-start="253" data-end="295">\n<p data-start="760" data-end="903"></p><ul><li>Click the <strong data-start="774" data-end="790">Request File</strong> button</li><li>This sends a task request to your </li><li><strong data-start="838" data-end="857">Project Manager </strong>Wait until the PM assigns a file to you</li></ul><p></p>\n<hr data-start="905" data-end="908">\n</h3><h3 data-start="910" data-end="953">📥 Step 4: Download the Assigned File</h3><h3 data-start="253" data-end="295">\n<p data-start="954" data-end="1130"></p><ul><li>Once assigned, the file status will update to <strong data-start="1004" data-end="1016">Assigned</strong></li><li>Click the <strong data-start="1033" data-end="1045" style="font-size: 1rem; color: rgb(2, 8, 23);">Download</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> button next to the task</span></li><li>Start working on the file as per the task instructions</li></ul><p></p>\n<hr data-start="1132" data-end="1135">\n</h3><h3 data-start="1137" data-end="1174">🧑‍💻 Step 5: Complete the Task</h3><h3 data-start="253" data-end="295">\n<p data-start="1175" data-end="1346"></p><ul><li>Work on your assigned task carefully</li><li>Compress your finished output into a <strong data-start="1259" data-end="1274" style="font-size: 1rem; color: rgb(2, 8, 23);"><code data-start="1261" data-end="1267">.zip</code> file</strong></li><li>Ensure the <code data-start="1292" data-end="1298" style="font-size: 1rem; color: rgb(2, 8, 23);">.zip</code><span style="font-size: 1rem; color: rgb(2, 8, 23);"> contains all required documents or deliverables</span></li></ul><p></p>\n<hr data-start="1348" data-end="1351">\n</h3><h3 data-start="1353" data-end="1395">⬆️ Step 6: Upload the Completed File</h3><h3 data-start="253" data-end="295">\n<p data-start="1396" data-end="1557"></p><ul><li>Return to <strong data-start="1410" data-end="1427">Request Files</strong> and find your task</li><li>Change the status to <strong data-start="1474" data-end="1487" style="font-size: 1rem; color: rgb(2, 8, 23);">Completed</strong></li><li>Click <strong data-start="1500" data-end="1510" style="font-size: 1rem; color: rgb(2, 8, 23);">Upload</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> and select your </span><strong data-start="1527" data-end="1537" style="font-size: 1rem; color: rgb(2, 8, 23);"><code data-start="1529" data-end="1535">.zip</code></strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> file for submission</span></li></ul><p></p>\n<hr data-start="1559" data-end="1562">\n</h3><h3 data-start="1564" data-end="1609">🕵️‍♂️ Step 7: Wait for PM Verification</h3><h3 data-start="253" data-end="295">\n<p data-start="1610" data-end="1774"></p><ul><li>Your <strong data-start="1619" data-end="1638">Project Manager</strong> will verify your submission</li><li>The task remains <strong data-start="1690" data-end="1703" style="font-size: 1rem; color: rgb(2, 8, 23);">Completed</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> until verified</span></li><li>You will be notified upon successful verification</li></ul><p></p>\n<hr data-start="1776" data-end="1779">\n</h3><h3 data-start="1781" data-end="1819">🔁 Step 8: Request the Next Task</h3><h3 data-start="253" data-end="295">\n<p data-start="1820" data-end="1969"></p><ul><li>After verification, go back to <strong data-start="1855" data-end="1872">Request Files</strong></li><li>Click <strong data-start="1885" data-end="1901" style="font-size: 1rem; color: rgb(2, 8, 23);">Request File</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> to get a new task</span></li><li>Repeat the process starting from&nbsp;<strong data-start="1959" data-end="1969" style="font-size: 1rem; color: rgb(2, 8, 23);">Step 3</strong></li></ul><p></p>\n<hr data-start="1971" data-end="1974">\n</h3><h2 data-start="1976" data-end="1997">⚠️ Important Notes</h2><h3 data-start="253" data-end="295">\n<p data-start="1999" data-end="2196"></p><ul><li>🗂️ Upload your task only in <strong data-start="2032" data-end="2049"><code data-start="2034" data-end="2040">.zip</code> format</strong></li><li>✅ Always change the task <strong data-start="2081" data-end="2121" style="font-size: 1rem; color: rgb(2, 8, 23);">status to Completed before uploading</strong></li><li>🔒 You <strong data-start="2135" data-end="2165" style="font-size: 1rem; color: rgb(2, 8, 23);">must wait for verification</strong><span style="font-size: 1rem; color: rgb(2, 8, 23);"> before requesting another file</span></li></ul><p></p></h3>	getting_started	published	istockphoto-2188604143-640_adpp_is.mp4	storage\\tutorials\\tut_mfv0j1mv_lu0c3y\\istockphoto-2188604143-640_adpp_is.mp4	video/mp4	6c3cfd14-4862-48bf-9a98-16f18286428d	2025-09-22 10:58:27.733645	2025-09-23 11:40:30.277228		{user,project_manager,super_admin}	f	{}	0	0	0
\.


--
-- Data for Name: user_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_notifications (id, notification_id, user_id, is_read, read_at, created_at) FROM stdin;
\.


--
-- Data for Name: user_projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_projects (user_id, project_id, role_in_project, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_roles (user_id, role_id, assigned_at, assigned_by) FROM stdin;
\.


--
-- Data for Name: user_salary_tracking; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_salary_tracking (id, user_id, date, files_processed, tier1_files, tier1_earnings, tier2_files, tier2_earnings, total_earnings, last_updated) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, name, email, phone, hashed_password, role, status, department, job_title, avatar_url, theme, language, notifications_enabled, join_date, last_login, created_at, updated_at) FROM stdin;
053a7da7-ac9e-4cd0-8106-4b8be411a4bb	Singam	singam@websyntactic.com	+9112345678909	$2b$10$xmLNxTiWm.fak3bmic.eze76q9vu9.8b.knrBJ8bAd3N5fIMQH8TO	super_admin	active	Admin	Admin	\N	system	English	t	2025-09-17	\N	2025-09-17 06:18:29.932752	2025-09-17 06:18:29.932752
dad1c730-8ff9-4a1c-ace0-5f20105e2d89	Sulaiman	sulaiman@websyntactic.com	\N	$2b$10$rzRjO4Id.Lrvw.RADlVy1.pRY4cvhob7naXBpmSANb61wyMrWHEO6	project_manager	active	Operations	Project Manager	\N	system	English	t	2025-09-17	2025-09-23 07:01:06.774092	2025-09-17 06:40:43.881634	2025-09-23 07:01:06.774092
3b5d3941-6b72-426e-99d6-30685f9ee583	Mari	mari@websyntactic.com	\N	$2b$10$vJs9i3uWhBmEJdYJ1JWGOOflWOQrGjAiEvjlXv4B/0S6ebI.ZW8eS	project_manager	active	\N	\N	\N	system	English	t	2025-09-19	2025-09-23 07:10:57.066054	2025-09-19 09:31:32.234973	2025-09-23 07:10:57.066054
d243a2a2-3afc-442e-b1cc-83977f32787d	user2	user2@websyntactic.com	3456783456789	$2b$10$CsORYLO/Z1N/9VTUDjBYCus74DPJ8sR2kgY2f00uuUYhAKEHHztIu	user	active	Operations	User	\N	system	English	t	2025-09-17	2025-09-23 07:11:26.442049	2025-09-17 10:45:35.508952	2025-09-23 07:11:26.442049
29acdefe-44da-4114-a65a-f56a497ff6fe	user	user@websyntactic.com	\N	$2b$10$CqISaK/A6UisKk/cmgUUmemDkYHnU2s.cEqhbzhX1NSNv8MU61kO2	user	active	Operations	User	\N	system	English	t	2025-09-17	2025-09-23 10:28:55.09457	2025-09-17 06:41:53.511939	2025-09-23 10:28:55.09457
6c3cfd14-4862-48bf-9a98-16f18286428d	Super Admin	admin@websyntactic.com	9629558605	$2b$10$lg2cCZkN6y5i4wvaNCOXM.3KMelf8y/sug.Zccm72mAtaBLY/L7Tq	super_admin	active	\N	\N	\N	system	English	t	2025-09-17	2025-09-23 10:31:56.014771	2025-09-17 06:13:44.566058	2025-09-23 10:31:56.014771
\.


--
-- Name: activity_logs activity_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_pkey PRIMARY KEY (id);


--
-- Name: backups backups_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: daily_counts daily_counts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_counts
    ADD CONSTRAINT daily_counts_pkey PRIMARY KEY (id);


--
-- Name: daily_counts daily_counts_user_id_project_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_counts
    ADD CONSTRAINT daily_counts_user_id_project_id_date_key UNIQUE (user_id, project_id, date);


--
-- Name: email_integration email_integration_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.email_integration
    ADD CONSTRAINT email_integration_pkey PRIMARY KEY (id);


--
-- Name: expense_categories expense_categories_name_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_name_key UNIQUE (name);


--
-- Name: expense_categories expense_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expense_categories
    ADD CONSTRAINT expense_categories_pkey PRIMARY KEY (id);


--
-- Name: expenses expenses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_pkey PRIMARY KEY (id);


--
-- Name: file_processes file_processes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_processes
    ADD CONSTRAINT file_processes_pkey PRIMARY KEY (id);


--
-- Name: file_requests file_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_requests
    ADD CONSTRAINT file_requests_pkey PRIMARY KEY (id);


--
-- Name: monthly_budgets monthly_budgets_month_type_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_budgets
    ADD CONSTRAINT monthly_budgets_month_type_key UNIQUE (month, type);


--
-- Name: monthly_budgets monthly_budgets_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_budgets
    ADD CONSTRAINT monthly_budgets_pkey PRIMARY KEY (id);


--
-- Name: monthly_financial_summary monthly_financial_summary_month_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_financial_summary
    ADD CONSTRAINT monthly_financial_summary_month_key UNIQUE (month);


--
-- Name: monthly_financial_summary monthly_financial_summary_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_financial_summary
    ADD CONSTRAINT monthly_financial_summary_pkey PRIMARY KEY (id);


--
-- Name: notification_category_settings notification_category_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_category_settings
    ADD CONSTRAINT notification_category_settings_pkey PRIMARY KEY (id);


--
-- Name: notification_category_settings notification_category_settings_user_id_category_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_category_settings
    ADD CONSTRAINT notification_category_settings_user_id_category_key UNIQUE (user_id, category);


--
-- Name: notification_recipients notification_recipients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_recipients
    ADD CONSTRAINT notification_recipients_pkey PRIMARY KEY (id);


--
-- Name: notification_settings notification_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_pkey PRIMARY KEY (user_id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: permissions permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.permissions
    ADD CONSTRAINT permissions_pkey PRIMARY KEY (id);


--
-- Name: pm_salaries pm_salaries_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_salaries
    ADD CONSTRAINT pm_salaries_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: role_permissions role_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_pkey PRIMARY KEY (role_id, permission_id);


--
-- Name: roles roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.roles
    ADD CONSTRAINT roles_pkey PRIMARY KEY (id);


--
-- Name: salary_config salary_config_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_config
    ADD CONSTRAINT salary_config_pkey PRIMARY KEY (id);


--
-- Name: security_settings security_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.security_settings
    ADD CONSTRAINT security_settings_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: tutorial_steps tutorial_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_steps
    ADD CONSTRAINT tutorial_steps_pkey PRIMARY KEY (id);


--
-- Name: tutorials tutorials_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorials
    ADD CONSTRAINT tutorials_pkey PRIMARY KEY (id);


--
-- Name: user_notifications user_notifications_notification_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_notification_id_user_id_key UNIQUE (notification_id, user_id);


--
-- Name: user_notifications user_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_pkey PRIMARY KEY (id);


--
-- Name: user_projects user_projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_pkey PRIMARY KEY (user_id, project_id);


--
-- Name: user_roles user_roles_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_pkey PRIMARY KEY (user_id, role_id);


--
-- Name: user_salary_tracking user_salary_tracking_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_salary_tracking
    ADD CONSTRAINT user_salary_tracking_pkey PRIMARY KEY (id);


--
-- Name: user_salary_tracking user_salary_tracking_user_id_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_salary_tracking
    ADD CONSTRAINT user_salary_tracking_user_id_date_key UNIQUE (user_id, date);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: idx_activity_logs_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_created_at ON public.activity_logs USING btree (created_at DESC);


--
-- Name: idx_activity_logs_entity; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_entity ON public.activity_logs USING btree (entity_type, entity_id);


--
-- Name: idx_activity_logs_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_activity_logs_user ON public.activity_logs USING btree (user_id);


--
-- Name: idx_daily_counts_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_counts_date ON public.daily_counts USING btree (date);


--
-- Name: idx_daily_counts_project_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_counts_project_date ON public.daily_counts USING btree (project_id, date);


--
-- Name: idx_daily_counts_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_counts_status ON public.daily_counts USING btree (status);


--
-- Name: idx_daily_counts_submitted_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_counts_submitted_at ON public.daily_counts USING btree (submitted_at);


--
-- Name: idx_daily_counts_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_counts_user_date ON public.daily_counts USING btree (user_id, date);


--
-- Name: idx_expense_categories_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_active ON public.expense_categories USING btree (is_active);


--
-- Name: idx_expense_categories_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expense_categories_type ON public.expense_categories USING btree (type);


--
-- Name: idx_expenses_approved_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_approved_by ON public.expenses USING btree (approved_by_user_id);


--
-- Name: idx_expenses_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_created_by ON public.expenses USING btree (created_by_user_id);


--
-- Name: idx_expenses_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_date ON public.expenses USING btree (expense_date);


--
-- Name: idx_expenses_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_month ON public.expenses USING btree (month);


--
-- Name: idx_expenses_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_status ON public.expenses USING btree (status);


--
-- Name: idx_expenses_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_expenses_type ON public.expenses USING btree (type);


--
-- Name: idx_file_processes_project_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_file_processes_project_id ON public.file_processes USING btree (project_id);


--
-- Name: idx_file_requests_file_process_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_file_requests_file_process_id ON public.file_requests USING btree (file_process_id);


--
-- Name: idx_monthly_budgets_month; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_budgets_month ON public.monthly_budgets USING btree (month);


--
-- Name: idx_monthly_budgets_type; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_monthly_budgets_type ON public.monthly_budgets USING btree (type);


--
-- Name: idx_notification_recipients_value; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notification_recipients_value ON public.notification_recipients USING btree (recipient_value);


--
-- Name: idx_notifications_created_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_created_at ON public.notifications USING btree (created_at DESC);


--
-- Name: idx_notifications_expires_at; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_notifications_expires_at ON public.notifications USING btree (expires_at);


--
-- Name: idx_pm_salaries_active; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_salaries_active ON public.pm_salaries USING btree (is_active);


--
-- Name: idx_pm_salaries_effective_from; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_salaries_effective_from ON public.pm_salaries USING btree (effective_from);


--
-- Name: idx_pm_salaries_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_salaries_user ON public.pm_salaries USING btree (user_id);


--
-- Name: idx_pm_salaries_user_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pm_salaries_user_id ON public.pm_salaries USING btree (user_id);


--
-- Name: idx_projects_created_by; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_created_by ON public.projects USING btree (created_by_user_id);


--
-- Name: idx_projects_end_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_end_date ON public.projects USING btree (end_date);


--
-- Name: idx_projects_priority; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_priority ON public.projects USING btree (priority);


--
-- Name: idx_projects_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_projects_status ON public.projects USING btree (status);


--
-- Name: idx_user_notifications_user_read; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_notifications_user_read ON public.user_notifications USING btree (user_id, is_read);


--
-- Name: idx_user_projects_project; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_projects_project ON public.user_projects USING btree (project_id);


--
-- Name: idx_user_projects_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_projects_user ON public.user_projects USING btree (user_id);


--
-- Name: idx_user_salary_tracking_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_salary_tracking_date ON public.user_salary_tracking USING btree (date);


--
-- Name: idx_user_salary_tracking_user_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_user_salary_tracking_user_date ON public.user_salary_tracking USING btree (user_id, date);


--
-- Name: idx_users_email; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_email ON public.users USING btree (email);


--
-- Name: idx_users_last_login; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_last_login ON public.users USING btree (last_login);


--
-- Name: idx_users_role; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_role ON public.users USING btree (role);


--
-- Name: idx_users_status; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_users_status ON public.users USING btree (status);


--
-- Name: user_profiles _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.user_profiles AS
 SELECT u.id,
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
    count(DISTINCT up.project_id) AS projects_count,
    u.created_at,
    u.updated_at
   FROM (public.users u
     LEFT JOIN public.user_projects up ON ((u.id = up.user_id)))
  GROUP BY u.id;


--
-- Name: project_summary _RETURN; Type: RULE; Schema: public; Owner: -
--

CREATE OR REPLACE VIEW public.project_summary AS
 SELECT p.id,
    p.name,
    p.description,
    p.status,
    p.priority,
    p.start_date,
    p.end_date,
    p.target_count,
    p.current_count,
        CASE
            WHEN (p.target_count > 0) THEN (((p.current_count)::double precision / (p.target_count)::double precision) * (100)::double precision)
            ELSE (0)::double precision
        END AS progress_percentage,
    count(DISTINCT up.user_id) AS assigned_users_count,
    p.created_by_user_id,
    u.name AS created_by_name,
    p.created_at,
    p.updated_at
   FROM ((public.projects p
     LEFT JOIN public.user_projects up ON ((p.id = up.project_id)))
     LEFT JOIN public.users u ON ((p.created_by_user_id = u.id)))
  GROUP BY p.id, u.name;


--
-- Name: daily_counts trigger_daily_counts_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_daily_counts_updated_at BEFORE UPDATE ON public.daily_counts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expense_categories trigger_expense_categories_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_expense_categories_updated_at BEFORE UPDATE ON public.expense_categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses trigger_expenses_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_expenses_updated_at BEFORE UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: monthly_budgets trigger_monthly_budgets_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_monthly_budgets_updated_at BEFORE UPDATE ON public.monthly_budgets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: pm_salaries trigger_pm_salaries_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_pm_salaries_updated_at BEFORE UPDATE ON public.pm_salaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: projects trigger_projects_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_projects_updated_at BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: roles trigger_roles_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_roles_updated_at BEFORE UPDATE ON public.roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: expenses trigger_update_monthly_budget_spent; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_monthly_budget_spent AFTER INSERT OR DELETE OR UPDATE ON public.expenses FOR EACH ROW EXECUTE FUNCTION public.update_monthly_budget_spent();


--
-- Name: daily_counts trigger_update_project_current_count; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_update_project_current_count AFTER INSERT OR DELETE OR UPDATE ON public.daily_counts FOR EACH ROW EXECUTE FUNCTION public.update_project_current_count();


--
-- Name: users trigger_users_updated_at; Type: TRIGGER; Schema: public; Owner: -
--

CREATE TRIGGER trigger_users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();


--
-- Name: activity_logs activity_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.activity_logs
    ADD CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: backups backups_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.backups
    ADD CONSTRAINT backups_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: daily_counts daily_counts_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_counts
    ADD CONSTRAINT daily_counts_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: daily_counts daily_counts_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_counts
    ADD CONSTRAINT daily_counts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: daily_counts daily_counts_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_counts
    ADD CONSTRAINT daily_counts_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: expenses expenses_approved_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_approved_by_user_id_fkey FOREIGN KEY (approved_by_user_id) REFERENCES public.users(id);


--
-- Name: expenses expenses_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.expenses
    ADD CONSTRAINT expenses_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: file_requests file_requests_file_process_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.file_requests
    ADD CONSTRAINT file_requests_file_process_id_fkey FOREIGN KEY (file_process_id) REFERENCES public.file_processes(id) ON DELETE CASCADE;


--
-- Name: monthly_budgets monthly_budgets_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.monthly_budgets
    ADD CONSTRAINT monthly_budgets_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: notification_category_settings notification_category_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_category_settings
    ADD CONSTRAINT notification_category_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notification_recipients notification_recipients_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_recipients
    ADD CONSTRAINT notification_recipients_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: notification_settings notification_settings_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notification_settings
    ADD CONSTRAINT notification_settings_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: notifications notifications_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: pm_salaries pm_salaries_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_salaries
    ADD CONSTRAINT pm_salaries_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id);


--
-- Name: pm_salaries pm_salaries_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pm_salaries
    ADD CONSTRAINT pm_salaries_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: projects projects_created_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_created_by_user_id_fkey FOREIGN KEY (created_by_user_id) REFERENCES public.users(id);


--
-- Name: role_permissions role_permissions_permission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_permission_id_fkey FOREIGN KEY (permission_id) REFERENCES public.permissions(id) ON DELETE CASCADE;


--
-- Name: role_permissions role_permissions_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.role_permissions
    ADD CONSTRAINT role_permissions_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: salary_config salary_config_updated_by_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.salary_config
    ADD CONSTRAINT salary_config_updated_by_user_id_fkey FOREIGN KEY (updated_by_user_id) REFERENCES public.users(id);


--
-- Name: tutorial_steps tutorial_steps_tutorial_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tutorial_steps
    ADD CONSTRAINT tutorial_steps_tutorial_id_fkey FOREIGN KEY (tutorial_id) REFERENCES public.tutorials(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_notification_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_notification_id_fkey FOREIGN KEY (notification_id) REFERENCES public.notifications(id) ON DELETE CASCADE;


--
-- Name: user_notifications user_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_notifications
    ADD CONSTRAINT user_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_projects user_projects_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_projects user_projects_project_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id) ON DELETE CASCADE;


--
-- Name: user_projects user_projects_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_projects
    ADD CONSTRAINT user_projects_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_assigned_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES public.users(id);


--
-- Name: user_roles user_roles_role_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_role_id_fkey FOREIGN KEY (role_id) REFERENCES public.roles(id) ON DELETE CASCADE;


--
-- Name: user_roles user_roles_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_roles
    ADD CONSTRAINT user_roles_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: user_salary_tracking user_salary_tracking_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_salary_tracking
    ADD CONSTRAINT user_salary_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- PostgreSQL database dump complete
--

