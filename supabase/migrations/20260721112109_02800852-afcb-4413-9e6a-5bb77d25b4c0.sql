
-- =========================
-- ENUMS
-- =========================
CREATE TYPE public.app_role AS ENUM ('admin','teacher','student','parent');
CREATE TYPE public.account_status AS ENUM ('pending','active','suspended');
CREATE TYPE public.exam_status AS ENUM ('draft','published','closed','archived');
CREATE TYPE public.question_type AS ENUM ('mcq_single','mcq_multi','true_false','short_answer','essay');
CREATE TYPE public.attempt_status AS ENUM ('in_progress','submitted','auto_submitted','graded');
CREATE TYPE public.attendance_status AS ENUM ('present','absent','late','excused');
CREATE TYPE public.lecture_status AS ENUM ('scheduled','live','ended','cancelled');
CREATE TYPE public.notification_channel AS ENUM ('in_app','email','whatsapp','sms');
CREATE TYPE public.notification_status AS ENUM ('pending','sent','failed','read');
CREATE TYPE public.parent_relationship AS ENUM ('father','mother','guardian','other');

-- =========================
-- UPDATED_AT HELPER
-- =========================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path=public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- =========================
-- PROFILES (one per auth user)
-- =========================
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  username text UNIQUE,
  email text,
  phone text,
  avatar_url text,
  status public.account_status NOT NULL DEFAULT 'active',
  locale text NOT NULL DEFAULT 'ar',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- USER ROLES (separate table — never on profiles)
-- =========================
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id=_user_id AND role=_role);
$$;

