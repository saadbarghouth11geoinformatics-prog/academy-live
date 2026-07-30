-- Repair the teacher name that was previously stored with broken character encoding.
update public.profiles
set full_name = 'الأستاذ عبيدة',
    updated_at = now()
where lower(email) = lower('saadbarghouth11geoinformatics@gmail.com');

update auth.users
set raw_user_meta_data = coalesce(raw_user_meta_data, '{}'::jsonb)
  || jsonb_build_object('full_name', 'الأستاذ عبيدة'),
    updated_at = now()
where lower(email) = lower('saadbarghouth11geoinformatics@gmail.com');
