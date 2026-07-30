
CREATE POLICY "teachers manage exam pdfs" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'exam-pdfs' AND (public.current_user_has_role('teacher') OR public.current_user_has_role('admin')))
  WITH CHECK (bucket_id = 'exam-pdfs' AND (public.current_user_has_role('teacher') OR public.current_user_has_role('admin')));