CREATE OR REPLACE FUNCTION public.current_user_has_role(_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT public.has_role(auth.uid(), _role);
$$;

-- =========================
-- ROLE PROFILES
-- =========================
CREATE TABLE public.student_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  educational_level_id uuid,
  group_id uuid,
  student_code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_profiles TO authenticated;
GRANT ALL ON public.student_profiles TO service_role;
ALTER TABLE public.student_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_student_profiles_updated BEFORE UPDATE ON public.student_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.teacher_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  bio text,
  subject_specialty text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_profiles TO authenticated;
GRANT ALL ON public.teacher_profiles TO service_role;
ALTER TABLE public.teacher_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_teacher_profiles_updated BEFORE UPDATE ON public.teacher_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.parent_profiles (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.parent_profiles TO authenticated;
GRANT ALL ON public.parent_profiles TO service_role;
ALTER TABLE public.parent_profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_parent_profiles_updated BEFORE UPDATE ON public.parent_profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.student_parents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  relationship public.parent_relationship NOT NULL DEFAULT 'guardian',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (student_id, parent_id)
);
CREATE INDEX idx_student_parents_parent ON public.student_parents(parent_id);
CREATE INDEX idx_student_parents_student ON public.student_parents(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.student_parents TO authenticated;
GRANT ALL ON public.student_parents TO service_role;
ALTER TABLE public.student_parents ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_parent_of(_parent uuid, _student uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.student_parents WHERE parent_id=_parent AND student_id=_student);
$$;

-- =========================
-- ACADEMIC STRUCTURE
-- =========================
CREATE TABLE public.educational_levels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.educational_levels TO authenticated;
GRANT ALL ON public.educational_levels TO service_role;
ALTER TABLE public.educational_levels ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.academic_terms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  starts_on date NOT NULL,
  ends_on date NOT NULL,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_terms TO authenticated;
GRANT ALL ON public.academic_terms TO service_role;
ALTER TABLE public.academic_terms ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  educational_level_id uuid REFERENCES public.educational_levels(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.groups TO authenticated;
GRANT ALL ON public.groups TO service_role;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;

-- Wire student_profiles FKs now that referenced tables exist
ALTER TABLE public.student_profiles
  ADD CONSTRAINT student_profiles_level_fk FOREIGN KEY (educational_level_id) REFERENCES public.educational_levels(id) ON DELETE SET NULL,
  ADD CONSTRAINT student_profiles_group_fk FOREIGN KEY (group_id) REFERENCES public.groups(id) ON DELETE SET NULL;

CREATE TABLE public.courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  subject text,
  description text,
  educational_level_id uuid REFERENCES public.educational_levels(id) ON DELETE SET NULL,
  term_id uuid REFERENCES public.academic_terms(id) ON DELETE SET NULL,
  starts_on date,
  ends_on date,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT ALL ON public.courses TO service_role;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_courses_updated BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.teacher_courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, teacher_id)
);
CREATE INDEX idx_teacher_courses_teacher ON public.teacher_courses(teacher_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.teacher_courses TO authenticated;
GRANT ALL ON public.teacher_courses TO service_role;
ALTER TABLE public.teacher_courses ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.teacher_owns_course(_teacher uuid, _course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.teacher_courses WHERE teacher_id=_teacher AND course_id=_course);
$$;

CREATE TABLE public.enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  group_id uuid REFERENCES public.groups(id) ON DELETE SET NULL,
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (course_id, student_id)
);
CREATE INDEX idx_enrollments_student ON public.enrollments(student_id);
CREATE INDEX idx_enrollments_course ON public.enrollments(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.enrollments TO authenticated;
GRANT ALL ON public.enrollments TO service_role;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.student_enrolled_in(_student uuid, _course uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.enrollments WHERE student_id=_student AND course_id=_course);
$$;

-- =========================
-- QUESTION BANK & EXAMS
-- =========================
CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  type public.question_type NOT NULL,
  prompt text NOT NULL,
  explanation text,
  difficulty int NOT NULL DEFAULT 1,
  category text,
  default_points numeric(6,2) NOT NULL DEFAULT 1,
  is_archived boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_questions_updated BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.question_options (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  label text NOT NULL,
  is_correct boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0
);
CREATE INDEX idx_question_options_q ON public.question_options(question_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_options TO authenticated;
GRANT ALL ON public.question_options TO service_role;
ALTER TABLE public.question_options ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.exams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  instructions text,
  opens_at timestamptz NOT NULL,
  closes_at timestamptz NOT NULL,
  duration_minutes int NOT NULL,
  max_attempts int NOT NULL DEFAULT 1,
  passing_score numeric(6,2) NOT NULL DEFAULT 50,
  total_points numeric(8,2) NOT NULL DEFAULT 0,
  randomize_questions boolean NOT NULL DEFAULT true,
  randomize_answers boolean NOT NULL DEFAULT true,
  auto_submit boolean NOT NULL DEFAULT true,
  show_results boolean NOT NULL DEFAULT true,
  access_password text,
  status public.exam_status NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_exams_course ON public.exams(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exams TO authenticated;
GRANT ALL ON public.exams TO service_role;
ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_exams_updated BEFORE UPDATE ON public.exams FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.exam_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  points numeric(6,2) NOT NULL DEFAULT 1,
  sort_order int NOT NULL DEFAULT 0,
  UNIQUE (exam_id, question_id)
);
CREATE INDEX idx_exam_questions_exam ON public.exam_questions(exam_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_questions TO authenticated;
GRANT ALL ON public.exam_questions TO service_role;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.exam_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id uuid NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  attempt_number int NOT NULL DEFAULT 1,
  status public.attempt_status NOT NULL DEFAULT 'in_progress',
  started_at timestamptz NOT NULL DEFAULT now(),
  submitted_at timestamptz,
  deadline_at timestamptz NOT NULL,
  score numeric(8,2),
  percentage numeric(6,2),
  passed boolean,
  ip_address text,
  user_agent text,
  UNIQUE (exam_id, student_id, attempt_number)
);
CREATE INDEX idx_attempts_student ON public.exam_attempts(student_id);
CREATE INDEX idx_attempts_exam ON public.exam_attempts(exam_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.exam_attempts TO authenticated;
GRANT ALL ON public.exam_attempts TO service_role;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.attempt_answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid NOT NULL REFERENCES public.exam_attempts(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE RESTRICT,
  selected_option_ids uuid[],
  text_answer text,
  is_correct boolean,
  awarded_points numeric(6,2),
  graded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  graded_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (attempt_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attempt_answers TO authenticated;
GRANT ALL ON public.attempt_answers TO service_role;
ALTER TABLE public.attempt_answers ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_attempt_answers_updated BEFORE UPDATE ON public.attempt_answers FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- LIVE LECTURES (Zoom)
-- =========================
CREATE TABLE public.live_lectures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  scheduled_at timestamptz NOT NULL,
  duration_minutes int NOT NULL DEFAULT 60,
  zoom_meeting_id text,
  zoom_join_url text,
  zoom_start_url text,  -- teacher/admin only via RLS
  status public.lecture_status NOT NULL DEFAULT 'scheduled',
  started_at timestamptz,
  ended_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_lectures_course ON public.live_lectures(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.live_lectures TO authenticated;
GRANT ALL ON public.live_lectures TO service_role;
ALTER TABLE public.live_lectures ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_lectures_updated BEFORE UPDATE ON public.live_lectures FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Safe view exposes lectures without the host start URL for students/parents
CREATE OR REPLACE VIEW public.live_lectures_public AS
  SELECT id, course_id, teacher_id, title, description, scheduled_at, duration_minutes,
         zoom_meeting_id, zoom_join_url, status, started_at, ended_at, created_at
  FROM public.live_lectures;
GRANT SELECT ON public.live_lectures_public TO authenticated;

CREATE TABLE public.lecture_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lecture_id uuid NOT NULL REFERENCES public.live_lectures(id) ON DELETE CASCADE,
  student_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status public.attendance_status NOT NULL DEFAULT 'absent',
  joined_at timestamptz,
  left_at timestamptz,
  duration_seconds int,
  notes text,
  recorded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (lecture_id, student_id)
);
CREATE INDEX idx_attendance_student ON public.lecture_attendance(student_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.lecture_attendance TO authenticated;
GRANT ALL ON public.lecture_attendance TO service_role;
ALTER TABLE public.lecture_attendance ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_attendance_updated BEFORE UPDATE ON public.lecture_attendance FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- =========================
-- ANNOUNCEMENTS / NOTIFICATIONS
-- =========================
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE,
  author_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  title text NOT NULL,
  body text NOT NULL,
  audience_roles public.app_role[] NOT NULL DEFAULT ARRAY['student','parent']::public.app_role[],
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_announcements_course ON public.announcements(course_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.announcements TO authenticated;
GRANT ALL ON public.announcements TO service_role;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notification_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  subject text,
  body text NOT NULL,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_templates TO authenticated;
GRANT ALL ON public.notification_templates TO service_role;
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  channel public.notification_channel NOT NULL DEFAULT 'in_app',
  title text NOT NULL,
  body text NOT NULL,
  status public.notification_status NOT NULL DEFAULT 'pending',
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  read_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_notifications_recipient ON public.notifications(recipient_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =========================
-- SYSTEM
-- =========================
CREATE TABLE public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity text,
  entity_id text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_audit_actor ON public.audit_logs(actor_id);
GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =========================
-- ON NEW USER: create profile
-- =========================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================
-- RLS POLICIES
-- =========================

-- profiles: self read/update; admins read/manage all; teachers/parents read linked
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles admin insert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(),'admin') OR id = auth.uid());
CREATE POLICY "profiles admin delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "profiles parent read linked" ON public.profiles FOR SELECT TO authenticated
  USING (public.is_parent_of(auth.uid(), id));

-- user_roles: user reads own; admins manage all
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "roles admin manage" ON public.user_roles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- role profiles: self + admin manage
CREATE POLICY "student_profiles self" ON public.student_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_parent_of(auth.uid(), user_id) OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "student_profiles admin manage" ON public.student_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "student_profiles self update" ON public.student_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "teacher_profiles read all authed" ON public.teacher_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "teacher_profiles self update" ON public.teacher_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "teacher_profiles admin manage" ON public.teacher_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "parent_profiles self" ON public.parent_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "parent_profiles self update" ON public.parent_profiles FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE POLICY "parent_profiles admin manage" ON public.parent_profiles FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- student_parents
CREATE POLICY "student_parents visible to linked" ON public.student_parents FOR SELECT TO authenticated
  USING (parent_id = auth.uid() OR student_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "student_parents admin manage" ON public.student_parents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- academic structure: all authenticated read; admin write
CREATE POLICY "levels read" ON public.educational_levels FOR SELECT TO authenticated USING (true);
CREATE POLICY "levels admin" ON public.educational_levels FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "terms read" ON public.academic_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "terms admin" ON public.academic_terms FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "groups read" ON public.groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "groups admin" ON public.groups FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "courses read" ON public.courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "courses admin" ON public.courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "teacher_courses read" ON public.teacher_courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "teacher_courses admin" ON public.teacher_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- enrollments
CREATE POLICY "enrollments visible" ON public.enrollments FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.teacher_owns_course(auth.uid(), course_id)
    OR public.is_parent_of(auth.uid(), student_id)
  );
CREATE POLICY "enrollments admin write" ON public.enrollments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- questions/options: teachers who own a linked course; admins
CREATE POLICY "questions teacher/admin read" ON public.questions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "questions teacher write own course" ON public.questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), course_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), course_id)));

CREATE POLICY "options teacher/admin read" ON public.question_options FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'teacher'));
CREATE POLICY "options teacher write" ON public.question_options FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.questions q WHERE q.id = question_id
    AND (q.course_id IS NULL OR public.teacher_owns_course(auth.uid(), q.course_id))
  ))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.questions q WHERE q.id = question_id
    AND (q.course_id IS NULL OR public.teacher_owns_course(auth.uid(), q.course_id))
  ));

