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
