
-- 1) Restrict questions & question_options SELECT to course owner (or admin)
DROP POLICY IF EXISTS "questions teacher/admin read" ON public.questions;
CREATE POLICY "questions teacher owner read" ON public.questions
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), course_id))
  );

DROP POLICY IF EXISTS "options teacher/admin read" ON public.question_options;
CREATE POLICY "options teacher owner read" ON public.question_options
  FOR SELECT TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin')
    OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_options.question_id
        AND q.course_id IS NOT NULL
        AND public.teacher_owns_course(auth.uid(), q.course_id)
    )
  );

-- 2) Restrict teacher_profiles read to self + admin (was: any authenticated)
DROP POLICY IF EXISTS "teacher_profiles read all authed" ON public.teacher_profiles;
CREATE POLICY "teacher_profiles read self or admin" ON public.teacher_profiles
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'));

-- 3) Storage: scope exam-pdfs to the uploading teacher (owner) or admin
DROP POLICY IF EXISTS "teachers manage exam pdfs" ON storage.objects;

CREATE POLICY "exam-pdfs owner select" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'exam-pdfs'
    AND (public.has_role(auth.uid(), 'admin') OR owner = auth.uid())
  );

CREATE POLICY "exam-pdfs teacher insert own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'exam-pdfs'
    AND owner = auth.uid()
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher'))
  );

CREATE POLICY "exam-pdfs owner update" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'exam-pdfs'
    AND (public.has_role(auth.uid(), 'admin') OR owner = auth.uid())
  )
  WITH CHECK (
    bucket_id = 'exam-pdfs'
    AND (public.has_role(auth.uid(), 'admin') OR owner = auth.uid())
  );

CREATE POLICY "exam-pdfs owner delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'exam-pdfs'
    AND (public.has_role(auth.uid(), 'admin') OR owner = auth.uid())
  );

-- 4) Lock down SECURITY DEFINER functions: revoke PUBLIC EXECUTE, grant only
--    to the roles that actually need to call them (RLS-referenced helpers +
--    the RPCs the client uses). handle_new_user is trigger-only.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(public.app_role) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teacher_owns_course(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.student_enrolled_in(uuid, uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.teacher_exists() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.bootstrap_first_teacher() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_owns_course(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_enrolled_in(uuid, uuid) TO authenticated, service_role;
-- teacher_exists is checked on the public /auth page before sign-in
GRANT EXECUTE ON FUNCTION public.teacher_exists() TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.bootstrap_first_teacher() TO authenticated, service_role;
-- handle_new_user runs from an auth trigger only
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
