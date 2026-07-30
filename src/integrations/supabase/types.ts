export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5";
  };
  public: {
    Tables: {
      academic_terms: {
        Row: {
          created_at: string;
          ends_on: string;
          id: string;
          is_active: boolean;
          name: string;
          starts_on: string;
        };
        Insert: {
          created_at?: string;
          ends_on: string;
          id?: string;
          is_active?: boolean;
          name: string;
          starts_on: string;
        };
        Update: {
          created_at?: string;
          ends_on?: string;
          id?: string;
          is_active?: boolean;
          name?: string;
          starts_on?: string;
        };
        Relationships: [];
      };
      announcements: {
        Row: {
          audience_roles: Database["public"]["Enums"]["app_role"][];
          author_id: string | null;
          body: string;
          course_id: string | null;
          created_at: string;
          id: string;
          title: string;
        };
        Insert: {
          audience_roles?: Database["public"]["Enums"]["app_role"][];
          author_id?: string | null;
          body: string;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          title: string;
        };
        Update: {
          audience_roles?: Database["public"]["Enums"]["app_role"][];
          author_id?: string | null;
          body?: string;
          course_id?: string | null;
          created_at?: string;
          id?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: "announcements_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      attempt_answers: {
        Row: {
          attempt_id: string;
          awarded_points: number | null;
          graded_at: string | null;
          graded_by: string | null;
          id: string;
          is_correct: boolean | null;
          question_id: string;
          selected_option_ids: string[] | null;
          teacher_feedback: string | null;
          text_answer: string | null;
          updated_at: string;
        };
        Insert: {
          attempt_id: string;
          awarded_points?: number | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          is_correct?: boolean | null;
          question_id: string;
          selected_option_ids?: string[] | null;
          teacher_feedback?: string | null;
          text_answer?: string | null;
          updated_at?: string;
        };
        Update: {
          attempt_id?: string;
          awarded_points?: number | null;
          graded_at?: string | null;
          graded_by?: string | null;
          id?: string;
          is_correct?: boolean | null;
          question_id?: string;
          selected_option_ids?: string[] | null;
          teacher_feedback?: string | null;
          text_answer?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attempt_answers_attempt_id_fkey";
            columns: ["attempt_id"];
            isOneToOne: false;
            referencedRelation: "exam_attempts";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "attempt_answers_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_records: {
        Row: {
          created_at: string;
          id: string;
          notes: string | null;
          session_id: string;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          session_id: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          notes?: string | null;
          session_id?: string;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_records_session_id_fkey";
            columns: ["session_id"];
            isOneToOne: false;
            referencedRelation: "attendance_sessions";
            referencedColumns: ["id"];
          },
        ];
      };
      attendance_sessions: {
        Row: {
          created_at: string;
          created_by: string;
          educational_level_id: string;
          id: string;
          notes: string | null;
          session_date: string;
          title: string;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          created_by: string;
          educational_level_id: string;
          id?: string;
          notes?: string | null;
          session_date: string;
          title: string;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          created_by?: string;
          educational_level_id?: string;
          id?: string;
          notes?: string | null;
          session_date?: string;
          title?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "attendance_sessions_educational_level_id_fkey";
            columns: ["educational_level_id"];
            isOneToOne: false;
            referencedRelation: "educational_levels";
            referencedColumns: ["id"];
          },
        ];
      };
      audit_logs: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          entity: string | null;
          entity_id: string | null;
          id: string;
          ip_address: string | null;
          metadata: Json;
        };
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          entity?: string | null;
          entity_id?: string | null;
          id?: string;
          ip_address?: string | null;
          metadata?: Json;
        };
        Relationships: [];
      };
      courses: {
        Row: {
          created_at: string;
          description: string | null;
          educational_level_id: string | null;
          ends_on: string | null;
          id: string;
          is_active: boolean;
          name: string;
          starts_on: string | null;
          subject: string | null;
          term_id: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          educational_level_id?: string | null;
          ends_on?: string | null;
          id?: string;
          is_active?: boolean;
          name: string;
          starts_on?: string | null;
          subject?: string | null;
          term_id?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          educational_level_id?: string | null;
          ends_on?: string | null;
          id?: string;
          is_active?: boolean;
          name?: string;
          starts_on?: string | null;
          subject?: string | null;
          term_id?: string | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "courses_educational_level_id_fkey";
            columns: ["educational_level_id"];
            isOneToOne: false;
            referencedRelation: "educational_levels";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "courses_term_id_fkey";
            columns: ["term_id"];
            isOneToOne: false;
            referencedRelation: "academic_terms";
            referencedColumns: ["id"];
          },
        ];
      };
      educational_levels: {
        Row: {
          created_at: string;
          id: string;
          name: string;
          sort_order: number;
        };
        Insert: {
          created_at?: string;
          id?: string;
          name: string;
          sort_order?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          name?: string;
          sort_order?: number;
        };
        Relationships: [];
      };
      enrollments: {
        Row: {
          course_id: string;
          enrolled_at: string;
          group_id: string | null;
          id: string;
          student_id: string;
        };
        Insert: {
          course_id: string;
          enrolled_at?: string;
          group_id?: string | null;
          id?: string;
          student_id: string;
        };
        Update: {
          course_id?: string;
          enrolled_at?: string;
          group_id?: string | null;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "enrollments_group_id_fkey";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_attempts: {
        Row: {
          attempt_number: number;
          deadline_at: string;
          exam_id: string;
          id: string;
          ip_address: string | null;
          objective_score: number | null;
          passed: boolean | null;
          pending_manual_grading: boolean;
          percentage: number | null;
          score: number | null;
          started_at: string;
          status: Database["public"]["Enums"]["attempt_status"];
          student_id: string;
          submitted_at: string | null;
          user_agent: string | null;
        };
        Insert: {
          attempt_number?: number;
          deadline_at: string;
          exam_id: string;
          id?: string;
          ip_address?: string | null;
          objective_score?: number | null;
          passed?: boolean | null;
          pending_manual_grading?: boolean;
          percentage?: number | null;
          score?: number | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          student_id: string;
          submitted_at?: string | null;
          user_agent?: string | null;
        };
        Update: {
          attempt_number?: number;
          deadline_at?: string;
          exam_id?: string;
          id?: string;
          ip_address?: string | null;
          objective_score?: number | null;
          passed?: boolean | null;
          pending_manual_grading?: boolean;
          percentage?: number | null;
          score?: number | null;
          started_at?: string;
          status?: Database["public"]["Enums"]["attempt_status"];
          student_id?: string;
          submitted_at?: string | null;
          user_agent?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "exam_attempts_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
        ];
      };
      exam_questions: {
        Row: {
          exam_id: string;
          id: string;
          points: number;
          question_id: string;
          sort_order: number;
        };
        Insert: {
          exam_id: string;
          id?: string;
          points?: number;
          question_id: string;
          sort_order?: number;
        };
        Update: {
          exam_id?: string;
          id?: string;
          points?: number;
          question_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "exam_questions_exam_id_fkey";
            columns: ["exam_id"];
            isOneToOne: false;
            referencedRelation: "exams";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "exam_questions_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      exams: {
        Row: {
          access_password: string | null;
          auto_submit: boolean;
          closes_at: string;
          course_id: string;
          created_at: string;
          created_by: string | null;
          duration_minutes: number;
          id: string;
          instructions: string | null;
          max_attempts: number;
          opens_at: string;
          passing_score: number;
          pdf_path: string | null;
          randomize_answers: boolean;
          randomize_questions: boolean;
          show_results: boolean;
          status: Database["public"]["Enums"]["exam_status"];
          title: string;
          total_points: number;
          updated_at: string;
        };
        Insert: {
          access_password?: string | null;
          auto_submit?: boolean;
          closes_at: string;
          course_id: string;
          created_at?: string;
          created_by?: string | null;
          duration_minutes: number;
          id?: string;
          instructions?: string | null;
          max_attempts?: number;
          opens_at: string;
          passing_score?: number;
          pdf_path?: string | null;
          randomize_answers?: boolean;
          randomize_questions?: boolean;
          show_results?: boolean;
          status?: Database["public"]["Enums"]["exam_status"];
          title: string;
          total_points?: number;
          updated_at?: string;
        };
        Update: {
          access_password?: string | null;
          auto_submit?: boolean;
          closes_at?: string;
          course_id?: string;
          created_at?: string;
          created_by?: string | null;
          duration_minutes?: number;
          id?: string;
          instructions?: string | null;
          max_attempts?: number;
          opens_at?: string;
          passing_score?: number;
          pdf_path?: string | null;
          randomize_answers?: boolean;
          randomize_questions?: boolean;
          show_results?: boolean;
          status?: Database["public"]["Enums"]["exam_status"];
          title?: string;
          total_points?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      groups: {
        Row: {
          created_at: string;
          educational_level_id: string | null;
          id: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          educational_level_id?: string | null;
          id?: string;
          name: string;
        };
        Update: {
          created_at?: string;
          educational_level_id?: string | null;
          id?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "groups_educational_level_id_fkey";
            columns: ["educational_level_id"];
            isOneToOne: false;
            referencedRelation: "educational_levels";
            referencedColumns: ["id"];
          },
        ];
      };
      lecture_attendance: {
        Row: {
          duration_seconds: number | null;
          id: string;
          joined_at: string | null;
          lecture_id: string;
          left_at: string | null;
          notes: string | null;
          recorded_by: string | null;
          status: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          updated_at: string;
        };
        Insert: {
          duration_seconds?: number | null;
          id?: string;
          joined_at?: string | null;
          lecture_id: string;
          left_at?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id: string;
          updated_at?: string;
        };
        Update: {
          duration_seconds?: number | null;
          id?: string;
          joined_at?: string | null;
          lecture_id?: string;
          left_at?: string | null;
          notes?: string | null;
          recorded_by?: string | null;
          status?: Database["public"]["Enums"]["attendance_status"];
          student_id?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "lecture_attendance_lecture_id_fkey";
            columns: ["lecture_id"];
            isOneToOne: false;
            referencedRelation: "live_lectures";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "lecture_attendance_lecture_id_fkey";
            columns: ["lecture_id"];
            isOneToOne: false;
            referencedRelation: "live_lectures_public";
            referencedColumns: ["id"];
          },
        ];
      };
      live_lectures: {
        Row: {
          course_id: string;
          created_at: string;
          description: string | null;
          duration_minutes: number;
          ended_at: string | null;
          id: string;
          scheduled_at: string;
          started_at: string | null;
          status: Database["public"]["Enums"]["lecture_status"];
          teacher_id: string;
          title: string;
          updated_at: string;
          zoom_join_url: string | null;
          zoom_meeting_id: string | null;
          zoom_start_url: string | null;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number;
          ended_at?: string | null;
          id?: string;
          scheduled_at: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lecture_status"];
          teacher_id: string;
          title: string;
          updated_at?: string;
          zoom_join_url?: string | null;
          zoom_meeting_id?: string | null;
          zoom_start_url?: string | null;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          description?: string | null;
          duration_minutes?: number;
          ended_at?: string | null;
          id?: string;
          scheduled_at?: string;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lecture_status"];
          teacher_id?: string;
          title?: string;
          updated_at?: string;
          zoom_join_url?: string | null;
          zoom_meeting_id?: string | null;
          zoom_start_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "live_lectures_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      notification_templates: {
        Row: {
          body: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          id: string;
          key: string;
          subject: string | null;
        };
        Insert: {
          body: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          key: string;
          subject?: string | null;
        };
        Update: {
          body?: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          key?: string;
          subject?: string | null;
        };
        Relationships: [];
      };
      notifications: {
        Row: {
          body: string;
          channel: Database["public"]["Enums"]["notification_channel"];
          created_at: string;
          id: string;
          metadata: Json;
          read_at: string | null;
          recipient_id: string;
          sent_at: string | null;
          status: Database["public"]["Enums"]["notification_status"];
          title: string;
        };
        Insert: {
          body: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          metadata?: Json;
          read_at?: string | null;
          recipient_id: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          title: string;
        };
        Update: {
          body?: string;
          channel?: Database["public"]["Enums"]["notification_channel"];
          created_at?: string;
          id?: string;
          metadata?: Json;
          read_at?: string | null;
          recipient_id?: string;
          sent_at?: string | null;
          status?: Database["public"]["Enums"]["notification_status"];
          title?: string;
        };
        Relationships: [];
      };
      parent_profiles: {
        Row: {
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          avatar_url: string | null;
          created_at: string;
          email: string | null;
          full_name: string;
          id: string;
          locale: string;
          phone: string | null;
          status: Database["public"]["Enums"]["account_status"];
          updated_at: string;
          username: string | null;
        };
        Insert: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id: string;
          locale?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
          username?: string | null;
        };
        Update: {
          avatar_url?: string | null;
          created_at?: string;
          email?: string | null;
          full_name?: string;
          id?: string;
          locale?: string;
          phone?: string | null;
          status?: Database["public"]["Enums"]["account_status"];
          updated_at?: string;
          username?: string | null;
        };
        Relationships: [];
      };
      question_options: {
        Row: {
          id: string;
          is_correct: boolean;
          label: string;
          question_id: string;
          sort_order: number;
        };
        Insert: {
          id?: string;
          is_correct?: boolean;
          label: string;
          question_id: string;
          sort_order?: number;
        };
        Update: {
          id?: string;
          is_correct?: boolean;
          label?: string;
          question_id?: string;
          sort_order?: number;
        };
        Relationships: [
          {
            foreignKeyName: "question_options_question_id_fkey";
            columns: ["question_id"];
            isOneToOne: false;
            referencedRelation: "questions";
            referencedColumns: ["id"];
          },
        ];
      };
      questions: {
        Row: {
          accepted_answers: string[];
          category: string | null;
          course_id: string | null;
          created_at: string;
          created_by: string | null;
          default_points: number;
          difficulty: number;
          explanation: string | null;
          id: string;
          is_archived: boolean;
          model_answer: string | null;
          prompt: string;
          requires_manual_grading: boolean;
          type: Database["public"]["Enums"]["question_type"];
          updated_at: string;
        };
        Insert: {
          accepted_answers?: string[];
          category?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_points?: number;
          difficulty?: number;
          explanation?: string | null;
          id?: string;
          is_archived?: boolean;
          model_answer?: string | null;
          prompt: string;
          requires_manual_grading?: boolean;
          type: Database["public"]["Enums"]["question_type"];
          updated_at?: string;
        };
        Update: {
          accepted_answers?: string[];
          category?: string | null;
          course_id?: string | null;
          created_at?: string;
          created_by?: string | null;
          default_points?: number;
          difficulty?: number;
          explanation?: string | null;
          id?: string;
          is_archived?: boolean;
          model_answer?: string | null;
          prompt?: string;
          requires_manual_grading?: boolean;
          type?: Database["public"]["Enums"]["question_type"];
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "questions_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      student_parents: {
        Row: {
          created_at: string;
          id: string;
          parent_id: string;
          relationship: Database["public"]["Enums"]["parent_relationship"];
          student_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          parent_id: string;
          relationship?: Database["public"]["Enums"]["parent_relationship"];
          student_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          parent_id?: string;
          relationship?: Database["public"]["Enums"]["parent_relationship"];
          student_id?: string;
        };
        Relationships: [];
      };
      student_profiles: {
        Row: {
          created_at: string;
          educational_level_id: string | null;
          governorate: string | null;
          group_id: string | null;
          guardian_phone: string | null;
          registration_completed: boolean;
          school_name: string | null;
          student_code: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          educational_level_id?: string | null;
          governorate?: string | null;
          group_id?: string | null;
          guardian_phone?: string | null;
          registration_completed?: boolean;
          school_name?: string | null;
          student_code?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          educational_level_id?: string | null;
          governorate?: string | null;
          group_id?: string | null;
          guardian_phone?: string | null;
          registration_completed?: boolean;
          school_name?: string | null;
          student_code?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "student_profiles_group_fk";
            columns: ["group_id"];
            isOneToOne: false;
            referencedRelation: "groups";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "student_profiles_level_fk";
            columns: ["educational_level_id"];
            isOneToOne: false;
            referencedRelation: "educational_levels";
            referencedColumns: ["id"];
          },
        ];
      };
      system_settings: {
        Row: {
          key: string;
          updated_at: string;
          value: Json;
        };
        Insert: {
          key: string;
          updated_at?: string;
          value: Json;
        };
        Update: {
          key?: string;
          updated_at?: string;
          value?: Json;
        };
        Relationships: [];
      };
      teacher_courses: {
        Row: {
          course_id: string;
          created_at: string;
          id: string;
          teacher_id: string;
        };
        Insert: {
          course_id: string;
          created_at?: string;
          id?: string;
          teacher_id: string;
        };
        Update: {
          course_id?: string;
          created_at?: string;
          id?: string;
          teacher_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "teacher_courses_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
      teacher_profiles: {
        Row: {
          bio: string | null;
          created_at: string;
          subject_specialty: string | null;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          bio?: string | null;
          created_at?: string;
          subject_specialty?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          bio?: string | null;
          created_at?: string;
          subject_specialty?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      user_roles: {
        Row: {
          created_at: string;
          id: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Insert: {
          created_at?: string;
          id?: string;
          role: Database["public"]["Enums"]["app_role"];
          user_id: string;
        };
        Update: {
          created_at?: string;
          id?: string;
          role?: Database["public"]["Enums"]["app_role"];
          user_id?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      live_lectures_public: {
        Row: {
          course_id: string | null;
          created_at: string | null;
          description: string | null;
          duration_minutes: number | null;
          ended_at: string | null;
          id: string | null;
          scheduled_at: string | null;
          started_at: string | null;
          status: Database["public"]["Enums"]["lecture_status"] | null;
          teacher_id: string | null;
          title: string | null;
          zoom_join_url: string | null;
          zoom_meeting_id: string | null;
        };
        Insert: {
          course_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lecture_status"] | null;
          teacher_id?: string | null;
          title?: string | null;
          zoom_join_url?: string | null;
          zoom_meeting_id?: string | null;
        };
        Update: {
          course_id?: string | null;
          created_at?: string | null;
          description?: string | null;
          duration_minutes?: number | null;
          ended_at?: string | null;
          id?: string | null;
          scheduled_at?: string | null;
          started_at?: string | null;
          status?: Database["public"]["Enums"]["lecture_status"] | null;
          teacher_id?: string | null;
          title?: string | null;
          zoom_join_url?: string | null;
          zoom_meeting_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "live_lectures_course_id_fkey";
            columns: ["course_id"];
            isOneToOne: false;
            referencedRelation: "courses";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Functions: {
      bootstrap_first_teacher: { Args: never; Returns: undefined };
      current_user_has_role: {
        Args: { _role: Database["public"]["Enums"]["app_role"] };
        Returns: boolean;
      };
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"];
          _user_id: string;
        };
        Returns: boolean;
      };
      is_parent_of: {
        Args: { _parent: string; _student: string };
        Returns: boolean;
      };
      promote_to_teacher: { Args: { _uid: string }; Returns: undefined };
      student_enrolled_in: {
        Args: { _course: string; _student: string };
        Returns: boolean;
      };
      teacher_exists: { Args: never; Returns: boolean };
      teacher_owns_course: {
        Args: { _course: string; _teacher: string };
        Returns: boolean;
      };
    };
    Enums: {
      account_status: "pending" | "active" | "suspended";
      app_role: "admin" | "teacher" | "student" | "parent";
      attempt_status: "in_progress" | "submitted" | "auto_submitted" | "graded";
      attendance_status: "present" | "absent" | "late" | "excused";
      exam_status: "draft" | "published" | "closed" | "archived";
      lecture_status: "scheduled" | "live" | "ended" | "cancelled";
      notification_channel: "in_app" | "email" | "whatsapp" | "sms";
      notification_status: "pending" | "sent" | "failed" | "read";
      parent_relationship: "father" | "mother" | "guardian" | "other";
      question_type: "mcq_single" | "mcq_multi" | "true_false" | "short_answer" | "essay";
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">;

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] & DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema["Tables"] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema["Enums"] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    keyof DefaultSchema["CompositeTypes"] | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      account_status: ["pending", "active", "suspended"],
      app_role: ["admin", "teacher", "student", "parent"],
      attempt_status: ["in_progress", "submitted", "auto_submitted", "graded"],
      attendance_status: ["present", "absent", "late", "excused"],
      exam_status: ["draft", "published", "closed", "archived"],
      lecture_status: ["scheduled", "live", "ended", "cancelled"],
      notification_channel: ["in_app", "email", "whatsapp", "sms"],
      notification_status: ["pending", "sent", "failed", "read"],
      parent_relationship: ["father", "mother", "guardian", "other"],
      question_type: ["mcq_single", "mcq_multi", "true_false", "short_answer", "essay"],
    },
  },
} as const;
