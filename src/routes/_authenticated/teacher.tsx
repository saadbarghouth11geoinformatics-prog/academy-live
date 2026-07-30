import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Plus,
  Trash2,
  Users,
  ClipboardList,
  KeyRound,
  Eye,
  CalendarCheck,
  FileText,
  FileUp,
  CheckCircle2,
  AlertTriangle,
  Video,
  ExternalLink,
  CalendarDays,
  Clock3,
  Link2,
  Radio,
  User,
  LayoutDashboard,
  Search,
  TrendingUp,
  GraduationCap,
  BookOpenCheck,
  Activity,
  UserCheck,
  CircleAlert,
  XCircle,
  CircleHelp,
  EyeOff,
  MailCheck,
  Pencil,
  Save,
  ShieldCheck,
  UserCog,
} from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import {
  listLevels,
  listStudents,
  createStudent,
  deleteStudent,
  resetStudentPassword,
  createExam,
  createExamFromPdf,
  listTeacherExams,
  deleteExam,
  listAttemptsForExam,
  listAttendanceSessions,
  createAttendanceSession,
  deleteAttendanceSession,
  getAttendanceForSession,
  getStudentDetails,
  getEssayAttemptForGrading,
  gradeEssayAttempt,
  createLiveLecture,
  listTeacherLectures,
  deleteLiveLecture,
  createOrLinkParent,
  getAttemptReview,
  listPlatformUsers,
  updatePlatformUser,
  deletePlatformUser,
} from "@/lib/academy.functions";
import { parseDocxExam, type ImportedMcqQuestion } from "@/lib/docx-exam-parser";
import { navigateDashboardTab } from "@/lib/dashboard-tabs";

export const Route = createFileRoute("/_authenticated/teacher")({
  component: () => (
    <RoleGuard allow={["teacher", "admin"]}>
      <AppShell title="لوحة المعلم" subtitle="مركز تحكم متكامل لإدارة الطلاب والمحتوى والحضور والنتائج">
        <div className="teacher-workspace space-y-6">
          <section className="teacher-capabilities">
            {[
              {
                icon: Users,
                title: "إدارة الطلاب",
                text: "بيانات كاملة وصلاحيات وتحكم سريع",
                tone: "teacher-capability-blue",
              },
              {
                icon: FileUp,
                title: "محتوى ذكي",
                text: "امتحانات DOCX ومحاضرات مباشرة",
                tone: "teacher-capability-violet",
              },
              {
                icon: CalendarCheck,
                title: "متابعة دقيقة",
                text: "حضور ونتائج وتقارير لكل طالب",
                tone: "teacher-capability-green",
              },
            ].map(({ icon: Icon, title, text, tone }) => (
              <article key={title} className="teacher-capability">
                <span className={tone}><Icon className="h-5 w-5" /></span>
                <div>
                  <strong>{title}</strong>
                  <p>{text}</p>
                </div>
              </article>
            ))}
          </section>

          <Tabs defaultValue="overview" className="dashboard-tabs" dir="rtl" onValueChange={() => navigateDashboardTab(".teacher-tabs")}>
          <TabsList className="teacher-tabs sticky top-[82px] z-20 h-auto w-full flex-nowrap justify-start overflow-x-auto bg-background/85 p-2 backdrop-blur-xl">
            <TabsTrigger value="overview">
              <LayoutDashboard className="ml-2 h-4 w-4" /> نظرة عامة
            </TabsTrigger>
            <TabsTrigger value="students">
              <Users className="ml-2 h-4 w-4" /> الطلاب
            </TabsTrigger>
            <TabsTrigger value="users">
              <UserCog className="ml-2 h-4 w-4" /> كل المستخدمين
            </TabsTrigger>
            <TabsTrigger value="exams">
              <ClipboardList className="ml-2 h-4 w-4" /> الامتحانات
            </TabsTrigger>
            <TabsTrigger value="attendance">
              <CalendarCheck className="ml-2 h-4 w-4" /> الحضور والغياب
            </TabsTrigger>
            <TabsTrigger value="lectures">
              <Video className="ml-2 h-4 w-4" /> المحاضرات
            </TabsTrigger>
            <TabsTrigger value="results">
              <Eye className="ml-2 h-4 w-4" /> النتائج
            </TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
            <TeacherOverview />
          </TabsContent>
          <TabsContent value="students" className="mt-6">
            <StudentsTab />
          </TabsContent>
          <TabsContent value="users" className="mt-6">
            <PlatformUsersTab />
          </TabsContent>
          <TabsContent value="exams" className="mt-6">
            <ExamsTab />
          </TabsContent>
          <TabsContent value="attendance" className="mt-6">
            <AttendanceTab />
          </TabsContent>
          <TabsContent value="lectures" className="mt-6">
            <LecturesTab />
          </TabsContent>
          <TabsContent value="results" className="mt-6">
            <ResultsTab />
          </TabsContent>
          </Tabs>
        </div>
      </AppShell>
    </RoleGuard>
  ),
});

function fmt(d?: string | null) {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" });
  } catch {
    return String(d);
  }
}

function examTiming(exam: any) {
  const now = Date.now();
  const opens = exam?.opens_at ? new Date(exam.opens_at).getTime() : 0;
  const closes = exam?.closes_at ? new Date(exam.closes_at).getTime() : Number.POSITIVE_INFINITY;
  if (exam?.status !== "published") return { key: "draft", label: "مسودة" } as const;
  if (now < opens) return { key: "upcoming", label: "قادم" } as const;
  if (now <= closes) return { key: "active", label: "متاح الآن" } as const;
  return { key: "ended", label: "منتهي" } as const;
}

