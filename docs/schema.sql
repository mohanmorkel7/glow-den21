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
