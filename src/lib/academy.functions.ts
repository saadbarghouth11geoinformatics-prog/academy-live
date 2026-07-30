import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function requireTeacher(supabase: any, userId: string) {
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId);
  const roles = (data ?? []).map((r: any) => r.role);
  if (!roles.includes("teacher") && !roles.includes("admin")) {
    throw new Error("forbidden");
  }
}

export const listLevels = createServerFn({ method: "GET" }).handler(async () => {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("educational_levels")
    .select("id, name, sort_order")
    .order("sort_order");
  return data ?? [];
});

export const listStudents = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("user_id")
      .eq("role", "student");
    const ids = (roles ?? []).map((r) => r.user_id);
    if (!ids.length) return [];
    const [profiles, sp, levels, attempts] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at")
        .in("id", ids),
      supabaseAdmin
        .from("student_profiles")
        .select(
          "user_id, educational_level_id, guardian_phone, school_name, governorate, registration_completed",
        )
        .in("user_id", ids),
      supabaseAdmin.from("educational_levels").select("id, name"),
      supabaseAdmin.from("exam_attempts").select("student_id, status").in("student_id", ids),
    ]);
    const lvlMap = new Map((levels.data ?? []).map((l) => [l.id, l.name]));
    const spMap = new Map((sp.data ?? []).map((s) => [s.user_id, s]));
    const attemptsMap: Record<string, number> = {};
    for (const a of attempts.data ?? []) {
      if (a.status === "graded" || a.status === "submitted" || a.status === "auto_submitted") {
        attemptsMap[a.student_id] = (attemptsMap[a.student_id] ?? 0) + 1;
      }
    }
    return (profiles.data ?? [])
      .map((p) => {
        const levelId = spMap.get(p.id)?.educational_level_id ?? null;
        return {
          id: p.id,
          full_name: p.full_name,
          email: p.email,
          created_at: p.created_at,
          level_id: levelId,
          level_name: levelId ? (lvlMap.get(levelId) ?? null) : null,
          guardian_phone: spMap.get(p.id)?.guardian_phone ?? null,
          school_name: spMap.get(p.id)?.school_name ?? null,
          governorate: spMap.get(p.id)?.governorate ?? null,
          registration_completed: spMap.get(p.id)?.registration_completed ?? false,
          attempts_count: attemptsMap[p.id] ?? 0,
        };
      })
      .sort((a, b) => a.full_name.localeCompare(b.full_name, "ar"));
  });

export const createStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        full_name: z.string().trim().min(2).max(120),
        email: z.string().trim().email().max(255),
        password: z.string().min(6).max(128),
        level_id: z.string().uuid(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { full_name: data.full_name },
    });
    if (error || !created.user) throw new Error(error?.message ?? "create_failed");
    const uid = created.user.id;
    await supabaseAdmin.from("profiles").upsert({
      id: uid,
      full_name: data.full_name,
      email: data.email,
    });
    await supabaseAdmin.from("user_roles").insert({ user_id: uid, role: "student" });
    await supabaseAdmin.from("student_profiles").upsert({
      user_id: uid,
      educational_level_id: data.level_id,
    });
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("educational_level_id", data.level_id)
      .limit(1)
      .maybeSingle();
    if (course) {
      await supabaseAdmin
        .from("enrollments")
        .upsert({ student_id: uid, course_id: course.id }, { onConflict: "student_id,course_id" });
    }
    return { id: uid };
  });

export const deleteStudent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.auth.admin.deleteUser(data.id);
    return { ok: true };
  });

export const resetStudentPassword = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ id: z.string().uuid(), password: z.string().min(6).max(128) }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.updateUserById(data.id, {
      password: data.password,
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const PlatformRoleSchema = z.enum(["admin", "teacher", "student", "parent"]);

export const listPlatformUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: authPage, error: authError } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });
    if (authError) throw new Error(authError.message);
    const users = authPage.users ?? [];
    const ids = users.map((user) => user.id);
    if (!ids.length) return [];

    const [profilesResult, rolesResult, studentsResult, levelsResult, parentLinksResult] =
      await Promise.all([
        supabaseAdmin
          .from("profiles")
          .select("id, full_name, username, email, phone, status, created_at, updated_at")
          .in("id", ids),
        supabaseAdmin.from("user_roles").select("user_id, role").in("user_id", ids),
        supabaseAdmin
          .from("student_profiles")
          .select("user_id, educational_level_id, guardian_phone, school_name, governorate, registration_completed")
          .in("user_id", ids),
        supabaseAdmin.from("educational_levels").select("id, name"),
        supabaseAdmin.from("student_parents").select("parent_id, student_id").in("parent_id", ids),
      ]);

    const profileMap = new Map((profilesResult.data ?? []).map((row) => [row.id, row]));
    const studentMap = new Map((studentsResult.data ?? []).map((row) => [row.user_id, row]));
    const levelMap = new Map((levelsResult.data ?? []).map((row) => [row.id, row.name]));
    const rolesMap = new Map<string, string[]>();
    for (const row of rolesResult.data ?? []) {
      rolesMap.set(row.user_id, [...(rolesMap.get(row.user_id) ?? []), row.role]);
    }
    const childrenCount = new Map<string, number>();
    for (const link of parentLinksResult.data ?? []) {
      childrenCount.set(link.parent_id, (childrenCount.get(link.parent_id) ?? 0) + 1);
    }

    return users
      .map((user) => {
        const profile = profileMap.get(user.id);
        const student = studentMap.get(user.id);
        return {
          id: user.id,
          full_name: profile?.full_name || user.user_metadata?.full_name || user.email || "مستخدم",
          username: profile?.username || user.user_metadata?.username || "",
          email: user.email || profile?.email || "",
          phone: profile?.phone || user.phone || "",
          status: profile?.status || "active",
          roles: rolesMap.get(user.id) ?? [],
          providers: (user.identities ?? []).map((identity) => identity.provider),
          email_confirmed: Boolean(user.email_confirmed_at),
          created_at: user.created_at,
          updated_at: user.updated_at,
          last_sign_in_at: user.last_sign_in_at,
          is_banned: Boolean(user.banned_until && new Date(user.banned_until).getTime() > Date.now()),
          level_id: student?.educational_level_id ?? null,
          level_name: student?.educational_level_id
            ? levelMap.get(student.educational_level_id) ?? null
            : null,
          guardian_phone: student?.guardian_phone ?? "",
          school_name: student?.school_name ?? "",
          governorate: student?.governorate ?? "",
          registration_completed: student?.registration_completed ?? false,
          children_count: childrenCount.get(user.id) ?? 0,
          is_current_user: user.id === context.userId,
        };
      })
      .sort((a, b) => +new Date(b.created_at) - +new Date(a.created_at));
  });

