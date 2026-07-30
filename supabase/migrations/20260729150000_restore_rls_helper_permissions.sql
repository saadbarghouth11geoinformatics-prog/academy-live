-- RLS policies execute these SECURITY DEFINER helpers as the querying role.
-- A previous hardening migration revoked authenticated EXECUTE, which made
-- otherwise-valid teacher/student reads fail with permission denied.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.current_user_has_role(public.app_role)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.teacher_owns_course(uuid, uuid)
  TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.student_enrolled_in(uuid, uuid)
  TO authenticated, service_role;

-- This public boolean is used only to decide whether the one-time teacher
-- setup screen should be shown. It does not expose account data.
GRANT EXECUTE ON FUNCTION public.teacher_exists()
  TO anon, authenticated, service_role;
