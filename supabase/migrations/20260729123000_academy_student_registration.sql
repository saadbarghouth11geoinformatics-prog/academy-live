-- Academy Live: student self-registration and Arabic-course foundation.
-- This migration is additive and safe to run against the existing project.

ALTER TABLE public.student_profiles
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS governorate text,
  ADD COLUMN IF NOT EXISTS registration_completed boolean NOT NULL DEFAULT false;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS model_answer text,
  ADD COLUMN IF NOT EXISTS accepted_answers text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS requires_manual_grading boolean NOT NULL DEFAULT false;

ALTER TABLE public.exam_attempts
  ADD COLUMN IF NOT EXISTS pending_manual_grading boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS objective_score numeric(8,2);

ALTER TABLE public.attempt_answers
  ADD COLUMN IF NOT EXISTS teacher_feedback text;

CREATE INDEX IF NOT EXISTS idx_student_profiles_level_group
  ON public.student_profiles(educational_level_id, group_id);
CREATE INDEX IF NOT EXISTS idx_profiles_status_created
  ON public.profiles(status, created_at DESC);

-- The public registration form only needs the two educational levels.
DROP POLICY IF EXISTS "levels public registration read" ON public.educational_levels;
CREATE POLICY "levels public registration read" ON public.educational_levels
  FOR SELECT TO anon USING (true);

-- Ensure the academy has the two required grades. Groups are intentionally not used yet.
INSERT INTO public.educational_levels(name, sort_order)
SELECT 'الصف الثاني الثانوي', 2
WHERE NOT EXISTS (
  SELECT 1 FROM public.educational_levels WHERE sort_order = 2
);

INSERT INTO public.educational_levels(name, sort_order)
SELECT 'الصف الثالث الثانوي', 3
WHERE NOT EXISTS (
  SELECT 1 FROM public.educational_levels WHERE sort_order = 3
);

-- Rename/normalize the existing seeded courses for the single subject taught by Mr Obeida.
UPDATE public.courses c
SET subject = 'اللغة العربية',
    name = CASE l.sort_order
      WHEN 2 THEN 'اللغة العربية - الصف الثاني الثانوي'
      WHEN 3 THEN 'اللغة العربية - الصف الثالث الثانوي'
      ELSE c.name
    END,
    is_active = true
FROM public.educational_levels l
WHERE c.educational_level_id = l.id AND l.sort_order IN (2, 3);