export const updatePlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        full_name: z.string().trim().min(2).max(120),
        username: z.string().trim().max(60),
        email: z.string().trim().email().max(255),
        phone: z.string().trim().max(30),
        password: z.string().min(8).max(128).optional().or(z.literal("")),
        roles: z.array(PlatformRoleSchema).min(1).max(4),
        active: z.boolean(),
        level_id: z.string().uuid().nullable().optional(),
        guardian_phone: z.string().trim().max(30).optional(),
        school_name: z.string().trim().max(160).optional(),
        governorate: z.string().trim().max(120).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: existing, error: getError } = await supabaseAdmin.auth.admin.getUserById(data.id);
    if (getError || !existing.user) throw new Error(getError?.message ?? "user_not_found");

    const authChanges: Record<string, unknown> = {
      email: data.email.toLowerCase(),
      email_confirm: true,
      user_metadata: {
        ...(existing.user.user_metadata ?? {}),
        full_name: data.full_name,
        username: data.username || null,
      },
      ban_duration: data.active ? "none" : "876000h",
    };
    if (data.password) authChanges.password = data.password;
    const { error: authError } = await supabaseAdmin.auth.admin.updateUserById(data.id, authChanges);
    if (authError) throw new Error(authError.message);

    const { error: profileError } = await supabaseAdmin.from("profiles").upsert({
      id: data.id,
      full_name: data.full_name,
      username: data.username || null,
      email: data.email.toLowerCase(),
      phone: data.phone || null,
      status: data.active ? "active" : "suspended",
    });
    if (profileError) throw new Error(profileError.message);

    const { error: deleteRolesError } = await supabaseAdmin.from("user_roles").delete().eq("user_id", data.id);
    if (deleteRolesError) throw new Error(deleteRolesError.message);
    const { error: rolesError } = await supabaseAdmin
      .from("user_roles")
      .insert(data.roles.map((role) => ({ user_id: data.id, role })));
    if (rolesError) throw new Error(rolesError.message);

    if (data.roles.includes("student")) {
      const { error: studentError } = await supabaseAdmin.from("student_profiles").upsert({
        user_id: data.id,
        educational_level_id: data.level_id || null,
        guardian_phone: data.guardian_phone || null,
        school_name: data.school_name || null,
        governorate: data.governorate || null,
      });
      if (studentError) throw new Error(studentError.message);
    }
    if (data.roles.includes("parent")) {
      const { error: parentError } = await supabaseAdmin.from("parent_profiles").upsert({ user_id: data.id });
      if (parentError) throw new Error(parentError.message);
    }
    if (data.roles.includes("teacher")) {
      const { error: teacherError } = await supabaseAdmin.from("teacher_profiles").upsert({ user_id: data.id });
      if (teacherError) throw new Error(teacherError.message);
    }
    return { ok: true };
  });

export const deletePlatformUser = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    if (data.id === context.userId) throw new Error("cannot_delete_current_user");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const createOrLinkParent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        student_id: z.string().uuid(),
        full_name: z.string().trim().min(3).max(120),
        email: z.string().trim().email().max(255),
        password: z.string().min(8).max(128),
        relationship: z.enum(["father", "mother", "guardian", "other"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: student } = await supabaseAdmin
      .from("student_profiles")
      .select("user_id")
      .eq("user_id", data.student_id)
      .maybeSingle();
    if (!student) throw new Error("student_not_found");

    const normalizedEmail = data.email.toLowerCase();
    const { data: existingProfile } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .ilike("email", normalizedEmail)
      .maybeSingle();
    let parentId = existingProfile?.id ?? null;

    if (!parentId) {
      const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email: normalizedEmail,
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (createError || !created.user) throw new Error(createError?.message ?? "parent_create_failed");
      parentId = created.user.id;
    } else {
      const { data: existingRoles } = await supabaseAdmin
        .from("user_roles")
        .select("role")
        .eq("user_id", parentId);
      if ((existingRoles ?? []).some((row) => row.role !== "parent")) {
        throw new Error("email_belongs_to_another_account_type");
      }
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(parentId, {
        password: data.password,
        email_confirm: true,
        user_metadata: { full_name: data.full_name },
      });
      if (updateError) throw new Error(updateError.message);
      await supabaseAdmin.from("profiles").update({ full_name: data.full_name }).eq("id", parentId);
    }

    const [{ error: roleError }, { error: profileError }, { error: linkError }] = await Promise.all([
      supabaseAdmin.from("user_roles").upsert(
        { user_id: parentId, role: "parent" },
        { onConflict: "user_id,role" },
      ),
      supabaseAdmin.from("parent_profiles").upsert({ user_id: parentId }),
      supabaseAdmin.from("student_parents").upsert(
        {
          student_id: data.student_id,
          parent_id: parentId,
          relationship: data.relationship,
        },
        { onConflict: "student_id,parent_id" },
      ),
    ]);
    const error = roleError || profileError || linkError;
    if (error) throw new Error(error.message);
    return { parent_id: parentId, email: normalizedEmail };
  });

const QuestionSchema = z
  .object({
    type: z.enum(["mcq_single", "mcq_multi", "true_false", "short_answer", "essay"]),
    prompt: z.string().trim().min(1).max(2000),
    points: z.number().int().min(1).max(100),
    options: z
      .array(
        z.object({
          label: z.string().trim().min(1).max(500),
          is_correct: z.boolean(),
        }),
      )
      .max(6),
    model_answer: z.string().trim().max(5000).optional().nullable(),
    accepted_answers: z.array(z.string().trim().min(1).max(500)).max(20).default([]),
  })
  .superRefine((question, ctx) => {
    if (["mcq_single", "true_false"].includes(question.type)) {
      if (
        question.options.length < 2 ||
        question.options.filter((o) => o.is_correct).length !== 1
      ) {
        ctx.addIssue({ code: "custom", message: "must_have_one_correct", path: ["options"] });
      }
    }
    if (
      question.type === "mcq_multi" &&
      (question.options.length < 2 || !question.options.some((o) => o.is_correct))
    ) {
      ctx.addIssue({ code: "custom", message: "must_have_correct_options", path: ["options"] });
    }
    if (question.type === "short_answer" && !question.accepted_answers.length) {
      ctx.addIssue({
        code: "custom",
        message: "accepted_answer_required",
        path: ["accepted_answers"],
      });
    }
    if (question.type === "essay" && !question.model_answer) {
      ctx.addIssue({ code: "custom", message: "model_answer_required", path: ["model_answer"] });
    }
  });

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(2).max(200),
        instructions: z.string().max(2000).optional().nullable(),
        level_id: z.string().uuid(),
        duration_minutes: z.number().int().min(1).max(600),
        opens_at: z.string().min(1),
        closes_at: z.string().min(1),
        passing_score: z.number().int().min(0).max(100).default(50),
        questions: z.array(QuestionSchema).min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("educational_level_id", data.level_id)
      .limit(1)
      .maybeSingle();
    if (!course) throw new Error("no_course_for_level");
    const totalPoints = data.questions.reduce((s, q) => s + q.points, 0);
    const { data: exam, error: examErr } = await supabaseAdmin
      .from("exams")
      .insert({
        title: data.title,
        instructions: data.instructions ?? null,
        course_id: course.id,
        duration_minutes: data.duration_minutes,
        opens_at: data.opens_at,
        closes_at: data.closes_at,
        passing_score: data.passing_score,
        total_points: totalPoints,
        status: "published",
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (examErr || !exam) throw new Error(examErr?.message ?? "exam_failed");
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      const { data: qRow, error: qErr } = await supabaseAdmin
        .from("questions")
        .insert({
          prompt: q.prompt,
          type: q.type,
          course_id: course.id,
          default_points: q.points,
          created_by: context.userId,
          model_answer: q.model_answer || null,
          accepted_answers: q.accepted_answers,
          requires_manual_grading: q.type === "essay",
        })
        .select("id")
        .single();
      if (qErr || !qRow) throw new Error(qErr?.message ?? "q_failed");
      if (q.options.length) {
        await supabaseAdmin.from("question_options").insert(
          q.options.map((o, oi) => ({
            question_id: qRow.id,
            label: o.label,
            is_correct: o.is_correct,
            sort_order: oi,
          })),
        );
      }
      await supabaseAdmin.from("exam_questions").insert({
        exam_id: exam.id,
        question_id: qRow.id,
        points: q.points,
        sort_order: i,
      });
    }
    return { id: exam.id };
  });

