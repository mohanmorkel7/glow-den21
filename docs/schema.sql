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



CREATE TABLE IF NOT EXISTS public.activity_logs (
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

CREATE TABLE IF NOT EXISTS public.backups (
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

CREATE TABLE IF NOT EXISTS public.company_settings (
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

CREATE TABLE IF NOT EXISTS public.daily_counts (
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

CREATE TABLE IF NOT EXISTS public.notifications (
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

CREATE TABLE IF NOT EXISTS public.projects (
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

CREATE TABLE IF NOT EXISTS public.user_notifications (
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
-- Drop table public.users;

CREATE TABLE IF NOT EXISTS public.users (
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


INSERT INTO users (
  id, name, email, phone, hashed_password, role, status,
  department, job_title, avatar_url, theme, language,
  notifications_enabled, join_date, last_login, created_at, updated_at
) VALUES (
  '6c3cfd14-4862-48bf-9a98-16f18286428d',
  'Super Admin',
  'admin@websyntactic.com',
  '9629558605',
  '$2b$10$lg2cCZkN6y5i4wvaNCOXM.3KMelf8y/sug.Zccm72mAtaBLY/L7Tq',
  'super_admin',
  'active',
  NULL,
  NULL,
  NULL,
  'system',
  'English',
  true,
  '2025-09-17',
  '2025-09-24 06:02:46.6047',
  '2025-09-17 06:13:44.566058',
  '2025-09-24 06:02:46.6047'
);

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

CREATE TABLE IF NOT EXISTS public.email_integration (
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

CREATE TABLE IF NOT EXISTS public.expense_categories (
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

CREATE TABLE IF NOT EXISTS public.expenses (
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

CREATE TABLE IF NOT EXISTS public.file_processes (
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

CREATE TABLE IF NOT EXISTS public.file_requests (
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

CREATE TABLE IF NOT EXISTS public.monthly_budgets (
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

CREATE TABLE IF NOT EXISTS public.monthly_financial_summary (
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

CREATE TABLE IF NOT EXISTS public.notification_category_settings (
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

CREATE TABLE IF NOT EXISTS public.notification_recipients (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    notification_id uuid,
    recipient_type public.recipient_type NOT NULL,
    recipient_value character varying(100) NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: notification_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.notification_settings (
    user_id uuid NOT NULL,
    email_enabled boolean DEFAULT true NOT NULL,
    push_enabled boolean DEFAULT true NOT NULL,
    sms_enabled boolean DEFAULT false NOT NULL,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


--
-- Name: permissions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE IF NOT EXISTS public.permissions (
    id character varying(50) NOT NULL,
    name character varying(100) NOT NULL,
    description text,
    module character varying(50) NOT NULL,
    action character varying(20) NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
