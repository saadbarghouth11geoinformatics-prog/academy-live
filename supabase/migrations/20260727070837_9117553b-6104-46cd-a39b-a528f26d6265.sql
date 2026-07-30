
-- Promote helper: grants admin+teacher roles, creates teacher profile, assigns all courses
CREATE OR REPLACE FUNCTION public.promote_to_teacher(_uid uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'admin') ON CONFLICT DO NOTHING;
  INSERT INTO public.user_roles(user_id, role) VALUES (_uid, 'teacher') ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_profiles(user_id) VALUES (_uid) ON CONFLICT DO NOTHING;
  INSERT INTO public.teacher_courses(teacher_id, course_id)
    SELECT _uid, id FROM public.courses
    ON CONFLICT (teacher_id, course_id) DO NOTHING;
END; $$;

REVOKE ALL ON FUNCTION public.promote_to_teacher(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.promote_to_teacher(uuid) TO service_role;

-- Update signup trigger to auto-promote the designated owner email
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'saadbarghouth11@gmail.com' THEN
    PERFORM public.promote_to_teacher(NEW.id);
  END IF;

  RETURN NEW;
END; $$;

-- Promote now if the user already exists
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE lower(email) = 'saadbarghouth11@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    PERFORM public.promote_to_teacher(_uid);
  END IF;
END $$;