export const listTeacherExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exams } = await supabaseAdmin
      .from("exams")
      .select(
        "id, title, duration_minutes, opens_at, closes_at, total_points, passing_score, status, course_id, created_at",
      )
      .order("created_at", { ascending: false });
    if (!exams || !exams.length) return [];
    const courseIds = [...new Set(exams.map((e) => e.course_id))];
    const [{ data: courses }, { data: levels }] = await Promise.all([
      supabaseAdmin.from("courses").select("id, educational_level_id").in("id", courseIds),
      supabaseAdmin.from("educational_levels").select("id, name"),
    ]);
    const lvlMap = new Map((levels ?? []).map((l) => [l.id, l.name]));
    const cMap = new Map((courses ?? []).map((c) => [c.id, c.educational_level_id]));
    const examIds = exams.map((e) => e.id);
    const { data: att } = await supabaseAdmin
      .from("exam_attempts")
      .select("exam_id, status")
      .in("exam_id", examIds);
    const counts: Record<string, number> = {};
    for (const a of att ?? []) counts[a.exam_id] = (counts[a.exam_id] ?? 0) + 1;
    return exams.map((e) => ({
      ...e,
      level_name: lvlMap.get(cMap.get(e.course_id) ?? "") ?? "",
      attempts_count: counts[e.id] ?? 0,
    }));
  });

export const deleteExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("exams").delete().eq("id", data.id);
    return { ok: true };
  });

// ---------- PDF exams ----------

const PdfQSchema = z.object({
  options_count: z.number().int().min(2).max(6),
  correct_index: z.number().int().min(0).max(5),
  points: z.number().int().min(1).max(100).default(1),
});

export const createExamFromPdf = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(2).max(200),
        instructions: z.string().max(2000).optional().nullable(),
        level_id: z.string().uuid(),
        duration_minutes: z.number().int().min(1).max(600),
        opens_at: z.string().min(1),
        closes_at: z.string().min(1),
        passing_score: z.number().int().min(0).max(100).default(50),
        pdf_path: z.string().min(1),
        questions: z.array(PdfQSchema).min(1).max(200),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("educational_level_id", data.level_id)
      .limit(1)
      .maybeSingle();
    if (!course) throw new Error("no_course_for_level");
    const totalPoints = data.questions.reduce((s, q) => s + q.points, 0);
    const { data: exam, error: examErr } = await supabaseAdmin
      .from("exams")
      .insert({
        title: data.title,
        instructions: data.instructions ?? null,
        course_id: course.id,
        duration_minutes: data.duration_minutes,
        opens_at: data.opens_at,
        closes_at: data.closes_at,
        passing_score: data.passing_score,
        total_points: totalPoints,
        status: "published",
        pdf_path: data.pdf_path,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (examErr || !exam) throw new Error(examErr?.message ?? "exam_failed");
    const letters = ["A", "B", "C", "D", "E", "F"];
    for (let i = 0; i < data.questions.length; i++) {
      const q = data.questions[i];
      if (q.correct_index >= q.options_count) throw new Error("bad_correct_index");
      const { data: qRow, error: qErr } = await supabaseAdmin
        .from("questions")
        .insert({
          prompt: `السؤال ${i + 1}`,
          type: "mcq_single",
          course_id: course.id,
          default_points: q.points,
          created_by: context.userId,
        })
        .select("id")
        .single();
      if (qErr || !qRow) throw new Error(qErr?.message ?? "q_failed");
      const opts = Array.from({ length: q.options_count }, (_, oi) => ({
        question_id: qRow.id,
        label: letters[oi],
        is_correct: oi === q.correct_index,
        sort_order: oi,
      }));
      await supabaseAdmin.from("question_options").insert(opts);
      await supabaseAdmin.from("exam_questions").insert({
        exam_id: exam.id,
        question_id: qRow.id,
        points: q.points,
        sort_order: i,
      });
    }
    return { id: exam.id };
  });

export const getExamPdfUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ exam_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("id, pdf_path, course_id")
      .eq("id", data.exam_id)
      .maybeSingle();
    if (!exam?.pdf_path) return { url: null as string | null };
    // authorize: teacher/admin OR enrolled student
    const { data: roles } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId);
    const rs = (roles ?? []).map((r: any) => r.role);
    const isStaff = rs.includes("teacher") || rs.includes("admin");
    if (!isStaff) {
      const { data: enr } = await supabaseAdmin
        .from("enrollments")
        .select("id")
        .eq("student_id", context.userId)
        .eq("course_id", exam.course_id)
        .maybeSingle();
      if (!enr) throw new Error("forbidden");
    }
    const { data: signed, error } = await supabaseAdmin.storage
      .from("exam-pdfs")
      .createSignedUrl(exam.pdf_path, 60 * 60);
    if (error) throw new Error(error.message);
    return { url: signed?.signedUrl ?? null };
  });

// ---------- Live lessons ----------

const MeetingUrlSchema = z
  .string()
  .trim()
  .url("invalid_meeting_url")
  .max(2000)
  .refine((value) => ["https:", "http:"].includes(new URL(value).protocol), "invalid_meeting_url");

export const createLiveLecture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        title: z.string().trim().min(2).max(200),
        description: z.string().trim().max(2000).optional().nullable(),
        level_id: z.string().uuid(),
        scheduled_at: z.string().datetime(),
        duration_minutes: z.number().int().min(10).max(600),
        meeting_url: MeetingUrlSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("educational_level_id", data.level_id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    if (!course) throw new Error("no_course_for_level");

    const { data: lecture, error } = await supabaseAdmin
      .from("live_lectures")
      .insert({
        course_id: course.id,
        teacher_id: context.userId,
        title: data.title,
        description: data.description || null,
        scheduled_at: data.scheduled_at,
        duration_minutes: data.duration_minutes,
        zoom_join_url: data.meeting_url,
        status: "scheduled",
      })
      .select("id")
      .single();
    if (error || !lecture) throw new Error(error?.message ?? "lecture_create_failed");
    return { id: lecture.id };
  });

export const listTeacherLectures = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: lectures }, { data: courses }, { data: levels }] = await Promise.all([
      supabaseAdmin
        .from("live_lectures")
        .select(
          "id, course_id, title, description, scheduled_at, duration_minutes, zoom_join_url, status, created_at",
        )
        .order("scheduled_at", { ascending: false }),
      supabaseAdmin.from("courses").select("id, educational_level_id"),
      supabaseAdmin.from("educational_levels").select("id, name"),
    ]);
    const courseLevel = new Map((courses ?? []).map((course) => [course.id, course.educational_level_id]));
    const levelNames = new Map((levels ?? []).map((level) => [level.id, level.name]));
    return (lectures ?? []).map((lecture) => ({
      ...lecture,
      level_name: levelNames.get(courseLevel.get(lecture.course_id) ?? "") ?? "",
    }));
  });

