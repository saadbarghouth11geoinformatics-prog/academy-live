
-- Seed 2 educational levels (grades 2 & 3 secondary)
INSERT INTO public.educational_levels (name, sort_order)
SELECT 'الصف الثاني الثانوي', 2
WHERE NOT EXISTS (SELECT 1 FROM public.educational_levels WHERE name='الصف الثاني الثانوي');
INSERT INTO public.educational_levels (name, sort_order)
SELECT 'الصف الثالث الثانوي', 3
WHERE NOT EXISTS (SELECT 1 FROM public.educational_levels WHERE name='الصف الثالث الثانوي');

-- Seed active academic term
INSERT INTO public.academic_terms (name, starts_on, ends_on, is_active)
SELECT 'العام الدراسي الحالي', date_trunc('year', now())::date, (date_trunc('year', now()) + interval '1 year')::date, true
WHERE NOT EXISTS (SELECT 1 FROM public.academic_terms WHERE is_active=true);

-- Seed one course per grade
INSERT INTO public.courses (name, subject, educational_level_id, term_id, is_active)
SELECT 'مادة الصف الثاني الثانوي', 'عام', l.id, t.id, true
FROM public.educational_levels l, public.academic_terms t
WHERE l.name='الصف الثاني الثانوي' AND t.is_active=true
  AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.educational_level_id=l.id);

INSERT INTO public.courses (name, subject, educational_level_id, term_id, is_active)
SELECT 'مادة الصف الثالث الثانوي', 'عام', l.id, t.id, true
FROM public.educational_levels l, public.academic_terms t
WHERE l.name='الصف الثالث الثانوي' AND t.is_active=true
  AND NOT EXISTS (SELECT 1 FROM public.courses c WHERE c.educational_level_id=l.id);

-- Uniqueness for upserts
CREATE UNIQUE INDEX IF NOT EXISTS teacher_courses_uniq ON public.teacher_courses(teacher_id, course_id);
CREATE UNIQUE INDEX IF NOT EXISTS enrollments_uniq ON public.enrollments(student_id, course_id);

-- Bootstrap RPC: first signed-in user becomes admin+teacher and is assigned to all courses.
CREATE OR REPLACE FUNCTION public.bootstrap_first_teacher()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid;
BEGIN
  _uid := auth.uid();
  IF _uid IS NULL THEN RAISE EXCEPTION 'not_authenticated'; END IF;
  IF EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('admin','teacher')) THEN
    RAISE EXCEPTION 'teacher_already_exists';
  END IF;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'teacher') ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_profiles(user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_courses(teacher_id, course_id)
    SELECT _uid, id FROM public.courses
    ON CONFLICT (teacher_id, course_id) DO NOTHING;
END; $$;

REVOKE ALL ON FUNCTION public.bootstrap_first_teacher() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_teacher() TO authenticated;

-- Helper: check if any teacher exists (used by public UI to show/hide bootstrap CTA)
CREATE OR REPLACE FUNCTION public.teacher_exists()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE role IN ('admin','teacher'));
$$;
REVOKE ALL ON FUNCTION public.teacher_exists() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.teacher_exists() TO anon, authenticated;
