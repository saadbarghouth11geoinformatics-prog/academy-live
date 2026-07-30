
-- Recreate view without SECURITY DEFINER semantics (default is invoker)
DROP VIEW IF EXISTS public.live_lectures_public;
CREATE VIEW public.live_lectures_public
WITH (security_invoker = true) AS
  SELECT id, course_id, teacher_id, title, description, scheduled_at, duration_minutes,
         zoom_meeting_id, zoom_join_url, status, started_at, ended_at, created_at
  FROM public.live_lectures;
GRANT SELECT ON public.live_lectures_public TO authenticated;

-- Restrict SECURITY DEFINER helpers to signed-in users only
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.current_user_has_role(public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.teacher_owns_course(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.student_enrolled_in(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.set_updated_at() FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_owns_course(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_enrolled_in(uuid, uuid) TO authenticated, service_role;