export const deleteLiveLecture = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("live_lectures").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listLecturesForStudent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: enrollments } = await supabaseAdmin
      .from("enrollments")
      .select("course_id")
      .eq("student_id", context.userId);
    const courseIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.course_id))];
    if (!courseIds.length) return [];
    const [{ data: lectures, error }, { data: courses }, { data: levels }] = await Promise.all([
      supabaseAdmin
        .from("live_lectures")
        .select(
          "id, course_id, title, description, scheduled_at, duration_minutes, zoom_join_url, status",
        )
        .in("course_id", courseIds)
        .neq("status", "cancelled")
        .order("scheduled_at", { ascending: true }),
      supabaseAdmin
        .from("courses")
        .select("id, educational_level_id")
        .in("id", courseIds),
      supabaseAdmin.from("educational_levels").select("id, name"),
    ]);
    if (error) throw new Error(error.message);
    const courseLevel = new Map((courses ?? []).map((course) => [course.id, course.educational_level_id]));
    const levelNames = new Map((levels ?? []).map((level) => [level.id, level.name]));
    return (lectures ?? []).map((lecture) => ({
      id: lecture.id,
      title: lecture.title,
      description: lecture.description,
      scheduled_at: lecture.scheduled_at,
      duration_minutes: lecture.duration_minutes,
      status: lecture.status,
      join_url: lecture.zoom_join_url,
      level_name: levelNames.get(courseLevel.get(lecture.course_id) ?? "") ?? "",
    }));
  });

// ---------- Attendance ----------

export const listAttendanceSessions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sess } = await supabaseAdmin
      .from("attendance_sessions")
      .select("id, session_date, title, notes, educational_level_id, created_at")
      .order("session_date", { ascending: false });
    const ids = (sess ?? []).map((s) => s.id);
    let counts: Record<string, { present: number; absent: number; late: number; excused: number }> =
      {};
    if (ids.length) {
      const { data: recs } = await supabaseAdmin
        .from("attendance_records")
        .select("session_id, status")
        .in("session_id", ids);
      for (const r of recs ?? []) {
        const c = counts[r.session_id] ?? { present: 0, absent: 0, late: 0, excused: 0 };
        (c as any)[r.status] = ((c as any)[r.status] ?? 0) + 1;
        counts[r.session_id] = c;
      }
    }
    const { data: levels } = await supabaseAdmin.from("educational_levels").select("id, name");
    const lm = new Map((levels ?? []).map((l) => [l.id, l.name]));
    return (sess ?? []).map((s) => ({
      ...s,
      level_name: lm.get(s.educational_level_id) ?? "",
      counts: counts[s.id] ?? { present: 0, absent: 0, late: 0, excused: 0 },
    }));
  });

export const createAttendanceSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        level_id: z.string().uuid(),
        session_date: z.string().min(1),
        title: z.string().trim().min(1).max(200),
        notes: z.string().max(1000).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sess, error } = await supabaseAdmin
      .from("attendance_sessions")
      .insert({
        educational_level_id: data.level_id,
        session_date: data.session_date,
        title: data.title,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("id")
      .single();
    if (error || !sess) throw new Error(error?.message ?? "create_failed");
    // pre-seed records as 'absent' for all students at this level
    const { data: roleRows } = await supabaseAdmin
      .from("student_profiles")
      .select("user_id")
      .eq("educational_level_id", data.level_id);
    const rows = (roleRows ?? []).map((r) => ({
      session_id: sess.id,
      student_id: r.user_id,
      status: "absent" as const,
    }));
    if (rows.length) await supabaseAdmin.from("attendance_records").insert(rows);
    return { id: sess.id };
  });

export const deleteAttendanceSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("attendance_sessions").delete().eq("id", data.id);
    return { ok: true };
  });

export const getAttendanceForSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ session_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sess } = await supabaseAdmin
      .from("attendance_sessions")
      .select("id, session_date, title, notes, educational_level_id")
      .eq("id", data.session_id)
      .maybeSingle();
    if (!sess) throw new Error("not_found");
    const { data: sp } = await supabaseAdmin
      .from("student_profiles")
      .select("user_id")
      .eq("educational_level_id", sess.educational_level_id);
    const ids = (sp ?? []).map((r) => r.user_id);
    const [profiles, recs] = await Promise.all([
      ids.length
        ? supabaseAdmin.from("profiles").select("id, full_name, email").in("id", ids)
        : Promise.resolve({ data: [] as any }),
      supabaseAdmin
        .from("attendance_records")
        .select("student_id, status, notes")
        .eq("session_id", data.session_id),
    ]);
    const rm = new Map((recs.data ?? []).map((r: any) => [r.student_id, r]));
    return {
      session: sess,
      rows: (profiles.data ?? [])
        .map((p: any) => ({
          student_id: p.id,
          full_name: p.full_name,
          email: p.email,
          status: rm.get(p.id)?.status ?? "absent",
          notes: rm.get(p.id)?.notes ?? null,
        }))
        .sort((a: any, b: any) => a.full_name.localeCompare(b.full_name, "ar")),
    };
  });

export const setAttendance = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        session_id: z.string().uuid(),
        student_id: z.string().uuid(),
        status: z.enum(["present", "absent", "late", "excused"]),
        notes: z.string().max(500).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("attendance_records").upsert(
      {
        session_id: data.session_id,
        student_id: data.student_id,
        status: data.status,
        notes: data.notes ?? null,
      },
      { onConflict: "session_id,student_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ---------- Student detail (teacher view) ----------

export const getStudentDetails = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ student_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: profile }, { data: sp }, { data: levels }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at")
        .eq("id", data.student_id)
        .maybeSingle(),
      supabaseAdmin
        .from("student_profiles")
        .select(
          "educational_level_id, guardian_phone, school_name, governorate, registration_completed",
        )
        .eq("user_id", data.student_id)
        .maybeSingle(),
      supabaseAdmin.from("educational_levels").select("id, name"),
    ]);
    if (!profile) throw new Error("not_found");
    const lm = new Map((levels ?? []).map((l) => [l.id, l.name]));
    const { data: atts } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, status, score, percentage, passed, submitted_at, started_at")
      .eq("student_id", data.student_id)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    const examIds = [...new Set((atts ?? []).map((a) => a.exam_id))];
    const { data: exams } = examIds.length
      ? await supabaseAdmin
          .from("exams")
          .select("id, title, total_points, passing_score")
          .in("id", examIds)
      : { data: [] as any };
    const em = new Map((exams ?? []).map((e: any) => [e.id, e]));
    const { data: attRecs } = await supabaseAdmin
      .from("attendance_records")
      .select("session_id, status, notes")
      .eq("student_id", data.student_id);
    const sessIds = [...new Set((attRecs ?? []).map((r) => r.session_id))];
    const { data: sess } = sessIds.length
      ? await supabaseAdmin
          .from("attendance_sessions")
          .select("id, session_date, title")
          .in("id", sessIds)
      : { data: [] as any };
    const sm = new Map((sess ?? []).map((s: any) => [s.id, s]));
    const attendance = (attRecs ?? [])
      .map((r) => ({ ...r, session: sm.get(r.session_id) ?? null }))
      .sort((a: any, b: any) =>
        (b.session?.session_date ?? "").localeCompare(a.session?.session_date ?? ""),
      );
    const summary = {
      total_sessions: attendance.length,
      present: attendance.filter((r) => r.status === "present").length,
      absent: attendance.filter((r) => r.status === "absent").length,
      late: attendance.filter((r) => r.status === "late").length,
      excused: attendance.filter((r) => r.status === "excused").length,
      exams_taken: (atts ?? []).filter((a) => a.status !== "in_progress").length,
      exams_passed: (atts ?? []).filter((a) => a.passed).length,
      avg_percentage: (() => {
        const done = (atts ?? []).filter((a) => a.percentage != null);
        if (!done.length) return null;
        return Math.round(done.reduce((s, a) => s + (a.percentage ?? 0), 0) / done.length);
      })(),
    };
    return {
      profile: {
        ...profile,
        level_name: sp?.educational_level_id ? (lm.get(sp.educational_level_id) ?? null) : null,
        guardian_phone: sp?.guardian_phone ?? null,
        school_name: sp?.school_name ?? null,
        governorate: sp?.governorate ?? null,
        registration_completed: sp?.registration_completed ?? false,
      },
      attempts: (atts ?? []).map((a) => ({ ...a, exam: em.get(a.exam_id) ?? null })),
      attendance,
      summary,
    };
  });