-- exams: students see published exams in their courses; teachers manage own; admins all
CREATE POLICY "exams read enrolled or teacher/admin" ON public.exams FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR public.teacher_owns_course(auth.uid(), course_id)
    OR (status = 'published' AND public.student_enrolled_in(auth.uid(), course_id))
    OR (status IN ('published','closed') AND EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.enrollments e ON e.student_id = sp.student_id
      WHERE sp.parent_id = auth.uid() AND e.course_id = exams.course_id
    ))
  );
CREATE POLICY "exams teacher/admin write" ON public.exams FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.teacher_owns_course(auth.uid(), course_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.teacher_owns_course(auth.uid(), course_id));

-- exam_questions: teachers of exam's course + admin; students never read directly
CREATE POLICY "exam_questions teacher/admin" ON public.exam_questions FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id)
  ))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id)
  ));

-- attempts: student sees own; teacher of course; admin; parent of linked student
CREATE POLICY "attempts visibility" ON public.exam_attempts FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id))
    OR public.is_parent_of(auth.uid(), student_id)
  );
CREATE POLICY "attempts student write" ON public.exam_attempts FOR INSERT TO authenticated
  WITH CHECK (student_id = auth.uid());
CREATE POLICY "attempts student update" ON public.exam_attempts FOR UPDATE TO authenticated
  USING (student_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR EXISTS (
    SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id)
  ))
  WITH CHECK (true);

