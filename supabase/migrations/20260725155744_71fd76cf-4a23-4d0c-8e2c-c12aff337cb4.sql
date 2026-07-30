
-- PDF exams column
ALTER TABLE public.exams ADD COLUMN IF NOT EXISTS pdf_path text;

-- Attendance sessions (teacher-created classroom sessions)
CREATE TABLE public.attendance_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  educational_level_id uuid NOT NULL REFERENCES public.educational_levels(id) ON DELETE CASCADE,
  session_date date NOT NULL,
  title text NOT NULL,
  notes text,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_sessions TO authenticated;
GRANT ALL ON public.attendance_sessions TO service_role;
ALTER TABLE public.attendance_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers manage attendance sessions" ON public.attendance_sessions
  FOR ALL TO authenticated
  USING (public.current_user_has_role('teacher') OR public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('teacher') OR public.current_user_has_role('admin'));
CREATE POLICY "students read own level sessions" ON public.attendance_sessions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.student_profiles sp WHERE sp.user_id = auth.uid() AND sp.educational_level_id = attendance_sessions.educational_level_id));
CREATE TRIGGER attendance_sessions_updated BEFORE UPDATE ON public.attendance_sessions FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Attendance records
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  status public.attendance_status NOT NULL DEFAULT 'present',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, student_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.attendance_records TO authenticated;
GRANT ALL ON public.attendance_records TO service_role;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "teachers manage attendance records" ON public.attendance_records
  FOR ALL TO authenticated
  USING (public.current_user_has_role('teacher') OR public.current_user_has_role('admin'))
  WITH CHECK (public.current_user_has_role('teacher') OR public.current_user_has_role('admin'));
CREATE POLICY "students read own attendance" ON public.attendance_records
  FOR SELECT TO authenticated USING (student_id = auth.uid());
CREATE TRIGGER attendance_records_updated BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