// A single, authorization-aware payload for the student and parent portal.
export const getStudentPortal = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ student_id: z.string().uuid().optional().nullable() }).parse(d ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const [{ data: ownStudent }, { data: parentLinks }, { data: roleRows }] = await Promise.all([
      supabaseAdmin
        .from("student_profiles")
        .select("user_id")
        .eq("user_id", context.userId)
        .maybeSingle(),
      supabaseAdmin
        .from("student_parents")
        .select("student_id, relationship")
        .eq("parent_id", context.userId),
      supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId),
    ]);

    const elevated = (roleRows ?? []).some((row) => row.role === "teacher" || row.role === "admin");
    const linkedIds = (parentLinks ?? []).map((link) => link.student_id);
    const { data: allStudentRows } = elevated
      ? await supabaseAdmin
          .from("student_profiles")
          .select("user_id")
          .order("created_at", { ascending: false })
      : { data: [] as { user_id: string }[] };
    const elevatedStudentIds = (allStudentRows ?? []).map((student) => student.user_id);
    const targetId =
      data.student_id || ownStudent?.user_id || linkedIds[0] || elevatedStudentIds[0] || null;
    if (!targetId) return { students: [], selected_student_id: null, dashboard: null };

    const allowed = targetId === context.userId || linkedIds.includes(targetId) || elevated;
    if (!allowed) throw new Error("forbidden");

    const accessibleIds = elevated
      ? elevatedStudentIds
      : ownStudent?.user_id
        ? [ownStudent.user_id]
        : linkedIds.length
          ? linkedIds
          : [targetId];
    const { data: accessibleProfiles } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .in("id", accessibleIds);
    const relationshipMap = new Map(
      (parentLinks ?? []).map((link) => [link.student_id, link.relationship]),
    );
    const students = (accessibleProfiles ?? []).map((profile) => ({
      id: profile.id,
      full_name: profile.full_name,
      email: profile.email,
      relationship: relationshipMap.get(profile.id) ?? null,
    }));

    const [{ data: profile }, { data: studentProfile }, { data: levels }] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, email, phone, status, created_at")
        .eq("id", targetId)
        .maybeSingle(),
      supabaseAdmin
        .from("student_profiles")
        .select(
          "educational_level_id, guardian_phone, school_name, governorate, registration_completed",
        )
        .eq("user_id", targetId)
        .maybeSingle(),
      supabaseAdmin.from("educational_levels").select("id, name"),
    ]);
    if (!profile || !studentProfile) throw new Error("student_not_found");

    const levelMap = new Map((levels ?? []).map((level) => [level.id, level.name]));
    const { data: enrollments } = await supabaseAdmin
      .from("enrollments")
      .select("course_id")
      .eq("student_id", targetId);
    let courseIds = [...new Set((enrollments ?? []).map((enrollment) => enrollment.course_id))];
    if (!courseIds.length && studentProfile.educational_level_id) {
      const { data: courses } = await supabaseAdmin
        .from("courses")
        .select("id")
        .eq("educational_level_id", studentProfile.educational_level_id)
        .eq("is_active", true);
      courseIds = (courses ?? []).map((course) => course.id);
    }

    const [attemptResult, attendanceResult, examResult, lectureResult] = await Promise.all([
      supabaseAdmin
        .from("exam_attempts")
        .select(
          "id, exam_id, status, score, percentage, passed, pending_manual_grading, submitted_at, started_at",
        )
        .eq("student_id", targetId)
        .order("submitted_at", { ascending: false, nullsFirst: false }),
      supabaseAdmin
        .from("attendance_records")
        .select("session_id, status, notes, created_at")
        .eq("student_id", targetId),
      courseIds.length
        ? supabaseAdmin
            .from("exams")
            .select(
              "id, title, instructions, duration_minutes, opens_at, closes_at, total_points, passing_score, status",
            )
            .in("course_id", courseIds)
            .eq("status", "published")
            .order("opens_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
      courseIds.length
        ? supabaseAdmin
            .from("live_lectures")
            .select("id, title, description, scheduled_at, duration_minutes, zoom_join_url, status")
            .in("course_id", courseIds)
            .neq("status", "cancelled")
            .order("scheduled_at", { ascending: false })
        : Promise.resolve({ data: [], error: null }),
    ]);

    const attempts = attemptResult.data ?? [];
    const examIds = [...new Set(attempts.map((attempt) => attempt.exam_id))];
    const sessionIds = [...new Set((attendanceResult.data ?? []).map((record) => record.session_id))];
    const [attemptExamResult, sessionResult] = await Promise.all([
      examIds.length
        ? supabaseAdmin
            .from("exams")
            .select("id, title, total_points, passing_score")
            .in("id", examIds)
        : Promise.resolve({ data: [], error: null }),
      sessionIds.length
        ? supabaseAdmin
            .from("attendance_sessions")
            .select("id, session_date, title, notes")
            .in("id", sessionIds)
        : Promise.resolve({ data: [], error: null }),
    ]);
    const examMap = new Map((attemptExamResult.data ?? []).map((exam) => [exam.id, exam]));
    const attemptMap = new Map(attempts.map((attempt) => [attempt.exam_id, attempt]));
    const sessionMap = new Map((sessionResult.data ?? []).map((session) => [session.id, session]));
    const attendance = (attendanceResult.data ?? [])
      .map((record) => ({ ...record, session: sessionMap.get(record.session_id) ?? null }))
      .sort((a, b) =>
        (b.session?.session_date ?? "").localeCompare(a.session?.session_date ?? ""),
      );
    const completedAttempts = attempts.filter(
      (attempt) => attempt.status !== "in_progress" && attempt.percentage != null,
    );
    const presentCount = attendance.filter((record) => record.status === "present").length;
    const attendanceRate = attendance.length
      ? Math.round(((presentCount + attendance.filter((r) => r.status === "late").length) / attendance.length) * 100)
      : null;

    return {
      students,
      selected_student_id: targetId,
      dashboard: {
        profile: {
          ...profile,
          level_name: studentProfile.educational_level_id
            ? levelMap.get(studentProfile.educational_level_id) ?? null
            : null,
          guardian_phone: studentProfile.guardian_phone,
          school_name: studentProfile.school_name,
          governorate: studentProfile.governorate,
          registration_completed: studentProfile.registration_completed,
        },
        summary: {
          exams_taken: completedAttempts.length,
          exams_passed: completedAttempts.filter((attempt) => attempt.passed).length,
          avg_percentage: completedAttempts.length
            ? Math.round(
                completedAttempts.reduce(
                  (sum, attempt) => sum + Number(attempt.percentage ?? 0),
                  0,
                ) / completedAttempts.length,
              )
            : null,
          attendance_rate: attendanceRate,
          total_sessions: attendance.length,
          present: presentCount,
          absent: attendance.filter((record) => record.status === "absent").length,
          late: attendance.filter((record) => record.status === "late").length,
          excused: attendance.filter((record) => record.status === "excused").length,
        },
        attempts: attempts.map((attempt) => ({
          ...attempt,
          exam: examMap.get(attempt.exam_id) ?? null,
        })),
        attendance,
        exams: (examResult.data ?? []).map((exam) => ({
          ...exam,
          attempt: attemptMap.get(exam.id) ?? null,
        })),
        lectures: (lectureResult.data ?? []).map((lecture) => ({
          id: lecture.id,
          title: lecture.title,
          description: lecture.description,
          scheduled_at: lecture.scheduled_at,
          duration_minutes: lecture.duration_minutes,
          status: lecture.status,
          join_url: lecture.zoom_join_url,
        })),
      },
    };
  });

