
DROP POLICY IF EXISTS "attempts student update" ON public.exam_attempts;
CREATE POLICY "attempts student update" ON public.exam_attempts FOR UPDATE TO authenticated
  USING (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id))
  )
  WITH CHECK (
    student_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exams x WHERE x.id = exam_id AND public.teacher_owns_course(auth.uid(), x.course_id))
  );

DROP POLICY IF EXISTS "answers student update" ON public.attempt_answers;
CREATE POLICY "answers student update" ON public.attempt_answers FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid() AND a.status = 'in_progress')
    OR EXISTS (SELECT 1 FROM public.exam_attempts a JOIN public.exams x ON x.id = a.exam_id WHERE a.id = attempt_id AND public.teacher_owns_course(auth.uid(), x.course_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(),'admin')
    OR EXISTS (SELECT 1 FROM public.exam_attempts a WHERE a.id = attempt_id AND a.student_id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.exam_attempts a JOIN public.exams x ON x.id = a.exam_id WHERE a.id = attempt_id AND public.teacher_owns_course(auth.uid(), x.course_id))
  );
