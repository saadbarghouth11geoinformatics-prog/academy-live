import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Clock,
  ExternalLink,
  GraduationCap,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Radio,
  School,
  Search,
  Sparkles,
  Target,
  TrendingUp,
  Trophy,
  UserRound,
  UsersRound,
  Video,
  XCircle,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getStudentPortal } from "@/lib/academy.functions";
import { primaryRole, useAuth } from "@/hooks/use-auth";
import { navigateDashboardTab } from "@/lib/dashboard-tabs";

export const Route = createFileRoute("/_authenticated/student")({
  component: () => (
    <RoleGuard allow={["student", "parent", "admin", "teacher"]}>
      <StudentPortal />
    </RoleGuard>
  ),
});

function fmt(value: string | null | undefined, dateOnly = false) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ar-EG", {
      dateStyle: "medium",
      ...(dateOnly ? {} : { timeStyle: "short" }),
    });
  } catch {
    return String(value);
  }
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("");
}

function meetingPlatform(url: string) {
  let host = "";
  try {
    host = new URL(url).hostname.toLowerCase();
  } catch {
    // The server validates newly created links; keep a safe generic fallback for old rows.
  }
  if (host.includes("zoom.")) return { name: "Zoom", tone: "bg-blue-500" };
  if (host.includes("meet.google.")) return { name: "Google Meet", tone: "bg-emerald-500" };
  if (host.includes("teams.microsoft.")) return { name: "Microsoft Teams", tone: "bg-violet-500" };
  return { name: "رابط مباشر", tone: "bg-primary" };
}

function lectureState(lecture: any) {
  const start = new Date(lecture.scheduled_at).getTime();
  const end = start + Number(lecture.duration_minutes) * 60_000;
  const now = Date.now();
  if (now < start) return "upcoming" as const;
  if (now <= end) return "live" as const;
  return "ended" as const;
}

function examState(exam: any) {
  if (exam.attempt && exam.attempt.status !== "in_progress") {
    return exam.attempt.pending_manual_grading
      ? "grading"
      : exam.attempt.passed
        ? "passed"
        : "failed";
  }
  if (exam.attempt?.status === "in_progress") return "in_progress";
  const now = Date.now();
  if (now < new Date(exam.opens_at).getTime()) return "upcoming";
  if (now > new Date(exam.closes_at).getTime()) return "ended";
  return "available";
}

const attendanceLabels: Record<string, string> = {
  present: "حاضر",
  absent: "غائب",
  late: "متأخر",
  excused: "بعذر",
};
const attendanceTones: Record<string, string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
  excused: "bg-blue-100 text-blue-700",
};

export function StudentPortal() {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const isParent = role === "parent";
  const isTeacher = role === "teacher" || role === "admin";
  const portalFn = useServerFn(getStudentPortal);
  const [studentId, setStudentId] = useState<string | null>(null);
  const portal = useQuery({
    queryKey: ["student-portal", studentId],
    queryFn: () => portalFn({ data: { student_id: studentId } }),
    refetchInterval: 60_000,
  });

  const title = isTeacher ? "معاينة لوحات الطلاب" : isParent ? "متابعة الطالب" : "لوحة الطالب";
  const subtitle = isTeacher
    ? "اختر أي طالب وشاهد لوحته ونتائجه وحضوره كما تظهر له بالضبط"
    : isParent
      ? "كل ما يخص ابنك من حضور وامتحانات ونتائج ومحاضرات في تقرير واحد"
      : "مساحتك الدراسية الكاملة لمتابعة تقدمك ومواعيدك ونتائجك";

  return (
    <AppShell title={title} subtitle={subtitle}>
      {portal.isLoading ? (
        <PortalLoading />
      ) : portal.isError ? (
        <EmptyState
          icon={AlertCircle}
          title="تعذّر تحميل بيانات الطالب"
          text="حدّث الصفحة، وإذا استمرت المشكلة تأكد من ربط حساب ولي الأمر بالطالب."
        />
      ) : !portal.data?.dashboard ? (
        <EmptyState
          icon={UsersRound}
          title={isTeacher ? "لا يوجد طلاب مسجلون" : isParent ? "لا يوجد طالب مرتبط بحسابك" : "بيانات الطالب غير مكتملة"}
          text={
            isTeacher
              ? "سجّل أول طالب من قسم إدارة الطلاب لتظهر لوحة المعاينة هنا."
              : isParent
              ? "اطلب من المدرس ربط حساب ولي الأمر بحساب الطالب لتظهر جميع بياناته هنا."
              : "تواصل مع المدرس لإكمال بيانات الصف والاشتراك الدراسي."
          }
        />
      ) : (
        <StudentDashboard
          payload={portal.data}
          isParent={isParent}
          isTeacher={isTeacher}
          selectedStudentId={portal.data.selected_student_id}
          onStudentChange={setStudentId}
        />
      )}
    </AppShell>
  );
}