export const listExamsForStudent = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sp } = await supabaseAdmin
      .from("student_profiles")
      .select("educational_level_id")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (!sp?.educational_level_id) return [];
    const { data: course } = await supabaseAdmin
      .from("courses")
      .select("id")
      .eq("educational_level_id", sp.educational_level_id)
      .maybeSingle();
    if (!course) return [];
    const { data: exams } = await supabaseAdmin
      .from("exams")
      .select(
        "id, title, instructions, duration_minutes, opens_at, closes_at, total_points, passing_score, status",
      )
      .eq("course_id", course.id)
      .eq("status", "published")
      .order("opens_at", { ascending: false });
    const ids = (exams ?? []).map((e) => e.id);
    let attempts: any[] = [];
    if (ids.length) {
      const { data } = await supabaseAdmin
        .from("exam_attempts")
        .select(
          "id, exam_id, status, score, objective_score, percentage, pending_manual_grading, submitted_at, started_at, deadline_at, passed",
        )
        .eq("student_id", context.userId)
        .in("exam_id", ids);
      attempts = data ?? [];
    }

    const attemptIds = attempts.map((attempt) => attempt.id);
    const [{ data: examQuestions }, { data: attemptAnswers }] = ids.length
      ? await Promise.all([
          supabaseAdmin.from("exam_questions").select("exam_id, question_id").in("exam_id", ids),
          attemptIds.length
            ? supabaseAdmin
                .from("attempt_answers")
                .select("attempt_id, is_correct, selected_option_ids, text_answer")
                .in("attempt_id", attemptIds)
            : Promise.resolve({ data: [] as any[] }),
        ])
      : [{ data: [] as any[] }, { data: [] as any[] }];

    const questionTotals = new Map<string, number>();
    for (const question of examQuestions ?? []) {
      questionTotals.set(question.exam_id, (questionTotals.get(question.exam_id) ?? 0) + 1);
    }

    const answerStats = new Map<string, { answered: number; correct: number; wrong: number; pending: number }>();
    for (const answer of attemptAnswers ?? []) {
      const stats = answerStats.get(answer.attempt_id) ?? { answered: 0, correct: 0, wrong: 0, pending: 0 };
      const hasSelectedOption = Array.isArray(answer.selected_option_ids) && answer.selected_option_ids.length > 0;
      const hasTextAnswer = typeof answer.text_answer === "string" && answer.text_answer.trim().length > 0;
      if (hasSelectedOption || hasTextAnswer) {
        stats.answered += 1;
        if (answer.is_correct === true) stats.correct += 1;
        else if (answer.is_correct === false) stats.wrong += 1;
        else stats.pending += 1;
      }
      answerStats.set(answer.attempt_id, stats);
    }

    return (exams ?? []).map((e) => ({
      ...e,
      attempt: (() => {
        const attempt = attempts.find((a) => a.exam_id === e.id) ?? null;
        if (!attempt) return null;
        const stats = answerStats.get(attempt.id) ?? { answered: 0, correct: 0, wrong: 0, pending: 0 };
        const total = questionTotals.get(e.id) ?? 0;
        return { ...attempt, question_stats: { total, ...stats, unanswered: Math.max(total - stats.answered, 0) } };
      })(),
    }));
  });

export const startAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ exam_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("id, course_id, duration_minutes, opens_at, closes_at, status")
      .eq("id", data.exam_id)
      .maybeSingle();
    if (!exam) throw new Error("exam_not_found");
    if (exam.status !== "published") throw new Error("not_available");
    const now = new Date();
    if (new Date(exam.opens_at) > now) throw new Error("not_open_yet");
    if (new Date(exam.closes_at) < now) throw new Error("closed");
    const { data: enroll } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("student_id", context.userId)
      .eq("course_id", exam.course_id)
      .maybeSingle();
    if (!enroll) throw new Error("not_enrolled");
    const loadExistingAttempt = () =>
      context.supabase
      .from("exam_attempts")
      .select("id, status, deadline_at, attempt_number")
      .eq("exam_id", data.exam_id)
      .eq("student_id", context.userId)
      .order("attempt_number", { ascending: true })
      .limit(1)
      .maybeSingle();
    const { data: existing, error: existingError } = await loadExistingAttempt();
    if (existingError) throw new Error(existingError.message);
    if (existing) {
      if (existing.status === "in_progress") {
        return { attempt_id: existing.id, deadline_at: existing.deadline_at };
      }
      throw new Error("already_submitted");
    }
    const startedAt = new Date();
    const durMs = exam.duration_minutes * 60_000;
    const closesAt = new Date(exam.closes_at);
    const deadline = new Date(Math.min(startedAt.getTime() + durMs, closesAt.getTime()));
    const { data: att, error } = await context.supabase
      .from("exam_attempts")
      .insert({
        exam_id: data.exam_id,
        student_id: context.userId,
        attempt_number: 1,
        started_at: startedAt.toISOString(),
        deadline_at: deadline.toISOString(),
        status: "in_progress",
      })
      .select("id, deadline_at")
      .single();
    if (error?.code === "23505") {
      // Starting can be requested twice by the browser. The first request owns
      // the insert; the second one must reuse that row instead of surfacing a
      // raw unique-constraint error.
      const { data: concurrentAttempt } = await loadExistingAttempt();
      if (concurrentAttempt?.status === "in_progress") {
        return {
          attempt_id: concurrentAttempt.id,
          deadline_at: concurrentAttempt.deadline_at,
        };
      }
      throw new Error("already_submitted");
    }
    if (error || !att) throw new Error(error?.message ?? "attempt_failed");
    return { attempt_id: att.id, deadline_at: att.deadline_at };
  });

