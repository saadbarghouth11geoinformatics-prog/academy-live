
-- 1) Trigger to block students from writing grading fields on exam_attempts
CREATE OR REPLACE FUNCTION public.guard_exam_attempts_student_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher') THEN
    RETURN NEW;
  END IF;
  IF NEW.student_id = auth.uid() THEN
    NEW.score := OLD.score;
    NEW.percentage := OLD.percentage;
    NEW.passed := OLD.passed;
    NEW.submitted_at := OLD.submitted_at;
    NEW.status := OLD.status;
    NEW.deadline_at := OLD.deadline_at;
    NEW.attempt_number := OLD.attempt_number;
    NEW.exam_id := OLD.exam_id;
    NEW.student_id := OLD.student_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_exam_attempts_student_update ON public.exam_attempts;
CREATE TRIGGER trg_guard_exam_attempts_student_update
  BEFORE UPDATE ON public.exam_attempts
  FOR EACH ROW EXECUTE FUNCTION public.guard_exam_attempts_student_update();

-- 2) Trigger to block students from writing grading fields on attempt_answers
CREATE OR REPLACE FUNCTION public.guard_attempt_answers_student_update()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher') THEN
    RETURN NEW;
  END IF;
  SELECT student_id INTO v_student FROM public.exam_attempts WHERE id = NEW.attempt_id;
  IF v_student = auth.uid() THEN
    NEW.is_correct := OLD.is_correct;
    NEW.awarded_points := OLD.awarded_points;
    NEW.graded_by := OLD.graded_by;
    NEW.graded_at := OLD.graded_at;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_attempt_answers_student_update ON public.attempt_answers;
CREATE TRIGGER trg_guard_attempt_answers_student_update
  BEFORE UPDATE ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.guard_attempt_answers_student_update();

-- Also guard INSERTs so students can't insert pre-graded rows
CREATE OR REPLACE FUNCTION public.guard_attempt_answers_student_insert()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_student uuid;
BEGIN
  IF public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher') THEN
    RETURN NEW;
  END IF;
  SELECT student_id INTO v_student FROM public.exam_attempts WHERE id = NEW.attempt_id;
  IF v_student = auth.uid() THEN
    NEW.is_correct := NULL;
    NEW.awarded_points := NULL;
    NEW.graded_by := NULL;
    NEW.graded_at := NULL;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_guard_attempt_answers_student_insert ON public.attempt_answers;
CREATE TRIGGER trg_guard_attempt_answers_student_insert
  BEFORE INSERT ON public.attempt_answers
  FOR EACH ROW EXECUTE FUNCTION public.guard_attempt_answers_student_insert();

-- 3) Restrict question_options write on course-less questions to creator/admin
DROP POLICY IF EXISTS "options teacher write" ON public.question_options;
CREATE POLICY "options teacher write" ON public.question_options
  FOR ALL TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_options.question_id
        AND (
          (q.course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), q.course_id))
          OR (q.course_id IS NULL AND q.created_by = auth.uid())
        )
    )
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = question_options.question_id
        AND (
          (q.course_id IS NOT NULL AND public.teacher_owns_course(auth.uid(), q.course_id))
          OR (q.course_id IS NULL AND q.created_by = auth.uid())
        )
    )
  );

-- 4) Revoke EXECUTE on SECURITY DEFINER helpers from anon/authenticated/public.
--    RLS policies invoke them internally regardless of grants.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.is_parent_of(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.teacher_owns_course(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.student_enrolled_in(uuid, uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.current_user_has_role(app_role) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.promote_to_teacher(uuid) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_exam_attempts_student_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_attempt_answers_student_update() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.guard_attempt_answers_student_insert() FROM PUBLIC, anon, authenticated;