-- Remove the old hard-coded teacher email behavior. Every normal public signup is a student.
-- The first teacher is promoted only through bootstrap_first_teacher while signed in.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _level_id uuid;
BEGIN
  IF COALESCE(NEW.raw_user_meta_data->>'educational_level_id', '') ~
      '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$' THEN
    _level_id := (NEW.raw_user_meta_data->>'educational_level_id')::uuid;
  END IF;

  -- Reject an unknown grade instead of storing inconsistent data.
  IF _level_id IS NOT NULL AND NOT EXISTS (
    SELECT 1 FROM public.educational_levels WHERE id = _level_id
  ) THEN
    _level_id := NULL;
  END IF;

  INSERT INTO public.profiles(id, full_name, email, phone, status)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(trim(NEW.raw_user_meta_data->>'full_name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(trim(NEW.raw_user_meta_data->>'phone'), ''),
    'active'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
    updated_at = now();

  INSERT INTO public.user_roles(user_id, role)
  VALUES (NEW.id, 'student')
  ON CONFLICT DO NOTHING;

  INSERT INTO public.student_profiles(
    user_id,
    educational_level_id,
    group_id,
    guardian_phone,
    school_name,
    governorate,
    registration_completed
  )
  VALUES (
    NEW.id,
    _level_id,
    NULL,
    NULLIF(trim(NEW.raw_user_meta_data->>'guardian_phone'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'school_name'), ''),
    NULLIF(trim(NEW.raw_user_meta_data->>'governorate'), ''),
    _level_id IS NOT NULL
      AND NULLIF(trim(NEW.raw_user_meta_data->>'guardian_phone'), '') IS NOT NULL
      AND NULLIF(trim(NEW.raw_user_meta_data->>'school_name'), '') IS NOT NULL
      AND NULLIF(trim(NEW.raw_user_meta_data->>'governorate'), '') IS NOT NULL
  )
  ON CONFLICT (user_id) DO UPDATE SET
    educational_level_id = COALESCE(EXCLUDED.educational_level_id, public.student_profiles.educational_level_id),
    group_id = NULL,
    guardian_phone = COALESCE(EXCLUDED.guardian_phone, public.student_profiles.guardian_phone),
    school_name = COALESCE(EXCLUDED.school_name, public.student_profiles.school_name),
    governorate = COALESCE(EXCLUDED.governorate, public.student_profiles.governorate),
    registration_completed = EXCLUDED.registration_completed,
    updated_at = now();

  -- A newly registered student is automatically enrolled in the active Arabic course for the grade.
  IF _level_id IS NOT NULL THEN
    INSERT INTO public.enrollments(course_id, student_id, group_id)
    SELECT c.id, NEW.id, NULL
    FROM public.courses c
    WHERE c.educational_level_id = _level_id
      AND c.is_active = true
      AND c.subject = 'اللغة العربية'
    ON CONFLICT (course_id, student_id) DO UPDATE
      SET group_id = EXCLUDED.group_id;
  END IF;

  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;

-- The single academy owner/teacher account chosen by the project owner.
CREATE OR REPLACE FUNCTION public.promote_to_teacher(_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.user_roles WHERE user_id = _uid AND role IN ('student', 'parent');
  DELETE FROM public.enrollments WHERE student_id = _uid;
  DELETE FROM public.student_profiles WHERE user_id = _uid;

  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'teacher') ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_profiles(user_id, bio, subject_specialty)
  VALUES (_uid, 'الأستاذ عبيدة - مدرس اللغة العربية للمرحلة الثانوية', 'اللغة العربية')
  ON CONFLICT (user_id) DO UPDATE SET
    bio = EXCLUDED.bio,
    subject_specialty = EXCLUDED.subject_specialty,
    updated_at = now();

  INSERT INTO public.teacher_courses(teacher_id, course_id)
  SELECT _uid, id FROM public.courses WHERE is_active = true
  ON CONFLICT (teacher_id, course_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.promote_to_teacher(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_teacher(uuid) TO service_role;

-- Promote the requested account immediately if it already exists in Supabase Auth.
DO $$
DECLARE
  _teacher_id uuid;
BEGIN
  SELECT id INTO _teacher_id
  FROM auth.users
  WHERE lower(email) = 'saadbarghouth11geoinformatics@gmail.com'
  LIMIT 1;

  IF _teacher_id IS NOT NULL THEN
    DELETE FROM public.teacher_courses WHERE teacher_id <> _teacher_id;
    DELETE FROM public.teacher_profiles WHERE user_id <> _teacher_id;
    DELETE FROM public.user_roles
    WHERE role IN ('admin', 'teacher') AND user_id <> _teacher_id;
    PERFORM public.promote_to_teacher(_teacher_id);
  END IF;
END;
$$;

-- Promote the first teacher safely and remove the temporary student identity created at signup.
CREATE OR REPLACE FUNCTION public.bootstrap_first_teacher()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
BEGIN
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE role IN ('admin', 'teacher') AND user_id <> _uid
  ) THEN
    RAISE EXCEPTION 'teacher_already_exists';
  END IF;

  DELETE FROM public.user_roles WHERE user_id = _uid AND role IN ('student', 'parent');
  DELETE FROM public.enrollments WHERE student_id = _uid;
  DELETE FROM public.student_profiles WHERE user_id = _uid;

  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'teacher') ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_profiles(user_id, bio, subject_specialty)
  VALUES (_uid, 'مدرس اللغة العربية للمرحلة الثانوية', 'اللغة العربية')
  ON CONFLICT (user_id) DO UPDATE SET subject_specialty = EXCLUDED.subject_specialty;

  INSERT INTO public.teacher_courses(teacher_id, course_id)
  SELECT _uid, id FROM public.courses WHERE is_active = true
  ON CONFLICT (teacher_id, course_id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.bootstrap_first_teacher() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_teacher() TO authenticated;

-- Only the student can edit the public registration fields; roles and ownership remain protected.
DROP POLICY IF EXISTS "student_profiles self update" ON public.student_profiles;
CREATE POLICY "student_profiles self update" ON public.student_profiles
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Students may correct contact/school details, but cannot move themselves to another grade.
REVOKE UPDATE ON public.student_profiles FROM authenticated;
GRANT UPDATE (guardian_phone, school_name, governorate) ON public.student_profiles TO authenticated;

-- Objective questions are immediate; essays remain pending for Mr Obeida to review.
UPDATE public.questions
SET requires_manual_grading = (type = 'essay')
WHERE requires_manual_grading IS DISTINCT FROM (type = 'essay');

COMMENT ON COLUMN public.student_profiles.guardian_phone IS
  'Guardian phone shown only to the student and authorized teacher/admin.';
COMMENT ON COLUMN public.questions.model_answer IS
  'Teacher model answer. Do not expose to students before submission.';
COMMENT ON COLUMN public.exam_attempts.pending_manual_grading IS
  'True when at least one essay answer still needs teacher review.';