export const getAttemptForTaking = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attempt_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: att } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, student_id, status, deadline_at, started_at")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!att || att.student_id !== context.userId) throw new Error("not_found");
    if (att.status !== "in_progress") throw new Error("already_submitted");
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("id, title, instructions, duration_minutes, closes_at, total_points, pdf_path")
      .eq("id", att.exam_id)
      .single();
    const { data: eqs } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id, points, sort_order")
      .eq("exam_id", att.exam_id)
      .order("sort_order");
    const qIds = (eqs ?? []).map((e) => e.question_id);
    const [{ data: qs }, { data: opts }] = await Promise.all([
      supabaseAdmin.from("questions").select("id, prompt, type").in("id", qIds),
      supabaseAdmin
        .from("question_options")
        .select("id, question_id, label, sort_order")
        .in("question_id", qIds)
        .order("sort_order"),
    ]);
    const qMap = new Map((qs ?? []).map((q) => [q.id, q]));
    const optsByQ = new Map<string, { id: string; label: string }[]>();
    for (const o of opts ?? []) {
      if (!optsByQ.has(o.question_id)) optsByQ.set(o.question_id, []);
      optsByQ.get(o.question_id)!.push({ id: o.id, label: o.label });
    }
    const questions = (eqs ?? []).map((e) => ({
      question_id: e.question_id,
      points: e.points,
      sort_order: e.sort_order,
      prompt: qMap.get(e.question_id)?.prompt ?? "",
      type: qMap.get(e.question_id)?.type ?? "mcq_single",
      options: optsByQ.get(e.question_id) ?? [],
    }));
    return { attempt: att, exam, questions };
  });

export const submitAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        attempt_id: z.string().uuid(),
        answers: z.array(
          z.object({
            question_id: z.string().uuid(),
            option_ids: z.array(z.string().uuid()).max(6).default([]),
            text_answer: z.string().max(10000).nullable().default(null),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: att } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, student_id, status, deadline_at")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!att || att.student_id !== context.userId) throw new Error("not_found");
    if (att.status !== "in_progress") throw new Error("already_submitted");
    const now = new Date();
    const late = new Date(att.deadline_at) < now;
    const { data: eqs } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id, points")
      .eq("exam_id", att.exam_id);
    const qIds = (eqs ?? []).map((e) => e.question_id);
    const [{ data: questions }, { data: opts }] = await Promise.all([
      supabaseAdmin
        .from("questions")
        .select("id, type, accepted_answers, requires_manual_grading")
        .in("id", qIds),
      supabaseAdmin
        .from("question_options")
        .select("id, question_id, is_correct")
        .in("question_id", qIds),
    ]);
    const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
    const correctByQ = new Map<string, string[]>();
    for (const option of opts ?? []) {
      if (!option.is_correct) continue;
      correctByQ.set(option.question_id, [
        ...(correctByQ.get(option.question_id) ?? []),
        option.id,
      ]);
    }
    let score = 0;
    let total = 0;
    let pendingManualGrading = false;
    const rows: any[] = [];
    const normalizeAnswer = (value: string) =>
      value
        .trim()
        .toLocaleLowerCase("ar-EG")
        .replace(/[\u064B-\u065F\u0670]/g, "")
        .replace(/\s+/g, " ");
    for (const eq of eqs ?? []) {
      total += eq.points;
      const question = questionMap.get(eq.question_id);
      const submitted = data.answers.find((answer) => answer.question_id === eq.question_id);
      const selected = [...(submitted?.option_ids ?? [])].sort();
      const expected = [...(correctByQ.get(eq.question_id) ?? [])].sort();
      const textAnswer = submitted?.text_answer?.trim() || null;
      const isEssay = question?.type === "essay" || question?.requires_manual_grading;
      let correct: boolean | null = false;

      if (isEssay) {
        correct = null;
        pendingManualGrading = true;
      } else if (question?.type === "short_answer") {
        const normalized = textAnswer ? normalizeAnswer(textAnswer) : "";
        correct = Boolean(
          normalized &&
          (question.accepted_answers ?? []).some(
            (answer) => normalizeAnswer(answer) === normalized,
          ),
        );
      } else {
        correct =
          selected.length > 0 &&
          selected.length === expected.length &&
          selected.every((id, index) => id === expected[index]);
      }
      if (correct === true) score += eq.points;
      rows.push({
        attempt_id: att.id,
        question_id: eq.question_id,
        selected_option_ids: selected.length ? selected : null,
        text_answer: textAnswer,
        is_correct: correct,
        awarded_points: correct === null ? null : correct ? eq.points : 0,
        graded_at: correct === null ? null : now.toISOString(),
      });
    }
    if (rows.length) await supabaseAdmin.from("attempt_answers").insert(rows);
    const percentage = pendingManualGrading ? null : total ? (score / total) * 100 : 0;
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("passing_score")
      .eq("id", att.exam_id)
      .single();
    const passed = exam && percentage !== null ? percentage >= exam.passing_score : null;
    await supabaseAdmin
      .from("exam_attempts")
      .update({
        status: pendingManualGrading ? "submitted" : late ? "auto_submitted" : "graded",
        submitted_at: now.toISOString(),
        score: pendingManualGrading ? null : score,
        objective_score: score,
        percentage,
        passed,
        pending_manual_grading: pendingManualGrading,
      })
      .eq("id", att.id);
    return {
      score: pendingManualGrading ? null : score,
      objective_score: score,
      total,
      percentage,
      passed,
      pending_manual_grading: pendingManualGrading,
    };
  });

export const listMyAttempts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: atts } = await supabaseAdmin
      .from("exam_attempts")
      .select(
        "id, exam_id, status, score, percentage, pending_manual_grading, submitted_at, started_at, passed",
      )
      .eq("student_id", context.userId)
      .order("submitted_at", { ascending: false, nullsFirst: false });
    const examIds = [...new Set((atts ?? []).map((a) => a.exam_id))];
    const { data: exams } = examIds.length
      ? await supabaseAdmin
          .from("exams")
          .select("id, title, total_points, passing_score")
          .in("id", examIds)
      : { data: [] as any };
    const m = new Map((exams ?? []).map((e: any) => [e.id, e]));
    return (atts ?? []).map((a) => ({ ...a, exam: m.get(a.exam_id) ?? null }));
  });