function PortalLoading() {
  return (
    <div className="space-y-5">
      <div className="h-52 animate-pulse rounded-3xl bg-card/80" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-32 animate-pulse rounded-2xl bg-card/80" />
        ))}
      </div>
      <div className="flex justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-primary/25 bg-card/75 p-10 text-center shadow-sm backdrop-blur">
      <span className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <Icon className="h-8 w-8" />
      </span>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-7 text-muted-foreground">{text}</p>
    </div>
  );
}

function StudentDashboard({
  payload,
  isParent,
  isTeacher,
  selectedStudentId,
  onStudentChange,
}: {
  payload: any;
  isParent: boolean;
  isTeacher: boolean;
  selectedStudentId: string;
  onStudentChange: (id: string) => void;
}) {
  const { dashboard, students } = payload;
  const isObserver = isParent || isTeacher;
  const { profile, summary, attempts, attendance, exams, lectures } = dashboard;
  const [examFilter, setExamFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [attendancePeriod, setAttendancePeriod] = useState("all");
  const [lectureFilter, setLectureFilter] = useState("active");
  const [search, setSearch] = useState("");

  const filteredExams = useMemo(
    () =>
      exams.filter((exam: any) => {
        const matchesSearch = exam.title.toLowerCase().includes(search.trim().toLowerCase());
        const state = examState(exam);
        const matchesState =
          examFilter === "all" ||
          state === examFilter ||
          (examFilter === "completed" && ["passed", "failed", "grading"].includes(state));
        return matchesSearch && matchesState;
      }),
    [exams, examFilter, search],
  );

  const filteredAttendance = useMemo(() => {
    const days = attendancePeriod === "all" ? null : Number(attendancePeriod);
    const cutoff = days ? Date.now() - days * 86_400_000 : null;
    return attendance.filter((record: any) => {
      const matchesState = attendanceFilter === "all" || record.status === attendanceFilter;
      const date = record.session?.session_date
        ? new Date(record.session.session_date).getTime()
        : new Date(record.created_at).getTime();
      return matchesState && (!cutoff || date >= cutoff);
    });
  }, [attendance, attendanceFilter, attendancePeriod]);

  const filteredLectures = useMemo(
    () =>
      lectures
        .filter((lecture: any) => {
          const state = lectureState(lecture);
          return lectureFilter === "all" || (lectureFilter === "active" ? state !== "ended" : state === lectureFilter);
        })
        .sort((a: any, b: any) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime()),
    [lectures, lectureFilter],
  );

  const nextLecture = lectures
    .filter((lecture: any) => lectureState(lecture) !== "ended")
    .sort((a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];
  const activeExam = exams.find((exam: any) => ["available", "in_progress"].includes(examState(exam)));
  const recentAttempts = attempts.filter((attempt: any) => attempt.percentage != null).slice(0, 5);
  const average = summary.avg_percentage ?? 0;
  const attendanceRate = summary.attendance_rate ?? 0;

  return (
    <div className="student-portal space-y-6" dir="rtl">
      {isObserver && (
        <div className="parent-mode-banner">
          <div className="flex items-center gap-3">
            <span><UsersRound className="h-5 w-5" /></span>
            <div>
              <strong>{isTeacher ? "وضع معاينة المدرس" : "وضع متابعة ولي الأمر"}</strong>
              <p>{isTeacher ? "اختر طالبًا لمعاينة لوحته كاملة. تظل أدوات الإدارة متاحة من قسم إدارة المنصة." : "أنت تشاهد التقرير التفصيلي للطالب، ولا يمكن حل الامتحان من حساب ولي الأمر."}</p>
            </div>
          </div>
          {students.length > 0 && (
            <Select value={selectedStudentId} onValueChange={onStudentChange}>
              <SelectTrigger className="w-full bg-white/80 sm:w-64">
                <SelectValue placeholder="اختر الطالب" />
              </SelectTrigger>
              <SelectContent>
                {students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>{student.full_name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}

      <section className="student-profile-hero">
        <div className="student-profile-primary">
          <span className="student-avatar">
            <UserRound aria-hidden />
            <small>{initials(profile.full_name || "طالب")}</small>
          </span>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="truncate text-2xl font-black sm:text-3xl">{profile.full_name}</h2>
              <Badge className="bg-emerald-500 text-white hover:bg-emerald-500">حساب نشط</Badge>
            </div>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="h-4 w-4 text-primary" /> {profile.level_name ?? "المرحلة الثانوية"}
            </p>
            <div className="student-profile-tags mt-4">
              <span><School /> {profile.school_name || "المدرسة غير مسجلة"}</span>
              <span><MapPin /> {profile.governorate || "المحافظة غير مسجلة"}</span>
              <span dir="ltr"><Phone /> {profile.phone || "—"}</span>
              <span dir="ltr"><Mail /> {profile.email}</span>
            </div>
          </div>
        </div>
        <div className="student-profile-score">
          <span className="relative grid h-28 w-28 place-items-center rounded-full" style={{ background: `conic-gradient(var(--primary) ${average * 3.6}deg, oklch(0.93 0.02 240) 0deg)` }}>
            <span className="grid h-22 w-22 place-items-center rounded-full bg-card text-center shadow-inner">
              <strong className="text-2xl font-black text-primary">{average}%</strong>
              <small className="block text-[10px] text-muted-foreground">متوسط الأداء</small>
            </span>
          </span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { icon: TrendingUp, label: "متوسط النتائج", value: `${average}%`, helper: `${summary.exams_taken} امتحان`, tone: "from-blue-600 to-cyan-500" },
          { icon: CalendarCheck, label: "نسبة الحضور", value: `${attendanceRate}%`, helper: `${summary.total_sessions} حصة`, tone: "from-emerald-600 to-teal-500" },
          { icon: Trophy, label: "امتحانات ناجحة", value: summary.exams_passed, helper: `من ${summary.exams_taken}`, tone: "from-amber-500 to-orange-500" },
          { icon: Target, label: "القادم", value: Number(!!nextLecture) + Number(!!activeExam), helper: "محاضرات وامتحانات", tone: "from-violet-600 to-fuchsia-500" },
        ].map(({ icon: Icon, label, value, helper, tone }, index) => (
          <article key={label} className="student-metric animate-fade-up" style={{ animationDelay: `${index * 60}ms` }}>
            <span className={`student-metric-icon bg-gradient-to-br ${tone}`}><Icon className="h-5 w-5" /></span>
            <div><small>{label}</small><strong>{value}</strong><p>{helper}</p></div>
          </article>
        ))}
      </section>

      <Tabs defaultValue="overview" className="dashboard-tabs space-y-5" dir="rtl" onValueChange={() => navigateDashboardTab(".student-portal-tabs")}>
        <TabsList className="student-portal-tabs h-auto w-full flex-nowrap justify-start overflow-x-auto bg-card/80 p-2 backdrop-blur">
          <TabsTrigger value="overview"><BarChart3 className="ml-2 h-4 w-4" /> نظرة عامة</TabsTrigger>
          <TabsTrigger value="exams"><ClipboardList className="ml-2 h-4 w-4" /> الامتحانات</TabsTrigger>
          <TabsTrigger value="attendance"><CalendarCheck className="ml-2 h-4 w-4" /> الحضور</TabsTrigger>
          <TabsTrigger value="lectures"><Video className="ml-2 h-4 w-4" /> المحاضرات</TabsTrigger>
          <TabsTrigger value="profile"><UserRound className="ml-2 h-4 w-4" /> بيانات الطالب</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <section className="portal-panel">
              <PanelTitle icon={TrendingUp} title="اتجاه الأداء" text="آخر خمس نتائج مسجلة" />
              {recentAttempts.length ? (
                <div className="performance-bars">
                  {[...recentAttempts].reverse().map((attempt: any) => (
                    <div key={attempt.id} className="performance-bar-item">
                      <div className="performance-bar-track">
                        <span style={{ height: `${Math.max(Number(attempt.percentage), 8)}%` }} className={attempt.passed ? "passed" : "failed"} />
                      </div>
                      <strong>{Math.round(attempt.percentage)}%</strong>
                      <small title={attempt.exam?.title}>{attempt.exam?.title ?? "امتحان"}</small>
                    </div>
                  ))}
                </div>
              ) : (
                <MiniEmpty text="ستظهر مقارنة النتائج بعد حل أول امتحان." />
              )}
            </section>

            <section className="portal-panel">
              <PanelTitle icon={CalendarCheck} title="ملخص الحضور" text="الحضور والغياب المسجل" />
              <div className="attendance-summary">
                {[
                  ["present", summary.present],
                  ["absent", summary.absent],
                  ["late", summary.late],
                  ["excused", summary.excused],
                ].map(([status, value]) => (
                  <div key={String(status)}>
                    <span className={attendanceTones[String(status)]}>{value}</span>
                    <small>{attendanceLabels[String(status)]}</small>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="mb-2 flex justify-between text-xs"><span className="text-muted-foreground">الالتزام العام</span><strong>{attendanceRate}%</strong></div>
                <Progress value={attendanceRate} className="h-2.5" />
              </div>
            </section>
          </div>

          <section className="grid gap-4 md:grid-cols-2">
            <QuickAction
              icon={Video}
              eyebrow="المحاضرة القادمة"
              title={nextLecture?.title ?? "لا توجد محاضرة قادمة"}
              text={nextLecture ? fmt(nextLecture.scheduled_at) : "سيظهر الموعد هنا فور نشره"}
              action={nextLecture ? { href: nextLecture.join_url, label: lectureState(nextLecture) === "live" ? "انضم الآن" : "فتح الرابط" } : null}
              live={nextLecture && lectureState(nextLecture) === "live"}
            />
            <QuickAction
              icon={BookOpenCheck}
              eyebrow="الامتحان المتاح"
              title={activeExam?.title ?? "لا يوجد امتحان متاح الآن"}
              text={activeExam ? `${activeExam.duration_minutes} دقيقة · ${activeExam.total_points} درجة` : "ستظهر الامتحانات الجديدة هنا"}
              exam={activeExam && !isObserver ? activeExam : null}
              parentLocked={!!activeExam && isObserver}
            />
          </section>
        </TabsContent>

        <TabsContent value="exams" className="space-y-4">
          <FilterBar>
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الامتحان" className="pr-10" />
            </div>
            <Select value={examFilter} onValueChange={setExamFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الامتحانات</SelectItem>
                <SelectItem value="available">متاحة الآن</SelectItem>
                <SelectItem value="upcoming">قادمة</SelectItem>
                <SelectItem value="completed">تم تقديمها</SelectItem>
                <SelectItem value="passed">ناجحة</SelectItem>
                <SelectItem value="failed">تحتاج تحسين</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
          <p className="text-xs text-muted-foreground">عرض {filteredExams.length} من {exams.length} امتحان</p>
          {filteredExams.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredExams.map((exam: any) => <ExamCard key={exam.id} exam={exam} isParent={isObserver} />)}
            </div>
          ) : <MiniEmpty text="لا توجد امتحانات مطابقة للفلاتر المختارة." />}
        </TabsContent>

        <TabsContent value="attendance" className="space-y-4">
          <FilterBar>
            <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الحالات</SelectItem>
                <SelectItem value="present">حاضر</SelectItem>
                <SelectItem value="absent">غائب</SelectItem>
                <SelectItem value="late">متأخر</SelectItem>
                <SelectItem value="excused">بعذر</SelectItem>
              </SelectContent>
            </Select>
            <Select value={attendancePeriod} onValueChange={setAttendancePeriod}>
              <SelectTrigger className="w-full sm:w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">كل الفترات</SelectItem>
                <SelectItem value="30">آخر 30 يومًا</SelectItem>
                <SelectItem value="90">آخر 3 أشهر</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
          <div className="student-attendance-wrap overflow-x-auto rounded-2xl border border-border bg-card/80">
            <table className="student-attendance-table w-full min-w-[650px] text-sm">
              <thead className="bg-muted/60 text-muted-foreground"><tr><th>الحصة</th><th>التاريخ</th><th>الحالة</th><th>ملاحظات المدرس</th></tr></thead>
              <tbody>
                {filteredAttendance.map((record: any) => (
                  <tr key={`${record.session_id}-${record.status}`} className="border-t border-border/70">
                    <td data-label="الحصة" className="font-bold">{record.session?.title ?? "حصة دراسية"}</td>
                    <td data-label="التاريخ">{fmt(record.session?.session_date, true)}</td>
                    <td data-label="الحالة"><Badge className={`${attendanceTones[record.status]} border-0`}>{attendanceLabels[record.status]}</Badge></td>
                    <td data-label="ملاحظات المدرس" className="text-muted-foreground">{record.notes || "—"}</td>
                  </tr>
                ))}
                {!filteredAttendance.length && <tr><td colSpan={4} className="py-10 text-center text-muted-foreground">لا توجد سجلات مطابقة للفلاتر.</td></tr>}
              </tbody>
            </table>
          </div>
        </TabsContent>

        <TabsContent value="lectures" className="space-y-4">
          <FilterBar>
            <Select value={lectureFilter} onValueChange={setLectureFilter}>
              <SelectTrigger className="w-full sm:w-52"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="active">القادمة والمباشرة</SelectItem>
                <SelectItem value="live">مباشر الآن</SelectItem>
                <SelectItem value="upcoming">قادمة</SelectItem>
                <SelectItem value="ended">سابقة</SelectItem>
                <SelectItem value="all">كل المحاضرات</SelectItem>
              </SelectContent>
            </Select>
          </FilterBar>
          {filteredLectures.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {filteredLectures.map((lecture: any) => <LectureCard key={lecture.id} lecture={lecture} />)}
            </div>
          ) : <MiniEmpty text="لا توجد محاضرات مطابقة للفلاتر المختارة." />}
        </TabsContent>

        <TabsContent value="profile">
          <section className="portal-panel">
            <PanelTitle icon={UserRound} title="بيانات الطالب" text="البيانات المسجلة لدى منصة عُبيدة" />
            <div className="profile-details-grid">
              {[
                [UserRound, "الاسم بالكامل", profile.full_name],
                [GraduationCap, "الصف الدراسي", profile.level_name],
                [School, "المدرسة", profile.school_name],
                [MapPin, "المحافظة", profile.governorate],
                [Phone, "هاتف الطالب", profile.phone],
                [UsersRound, "هاتف ولي الأمر", profile.guardian_phone],
                [Mail, "البريد الإلكتروني", profile.email],
                [CalendarDays, "تاريخ الانضمام", fmt(profile.created_at, true)],
              ].map(([Icon, label, value]: any) => (
                <div key={label}><span><Icon className="h-4 w-4" /></span><small>{label}</small><strong>{value || "غير مسجل"}</strong></div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function PanelTitle({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return <div className="portal-panel-title"><span><Icon className="h-5 w-5" /></span><div><h3>{title}</h3><p>{text}</p></div></div>;
}

function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="portal-filter-bar">{children}</div>;
}

function MiniEmpty({ text }: { text: string }) {
  return <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">{text}</div>;
}

function QuickAction({ icon: Icon, eyebrow, title, text, action, live, exam, parentLocked }: any) {
  return (
    <article className={`quick-action-card ${live ? "live" : ""}`}>
      <span><Icon className="h-6 w-6" /></span>
      <div className="min-w-0 flex-1"><small>{eyebrow}</small><h3 className="truncate">{title}</h3><p>{text}</p></div>
      {action && <Button asChild size="sm" className={live ? "bg-red-500 hover:bg-red-600" : ""}><a href={action.href} target="_blank" rel="noopener noreferrer">{action.label}<ExternalLink className="h-3.5 w-3.5" /></a></Button>}
      {exam && <Button asChild size="sm"><Link to="/exam/$examId" params={{ examId: exam.id }}>{exam.attempt?.status === "in_progress" ? "متابعة" : "ابدأ الآن"}</Link></Button>}
      {parentLocked && <Badge variant="secondary">للطالب فقط</Badge>}
    </article>
  );
}

function ExamCard({ exam, isParent }: { exam: any; isParent: boolean }) {
  const state = examState(exam);
  const labels: Record<string, string> = { available: "متاح الآن", upcoming: "قريبًا", ended: "انتهى", passed: "ناجح", failed: "يحتاج تحسين", grading: "قيد التصحيح", in_progress: "قيد الحل" };
  const done = ["passed", "failed", "grading"].includes(state);
  const stats = exam.attempt?.question_stats;
  return (
    <article className="portal-exam-card">
      <div className="flex items-start justify-between gap-3">
        <span className="portal-card-icon"><ClipboardList className="h-5 w-5" /></span>
        <Badge variant={state === "failed" || state === "ended" ? "destructive" : state === "available" ? "default" : "secondary"}>{labels[state]}</Badge>
      </div>
      <h3>{exam.title}</h3>
      <div className="portal-card-meta"><span><Clock /> {exam.duration_minutes} دقيقة</span><span><Target /> {exam.total_points} درجة</span></div>
      <div className="portal-card-dates"><span>يفتح: {fmt(exam.opens_at)}</span><span>يغلق: {fmt(exam.closes_at)}</span></div>
      {done && exam.attempt?.percentage != null ? (
        <div className={`exam-result-summary ${exam.attempt.passed ? "is-passed" : "is-failed"}`}>
          <div className="exam-result-heading">
            <div><span>درجتك</span><strong>{exam.attempt.score ?? 0} <small>من {exam.total_points}</small></strong></div>
            <b>{Math.round(exam.attempt.percentage)}%</b>
          </div>
          <Progress value={exam.attempt.percentage} className="h-2" />
          {stats && (
            <div className="exam-answer-stats">
              <div className="total"><ClipboardList /><span>الأسئلة</span><strong>{stats.total}</strong></div>
              <div className="correct"><CheckCircle2 /><span>صح</span><strong>{stats.correct}</strong></div>
              <div className="wrong"><XCircle /><span>غلط</span><strong>{stats.wrong}</strong></div>
              {stats.unanswered > 0 && <div className="unanswered"><AlertCircle /><span>متروك</span><strong>{stats.unanswered}</strong></div>}
              {stats.pending > 0 && <div className="pending"><Clock /><span>قيد التصحيح</span><strong>{stats.pending}</strong></div>}
            </div>
          )}
        </div>
      ) : done && state === "grading" ? (
        <div className="exam-result-summary is-grading">
          <div className="exam-result-heading"><div><span>الدرجة الحالية</span><strong>{exam.attempt?.objective_score ?? 0} <small>من {exam.total_points}</small></strong></div><b><Clock /></b></div>
          {stats && <div className="exam-answer-stats"><div className="total"><ClipboardList /><span>الأسئلة</span><strong>{stats.total}</strong></div><div className="correct"><CheckCircle2 /><span>صح</span><strong>{stats.correct}</strong></div><div className="wrong"><XCircle /><span>غلط</span><strong>{stats.wrong}</strong></div>{stats.unanswered > 0 && <div className="unanswered"><AlertCircle /><span>متروك</span><strong>{stats.unanswered}</strong></div>}<div className="pending"><Clock /><span>قيد التصحيح</span><strong>{stats.pending}</strong></div></div>}
        </div>
      ) : state === "available" || state === "in_progress" ? (
        isParent ? <Button disabled variant="secondary" className="w-full">حل الامتحان متاح من حساب الطالب</Button> : <Button asChild className="w-full"><Link to="/exam/$examId" params={{ examId: exam.id }}>{state === "in_progress" ? "متابعة الامتحان" : "بدء الامتحان"}</Link></Button>
      ) : null}
    </article>
  );
}

function LectureCard({ lecture }: { lecture: any }) {
  const state = lectureState(lecture);
  const platform = meetingPlatform(lecture.join_url);
  return (
    <article className={`portal-lecture-card ${state === "live" ? "live" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <span className={`portal-card-icon text-white ${platform.tone}`}>{state === "live" ? <Radio className="h-5 w-5 animate-pulse" /> : <Video className="h-5 w-5" />}</span>
        <Badge variant={state === "ended" ? "secondary" : state === "live" ? "destructive" : "default"}>{state === "live" ? "مباشر الآن" : state === "upcoming" ? "قادمة" : "انتهت"}</Badge>
      </div>
      <h3>{lecture.title}</h3>
      {lecture.description && <p className="line-clamp-2">{lecture.description}</p>}
      <div className="portal-card-meta"><span><CalendarDays /> {fmt(lecture.scheduled_at)}</span><span><Clock /> {lecture.duration_minutes} دقيقة</span></div>
      {state !== "ended" && <Button asChild className={`w-full ${state === "live" ? "bg-red-500 hover:bg-red-600" : ""}`}><a href={lecture.join_url} target="_blank" rel="noopener noreferrer">{state === "live" ? "انضم إلى الدرس" : "فتح رابط المحاضرة"}<ExternalLink className="h-4 w-4" /></a></Button>}
    </article>
  );
}