-- attempt_answers: student on own attempt; teacher/admin for grading
CREATE POLICY "answers visibility" ON public.attempt_answers FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND (
      a.student_id = auth.uid()
      OR public.is_parent_of(auth.uid(), a.student_id)
      OR EXISTS (SELECT 1 FROM public.exams x WHERE x.id = a.exam_id AND public.teacher_owns_course(auth.uid(), x.course_id))
    ))
  );
CREATE POLICY "answers student write" ON public.attempt_answers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress'));
CREATE POLICY "answers student update" ON public.attempt_answers FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress')
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exam_attempts a JOIN public.exams x ON x.id = a.exam_id WHERE a.id = attempt_id AND public.teacher_owns_course(auth.uid(), x.course_id))
  )
  WITH CHECK (true);

-- live_lectures: teachers of course + admin; students/parents only via view
CREATE POLICY "lectures teacher/admin" ON public.live_lectures FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR public.teacher_owns_course(auth.uid(), course_id))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.teacher_owns_course(auth.uid(), course_id));
CREATE POLICY "lectures enrolled read (no start_url)" ON public.live_lectures FOR SELECT TO authenticated
  USING (
    public.student_enrolled_in(auth.uid(), course_id)
    OR EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.enrollments e ON e.student_id = sp.student_id
      WHERE sp.parent_id = auth.uid() AND e.course_id = live_lectures.course_id
    )
  );

-- attendance
CREATE POLICY "attendance visibility" ON public.lecture_attendance FOR SELECT TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR public.is_parent_of(auth.uid(), student_id)
    OR EXISTS (SELECT 1 FROM public.live_lectures l WHERE l.id = lecture_id AND public.teacher_owns_course(auth.uid(), l.course_id))
  );
CREATE POLICY "attendance teacher/admin write" ON public.lecture_attendance FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.live_lectures l WHERE l.id = lecture_id AND public.teacher_owns_course(auth.uid(), l.course_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.live_lectures l WHERE l.id = lecture_id AND public.teacher_owns_course(auth.uid(), l.course_id)));

-- announcements
CREATE POLICY "announcements read" ON public.announcements FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR (course_id IS NULL)
    OR public.teacher_owns_course(auth.uid(), course_id)
    OR public.student_enrolled_in(auth.uid(), course_id)
    OR EXISTS (
      SELECT 1 FROM public.student_parents sp
      JOIN public.enrollments e ON e.student_id = sp.student_id
      WHERE sp.parent_id = auth.uid() AND e.course_id = announcements.course_id
    )
  );
CREATE POLICY "announcements teacher/admin write" ON public.announcements FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR (course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), course_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR (course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), course_id)));

-- notifications: recipient reads own; admin all
CREATE POLICY "notifications self read" ON public.notifications FOR SELECT TO authenticated
  USING (recipient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "notifications self update" ON public.notifications FOR UPDATE TO authenticated
  USING (recipient_id = auth.uid()) WITH CHECK (recipient_id = auth.uid());
CREATE POLICY "notifications admin write" ON public.notifications FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "templates read" ON public.notification_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "templates admin" ON public.notification_templates FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "settings read" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "settings admin" ON public.system_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "audit admin read" ON public.audit_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin'));

-- Seed default settings
INSERT INTO public.system_settings(key,value) VALUES
  ('registration.approval_required', 'false'::jsonb),
  ('zoom.mode', '"mock"'::jsonb),
  ('notifications.default_channel', '"in_app"'::jsonb)
ON CONFLICT (key) DO NOTHING;