export const getAttemptReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attempt_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: att } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, student_id, status, score, percentage, passed, submitted_at")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!att) throw new Error("not_found");
    // owner or teacher
    if (att.student_id !== context.userId) {
      await requireTeacher(context.supabase, context.userId);
    }
    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("id, title, total_points, passing_score")
      .eq("id", att.exam_id)
      .single();
    const { data: eqs } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id, points, sort_order")
      .eq("exam_id", att.exam_id)
      .order("sort_order");
    const qIds = (eqs ?? []).map((e) => e.question_id);
    const [{ data: qs }, { data: opts }, { data: ans }] = await Promise.all([
      supabaseAdmin
        .from("questions")
        .select("id, prompt, type, accepted_answers, requires_manual_grading")
        .in("id", qIds),
      supabaseAdmin
        .from("question_options")
        .select("id, question_id, label, is_correct, sort_order")
        .in("question_id", qIds)
        .order("sort_order"),
      supabaseAdmin
        .from("attempt_answers")
        .select("question_id, selected_option_ids, text_answer, is_correct, awarded_points, teacher_feedback")
        .eq("attempt_id", att.id),
    ]);
    const qMap = new Map((qs ?? []).map((q) => [q.id, q]));
    const optsByQ = new Map<string, any[]>();
    for (const o of opts ?? []) {
      if (!optsByQ.has(o.question_id)) optsByQ.set(o.question_id, []);
      optsByQ.get(o.question_id)!.push(o);
    }
    const ansByQ = new Map((ans ?? []).map((a) => [a.question_id, a]));
    return {
      attempt: att,
      exam,
      questions: (eqs ?? []).map((e) => ({
        question_id: e.question_id,
        points: e.points,
        sort_order: e.sort_order,
        prompt: qMap.get(e.question_id)?.prompt ?? "",
        type: qMap.get(e.question_id)?.type ?? "mcq_single",
        accepted_answers:
          qMap.get(e.question_id)?.type === "short_answer"
            ? (qMap.get(e.question_id)?.accepted_answers ?? [])
            : [],
        requires_manual_grading: qMap.get(e.question_id)?.requires_manual_grading ?? false,
        options: optsByQ.get(e.question_id) ?? [],
        answer: ansByQ.get(e.question_id) ?? null,
      })),
    };
  });

export const listAttemptsForExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ exam_id: z.string().uuid().nullable().optional() }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let attemptsQuery = supabaseAdmin
      .from("exam_attempts")
      .select(
        "id, exam_id, student_id, status, score, percentage, passed, pending_manual_grading, submitted_at, started_at",
      )
      .order("submitted_at", { ascending: false, nullsFirst: false });
    if (data.exam_id) attemptsQuery = attemptsQuery.eq("exam_id", data.exam_id);
    const { data: atts, error: attemptsError } = await attemptsQuery;
    if (attemptsError) throw new Error(attemptsError.message);
    const sids = [...new Set((atts ?? []).map((a) => a.student_id))];
    const examIds = [...new Set((atts ?? []).map((a) => a.exam_id))];
    const [profsRes, examsRes] = await Promise.all([
      sids.length
        ? supabaseAdmin.from("profiles").select("id, full_name, email").in("id", sids)
        : Promise.resolve({ data: [] as { id: string; full_name: string; email: string }[] }),
      examIds.length
        ? supabaseAdmin.from("exams").select("id, title, total_points").in("id", examIds)
        : Promise.resolve({ data: [] as { id: string; title: string; total_points: number }[] }),
    ]);
    const pMap = new Map((profsRes.data ?? []).map((p) => [p.id, p]));
    const eMap = new Map((examsRes.data ?? []).map((exam) => [exam.id, exam]));
    return (atts ?? []).map((a) => ({
      ...a,
      student_name: pMap.get(a.student_id)?.full_name ?? "",
      student_email: pMap.get(a.student_id)?.email ?? "",
      exam_title: eMap.get(a.exam_id)?.title ?? "",
      exam_total_points: eMap.get(a.exam_id)?.total_points ?? null,
    }));
  });

export const getEssayAttemptForGrading = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ attempt_id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, student_id, objective_score, pending_manual_grading")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!attempt) throw new Error("not_found");

    const [{ data: profile }, { data: exam }, { data: examQuestions }] = await Promise.all([
      supabaseAdmin.from("profiles").select("full_name").eq("id", attempt.student_id).single(),
      supabaseAdmin
        .from("exams")
        .select("title, total_points, passing_score")
        .eq("id", attempt.exam_id)
        .single(),
      supabaseAdmin
        .from("exam_questions")
        .select("question_id, points, sort_order")
        .eq("exam_id", attempt.exam_id)
        .order("sort_order"),
    ]);
    const questionIds = (examQuestions ?? []).map((question) => question.question_id);
    const [{ data: questions }, { data: answers }] = await Promise.all([
      supabaseAdmin
        .from("questions")
        .select("id, prompt, model_answer, type")
        .in("id", questionIds)
        .eq("type", "essay"),
      supabaseAdmin
        .from("attempt_answers")
        .select("question_id, text_answer, awarded_points, teacher_feedback")
        .eq("attempt_id", attempt.id)
        .in("question_id", questionIds),
    ]);
    const questionMap = new Map((questions ?? []).map((question) => [question.id, question]));
    const answerMap = new Map((answers ?? []).map((answer) => [answer.question_id, answer]));
    return {
      attempt,
      student_name: profile?.full_name ?? "",
      exam,
      questions: (examQuestions ?? [])
        .filter((item) => questionMap.has(item.question_id))
        .map((item) => ({
          question_id: item.question_id,
          points: item.points,
          prompt: questionMap.get(item.question_id)?.prompt ?? "",
          model_answer: questionMap.get(item.question_id)?.model_answer ?? "",
          answer: answerMap.get(item.question_id) ?? null,
        })),
    };
  });

export const gradeEssayAttempt = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z
      .object({
        attempt_id: z.string().uuid(),
        grades: z.array(
          z.object({
            question_id: z.string().uuid(),
            awarded_points: z.number().min(0).max(1000),
            teacher_feedback: z.string().trim().max(3000).optional().nullable(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    await requireTeacher(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: attempt } = await supabaseAdmin
      .from("exam_attempts")
      .select("id, exam_id, pending_manual_grading")
      .eq("id", data.attempt_id)
      .maybeSingle();
    if (!attempt?.pending_manual_grading) throw new Error("not_pending_grading");

    const { data: examQuestions } = await supabaseAdmin
      .from("exam_questions")
      .select("question_id, points")
      .eq("exam_id", attempt.exam_id);
    const maxPoints = new Map(
      (examQuestions ?? []).map((item) => [item.question_id, Number(item.points)]),
    );
    for (const grade of data.grades) {
      const maximum = maxPoints.get(grade.question_id);
      if (maximum == null || grade.awarded_points > maximum) throw new Error("invalid_grade");
      const { error } = await supabaseAdmin
        .from("attempt_answers")
        .update({
          awarded_points: grade.awarded_points,
          is_correct: grade.awarded_points === maximum,
          teacher_feedback: grade.teacher_feedback || null,
          graded_by: context.userId,
          graded_at: new Date().toISOString(),
        })
        .eq("attempt_id", attempt.id)
        .eq("question_id", grade.question_id);
      if (error) throw new Error(error.message);
    }

    const [{ data: answers }, { data: exam }] = await Promise.all([
      supabaseAdmin.from("attempt_answers").select("awarded_points").eq("attempt_id", attempt.id),
      supabaseAdmin
        .from("exams")
        .select("total_points, passing_score")
        .eq("id", attempt.exam_id)
        .single(),
    ]);
    const score = (answers ?? []).reduce(
      (sum, answer) => sum + Number(answer.awarded_points ?? 0),
      0,
    );
    const total = Number(exam?.total_points ?? 0);
    const percentage = total ? (score / total) * 100 : 0;
    const passed = percentage >= Number(exam?.passing_score ?? 0);
    await supabaseAdmin
      .from("exam_attempts")
      .update({
        status: "graded",
        score,
        percentage,
        passed,
        pending_manual_grading: false,
      })
      .eq("id", attempt.id);
    return { score, total, percentage, passed };
  });