function TeacherOverview() {
  const studentsFn = useServerFn(listStudents);
  const examsFn = useServerFn(listTeacherExams);
  const lecturesFn = useServerFn(listTeacherLectures);
  const sessionsFn = useServerFn(listAttendanceSessions);
  const students = useQuery({ queryKey: ["students"], queryFn: () => studentsFn() });
  const exams = useQuery({ queryKey: ["teacher-exams"], queryFn: () => examsFn() });
  const lectures = useQuery({ queryKey: ["teacher-lectures"], queryFn: () => lecturesFn() });
  const sessions = useQuery({ queryKey: ["att-sessions"], queryFn: () => sessionsFn() });
  const loading = students.isLoading || exams.isLoading || lectures.isLoading || sessions.isLoading;

  const summary = useMemo(() => {
    const studentRows = students.data ?? [];
    const examRows = exams.data ?? [];
    const lectureRows = lectures.data ?? [];
    const sessionRows = sessions.data ?? [];
    const upcomingLectures = lectureRows
      .filter((lecture: any) => lectureTiming(lecture).key !== "ended")
      .sort((a: any, b: any) => +new Date(a.scheduled_at) - +new Date(b.scheduled_at));
    return {
      students: studentRows.length,
      incomplete: studentRows.filter((student: any) => !student.registration_completed).length,
      attempts: studentRows.reduce((sum: number, student: any) => sum + Number(student.attempts_count || 0), 0),
      exams: examRows.length,
      activeExams: examRows.filter((exam: any) => examTiming(exam).key === "active").length,
      lectures: lectureRows.length,
      upcomingLectures,
      sessions: sessionRows.length,
      attendanceRecords: sessionRows.reduce(
        (sum: number, session: any) =>
          sum + Object.values(session.counts ?? {}).reduce((total: number, value: any) => total + Number(value || 0), 0),
        0,
      ),
    };
  }, [students.data, exams.data, lectures.data, sessions.data]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  const cards = [
    { label: "إجمالي الطلاب", value: summary.students, note: `${summary.incomplete} بياناتهم غير مكتملة`, icon: GraduationCap, tone: "blue" },
    { label: "الامتحانات", value: summary.exams, note: `${summary.activeExams} متاح الآن`, icon: BookOpenCheck, tone: "violet" },
    { label: "المحاولات", value: summary.attempts, note: "إجمالي تسليمات الطلاب", icon: TrendingUp, tone: "green" },
    { label: "جلسات الحضور", value: summary.sessions, note: `${summary.attendanceRecords} حالة مسجلة`, icon: UserCheck, tone: "orange" },
  ];

  return (
    <div className="teacher-overview space-y-6">
      <section className="teacher-overview-hero">
        <div>
          <Badge className="mb-3 bg-white/15 text-white hover:bg-white/20">لوحة القيادة الذكية</Badge>
          <h2>إدارة أسهل، متابعة أدق، ونتائج أفضل</h2>
          <p>أدر طلابك وامتحاناتك ومحاضراتك، وتابع الحضور والنتائج بوضوح من مكان واحد.</p>
        </div>
        <div className="teacher-overview-pulse"><Activity className="h-7 w-7" /><span>النظام يعمل بكفاءة</span></div>
      </section>

      <section className="teacher-kpi-grid">
        {cards.map(({ label, value, note, icon: Icon, tone }) => (
          <article key={label} className={`teacher-kpi teacher-kpi-${tone}`}>
            <span><Icon className="h-5 w-5" /></span>
            <div><p>{label}</p><strong>{value}</strong><small>{note}</small></div>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.15fr_.85fr]">
        <div className="teacher-panel">
          <div className="teacher-panel-heading"><div><h3>المحاضرات القادمة</h3><p>أقرب المواعيد المنشورة للطلاب</p></div><Video className="h-5 w-5 text-primary" /></div>
          <div className="space-y-3">
            {summary.upcomingLectures.length ? summary.upcomingLectures.slice(0, 4).map((lecture: any) => (
              <div key={lecture.id} className="teacher-agenda-item">
                <span className={lectureTiming(lecture).key === "live" ? "is-live" : ""}><CalendarDays className="h-4 w-4" /></span>
                <div className="min-w-0 flex-1"><strong className="block truncate">{lecture.title}</strong><small>{lecture.level_name} · {fmt(lecture.scheduled_at)}</small></div>
                <Badge variant={lectureTiming(lecture).key === "live" ? "destructive" : "secondary"}>{lectureTiming(lecture).label}</Badge>
              </div>
            )) : <p className="py-8 text-center text-sm text-muted-foreground">لا توجد محاضرات قادمة حاليًا.</p>}
          </div>
        </div>

        <div className="teacher-panel">
          <div className="teacher-panel-heading"><div><h3>تنبيهات تحتاج انتباهك</h3><p>نقاط تساعدك على إكمال العمل</p></div><CircleAlert className="h-5 w-5 text-amber-500" /></div>
          <div className="space-y-3">
            <div className="teacher-alert"><span className="bg-amber-500/10 text-amber-600"><Users className="h-4 w-4" /></span><div><strong>{summary.incomplete} طلاب</strong><p>لم يكملوا بيانات التسجيل بعد</p></div></div>
            <div className="teacher-alert"><span className="bg-emerald-500/10 text-emerald-600"><ClipboardList className="h-4 w-4" /></span><div><strong>{summary.activeExams} امتحانات</strong><p>متاحة للطلاب في الوقت الحالي</p></div></div>
            <div className="teacher-alert"><span className="bg-sky-500/10 text-sky-600"><Video className="h-4 w-4" /></span><div><strong>{summary.upcomingLectures.length} محاضرات</strong><p>قادمة أو مباشرة الآن</p></div></div>
          </div>
        </div>
      </section>
    </div>
  );
}

type PlatformRole = "admin" | "teacher" | "student" | "parent";

const platformRoleLabels: Record<PlatformRole, string> = {
  admin: "مدير النظام",
  teacher: "مدرس",
  student: "طالب",
  parent: "ولي أمر",
};

function userInitials(name: string | null | undefined) {
  const parts = String(name ?? "").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "م";
  return `${parts[0]?.[0] ?? ""}${parts.length > 1 ? parts[parts.length - 1]?.[0] ?? "" : ""}`;
}

function PlatformUsersTab() {
  const listFn = useServerFn(listPlatformUsers);
  const users = useQuery({ queryKey: ["platform-users"], queryFn: () => listFn() });
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("all");
  const [status, setStatus] = useState("all");
  const [selected, setSelected] = useState<any | null>(null);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase("ar");
    return (users.data ?? []).filter((user: any) => {
      const matchesSearch =
        !term ||
        [user.full_name, user.username, user.email, user.phone, user.school_name, user.governorate, user.id]
          .some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(term));
      const matchesRole = role === "all" || user.roles.includes(role);
      const matchesStatus = status === "all" || (status === "active" ? !user.is_banned : user.is_banned);
      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users.data, search, role, status]);

  const totals = useMemo(() => ({
    all: users.data?.length ?? 0,
    students: (users.data ?? []).filter((user: any) => user.roles.includes("student")).length,
    parents: (users.data ?? []).filter((user: any) => user.roles.includes("parent")).length,
    staff: (users.data ?? []).filter((user: any) => user.roles.some((item: string) => item === "teacher" || item === "admin")).length,
  }), [users.data]);

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <span className="teacher-section-kicker"><ShieldCheck className="h-4 w-4" /> إدارة آمنة للحسابات</span>
          <h2 className="mt-2 text-2xl font-black">كل مستخدمي المنصة</h2>
          <p className="mt-1 text-sm text-muted-foreground">راجع بيانات الدخول والأدوار، وعدّل أي حساب مباشرة من لوحة المدرس.</p>
        </div>
        <Badge variant="outline" className="w-fit px-3 py-1.5">آخر تحديث: الآن</Badge>
      </div>

      <div className="teacher-users-stats">
        {[
          ["إجمالي الحسابات", totals.all, UserCog, "blue"],
          ["الطلاب", totals.students, GraduationCap, "violet"],
          ["أولياء الأمور", totals.parents, Users, "green"],
          ["فريق الإدارة", totals.staff, ShieldCheck, "amber"],
        ].map(([label, value, Icon, tone]: any) => (
          <article key={label} className={`teacher-users-stat is-${tone}`}>
            <span><Icon className="h-5 w-5" /></span>
            <div><strong>{value}</strong><p>{label}</p></div>
          </article>
        ))}
      </div>

      <div className="teacher-filter-bar">
        <div className="teacher-search-field">
          <Search className="h-4 w-4" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد أو الهاتف أو UID..." />
        </div>
        <Select value={role} onValueChange={setRole}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأدوار</SelectItem>
            {Object.entries(platformRoleLabels).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="active">نشط</SelectItem><SelectItem value="blocked">موقوف</SelectItem></SelectContent>
        </Select>
        <div className="teacher-filter-count">عرض <strong>{filtered.length}</strong> من {users.data?.length ?? 0}</div>
      </div>

      {users.isLoading ? (
        <div className="teacher-users-loading"><Loader2 className="h-7 w-7 animate-spin" /><span>جارٍ تحميل حسابات المنصة...</span></div>
      ) : users.isError ? (
        <div className="teacher-users-error"><CircleAlert /><div><strong>تعذّر تحميل المستخدمين</strong><p>{(users.error as Error)?.message}</p></div></div>
      ) : (
        <div className="teacher-users-table-wrap">
          <table className="teacher-users-table">
            <thead><tr><th>المستخدم</th><th>الدور</th><th>حالة الحساب</th><th>آخر دخول</th><th>التسجيل</th><th>إدارة</th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={6} className="py-12 text-center text-muted-foreground">لا توجد حسابات مطابقة للفلاتر الحالية.</td></tr>
              ) : filtered.map((user: any) => (
                <tr key={user.id} onClick={() => setSelected(user)} className="cursor-pointer">
                  <td data-label="المستخدم">
                    <div className="teacher-user-identity">
                      <span className={`teacher-user-avatar is-${user.roles[0] ?? "student"} ${user.is_banned ? "is-blocked" : ""}`}>{userInitials(user.full_name)}</span>
                      <div className="teacher-user-copy"><strong title={user.full_name}>{user.full_name}</strong><span dir="ltr" title={user.email}>{user.email}</span>{user.username && <small>@{user.username}</small>}</div>
                    </div>
                  </td>
                  <td data-label="الدور"><div className="teacher-user-roles">{user.roles.map((item: PlatformRole) => <span key={item} className={`is-${item}`}>{platformRoleLabels[item]}</span>)}</div></td>
                  <td data-label="حالة الحساب"><span className={`teacher-user-status ${user.is_banned ? "is-blocked" : "is-active"}`}><i />{user.is_banned ? "موقوف" : "نشط"}</span></td>
                  <td data-label="آخر دخول">{fmt(user.last_sign_in_at)}</td>
                  <td data-label="تاريخ التسجيل">{fmt(user.created_at)}</td>
                  <td data-label="إدارة"><Button size="sm" variant="secondary" onClick={(event) => { event.stopPropagation(); setSelected(user); }}><Pencil className="ml-1 h-3.5 w-3.5" /> فتح وتعديل</Button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selected && <PlatformUserDialog key={selected.id} user={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}

function PlatformUserDialog({ user, onClose }: { user: any; onClose: () => void }) {
  const qc = useQueryClient();
  const updateFn = useServerFn(updatePlatformUser);
  const deleteFn = useServerFn(deletePlatformUser);
  const levelsFn = useServerFn(listLevels);
  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelsFn() });
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState({
    full_name: user.full_name ?? "",
    username: user.username ?? "",
    email: user.email ?? "",
    phone: user.phone ?? "",
    password: "",
    roles: [...user.roles] as PlatformRole[],
    active: !user.is_banned,
    level_id: user.level_id ?? null,
    guardian_phone: user.guardian_phone ?? "",
    school_name: user.school_name ?? "",
    governorate: user.governorate ?? "",
  });

  const saveUser = useMutation({
    mutationFn: () => updateFn({ data: { id: user.id, ...form } }),
    onSuccess: async () => {
      toast.success("تم تحديث الحساب وحفظ بياناته بنجاح");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["platform-users"] }),
        qc.invalidateQueries({ queryKey: ["students"] }),
      ]);
      onClose();
    },
    onError: (error: any) => toast.error("تعذّر حفظ الحساب: " + (error?.message ?? "")),
  });
  const removeUser = useMutation({
    mutationFn: () => deleteFn({ data: { id: user.id } }),
    onSuccess: async () => {
      toast.success("تم حذف الحساب من المنصة");
      await qc.invalidateQueries({ queryKey: ["platform-users"] });
      onClose();
    },
    onError: (error: any) => toast.error(error?.message?.includes("cannot_delete_current_user") ? "لا يمكن حذف الحساب الذي تستخدمه الآن." : "تعذّر حذف الحساب: " + (error?.message ?? "")),
  });
  const toggleRole = (role: PlatformRole) => setForm((current) => ({
    ...current,
    roles: current.roles.includes(role)
      ? current.roles.length > 1 ? current.roles.filter((item) => item !== role) : current.roles
      : [...current.roles, role],
  }));
  const isStudent = form.roles.includes("student");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent dir="rtl" className="teacher-user-dialog max-h-[92vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader className="teacher-user-dialog-head">
          <div className="teacher-user-dialog-avatar">{userInitials(form.full_name)}</div>
          <div>
            <DialogTitle>{form.full_name || "بيانات المستخدم"}</DialogTitle>
            <p dir="ltr">{user.id}</p>
          </div>
          <span className={`teacher-user-status ${form.active ? "is-active" : "is-blocked"}`}><i />{form.active ? "حساب نشط" : "حساب موقوف"}</span>
        </DialogHeader>

        <div className="teacher-user-meta-strip">
          <div><span>تاريخ الإنشاء</span><strong>{fmt(user.created_at)}</strong></div>
          <div><span>آخر تسجيل دخول</span><strong>{fmt(user.last_sign_in_at)}</strong></div>
          <div><span>تأكيد البريد</span><strong>{user.email_confirmed ? <><MailCheck className="h-4 w-4" /> مؤكّد</> : "غير مؤكّد"}</strong></div>
          <div><span>طريقة الدخول</span><strong>{user.providers.length ? user.providers.join(" + ") : "Email"}</strong></div>
        </div>

        <section className="teacher-user-form-section">
          <div className="teacher-user-form-title"><UserCog /><div><h3>بيانات الحساب</h3><p>اسم العرض وبيانات تسجيل الدخول الأساسية</p></div></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>الاسم الكامل</Label><Input value={form.full_name} onChange={(event) => setForm({ ...form, full_name: event.target.value })} /></div>
            <div className="space-y-2"><Label>اسم المستخدم</Label><Input dir="ltr" value={form.username} onChange={(event) => setForm({ ...form, username: event.target.value.replace(/\s/g, "") })} placeholder="username" /><p className="text-xs text-muted-foreground">اسم تعريفي داخل المنصة؛ تسجيل الدخول يظل بالبريد.</p></div>
            <div className="space-y-2"><Label>البريد الإلكتروني</Label><Input dir="ltr" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} /></div>
            <div className="space-y-2"><Label>رقم الهاتف</Label><Input dir="ltr" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="01xxxxxxxxx" /></div>
          </div>
        </section>

        <section className="teacher-user-form-section">
          <div className="teacher-user-form-title"><ShieldCheck /><div><h3>الدور والصلاحيات</h3><p>يمكن للحساب امتلاك أكثر من دور</p></div></div>
          <div className="teacher-role-picker">
            {(Object.keys(platformRoleLabels) as PlatformRole[]).map((role) => (
              <button type="button" key={role} className={form.roles.includes(role) ? "is-selected" : ""} onClick={() => toggleRole(role)}>
                <span>{form.roles.includes(role) && <CheckCircle2 />}</span><strong>{platformRoleLabels[role]}</strong>
              </button>
            ))}
          </div>
        </section>

        {isStudent && (
          <section className="teacher-user-form-section">
            <div className="teacher-user-form-title"><GraduationCap /><div><h3>البيانات الدراسية</h3><p>تظهر للطالب وولي الأمر في لوحة المتابعة</p></div></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2"><Label>الصف الدراسي</Label><Select value={form.level_id ?? "none"} onValueChange={(value) => setForm({ ...form, level_id: value === "none" ? null : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">غير محدد</SelectItem>{(levels.data ?? []).map((level: any) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-2"><Label>هاتف ولي الأمر</Label><Input dir="ltr" value={form.guardian_phone} onChange={(event) => setForm({ ...form, guardian_phone: event.target.value })} /></div>
              <div className="space-y-2"><Label>المدرسة</Label><Input value={form.school_name} onChange={(event) => setForm({ ...form, school_name: event.target.value })} /></div>
              <div className="space-y-2"><Label>المحافظة</Label><Input value={form.governorate} onChange={(event) => setForm({ ...form, governorate: event.target.value })} /></div>
            </div>
          </section>
        )}

        <section className="teacher-user-form-section is-security">
          <div className="teacher-user-form-title"><KeyRound /><div><h3>الأمان وكلمة المرور</h3><p>اترك الحقل فارغًا للاحتفاظ بكلمة المرور الحالية</p></div></div>
          <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
            <div className="space-y-2"><Label>كلمة مرور جديدة</Label><div className="relative"><Input className="pl-11" dir="ltr" type={showPassword ? "text" : "password"} value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="8 أحرف على الأقل" /><button type="button" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowPassword(!showPassword)}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button></div></div>
            <Button type="button" variant={form.active ? "outline" : "default"} onClick={() => setForm({ ...form, active: !form.active })}>{form.active ? <><XCircle className="ml-2 h-4 w-4" /> إيقاف الحساب</> : <><CheckCircle2 className="ml-2 h-4 w-4" /> تفعيل الحساب</>}</Button>
          </div>
          <p className="teacher-password-note"><ShieldCheck className="h-4 w-4" /> لا يمكن لأي شخص رؤية كلمة المرور القديمة لأنها محفوظة بصورة مشفّرة؛ يمكنك فقط تعيين كلمة جديدة.</p>
        </section>

        <DialogFooter className="teacher-user-dialog-actions">
          <Button onClick={() => saveUser.mutate()} disabled={saveUser.isPending || form.full_name.trim().length < 2 || !form.email.includes("@") || (form.password.length > 0 && form.password.length < 8)}>
            {saveUser.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Save className="ml-2 h-4 w-4" />} حفظ كل التعديلات
          </Button>
          <Button variant="outline" onClick={onClose}>إلغاء</Button>
          <Button variant="destructive" className="sm:mr-auto" disabled={user.is_current_user || removeUser.isPending} onClick={() => { if (confirm(`سيتم حذف حساب ${user.full_name} وكل البيانات المرتبطة به نهائيًا. هل أنت متأكد؟`)) removeUser.mutate(); }}>
            {removeUser.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : <Trash2 className="ml-2 h-4 w-4" />} حذف الحساب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StudentsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listStudents);
  const levelsFn = useServerFn(listLevels);
  const createFn = useServerFn(createStudent);
  const delFn = useServerFn(deleteStudent);
  const resetFn = useServerFn(resetStudentPassword);
  const parentFn = useServerFn(createOrLinkParent);

  const students = useQuery({ queryKey: ["students"], queryFn: () => listFn() });
  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelsFn() });

  const [open, setOpen] = useState(false);
  const [values, setValues] = useState({ full_name: "", email: "", password: "", level_id: "" });
  const [studentSearch, setStudentSearch] = useState("");
  const [studentLevel, setStudentLevel] = useState("all");
  const [studentStatus, setStudentStatus] = useState("all");
  const filteredStudents = useMemo(() => {
    const term = studentSearch.trim().toLocaleLowerCase("ar");
    return (students.data ?? []).filter((student: any) => {
      const matchesTerm = !term || [student.full_name, student.email, student.school_name, student.governorate]
        .some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(term));
      const matchesLevel = studentLevel === "all" || student.level_id === studentLevel;
      const matchesStatus = studentStatus === "all" ||
        (studentStatus === "complete" ? student.registration_completed : !student.registration_completed);
      return matchesTerm && matchesLevel && matchesStatus;
    });
  }, [students.data, studentSearch, studentLevel, studentStatus]);

  const create = useMutation({
    mutationFn: () => createFn({ data: values }),
    onSuccess: () => {
      toast.success("تم إنشاء حساب الطالب");
      qc.invalidateQueries({ queryKey: ["students"] });
      setOpen(false);
      setValues({ full_name: "", email: "", password: "", level_id: values.level_id });
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف الطالب");
      qc.invalidateQueries({ queryKey: ["students"] });
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });

  const [resetting, setResetting] = useState<{ id: string; name: string } | null>(null);
  const [newPass, setNewPass] = useState("");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [parentStudent, setParentStudent] = useState<{ id: string; name: string } | null>(null);
  const [parentForm, setParentForm] = useState({
    full_name: "",
    email: "",
    password: "",
    relationship: "father" as "father" | "mother" | "guardian" | "other",
  });
  const resetPw = useMutation({
    mutationFn: () => resetFn({ data: { id: resetting!.id, password: newPass } }),
    onSuccess: () => {
      toast.success("تم تغيير كلمة المرور");
      setResetting(null);
      setNewPass("");
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });
  const saveParent = useMutation({
    mutationFn: () =>
      parentFn({
        data: {
          student_id: parentStudent!.id,
          ...parentForm,
        },
      }),
    onSuccess: () => {
      toast.success("تم إنشاء وربط حساب ولي الأمر بالطالب");
      setParentStudent(null);
      setParentForm({ full_name: "", email: "", password: "", relationship: "father" });
    },
    onError: (error: any) =>
      toast.error(
        error?.message?.includes("email_belongs_to_another_account_type")
          ? "هذا البريد مستخدم بالفعل لحساب طالب أو مدرس. استخدم بريدًا آخر لولي الأمر."
          : "تعذّر ربط ولي الأمر: " + (error?.message ?? ""),
      ),
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-extrabold">إدارة الطلاب</h2><p className="text-sm text-muted-foreground">بيانات الطلاب والحسابات وأولياء الأمور من شاشة واحدة.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" /> إضافة طالب
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>طالب جديد</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>الصف الدراسي</Label>
                <Select
                  value={values.level_id}
                  onValueChange={(v) => setValues((s) => ({ ...s, level_id: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels.data ?? []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>الاسم الكامل</Label>
                <Input
                  value={values.full_name}
                  onChange={(e) => setValues((s) => ({ ...s, full_name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>البريد الإلكتروني</Label>
                <Input
                  dir="ltr"
                  type="email"
                  value={values.email}
                  onChange={(e) => setValues((s) => ({ ...s, email: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>كلمة المرور</Label>
                <Input
                  dir="ltr"
                  value={values.password}
                  onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))}
                />
                <p className="text-xs text-muted-foreground">
                  شارك هذه البيانات مع الطالب وولي أمره.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={
                  create.isPending ||
                  !values.level_id ||
                  !values.full_name ||
                  !values.email ||
                  values.password.length < 6
                }
              >
                {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="teacher-filter-bar">
        <div className="teacher-search-field">
          <Search className="h-4 w-4" />
          <Input value={studentSearch} onChange={(event) => setStudentSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد أو المدرسة..." />
        </div>
        <Select value={studentLevel} onValueChange={setStudentLevel}>
          <SelectTrigger><SelectValue placeholder="كل الصفوف" /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{(levels.data ?? []).map((level: any) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={studentStatus} onValueChange={setStudentStatus}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="all">كل حالات التسجيل</SelectItem><SelectItem value="complete">بيانات مكتملة</SelectItem><SelectItem value="incomplete">بيانات غير مكتملة</SelectItem></SelectContent>
        </Select>
        <div className="teacher-filter-count">عرض <strong>{filteredStudents.length}</strong> من {students.data?.length ?? 0}</div>
      </div>

      {students.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-border bg-card">
          <table className="min-w-[920px] w-full text-sm">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-right">الاسم</th>
                <th className="px-4 py-3 text-right">البريد</th>
                <th className="px-4 py-3 text-right">الصف</th>
                <th className="px-4 py-3 text-right">حالة البيانات</th>
                <th className="px-4 py-3 text-right">امتحانات مقدمة</th>
                <th className="px-4 py-3 text-right">إجراءات</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
                    لا توجد نتائج مطابقة للفلاتر الحالية.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((s: any) => (
                  <tr key={s.id} className="border-t border-border transition hover:bg-muted/30">
                    <td className="px-4 py-3 font-medium">{s.full_name}</td>
                    <td className="px-4 py-3" dir="ltr">
                      {s.email}
                    </td>
                    <td className="px-4 py-3">{s.level_name ?? "—"}</td>
                    <td className="px-4 py-3"><Badge variant={s.registration_completed ? "default" : "secondary"}>{s.registration_completed ? "مكتملة" : "تحتاج استكمال"}</Badge></td>
                    <td className="px-4 py-3">{s.attempts_count}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <Button size="sm" variant="secondary" onClick={() => setDetailId(s.id)}>
                          <User className="ml-1 h-3.5 w-3.5" /> التفاصيل
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setResetting({ id: s.id, name: s.full_name })}
                        >
                          <KeyRound className="ml-1 h-3.5 w-3.5" /> كلمة المرور
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setParentStudent({ id: s.id, name: s.full_name })}
                        >
                          <Users className="ml-1 h-3.5 w-3.5" /> ولي الأمر
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            if (confirm(`حذف ${s.full_name}؟`)) del.mutate(s.id);
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={!!resetting} onOpenChange={(v) => !v && setResetting(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>تغيير كلمة مرور {resetting?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>كلمة المرور الجديدة</Label>
            <Input dir="ltr" value={newPass} onChange={(e) => setNewPass(e.target.value)} />
          </div>
          <DialogFooter>
            <Button
              onClick={() => resetPw.mutate()}
              disabled={newPass.length < 6 || resetPw.isPending}
            >
              {resetPw.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} حفظ
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!parentStudent} onOpenChange={(value) => !value && setParentStudent(null)}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>حساب ولي أمر {parentStudent?.name}</DialogTitle>
          </DialogHeader>
          <div className="rounded-xl border border-primary/15 bg-primary/5 p-3 text-xs leading-6 text-muted-foreground">
            ولي الأمر سيدخل بالبريد وكلمة المرور ويشاهد ملف الطالب ونتائجه وحضوره ومحاضراته، بدون صلاحية حل الامتحانات.
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>اسم ولي الأمر</Label>
              <Input value={parentForm.full_name} onChange={(event) => setParentForm({ ...parentForm, full_name: event.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>صلة القرابة</Label>
              <Select value={parentForm.relationship} onValueChange={(value: any) => setParentForm({ ...parentForm, relationship: value })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="father">الأب</SelectItem>
                  <SelectItem value="mother">الأم</SelectItem>
                  <SelectItem value="guardian">ولي أمر</SelectItem>
                  <SelectItem value="other">أخرى</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>البريد الإلكتروني</Label>
              <Input dir="ltr" type="email" value={parentForm.email} onChange={(event) => setParentForm({ ...parentForm, email: event.target.value })} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label>كلمة المرور</Label>
              <Input dir="ltr" type="password" value={parentForm.password} onChange={(event) => setParentForm({ ...parentForm, password: event.target.value })} />
              <p className="text-xs text-muted-foreground">8 أحرف على الأقل. شارك البيانات مع ولي الأمر بطريقة آمنة.</p>
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => saveParent.mutate()}
              disabled={saveParent.isPending || parentForm.full_name.trim().length < 3 || !parentForm.email.includes("@") || parentForm.password.length < 8}
            >
              {saveParent.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
              إنشاء وربط الحساب
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <StudentDetailDialog studentId={detailId} onClose={() => setDetailId(null)} />
    </div>
  );
}

type QuestionType = "mcq_single" | "mcq_multi" | "true_false" | "short_answer" | "essay";
type DraftQ = {
  type: QuestionType;
  prompt: string;
  points: number;
  options: { label: string; is_correct: boolean }[];
  model_answer: string;
  accepted_answers: string[];
};

function ExamsTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTeacherExams);
  const levelsFn = useServerFn(listLevels);
  const createFn = useServerFn(createExam);
  const delFn = useServerFn(deleteExam);
  const exams = useQuery({ queryKey: ["teacher-exams"], queryFn: () => listFn() });
  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelsFn() });
  const [examSearch, setExamSearch] = useState("");
  const [examLevel, setExamLevel] = useState("all");
  const [examStatus, setExamStatus] = useState("all");
  const filteredExams = useMemo(() => {
    const term = examSearch.trim().toLocaleLowerCase("ar");
    return (exams.data ?? []).filter((exam: any) => {
      const timing = examTiming(exam).key;
      return (!term || String(exam.title).toLocaleLowerCase("ar").includes(term)) &&
        (examLevel === "all" || exam.level_name === examLevel) &&
        (examStatus === "all" || timing === examStatus);
    });
  }, [exams.data, examSearch, examLevel, examStatus]);

  const [open, setOpen] = useState(false);
  const empty = (): DraftQ => ({
    type: "mcq_single",
    prompt: "",
    points: 1,
    model_answer: "",
    accepted_answers: [],
    options: [
      { label: "", is_correct: true },
      { label: "", is_correct: false },
      { label: "", is_correct: false },
      { label: "", is_correct: false },
    ],
  });
  const nowIso = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    [],
  );
  const laterIso = useMemo(
    () =>
      new Date(Date.now() + 7 * 24 * 3600 * 1000 - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    [],
  );
  const [form, setForm] = useState<{
    title: string;
    instructions: string;
    level_id: string;
    duration_minutes: number;
    opens_at: string;
    closes_at: string;
    passing_score: number;
    questions: DraftQ[];
  }>({
    title: "",
    instructions: "",
    level_id: "",
    duration_minutes: 30,
    opens_at: nowIso,
    closes_at: laterIso,
    passing_score: 50,
    questions: [empty()],
  });

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: form.title,
          instructions: form.instructions || null,
          level_id: form.level_id,
          duration_minutes: form.duration_minutes,
          opens_at: new Date(form.opens_at).toISOString(),
          closes_at: new Date(form.closes_at).toISOString(),
          passing_score: form.passing_score,
          questions: form.questions,
        },
      }),
    onSuccess: () => {
      toast.success("تم نشر الامتحان");
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
      setOpen(false);
      setForm((f) => ({ ...f, title: "", instructions: "", questions: [empty()] }));
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });

  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
    },
  });

  function updateQ(i: number, patch: Partial<DraftQ>) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, idx) => (idx === i ? { ...q, ...patch } : q)),
    }));
  }
  function updateOpt(qi: number, oi: number, patch: Partial<DraftQ["options"][number]>) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, j) => (j === oi ? { ...o, ...patch } : o)),
            },
      ),
    }));
  }
  function setCorrect(qi: number, oi: number) {
    setForm((f) => ({
      ...f,
      questions: f.questions.map((q, i) =>
        i !== qi
          ? q
          : {
              ...q,
              options: q.options.map((o, j) => ({
                ...o,
                is_correct:
                  q.type === "mcq_multi" ? (j === oi ? !o.is_correct : o.is_correct) : j === oi,
              })),
            },
      ),
    }));
  }

  function changeQuestionType(qi: number, type: QuestionType) {
    const options =
      type === "true_false"
        ? [
            { label: "صح", is_correct: true },
            { label: "خطأ", is_correct: false },
          ]
        : type === "short_answer" || type === "essay"
          ? []
          : [
              { label: "", is_correct: true },
              { label: "", is_correct: false },
              { label: "", is_correct: false },
              { label: "", is_correct: false },
            ];
    updateQ(qi, { type, options });
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-extrabold">إدارة الامتحانات</h2><p className="text-sm text-muted-foreground">أنشئ الامتحان وتابع إتاحته ومحاولات الطلاب.</p></div>
        <div className="flex gap-2">
          <DocxExamDialog levels={levels.data ?? []} />
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="ml-2 h-4 w-4" /> إضافة MCQ يدوي
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
              <DialogHeader>
                <DialogTitle>إنشاء امتحان MCQ يدوي</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>العنوان</Label>
                    <Input
                      value={form.title}
                      onChange={(e) => setForm({ ...form, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الصف</Label>
                    <Select
                      value={form.level_id}
                      onValueChange={(v) => setForm({ ...form, level_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="اختر" />
                      </SelectTrigger>
                      <SelectContent>
                        {(levels.data ?? []).map((l: any) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>المدة (دقيقة)</Label>
                    <Input
                      type="number"
                      min={1}
                      value={form.duration_minutes}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          duration_minutes: Math.max(1, Number(e.target.value) || 0),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>الحد الأدنى للنجاح (%)</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={form.passing_score}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          passing_score: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                        })
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>يفتح في</Label>
                    <Input
                      dir="ltr"
                      type="datetime-local"
                      value={form.opens_at}
                      onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>يغلق في</Label>
                    <Input
                      dir="ltr"
                      type="datetime-local"
                      value={form.closes_at}
                      onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>التعليمات (اختياري)</Label>
                  <Textarea
                    value={form.instructions}
                    onChange={(e) => setForm({ ...form, instructions: e.target.value })}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold">الأسئلة ({form.questions.length})</h4>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() =>
                        setForm((f) => ({ ...f, questions: [...f.questions, empty()] }))
                      }
                    >
                      <Plus className="ml-1 h-3.5 w-3.5" /> إضافة سؤال
                    </Button>
                  </div>
                  {form.questions.map((q, qi) => (
                    <div key={qi} className="teacher-question-builder space-y-3 rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-2">
                        <span className="text-sm font-medium">سؤال {qi + 1}</span>
                        {form.questions.length > 1 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              setForm((f) => ({
                                ...f,
                                questions: f.questions.filter((_, i) => i !== qi),
                              }))
                            }
                          >
                            <Trash2 className="h-3.5 w-3.5 text-destructive" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2 md:grid-cols-[1fr_170px_120px]">
                        <Textarea
                          placeholder="نص السؤال"
                          value={q.prompt}
                          onChange={(e) => updateQ(qi, { prompt: e.target.value })}
                        />
                        <div>
                          <Label className="mb-1 text-xs">نوع السؤال</Label>
                          <Select
                            value={q.type}
                            onValueChange={(value) => changeQuestionType(qi, value as QuestionType)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mcq_single">اختيار واحد</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="mb-1 text-xs">الدرجة</Label>
                          <Input
                            type="number"
                            min={1}
                            value={q.points}
                            onChange={(e) =>
                              updateQ(qi, { points: Math.max(1, Number(e.target.value) || 1) })
                            }
                          />
                        </div>
                      </div>
                      {q.type === "short_answer" && (
                        <div className="space-y-2">
                          <Label>الإجابات المقبولة</Label>
                          <Input
                            value={q.accepted_answers.join("، ")}
                            onChange={(event) =>
                              updateQ(qi, {
                                accepted_answers: event.target.value
                                  .split(/[,،]/)
                                  .map((answer) => answer.trim())
                                  .filter(Boolean),
                              })
                            }
                            placeholder="مثال: القاهرة، القاهره"
                          />
                          <p className="text-xs text-muted-foreground">
                            افصل بين الإجابات الصحيحة بفاصلة.
                          </p>
                        </div>
                      )}
                      {q.type === "essay" && (
                        <div className="space-y-2">
                          <Label>الإجابة النموذجية للمدرس</Label>
                          <Textarea
                            value={q.model_answer}
                            onChange={(event) => updateQ(qi, { model_answer: event.target.value })}
                            rows={5}
                            placeholder="اكتب عناصر الإجابة التي ستراجع على أساسها إجابة الطالب"
                          />
                        </div>
                      )}
                      {!["short_answer", "essay"].includes(q.type) && (
                        <div className="teacher-question-options space-y-2">
                          {q.options.map((o, oi) => (
                            <div key={oi} className="flex items-center gap-2">
                              <input
                                type={q.type === "mcq_multi" ? "checkbox" : "radio"}
                                name={`q${qi}`}
                                checked={o.is_correct}
                                onChange={() => setCorrect(qi, oi)}
                                className="h-4 w-4 accent-primary"
                              />
                              <Input
                                placeholder={`اختيار ${oi + 1}`}
                                value={o.label}
                                onChange={(e) => updateOpt(qi, oi, { label: e.target.value })}
                              />
                              {q.options.length > 2 && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() =>
                                    updateQ(qi, { options: q.options.filter((_, j) => j !== oi) })
                                  }
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                            </div>
                          ))}
                          {q.type !== "true_false" && q.options.length < 6 && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() =>
                                updateQ(qi, {
                                  options: [...q.options, { label: "", is_correct: false }],
                                })
                              }
                            >
                              <Plus className="ml-1 h-3.5 w-3.5" /> إضافة اختيار
                            </Button>
                          )}
                          <div className="teacher-answer-key">
                            <span className="teacher-answer-key-icon"><CheckCircle2 /></span>
                            <div className="teacher-answer-key-copy">
                              <Label>الإجابة الصحيحة</Label>
                              <p>اختر الإجابة التي سيتم التصحيح عليها تلقائيًا</p>
                            </div>
                            <Select
                              value={String(Math.max(q.options.findIndex((option) => option.is_correct), 0))}
                              onValueChange={(value) => setCorrect(qi, Number(value))}
                            >
                              <SelectTrigger className="teacher-answer-key-select">
                                <SelectValue placeholder="حدد الإجابة الصحيحة" />
                              </SelectTrigger>
                              <SelectContent>
                                {q.options.map((option, optionIndex) => (
                                  <SelectItem key={optionIndex} value={String(optionIndex)}>
                                    {option.label.trim() || `اختيار ${optionIndex + 1}`}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    create.isPending ||
                    !form.title ||
                    !form.level_id ||
                    form.questions.some(
                      (q) =>
                        !q.prompt ||
                        (["mcq_single", "mcq_multi", "true_false"].includes(q.type) &&
                          q.options.some((o) => !o.label)) ||
                        (q.type === "short_answer" && !q.accepted_answers.length) ||
                        (q.type === "essay" && !q.model_answer.trim()),
                    )
                  }
                >
                  {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} نشر
                  الامتحان
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="teacher-filter-bar">
        <div className="teacher-search-field"><Search className="h-4 w-4" /><Input value={examSearch} onChange={(event) => setExamSearch(event.target.value)} placeholder="ابحث باسم الامتحان..." /></div>
        <Select value={examLevel} onValueChange={setExamLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{(levels.data ?? []).map((level: any) => <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>)}</SelectContent></Select>
        <Select value={examStatus} onValueChange={setExamStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="active">متاح الآن</SelectItem><SelectItem value="upcoming">قادم</SelectItem><SelectItem value="ended">منتهي</SelectItem><SelectItem value="draft">مسودة</SelectItem></SelectContent></Select>
        <div className="teacher-filter-count">عرض <strong>{filteredExams.length}</strong> من {exams.data?.length ?? 0}</div>
      </div>

      {exams.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredExams.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              لا توجد امتحانات مطابقة للفلاتر الحالية.
            </div>
          ) : (
            filteredExams.map((e: any) => (
              <div key={e.id} className="teacher-resource-card">
                <div className="mb-2 flex items-start justify-between">
                  <h3 className="font-bold">{e.title}</h3>
                  <div className="flex gap-2"><Badge variant="secondary">{e.level_name}</Badge><Badge variant={examTiming(e).key === "active" ? "default" : "outline"}>{examTiming(e).label}</Badge></div>
                </div>
                <div className="space-y-1 text-sm text-muted-foreground">
                  <div>
                    المدة: {e.duration_minutes} دقيقة · الدرجة: {e.total_points}
                  </div>
                  <div>يفتح: {fmt(e.opens_at)}</div>
                  <div>يغلق: {fmt(e.closes_at)}</div>
                  <div>محاولات مسجلة: {e.attempts_count}</div>
                </div>
                <div className="mt-3 flex justify-end">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("حذف الامتحان؟")) del.mutate(e.id);
                    }}
                  >
                    <Trash2 className="ml-1 h-3.5 w-3.5 text-destructive" /> حذف
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function ResultsTab() {
  const listExamsFn = useServerFn(listTeacherExams);
  const listAttFn = useServerFn(listAttemptsForExam);
  const exams = useQuery({ queryKey: ["teacher-exams"], queryFn: () => listExamsFn() });
  const [examId, setExamId] = useState<string>("all");
  const [studentId, setStudentId] = useState<string>("all");
  const [gradingId, setGradingId] = useState<string | null>(null);
  const [reviewId, setReviewId] = useState<string | null>(null);
  const [resultSearch, setResultSearch] = useState("");
  const [resultStatus, setResultStatus] = useState("all");
  const atts = useQuery({
    queryKey: ["exam-attempts", examId],
    queryFn: () => listAttFn({ data: { exam_id: examId === "all" ? null : examId } }),
  });
  const students = useMemo(() => {
    const unique = new Map<string, { id: string; name: string }>();
    for (const attempt of atts.data ?? []) {
      unique.set(attempt.student_id, {
        id: attempt.student_id,
        name: attempt.student_name || attempt.student_email || "طالب بدون اسم",
      });
    }
    return [...unique.values()].sort((a, b) => a.name.localeCompare(b.name, "ar"));
  }, [atts.data]);
  const filteredAttempts = useMemo(() => {
    const term = resultSearch.trim().toLocaleLowerCase("ar");
    return (atts.data ?? []).filter((attempt: any) => {
      const matchesTerm = !term || [attempt.student_name, attempt.student_email].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(term));
      const state = attempt.pending_manual_grading ? "pending" : attempt.status === "in_progress" ? "progress" : attempt.passed ? "passed" : "failed";
      const matchesStudent = studentId === "all" || attempt.student_id === studentId;
      return matchesTerm && matchesStudent && (resultStatus === "all" || resultStatus === state);
    });
  }, [atts.data, resultSearch, resultStatus, studentId]);
  const gradedAttempts = filteredAttempts.filter((attempt: any) => attempt.percentage != null);
  const averageResult = gradedAttempts.length
    ? Math.round(gradedAttempts.reduce((sum: number, attempt: any) => sum + Number(attempt.percentage || 0), 0) / gradedAttempts.length)
    : 0;

  return (
    <div className="space-y-5">
      <div><h2 className="text-xl font-extrabold">النتائج والتصحيح</h2><p className="text-sm text-muted-foreground">راجع أداء الطلاب وصحّح الأسئلة المقالية واعتمد النتائج.</p></div>
      <div className="teacher-filter-bar">
        <div className="space-y-1">
        <Label className="text-xs">الامتحان</Label>
        <Select value={examId} onValueChange={(value) => { setExamId(value); setStudentId("all"); }}>
          <SelectTrigger>
            <SelectValue placeholder="—" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الامتحانات</SelectItem>
            {(exams.data ?? []).map((e: any) => (
              <SelectItem key={e.id} value={e.id}>
                {e.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        </div>
        <Select value={studentId} onValueChange={setStudentId}><SelectTrigger><SelectValue placeholder="كل الطلاب" /></SelectTrigger><SelectContent><SelectItem value="all">كل الطلاب</SelectItem>{students.map((student) => <SelectItem key={student.id} value={student.id}>{student.name}</SelectItem>)}</SelectContent></Select>
        <div className="teacher-search-field"><Search className="h-4 w-4" /><Input value={resultSearch} onChange={(event) => setResultSearch(event.target.value)} placeholder="ابحث بالاسم أو البريد..." /></div>
        <Select value={resultStatus} onValueChange={setResultStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل النتائج</SelectItem><SelectItem value="passed">ناجح</SelectItem><SelectItem value="failed">لم ينجح</SelectItem><SelectItem value="pending">ينتظر التصحيح</SelectItem><SelectItem value="progress">قيد الحل</SelectItem></SelectContent></Select>
      </div>
      {!atts.isLoading && <div className="teacher-mini-stats"><div><strong>{filteredAttempts.length}</strong><span>نتيجة ظاهرة</span></div><div><strong>{averageResult}%</strong><span>متوسط النتيجة</span></div><div><strong>{filteredAttempts.filter((a: any) => a.passed).length}</strong><span>ناجح</span></div><div><strong>{filteredAttempts.filter((a: any) => a.pending_manual_grading).length}</strong><span>ينتظر التصحيح</span></div></div>}
      {atts.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="min-w-[800px] w-full text-sm">
              <thead className="bg-muted/50 text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 text-right">الطالب</th>
                  <th className="px-4 py-3 text-right">الامتحان</th>
                  <th className="px-4 py-3 text-right">البريد</th>
                  <th className="px-4 py-3 text-right">الدرجة</th>
                  <th className="px-4 py-3 text-right">النسبة</th>
                  <th className="px-4 py-3 text-right">الحالة</th>
                  <th className="px-4 py-3 text-right">تاريخ التسليم</th>
                  <th className="px-4 py-3 text-right">التفاصيل</th>
                </tr>
              </thead>
              <tbody>
                {filteredAttempts.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      لا توجد نتائج مطابقة للفلاتر الحالية.
                    </td>
                  </tr>
                ) : (
                  filteredAttempts.map((a: any) => (
                    <tr key={a.id} className="border-t border-border transition hover:bg-muted/30">
                      <td className="px-4 py-3 font-medium">{a.student_name}</td>
                      <td className="px-4 py-3 font-medium text-primary">{a.exam_title}</td>
                      <td className="px-4 py-3" dir="ltr">
                        {a.student_email}
                      </td>
                      <td className="px-4 py-3">{a.score ?? "—"}</td>
                      <td className="px-4 py-3">
                        {a.percentage != null ? Math.round(a.percentage) + "%" : "—"}
                      </td>
                      <td className="px-4 py-3">
                        {a.pending_manual_grading ? (
                          <Button size="sm" onClick={() => setGradingId(a.id)}>
                            تصحيح المقالي
                          </Button>
                        ) : a.passed ? (
                          <Badge>نجح</Badge>
                        ) : a.status === "in_progress" ? (
                          <Badge variant="outline">قيد التقدم</Badge>
                        ) : (
                          <Badge variant="destructive">لم ينجح</Badge>
                        )}
                      </td>
                      <td className="px-4 py-3">{fmt(a.submitted_at ?? a.started_at)}</td>
                      <td className="px-4 py-3">
                        <Button size="sm" variant="outline" disabled={a.status === "in_progress"} onClick={() => setReviewId(a.id)}>
                          <Eye className="ml-1 h-4 w-4" /> {a.status === "in_progress" ? "لم يسلّم" : "عرض الإجابات"}
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      <AttemptReviewDialog attemptId={reviewId} onClose={() => setReviewId(null)} />
      <EssayGradingDialog
        attemptId={gradingId}
        onClose={() => setGradingId(null)}
        onGraded={() => {
          setGradingId(null);
          atts.refetch();
        }}
      />
    </div>
  );
}

function AttemptReviewDialog({
  attemptId,
  onClose,
}: {
  attemptId: string | null;
  onClose: () => void;
}) {
  const reviewFn = useServerFn(getAttemptReview);
  const review = useQuery({
    queryKey: ["teacher-attempt-review", attemptId],
    enabled: !!attemptId,
    queryFn: () => reviewFn({ data: { attempt_id: attemptId! } }),
  });

  const questions = review.data?.questions ?? [];
  const correctCount = questions.filter((question: any) => question.answer?.is_correct === true).length;
  const wrongCount = questions.filter((question: any) => question.answer?.is_correct === false).length;
  const pendingCount = questions.filter((question: any) => question.answer?.is_correct == null).length;

  return (
    <Dialog open={!!attemptId} onOpenChange={(openValue) => !openValue && onClose()}>
      <DialogContent className="teacher-review-dialog" dir="rtl">
        <DialogHeader>
          <DialogTitle className="teacher-review-title">
            <span className="teacher-review-title-icon"><ClipboardList /></span>
            <span>
              مراجعة إجابات الطالب
              <small>{review.data?.exam?.title ?? "جاري تحميل الامتحان..."}</small>
            </span>
          </DialogTitle>
        </DialogHeader>

        {review.isLoading ? (
          <div className="teacher-review-loading"><Loader2 className="h-8 w-8 animate-spin" /><span>بنجهّز تقرير الإجابات...</span></div>
        ) : review.isError ? (
          <div className="teacher-review-error"><CircleAlert /><span>تعذّر تحميل تفاصيل المحاولة. حاول مرة أخرى.</span></div>
        ) : review.data ? (
          <div className="teacher-review-body">
            <div className="teacher-review-summary">
              <div className="teacher-review-score">
                <strong>{review.data.attempt.percentage != null ? `${Math.round(review.data.attempt.percentage)}%` : "—"}</strong>
                <span>{review.data.attempt.score ?? 0} من {review.data.exam?.total_points ?? 0} درجة</span>
              </div>
              <div className="teacher-review-stat is-correct"><CheckCircle2 /><strong>{correctCount}</strong><span>إجابة صحيحة</span></div>
              <div className="teacher-review-stat is-wrong"><XCircle /><strong>{wrongCount}</strong><span>إجابة خاطئة</span></div>
              <div className="teacher-review-stat is-pending"><CircleHelp /><strong>{pendingCount}</strong><span>بدون تصحيح</span></div>
            </div>

            <div className="teacher-review-questions">
              {questions.map((question: any, index: number) => {
                const answer = question.answer;
                const selectedIds = answer?.selected_option_ids ?? [];
                const isManual = question.requires_manual_grading || question.type === "essay";
                const status = answer?.is_correct === true ? "correct" : answer?.is_correct === false ? "wrong" : "pending";
                const correctOptions = question.options.filter((option: any) => option.is_correct);
                return (
                  <article key={question.question_id} className={`teacher-review-question is-${status}`}>
                    <div className="teacher-review-question-head">
                      <span className="teacher-review-number">{index + 1}</span>
                      <div><h3>{question.prompt}</h3><p>{question.points} درجة</p></div>
                      <span className={`teacher-review-status is-${status}`}>
                        {status === "correct" ? <><CheckCircle2 /> صحيحة</> : status === "wrong" ? <><XCircle /> خاطئة</> : <><CircleHelp /> {isManual ? "تحتاج تصحيح" : "لم يُجب"}</>}
                      </span>
                    </div>

                    {question.options.length > 0 ? (
                      <div className="teacher-review-options">
                        {question.options.map((option: any) => {
                          const selected = selectedIds.includes(option.id);
                          return (
                            <div key={option.id} className={`teacher-review-option${option.is_correct ? " is-answer" : ""}${selected ? " is-selected" : ""}${selected && !option.is_correct ? " is-selected-wrong" : ""}`}>
                              <span className="teacher-review-option-mark">{option.is_correct ? <CheckCircle2 /> : selected ? <XCircle /> : <span />}</span>
                              <span>{option.label}</span>
                              <div className="teacher-review-option-tags">
                                {selected && <em>اختيار الطالب</em>}
                                {option.is_correct && <em>الإجابة الصحيحة</em>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="teacher-review-text-answers">
                        <div><span>إجابة الطالب</span><p>{answer?.text_answer || "لم يكتب إجابة"}</p></div>
                        {!isManual && question.accepted_answers?.length > 0 && <div className="is-model-answer"><span>الإجابة الصحيحة</span><p>{question.accepted_answers.join("، ")}</p></div>}
                        {answer?.teacher_feedback && <div className="is-feedback"><span>ملاحظة المدرس</span><p>{answer.teacher_feedback}</p></div>}
                      </div>
                    )}

                    <div className="teacher-review-points">
                      الدرجة المستحقة: <strong>{answer?.awarded_points ?? 0}</strong> من {question.points}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

function EssayGradingDialog({
  attemptId,
  onClose,
  onGraded,
}: {
  attemptId: string | null;
  onClose: () => void;
  onGraded: () => void;
}) {
  const getFn = useServerFn(getEssayAttemptForGrading);
  const gradeFn = useServerFn(gradeEssayAttempt);
  const [grades, setGrades] = useState<
    Record<string, { awarded_points: number; teacher_feedback: string }>
  >({});
  const attempt = useQuery({
    queryKey: ["essay-grading", attemptId],
    enabled: !!attemptId,
    queryFn: () => getFn({ data: { attempt_id: attemptId! } }),
  });

  useEffect(() => {
    if (!attempt.data) return;
    setGrades(
      Object.fromEntries(
        attempt.data.questions.map((question: any) => [
          question.question_id,
          {
            awarded_points: Number(question.answer?.awarded_points ?? 0),
            teacher_feedback: question.answer?.teacher_feedback ?? "",
          },
        ]),
      ),
    );
  }, [attempt.data]);

  const submit = useMutation({
    mutationFn: () =>
      gradeFn({
        data: {
          attempt_id: attemptId!,
          grades: (attempt.data?.questions ?? []).map((question: any) => ({
            question_id: question.question_id,
            awarded_points: grades[question.question_id]?.awarded_points ?? 0,
            teacher_feedback: grades[question.question_id]?.teacher_feedback || null,
          })),
        },
      }),
    onSuccess: (result) => {
      toast.success(`تم اعتماد النتيجة: ${result.score}/${result.total}`);
      onGraded();
    },
    onError: (error: any) => toast.error("تعذر حفظ التصحيح: " + (error?.message ?? "")),
  });

  return (
    <Dialog open={!!attemptId} onOpenChange={(openValue) => !openValue && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            تصحيح إجابة {attempt.data?.student_name ?? "الطالب"} — {attempt.data?.exam?.title ?? ""}
          </DialogTitle>
        </DialogHeader>
        {attempt.isLoading ? (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {(attempt.data?.questions ?? []).map((question: any, index: number) => (
              <div
                key={question.question_id}
                className="space-y-3 rounded-xl border border-border p-4"
              >
                <div className="flex justify-between gap-3">
                  <h4 className="font-bold">
                    س{index + 1}. {question.prompt}
                  </h4>
                  <Badge variant="secondary">من {question.points}</Badge>
                </div>
                <div className="rounded-lg bg-muted/40 p-3">
                  <p className="mb-1 text-xs font-bold text-muted-foreground">إجابة الطالب</p>
                  <p className="whitespace-pre-wrap">{question.answer?.text_answer || "لم يجب"}</p>
                </div>
                <div className="rounded-lg border border-primary/15 bg-primary/5 p-3">
                  <p className="mb-1 text-xs font-bold text-primary">الإجابة النموذجية</p>
                  <p className="whitespace-pre-wrap">{question.model_answer}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-[140px_1fr]">
                  <div className="space-y-2">
                    <Label>الدرجة</Label>
                    <Input
                      type="number"
                      min={0}
                      max={question.points}
                      value={grades[question.question_id]?.awarded_points ?? 0}
                      onChange={(event) =>
                        setGrades((current) => ({
                          ...current,
                          [question.question_id]: {
                            awarded_points: Math.min(
                              Number(question.points),
                              Math.max(0, Number(event.target.value) || 0),
                            ),
                            teacher_feedback: current[question.question_id]?.teacher_feedback ?? "",
                          },
                        }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ملاحظة للطالب</Label>
                    <Input
                      value={grades[question.question_id]?.teacher_feedback ?? ""}
                      onChange={(event) =>
                        setGrades((current) => ({
                          ...current,
                          [question.question_id]: {
                            awarded_points: current[question.question_id]?.awarded_points ?? 0,
                            teacher_feedback: event.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => submit.mutate()} disabled={!attempt.data || submit.isPending}>
            {submit.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            اعتماد النتيجة النهائية
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- DOCX MCQ import dialog ----------------

function DocxExamDialog({ levels }: { levels: any[] }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createExam);
  const [open, setOpen] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [fileName, setFileName] = useState("");
  const [questions, setQuestions] = useState<ImportedMcqQuestion[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const nowIso = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    [],
  );
  const laterIso = useMemo(
    () =>
      new Date(Date.now() + 7 * 24 * 3600 * 1000 - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    [],
  );
  const [form, setForm] = useState({
    title: "",
    instructions: "اختر إجابة واحدة صحيحة لكل سؤال.",
    level_id: "",
    duration_minutes: 30,
    opens_at: nowIso,
    closes_at: laterIso,
    passing_score: 50,
  });

  async function onFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setParsing(true);
    setQuestions([]);
    setWarnings([]);
    try {
      const parsed = await parseDocxExam(file);
      setQuestions(parsed.questions);
      setWarnings(parsed.warnings);
      setFileName(file.name);
      setForm((current) => ({
        ...current,
        title: current.title.trim() ? current.title : parsed.suggestedTitle,
      }));
      toast.success(`تم استخراج ${parsed.questions.length} سؤالًا من ملف Word`);
    } catch (error: any) {
      const messages: Record<string, string> = {
        docx_only: "اختر ملف Word بصيغة DOCX.",
        docx_too_large: "حجم الملف يجب ألا يتجاوز 15 ميجابايت.",
        invalid_docx: "ملف Word غير صالح أو تالف.",
        invalid_docx_xml: "تعذر قراءة محتوى ملف Word.",
        empty_docx: "ملف Word لا يحتوي على نص.",
        no_mcq_questions:
          "لم أجد أسئلة مكتملة. يجب أن يلي كل سؤال 4 اختيارات وإجابة واحدة مظللة بالأصفر.",
      };
      toast.error(messages[error?.message] ?? "تعذر تحليل ملف Word.");
      setFileName("");
    } finally {
      setParsing(false);
      event.target.value = "";
    }
  }

  function updateQuestion(index: number, patch: Partial<ImportedMcqQuestion>) {
    setQuestions((current) =>
      current.map((question, questionIndex) =>
        questionIndex === index ? { ...question, ...patch } : question,
      ),
    );
  }

  function updateOption(questionIndex: number, optionIndex: number, label: string) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex !== questionIndex
          ? question
          : {
              ...question,
              options: question.options.map((option, currentOptionIndex) =>
                currentOptionIndex === optionIndex ? { ...option, label } : option,
              ),
            },
      ),
    );
  }

  function setCorrect(questionIndex: number, optionIndex: number) {
    setQuestions((current) =>
      current.map((question, currentQuestionIndex) =>
        currentQuestionIndex !== questionIndex
          ? question
          : {
              ...question,
              options: question.options.map((option, currentOptionIndex) => ({
                ...option,
                is_correct: currentOptionIndex === optionIndex,
              })),
            },
      ),
    );
  }

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: form.title,
          instructions: form.instructions || null,
          level_id: form.level_id,
          duration_minutes: form.duration_minutes,
          opens_at: new Date(form.opens_at).toISOString(),
          closes_at: new Date(form.closes_at).toISOString(),
          passing_score: form.passing_score,
          questions: questions.map((question) => ({
            type: "mcq_single" as const,
            prompt: question.prompt,
            points: 1,
            options: question.options,
            model_answer: "",
            accepted_answers: [],
          })),
        },
      }),
    onSuccess: () => {
      toast.success("تم نشر الامتحان وإتاحته للطلاب");
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
      setOpen(false);
      setFileName("");
      setQuestions([]);
      setWarnings([]);
      setForm((current) => ({ ...current, title: "" }));
    },
    onError: (error: any) => toast.error("تعذر نشر الامتحان: " + (error?.message ?? "")),
  });

  const invalidQuestions = questions.some(
    (question) =>
      !question.prompt.trim() ||
      question.options.length !== 4 ||
      question.options.some((option) => !option.label.trim()) ||
      question.options.filter((option) => option.is_correct).length !== 1,
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <FileUp className="ml-2 h-4 w-4" /> رفع امتحان Word
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[92vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>إنشاء امتحان MCQ من ملف Word</DialogTitle>
        </DialogHeader>

        <div className="space-y-5">
          <div className="rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <h3 className="font-bold">ارفع ملف الأسئلة بصيغة DOCX</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  كل سؤال يليه 4 اختيارات، والإجابة الصحيحة تكون مظللة بالأصفر داخل Word.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-bold text-primary-foreground transition hover:opacity-90">
                {parsing ? (
                  <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                ) : (
                  <FileUp className="ml-2 h-4 w-4" />
                )}
                {parsing ? "جارٍ قراءة الملف" : "اختيار ملف Word"}
                <input
                  type="file"
                  accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  onChange={onFile}
                  disabled={parsing}
                  className="sr-only"
                />
              </label>
            </div>
            {fileName && (
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span className="font-semibold">{fileName}</span>
                <Badge variant="secondary">{questions.length} سؤال</Badge>
                <Badge variant="secondary">{questions.length} درجة</Badge>
              </div>
            )}
          </div>

          {warnings.length > 0 && (
            <div className="rounded-xl border border-amber-400/40 bg-amber-400/10 p-4 text-sm">
              <div className="mb-2 flex items-center gap-2 font-bold text-amber-700 dark:text-amber-300">
                <AlertTriangle className="h-4 w-4" /> راجع الملاحظات قبل النشر
              </div>
              {warnings.map((warning) => (
                <p key={warning}>{warning}</p>
              ))}
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-2 md:col-span-2">
              <Label>اسم الامتحان</Label>
              <Input
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                placeholder="مثال: امتحان المحاضرة السادسة عشر"
              />
            </div>
            <div className="space-y-2">
              <Label>الصف</Label>
              <Select
                value={form.level_id}
                onValueChange={(value) => setForm({ ...form, level_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر الصف" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((level: any) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المدة بالدقائق</Label>
              <Input
                type="number"
                min={1}
                max={600}
                value={form.duration_minutes}
                onChange={(event) =>
                  setForm({
                    ...form,
                    duration_minutes: Math.max(1, Number(event.target.value) || 1),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>يفتح في</Label>
              <Input
                dir="ltr"
                type="datetime-local"
                value={form.opens_at}
                onChange={(event) => setForm({ ...form, opens_at: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>يغلق في</Label>
              <Input
                dir="ltr"
                type="datetime-local"
                value={form.closes_at}
                onChange={(event) => setForm({ ...form, closes_at: event.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>درجة النجاح (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={(event) =>
                  setForm({
                    ...form,
                    passing_score: Math.min(100, Math.max(0, Number(event.target.value) || 0)),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>التعليمات</Label>
              <Input
                value={form.instructions}
                onChange={(event) => setForm({ ...form, instructions: event.target.value })}
              />
            </div>
          </div>

          {questions.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold">معاينة الامتحان</h3>
                  <p className="text-xs text-muted-foreground">
                    الإجابة الخضراء هي التي كانت مظللة بالأصفر، ويمكن تعديل أي نص أو إجابة.
                  </p>
                </div>
                <Badge>{questions.length} سؤال</Badge>
              </div>
              {questions.map((question, questionIndex) => (
                <div
                  key={questionIndex}
                  className="rounded-2xl border border-border bg-card p-4 shadow-sm"
                >
                  <div className="mb-3 flex items-start gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary font-bold text-primary-foreground">
                      {questionIndex + 1}
                    </span>
                    <Textarea
                      value={question.prompt}
                      onChange={(event) =>
                        updateQuestion(questionIndex, { prompt: event.target.value })
                      }
                      className="min-h-20 resize-y font-semibold leading-7"
                    />
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      aria-label="حذف السؤال"
                      onClick={() =>
                        setQuestions((current) =>
                          current.filter((_, index) => index !== questionIndex),
                        )
                      }
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                  <div className="grid gap-2 md:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <div
                        key={optionIndex}
                        className={
                          "flex items-center gap-2 rounded-xl border p-2 transition " +
                          (option.is_correct
                            ? "border-emerald-500/60 bg-emerald-500/10"
                            : "border-border bg-background")
                        }
                      >
                        <button
                          type="button"
                          onClick={() => setCorrect(questionIndex, optionIndex)}
                          aria-label={`تحديد الاختيار ${optionIndex + 1} كإجابة صحيحة`}
                          className={
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold " +
                            (option.is_correct
                              ? "border-emerald-500 bg-emerald-500 text-white"
                              : "border-border hover:border-primary")
                          }
                        >
                          {option.is_correct ? <CheckCircle2 className="h-4 w-4" /> : optionIndex + 1}
                        </button>
                        <Input
                          value={option.label}
                          onChange={(event) =>
                            updateOption(questionIndex, optionIndex, event.target.value)
                          }
                          className="border-0 bg-transparent shadow-none focus-visible:ring-1"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <DialogFooter className="mt-5">
          <Button
            onClick={() => create.mutate()}
            disabled={
              create.isPending ||
              parsing ||
              !form.title.trim() ||
              !form.level_id ||
              !questions.length ||
              invalidQuestions
            }
          >
            {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
            نشر الامتحان للطلاب
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- PDF exam dialog ----------------

function PdfExamDialog({ levels }: { levels: any[] }) {
  const qc = useQueryClient();
  const createFn = useServerFn(createExamFromPdf);
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [pdfPath, setPdfPath] = useState<string | null>(null);
  const [pdfName, setPdfName] = useState<string>("");
  const nowIso = useMemo(
    () => new Date(Date.now() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16),
    [],
  );
  const laterIso = useMemo(
    () =>
      new Date(Date.now() + 7 * 24 * 3600 * 1000 - new Date().getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16),
    [],
  );
  const [form, setForm] = useState({
    title: "",
    instructions: "",
    level_id: "",
    duration_minutes: 60,
    opens_at: nowIso,
    closes_at: laterIso,
    passing_score: 50,
    q_count: 20,
    options_count: 4,
  });
  const [answers, setAnswers] = useState<number[]>(() => Array(20).fill(0));

  function updateCount(n: number) {
    const v = Math.max(1, Math.min(200, n | 0));
    setForm((f) => ({ ...f, q_count: v }));
    setAnswers((prev) =>
      Array.from({ length: v }, (_, i) => Math.min(prev[i] ?? 0, form.options_count - 1)),
    );
  }
  function updateOptCount(n: number) {
    const v = Math.max(2, Math.min(6, n | 0));
    setForm((f) => ({ ...f, options_count: v }));
    setAnswers((prev) => prev.map((a) => Math.min(a, v - 1)));
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      toast.error("الملف يجب أن يكون PDF");
      return;
    }
    setUploading(true);
    try {
      const path = `${crypto.randomUUID()}.pdf`;
      const { error } = await supabase.storage.from("exam-pdfs").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
        contentType: "application/pdf",
      });
      if (error) throw error;
      setPdfPath(path);
      setPdfName(file.name);
      toast.success("تم رفع الملف");
    } catch (err: any) {
      toast.error("فشل الرفع: " + (err?.message ?? ""));
    } finally {
      setUploading(false);
    }
  }

  const create = useMutation({
    mutationFn: () => {
      if (!pdfPath) throw new Error("no_pdf");
      const questions = Array.from({ length: form.q_count }, (_, i) => ({
        options_count: form.options_count,
        correct_index: answers[i] ?? 0,
        points: 1,
      }));
      return createFn({
        data: {
          title: form.title,
          instructions: form.instructions || null,
          level_id: form.level_id,
          duration_minutes: form.duration_minutes,
          opens_at: new Date(form.opens_at).toISOString(),
          closes_at: new Date(form.closes_at).toISOString(),
          passing_score: form.passing_score,
          pdf_path: pdfPath,
          questions,
        },
      });
    },
    onSuccess: () => {
      toast.success("تم نشر امتحان PDF");
      qc.invalidateQueries({ queryKey: ["teacher-exams"] });
      setOpen(false);
      setPdfPath(null);
      setPdfName("");
      setForm((f) => ({ ...f, title: "", instructions: "" }));
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });

  const letters = ["A", "B", "C", "D", "E", "F"];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FileText className="ml-2 h-4 w-4" /> امتحان PDF
        </Button>
      </DialogTrigger>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>امتحان بملف PDF + مفتاح إجابة</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="rounded-xl border border-dashed border-border p-4">
            <Label>ملف الأسئلة (PDF)</Label>
            <div className="mt-2 flex items-center gap-2">
              <Input type="file" accept="application/pdf" onChange={onFile} disabled={uploading} />
              {uploading && <Loader2 className="h-4 w-4 animate-spin" />}
            </div>
            {pdfPath && <p className="mt-2 text-xs text-primary">✓ {pdfName}</p>}
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="space-y-2">
              <Label>العنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>الصف</Label>
              <Select
                value={form.level_id}
                onValueChange={(v) => setForm({ ...form, level_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر" />
                </SelectTrigger>
                <SelectContent>
                  {levels.map((l: any) => (
                    <SelectItem key={l.id} value={l.id}>
                      {l.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>المدة (دقيقة)</Label>
              <Input
                type="number"
                min={1}
                value={form.duration_minutes}
                onChange={(e) =>
                  setForm({ ...form, duration_minutes: Math.max(1, Number(e.target.value) || 0) })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>الحد الأدنى للنجاح (%)</Label>
              <Input
                type="number"
                min={0}
                max={100}
                value={form.passing_score}
                onChange={(e) =>
                  setForm({
                    ...form,
                    passing_score: Math.min(100, Math.max(0, Number(e.target.value) || 0)),
                  })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>يفتح في</Label>
              <Input
                dir="ltr"
                type="datetime-local"
                value={form.opens_at}
                onChange={(e) => setForm({ ...form, opens_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>يغلق في</Label>
              <Input
                dir="ltr"
                type="datetime-local"
                value={form.closes_at}
                onChange={(e) => setForm({ ...form, closes_at: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>عدد الأسئلة</Label>
              <Input
                type="number"
                min={1}
                max={200}
                value={form.q_count}
                onChange={(e) => updateCount(Number(e.target.value) || 1)}
              />
            </div>
            <div className="space-y-2">
              <Label>عدد الاختيارات لكل سؤال</Label>
              <Input
                type="number"
                min={2}
                max={6}
                value={form.options_count}
                onChange={(e) => updateOptCount(Number(e.target.value) || 4)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>التعليمات (اختياري)</Label>
            <Textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
            />
          </div>

          <div>
            <h4 className="mb-2 font-bold">مفتاح الإجابات</h4>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              {Array.from({ length: form.q_count }, (_, i) => (
                <div key={i} className="rounded-lg border border-border p-2">
                  <div className="mb-1 text-xs text-muted-foreground">سؤال {i + 1}</div>
                  <div className="flex flex-wrap gap-1">
                    {Array.from({ length: form.options_count }, (_, oi) => (
                      <button
                        type="button"
                        key={oi}
                        onClick={() => setAnswers((a) => a.map((v, j) => (j === i ? oi : v)))}
                        className={
                          "h-8 min-w-[36px] rounded-md border px-2 text-sm font-bold " +
                          ((answers[i] ?? 0) === oi
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent/40")
                        }
                      >
                        {letters[oi]}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            onClick={() => create.mutate()}
            disabled={create.isPending || !pdfPath || !form.title || !form.level_id}
          >
            {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} نشر
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Live lectures tab ----------------

function meetingPlatform(url?: string | null) {
  if (!url) return "رابط مباشر";
  try {
    const host = new URL(url).hostname.toLowerCase();
    if (host.includes("zoom")) return "Zoom";
    if (host === "meet.google.com" || host.endsWith(".meet.google.com")) return "Google Meet";
    if (host.includes("teams.microsoft") || host.includes("teams.live")) return "Microsoft Teams";
  } catch {
    return "رابط مباشر";
  }
  return "رابط مباشر";
}

function lectureTiming(lecture: { scheduled_at: string; duration_minutes: number }) {
  const start = new Date(lecture.scheduled_at).getTime();
  const end = start + Number(lecture.duration_minutes) * 60_000;
  const now = Date.now();
  if (now < start) return { key: "upcoming", label: "قادمة" } as const;
  if (now <= end) return { key: "live", label: "مباشر الآن" } as const;
  return { key: "ended", label: "انتهت" } as const;
}

function LecturesTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listTeacherLectures);
  const createFn = useServerFn(createLiveLecture);
  const deleteFn = useServerFn(deleteLiveLecture);
  const lectures = useQuery({ queryKey: ["teacher-lectures"], queryFn: () => listFn() });
  const levelsFn = useServerFn(listLevels);
  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelsFn() });
  const [open, setOpen] = useState(false);
  const [lectureSearch, setLectureSearch] = useState("");
  const [lectureLevel, setLectureLevel] = useState("all");
  const [lectureStatus, setLectureStatus] = useState("all");
  const defaultDate = useMemo(
    () =>
      new Date(Date.now() + 60 * 60_000 - new Date().getTimezoneOffset() * 60_000)
        .toISOString()
        .slice(0, 16),
    [],
  );
  const [form, setForm] = useState({
    title: "",
    description: "",
    level_id: "",
    scheduled_at: defaultDate,
    duration_minutes: 60,
    meeting_url: "",
  });
  const filteredLectures = useMemo(() => {
    const term = lectureSearch.trim().toLocaleLowerCase("ar");
    return (lectures.data ?? []).filter((lecture: any) =>
      (!term || [lecture.title, lecture.description].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(term))) &&
      (lectureLevel === "all" || lecture.level_name === lectureLevel) &&
      (lectureStatus === "all" || lectureTiming(lecture).key === lectureStatus),
    );
  }, [lectures.data, lectureSearch, lectureLevel, lectureStatus]);

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          title: form.title,
          description: form.description || null,
          level_id: form.level_id,
          scheduled_at: new Date(form.scheduled_at).toISOString(),
          duration_minutes: form.duration_minutes,
          meeting_url: form.meeting_url.trim(),
        },
      }),
    onSuccess: () => {
      toast.success("تمت إضافة المحاضرة وإتاحتها للطلاب");
      qc.invalidateQueries({ queryKey: ["teacher-lectures"] });
      qc.invalidateQueries({ queryKey: ["student-lectures"] });
      setOpen(false);
      setForm((current) => ({
        ...current,
        title: "",
        description: "",
        meeting_url: "",
      }));
    },
    onError: (error: any) =>
      toast.error(
        error?.message?.includes("invalid_meeting_url")
          ? "اكتب رابط Zoom أو Google Meet صحيحًا."
          : "تعذر إضافة المحاضرة: " + (error?.message ?? ""),
      ),
  });

  const remove = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم حذف المحاضرة");
      qc.invalidateQueries({ queryKey: ["teacher-lectures"] });
      qc.invalidateQueries({ queryKey: ["student-lectures"] });
    },
    onError: (error: any) => toast.error("تعذر الحذف: " + (error?.message ?? "")),
  });

  return (
    <div className="space-y-5">
      <div className="overflow-hidden rounded-3xl border border-primary/20 bg-gradient-to-l from-primary/15 via-sky-500/10 to-background p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-glow">
              <Video className="h-7 w-7" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold">المحاضرات والدروس المباشرة</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                أضف موعد الدرس ورابط Zoom أو Google Meet وسيظهر للطلاب فورًا.
              </p>
            </div>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="ml-2 h-4 w-4" /> إضافة محاضرة
              </Button>
            </DialogTrigger>
            <DialogContent dir="rtl" className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>إضافة محاضرة جديدة</DialogTitle>
              </DialogHeader>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2 md:col-span-2">
                  <Label>عنوان المحاضرة</Label>
                  <Input
                    value={form.title}
                    onChange={(event) => setForm({ ...form, title: event.target.value })}
                    placeholder="مثال: شرح النحو — اسم الفاعل"
                  />
                </div>
                <div className="space-y-2">
                  <Label>الصف الدراسي</Label>
                  <Select
                    value={form.level_id}
                    onValueChange={(value) => setForm({ ...form, level_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="اختر الصف" />
                    </SelectTrigger>
                    <SelectContent>
                      {(levels.data ?? []).map((level: any) => (
                        <SelectItem key={level.id} value={level.id}>
                          {level.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>اليوم والساعة</Label>
                  <Input
                    dir="ltr"
                    type="datetime-local"
                    value={form.scheduled_at}
                    onChange={(event) => setForm({ ...form, scheduled_at: event.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>مدة المحاضرة بالدقائق</Label>
                  <Input
                    type="number"
                    min={10}
                    max={600}
                    value={form.duration_minutes}
                    onChange={(event) =>
                      setForm({
                        ...form,
                        duration_minutes: Math.max(10, Number(event.target.value) || 10),
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>رابط الاجتماع</Label>
                  <div className="relative">
                    <Link2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      dir="ltr"
                      type="url"
                      value={form.meeting_url}
                      onChange={(event) => setForm({ ...form, meeting_url: event.target.value })}
                      className="pr-10"
                      placeholder="https://meet.google.com/..."
                    />
                  </div>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>تفاصيل الدرس (اختياري)</Label>
                  <Textarea
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                    placeholder="اكتب موضوعات المحاضرة أو المطلوب من الطلاب تحضيره."
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  onClick={() => create.mutate()}
                  disabled={
                    create.isPending ||
                    !form.title.trim() ||
                    !form.level_id ||
                    !form.scheduled_at ||
                    !form.meeting_url.trim()
                  }
                >
                  {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />}
                  نشر المحاضرة للطلاب
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="teacher-filter-bar">
        <div className="teacher-search-field"><Search className="h-4 w-4" /><Input value={lectureSearch} onChange={(event) => setLectureSearch(event.target.value)} placeholder="ابحث في المحاضرات..." /></div>
        <Select value={lectureLevel} onValueChange={setLectureLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{(levels.data ?? []).map((level: any) => <SelectItem key={level.id} value={level.name}>{level.name}</SelectItem>)}</SelectContent></Select>
        <Select value={lectureStatus} onValueChange={setLectureStatus}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الحالات</SelectItem><SelectItem value="live">مباشر الآن</SelectItem><SelectItem value="upcoming">قادمة</SelectItem><SelectItem value="ended">منتهية</SelectItem></SelectContent></Select>
        <div className="teacher-filter-count">عرض <strong>{filteredLectures.length}</strong> من {lectures.data?.length ?? 0}</div>
      </div>

      {lectures.isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : filteredLectures.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-border bg-card p-12 text-center">
          <Video className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
          <h3 className="font-bold">لا توجد محاضرات بعد</h3>
          <p className="mt-1 text-sm text-muted-foreground">أضف أول موعد ليظهر هنا ولطلاب الصف.</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {filteredLectures.map((lecture: any) => {
            const timing = lectureTiming(lecture);
            const platform = meetingPlatform(lecture.zoom_join_url);
            return (
              <article
                key={lecture.id}
                className="group relative overflow-hidden rounded-3xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                {timing.key === "live" && (
                  <span className="absolute left-0 top-0 h-1 w-full animate-pulse bg-red-500" />
                )}
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="flex gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                      {timing.key === "live" ? (
                        <Radio className="h-5 w-5 animate-pulse" />
                      ) : (
                        <Video className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-extrabold">{lecture.title}</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {lecture.level_name} · {platform}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant={timing.key === "ended" ? "secondary" : "default"}
                    className={timing.key === "live" ? "bg-red-500 text-white" : ""}
                  >
                    {timing.label}
                  </Badge>
                </div>
                {lecture.description && (
                  <p className="mb-4 line-clamp-2 text-sm leading-6 text-muted-foreground">
                    {lecture.description}
                  </p>
                )}
                <div className="mb-4 grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                    <CalendarDays className="h-4 w-4 text-primary" /> {fmt(lecture.scheduled_at)}
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2">
                    <Clock3 className="h-4 w-4 text-primary" /> {lecture.duration_minutes} دقيقة
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button asChild size="sm" variant="outline">
                    <a href={lecture.zoom_join_url} target="_blank" rel="noreferrer noopener">
                      <ExternalLink className="ml-2 h-4 w-4" /> فتح الرابط
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    disabled={remove.isPending}
                    onClick={() => {
                      if (confirm("حذف هذه المحاضرة؟")) remove.mutate(lecture.id);
                    }}
                  >
                    <Trash2 className="ml-1 h-4 w-4 text-destructive" /> حذف
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ---------------- Attendance tab ----------------

function AttendanceTab() {
  const qc = useQueryClient();
  const listFn = useServerFn(listAttendanceSessions);
  const levelsFn = useServerFn(listLevels);
  const createFn = useServerFn(createAttendanceSession);
  const delFn = useServerFn(deleteAttendanceSession);
  const sessions = useQuery({ queryKey: ["att-sessions"], queryFn: () => listFn() });
  const levels = useQuery({ queryKey: ["levels"], queryFn: () => levelsFn() });
  const [open, setOpen] = useState(false);
  const today = new Date().toISOString().slice(0, 10);
  const [form, setForm] = useState({ level_id: "", session_date: today, title: "", notes: "" });
  const [selected, setSelected] = useState<string | null>(null);
  const [sessionSearch, setSessionSearch] = useState("");
  const [sessionLevel, setSessionLevel] = useState("all");
  const [sessionPeriod, setSessionPeriod] = useState("all");
  const filteredSessions = useMemo(() => {
    const term = sessionSearch.trim().toLocaleLowerCase("ar");
    const now = new Date();
    return (sessions.data ?? []).filter((session: any) => {
      const date = new Date(`${session.session_date}T00:00:00`);
      const daysAgo = (now.getTime() - date.getTime()) / 86_400_000;
      const periodMatch = sessionPeriod === "all" || (sessionPeriod === "week" ? daysAgo <= 7 : daysAgo <= 30);
      return (!term || String(session.title).toLocaleLowerCase("ar").includes(term)) &&
        (sessionLevel === "all" || session.educational_level_id === sessionLevel) && periodMatch;
    });
  }, [sessions.data, sessionSearch, sessionLevel, sessionPeriod]);

  const create = useMutation({
    mutationFn: () =>
      createFn({
        data: {
          level_id: form.level_id,
          session_date: form.session_date,
          title: form.title,
          notes: form.notes || null,
        },
      }),
    onSuccess: (r) => {
      toast.success("تم إنشاء الجلسة");
      qc.invalidateQueries({ queryKey: ["att-sessions"] });
      setOpen(false);
      setForm((f) => ({ ...f, title: "", notes: "" }));
      setSelected(r.id);
    },
    onError: (e: any) => toast.error("خطأ: " + (e?.message ?? "")),
  });
  const del = useMutation({
    mutationFn: (id: string) => delFn({ data: { id } }),
    onSuccess: () => {
      toast.success("تم الحذف");
      qc.invalidateQueries({ queryKey: ["att-sessions"] });
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><h2 className="text-xl font-extrabold">الحضور والغياب</h2><p className="text-sm text-muted-foreground">أنشئ الجلسات وسجّل حالة كل طالب بسرعة.</p></div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="ml-2 h-4 w-4" /> جلسة جديدة
            </Button>
          </DialogTrigger>
          <DialogContent dir="rtl">
            <DialogHeader>
              <DialogTitle>جلسة حضور جديدة</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>الصف</Label>
                <Select
                  value={form.level_id}
                  onValueChange={(v) => setForm({ ...form, level_id: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر" />
                  </SelectTrigger>
                  <SelectContent>
                    {(levels.data ?? []).map((l: any) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>التاريخ</Label>
                <Input
                  dir="ltr"
                  type="date"
                  value={form.session_date}
                  onChange={(e) => setForm({ ...form, session_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label>عنوان الجلسة</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="مثال: حصة الأحد"
                />
              </div>
              <div className="space-y-2">
                <Label>ملاحظات (اختياري)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                onClick={() => create.mutate()}
                disabled={!form.level_id || !form.title || create.isPending}
              >
                {create.isPending && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} إنشاء
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      <div className="teacher-filter-bar">
        <div className="teacher-search-field"><Search className="h-4 w-4" /><Input value={sessionSearch} onChange={(event) => setSessionSearch(event.target.value)} placeholder="ابحث بعنوان الجلسة..." /></div>
        <Select value={sessionLevel} onValueChange={setSessionLevel}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الصفوف</SelectItem>{(levels.data ?? []).map((level: any) => <SelectItem key={level.id} value={level.id}>{level.name}</SelectItem>)}</SelectContent></Select>
        <Select value={sessionPeriod} onValueChange={setSessionPeriod}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الفترات</SelectItem><SelectItem value="week">آخر 7 أيام</SelectItem><SelectItem value="month">آخر 30 يومًا</SelectItem></SelectContent></Select>
        <div className="teacher-filter-count">عرض <strong>{filteredSessions.length}</strong> من {sessions.data?.length ?? 0}</div>
      </div>
      {sessions.isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {filteredSessions.length === 0 ? (
            <div className="col-span-full rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
              لا توجد جلسات بعد.
            </div>
          ) : (
            filteredSessions.map((s: any) => (
              <div key={s.id} className="teacher-resource-card">
                <div className="mb-2 flex items-start justify-between">
                  <div>
                    <h3 className="font-bold">{s.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      {s.session_date} · {s.level_name}
                    </p>
                  </div>
                  <Badge variant="secondary">
                    حاضر {s.counts.present} · غائب {s.counts.absent}
                  </Badge>
                </div>
                <div className="mt-3 flex justify-end gap-2">
                  <Button size="sm" onClick={() => setSelected(s.id)}>
                    تسجيل الحضور
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (confirm("حذف الجلسة؟")) del.mutate(s.id);
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
      <AttendanceSessionDialog sessionId={selected} onClose={() => setSelected(null)} />
    </div>
  );
}

function AttendanceSessionDialog({
  sessionId,
  onClose,
}: {
  sessionId: string | null;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const getFn = useServerFn(getAttendanceForSession);
  const [attendanceSearch, setAttendanceSearch] = useState("");
  const q = useQuery({
    queryKey: ["att-session", sessionId],
    enabled: !!sessionId,
    queryFn: () => getFn({ data: { session_id: sessionId! } }),
  });
  const mut = useMutation({
    mutationFn: async (p: {
      student_id: string;
      status: "present" | "absent" | "late" | "excused";
    }) => {
      if (!sessionId) throw new Error("الجلسة غير متاحة");
      const { error } = await supabase.from("attendance_records").upsert(
        {
          session_id: sessionId,
          student_id: p.student_id,
          status: p.status,
          notes: null,
        },
        { onConflict: "session_id,student_id" },
      );
      if (error) throw error;
      return { ok: true };
    },
    onMutate: async (nextStatus) => {
      const queryKey = ["att-session", sessionId];
      await qc.cancelQueries({ queryKey });
      const previous = qc.getQueryData<any>(queryKey);
      qc.setQueryData<any>(queryKey, (current: any) =>
        current
          ? {
              ...current,
              rows: (current.rows ?? []).map((row: any) =>
                row.student_id === nextStatus.student_id
                  ? { ...row, status: nextStatus.status }
                  : row,
              ),
            }
          : current,
      );
      return { previous, queryKey };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["att-sessions"] });
    },
    onError: (e: any, _variables, context) => {
      if (context?.previous) qc.setQueryData(context.queryKey, context.previous);
      toast.error("تعذر حفظ الحضور: " + (e?.message ?? ""));
    },
  });
  const bulkMut = useMutation({
    mutationFn: async (status: "present" | "absent") => {
      if (!sessionId) throw new Error("الجلسة غير متاحة");
      const rows = (q.data?.rows ?? []).map((row: any) => ({
        session_id: sessionId,
        student_id: row.student_id,
        status,
        notes: null,
      }));
      if (!rows.length) return;
      const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "session_id,student_id" });
      if (error) throw error;
    },
    onSuccess: async (_data, status) => {
      qc.setQueryData<any>(["att-session", sessionId], (current: any) => current ? ({ ...current, rows: (current.rows ?? []).map((row: any) => ({ ...row, status })) }) : current);
      await qc.invalidateQueries({ queryKey: ["att-sessions"] });
      toast.success(status === "present" ? "تم تسجيل الجميع حاضرًا" : "تم تسجيل الجميع غائبًا");
    },
    onError: (error: any) => toast.error("تعذر تحديث الجميع: " + (error?.message ?? "")),
  });
  const statuses: { v: "present" | "absent" | "late" | "excused"; label: string }[] = [
    { v: "present", label: "حاضر" },
    { v: "absent", label: "غائب" },
    { v: "late", label: "متأخر" },
    { v: "excused", label: "بعذر" },
  ];
  const filteredAttendanceRows = (q.data?.rows ?? []).filter((row: any) => {
    const term = attendanceSearch.trim().toLocaleLowerCase("ar");
    return !term || [row.full_name, row.email].some((value) => String(value ?? "").toLocaleLowerCase("ar").includes(term));
  });
  return (
    <Dialog open={!!sessionId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{q.data?.session?.title ?? "الحضور"}</DialogTitle>
        </DialogHeader>
        {q.isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-3">
            <div className="teacher-attendance-tools">
              <div className="teacher-search-field"><Search className="h-4 w-4" /><Input value={attendanceSearch} onChange={(event) => setAttendanceSearch(event.target.value)} placeholder="ابحث عن طالب..." /></div>
              <div className="flex gap-2"><Button size="sm" variant="outline" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate("absent")}>الكل غائب</Button><Button size="sm" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate("present")}>{bulkMut.isPending && <Loader2 className="ml-1 h-3.5 w-3.5 animate-spin" />}الكل حاضر</Button></div>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground"><span>الطلاب الظاهرون: {filteredAttendanceRows.length}</span><span>يتم الحفظ تلقائيًا</span></div>
            {filteredAttendanceRows.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">لا يوجد طلاب في هذا الصف.</p>
            ) : (
              filteredAttendanceRows.map((r: any) => (
                <div
                  key={r.student_id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-border p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{r.full_name}</p>
                    <p className="truncate text-xs text-muted-foreground" dir="ltr">
                      {r.email}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {statuses.map((s) => (
                      <button
                        key={s.v}
                        type="button"
                        disabled={mut.isPending}
                        onClick={() => mut.mutate({ student_id: r.student_id, status: s.v })}
                        className={
                          "inline-flex min-w-12 items-center justify-center rounded-md border px-2 py-1 text-xs font-semibold transition disabled:cursor-wait disabled:opacity-60 " +
                          (r.status === s.v
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent/40")
                        }
                      >
                        {mut.isPending &&
                        mut.variables?.student_id === r.student_id &&
                        mut.variables?.status === s.v ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          s.label
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ---------------- Student detail dialog ----------------

function StudentDetailDialog({
  studentId,
  onClose,
}: {
  studentId: string | null;
  onClose: () => void;
}) {
  const getFn = useServerFn(getStudentDetails);
  const q = useQuery({
    queryKey: ["student-details", studentId],
    enabled: !!studentId,
    queryFn: () => getFn({ data: { student_id: studentId! } }),
  });
  return (
    <Dialog open={!!studentId} onOpenChange={(v) => !v && onClose()}>
      <DialogContent dir="rtl" className="max-h-[90vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{q.data?.profile?.full_name ?? "تفاصيل الطالب"}</DialogTitle>
        </DialogHeader>
        {q.isLoading || !q.data ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-card p-4 text-sm md:grid-cols-4">
              <div>
                <div className="text-xs text-muted-foreground">البريد</div>
                <div dir="ltr">{q.data.profile.email}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">الصف</div>
                <div>{q.data.profile.level_name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">الهاتف</div>
                <div dir="ltr">{q.data.profile.phone ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">هاتف ولي الأمر</div>
                <div dir="ltr">{q.data.profile.guardian_phone ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">المدرسة</div>
                <div>{q.data.profile.school_name ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">المحافظة</div>
                <div>{q.data.profile.governorate ?? "—"}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">تاريخ التسجيل</div>
                <div>{fmt(q.data.profile.created_at)}</div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
              <StatCard label="امتحانات مقدمة" value={q.data.summary.exams_taken} />
              <StatCard label="امتحانات ناجحة" value={q.data.summary.exams_passed} />
              <StatCard
                label="متوسط النسبة"
                value={
                  q.data.summary.avg_percentage != null ? q.data.summary.avg_percentage + "%" : "—"
                }
              />
              <StatCard label="جلسات مسجّلة" value={q.data.summary.total_sessions} />
              <StatCard label="حضور" value={q.data.summary.present} />
              <StatCard label="غياب" value={q.data.summary.absent} />
              <StatCard label="تأخر" value={q.data.summary.late} />
              <StatCard label="بعذر" value={q.data.summary.excused} />
            </div>
            <div>
              <h4 className="mb-2 font-bold">سجل الامتحانات</h4>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-right">الامتحان</th>
                      <th className="px-3 py-2 text-right">الدرجة</th>
                      <th className="px-3 py-2 text-right">النسبة</th>
                      <th className="px-3 py-2 text-right">الحالة</th>
                      <th className="px-3 py-2 text-right">التاريخ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.attempts.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">
                          لا يوجد سجل.
                        </td>
                      </tr>
                    ) : (
                      q.data.attempts.map((a: any) => (
                        <tr key={a.id} className="border-t border-border">
                          <td className="px-3 py-2">{a.exam?.title ?? "—"}</td>
                          <td className="px-3 py-2">
                            {a.score ?? "—"} / {a.exam?.total_points ?? "—"}
                          </td>
                          <td className="px-3 py-2">
                            {a.percentage != null ? Math.round(a.percentage) + "%" : "—"}
                          </td>
                          <td className="px-3 py-2">
                            {a.passed ? (
                              <Badge>نجح</Badge>
                            ) : a.status === "in_progress" ? (
                              <Badge variant="outline">قيد التقدم</Badge>
                            ) : (
                              <Badge variant="destructive">لم ينجح</Badge>
                            )}
                          </td>
                          <td className="px-3 py-2">{fmt(a.submitted_at ?? a.started_at)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
            <div>
              <h4 className="mb-2 font-bold">سجل الحضور</h4>
              <div className="overflow-hidden rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="px-3 py-2 text-right">التاريخ</th>
                      <th className="px-3 py-2 text-right">الجلسة</th>
                      <th className="px-3 py-2 text-right">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {q.data.attendance.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">
                          لا يوجد سجل.
                        </td>
                      </tr>
                    ) : (
                      q.data.attendance.map((r: any, i: number) => (
                        <tr key={i} className="border-t border-border">
                          <td className="px-3 py-2">{r.session?.session_date ?? "—"}</td>
                          <td className="px-3 py-2">{r.session?.title ?? "—"}</td>
                          <td className="px-3 py-2">
                            {r.status === "present" ? (
                              <Badge>حاضر</Badge>
                            ) : r.status === "absent" ? (
                              <Badge variant="destructive">غائب</Badge>
                            ) : r.status === "late" ? (
                              <Badge variant="outline">متأخر</Badge>
                            ) : (
                              <Badge variant="secondary">بعذر</Badge>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-xl font-bold">{value}</div>
    </div>
  );
}
