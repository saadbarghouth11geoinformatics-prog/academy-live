CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  )
  ON CONFLICT (id) DO NOTHING;

  IF lower(NEW.email) = 'saadbarghouth11@gmail.com' THEN
    PERFORM public.promote_to_teacher(NEW.id);
  ELSE
    INSERT INTO public.user_roles(user_id, role)
    VALUES (NEW.id, 'student')
    ON CONFLICT DO NOTHING;

    INSERT INTO public.student_profiles(user_id)
    VALUES (NEW.id)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$function$;

-- Ensure trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Backfill: any existing auth users without a role become students (except admin email)
INSERT INTO public.user_roles(user_id, role)
SELECT u.id, 'student'::app_role
FROM auth.users u
LEFT JOIN public.user_roles r ON r.user_id = u.id
WHERE r.user_id IS NULL
  AND lower(u.email) <> 'saadbarghouth11@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.student_profiles(user_id)
SELECT u.id
FROM auth.users u
LEFT JOIN public.student_profiles sp ON sp.user_id = u.id
LEFT JOIN public.user_roles r ON r.user_id = u.id AND r.role = 'student'
WHERE sp.user_id IS NULL
  AND (r.user_id IS NOT NULL OR lower(u.email) <> 'saadbarghouth11@gmail.com')
ON CONFLICT DO NOTHING;