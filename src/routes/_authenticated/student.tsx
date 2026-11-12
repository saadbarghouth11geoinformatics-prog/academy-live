import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  CalendarDays,
  Camera,
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
  LayoutDashboard,
  Menu,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { StudentAvatarDialog } from "@/components/student-avatar-dialog";
import { StudentSidebar } from "@/components/student-sidebar";
import { EnterpriseLayout } from "@/components/enterprise-layout";
import { RecordedCoursesView } from "@/components/recorded-courses-view";
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

function studentAccountState(status?: string | null) {
  switch (status?.toLowerCase()) {
    case "inactive":
      return { label: "الحساب غير نشط", tone: "inactive" };
    case "suspended":
    case "blocked":
      return { label: "الحساب موقوف", tone: "suspended" };
    default:
      return { label: "حساب نشط", tone: "active" };
  }
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

  if (portal.isLoading) {
    return (
      <AppShell title={title} subtitle={subtitle}>
        <PortalLoading />
      </AppShell>
    );
  }

  if (portal.isError) {
    return (
      <AppShell title={title} subtitle={subtitle}>
        <EmptyState
          icon={AlertCircle}
          title="تعذّر تحميل بيانات الطالب"
          text="حدّث الصفحة، وإذا استمرت المشكلة تأكد من ربط حساب ولي الأمر بالطالب."
        />
      </AppShell>
    );
  }

  if (!portal.data?.dashboard) {
    return (
      <AppShell title={title} subtitle={subtitle}>
        <EmptyState
          icon={UsersRound}
          title={
            isTeacher
              ? "لا يوجد طلاب مسجلون"
              : isParent
                ? "لا يوجد طالب مرتبط بحسابك"
                : "بيانات الطالب غير مكتملة"
          }
          text={
            isTeacher
              ? "سجّل أول طالب من قسم إدارة الطلاب لتظهر لوحة المعاينة هنا."
              : isParent
                ? "اطلب من المدرس ربط حساب ولي الأمر بحساب الطالب لتظهر جميع بياناته هنا."
                : "تواصل مع المدرس لإكمال بيانات الصف والاشتراك الدراسي."
          }
        />
      </AppShell>
    );
  }

  return (
    <StudentDashboard
      payload={portal.data}
      isParent={isParent}
      isTeacher={isTeacher}
      selectedStudentId={portal.data.selected_student_id}
      onStudentChange={setStudentId}
    />
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
  const accountState = studentAccountState(profile?.status);

  // Cache user profile for instant personalized splash/loading screen
  useEffect(() => {
    if (profile?.id && typeof window !== "undefined") {
      try {
        localStorage.setItem(
          "academy_user_profile",
          JSON.stringify({
            name: profile.full_name,
            avatar: profile.avatar_url,
            level: profile.level_name || "الصف الثاني الثانوي",
            code: `STU-${profile.id.slice(0, 6).toUpperCase()}`,
            role: "student",
          }),
        );
      } catch {}
    }
  }, [profile]);
  const [examFilter, setExamFilter] = useState("all");
  const [examLevelFilter, setExamLevelFilter] = useState("all");
  const [attendanceFilter, setAttendanceFilter] = useState("all");
  const [attendancePeriod, setAttendancePeriod] = useState("all");
  const [lectureFilter, setLectureFilter] = useState("active");
  const [lectureLevelFilter, setLectureLevelFilter] = useState("all");
  const [lectureSearch, setLectureSearch] = useState("");
  const [search, setSearch] = useState("");
  const [avatarDialogOpen, setAvatarDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [mobileOpen, setMobileOpen] = useState(false);

  const availableLevels = useMemo(
    () => [...new Set(exams.map((e: any) => e.level_name).filter(Boolean))] as string[],
    [exams],
  );

  const availableLectureLevels = useMemo(
    () => [...new Set(lectures.map((l: any) => l.level_name).filter(Boolean))] as string[],
    [lectures],
  );

  const tabLabels: Record<string, string> = {
    overview: "نظرة عامة والتحليلات",
    courses: "الكورسات والمنهاج المسجل",
    exams: "بنك الامتحانات والنتائج",
    attendance: "سجل الحضور والغياب",
    lectures: "المحاضرات المباشرة",
    profile: "بيانات الطالب والاشتراك",
  };

  const filteredExams = useMemo(
    () =>
      exams.filter((exam: any) => {
        const matchesSearch = exam.title.toLowerCase().includes(search.trim().toLowerCase());
        const state = examState(exam);
        const matchesState =
          examFilter === "all" ||
          state === examFilter ||
          (examFilter === "completed" && ["passed", "failed", "grading"].includes(state));
        const matchesLevel = examLevelFilter === "all" || exam.level_name === examLevelFilter;
        return matchesSearch && matchesState && matchesLevel;
      }),
    [exams, examFilter, examLevelFilter, search],
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
          const matchesSearch =
            !lectureSearch.trim() ||
            lecture.title.toLowerCase().includes(lectureSearch.trim().toLowerCase()) ||
            (lecture.description &&
              lecture.description.toLowerCase().includes(lectureSearch.trim().toLowerCase()));
          const matchesLevel =
            lectureLevelFilter === "all" || lecture.level_name === lectureLevelFilter;
          const state = lectureState(lecture);
          const matchesState =
            lectureFilter === "all" ||
            (lectureFilter === "active" ? state !== "ended" : state === lectureFilter);
          return matchesSearch && matchesLevel && matchesState;
        })
        .sort(
          (a: any, b: any) =>
            new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime(),
        ),
    [lectures, lectureFilter, lectureLevelFilter, lectureSearch],
  );

  const nextLecture = lectures
    .filter((lecture: any) => lectureState(lecture) !== "ended")
    .sort(
      (a: any, b: any) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime(),
    )[0];
  const activeExam = exams.find((exam: any) =>
    ["available", "in_progress"].includes(examState(exam)),
  );
  const recentAttempts = attempts.filter((attempt: any) => attempt.percentage != null).slice(0, 5);
  const average = summary.avg_percentage ?? 0;
  const attendanceRate = summary.attendance_rate ?? 0;

  return (
    <Tabs
      value={activeTab}
      onValueChange={(val) => {
        setActiveTab(val);
        navigateDashboardTab(".enterprise-sidebar-nav");
      }}
      className="dashboard-tabs"
      dir="rtl"
    >
      <EnterpriseLayout
        sidebar={
          <StudentSidebar
            activeTab={activeTab}
            onSelectTab={(tab) => {
              setActiveTab(tab);
              navigateDashboardTab(".enterprise-sidebar-nav");
            }}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
            profile={profile}
            summary={summary}
            exams={exams}
            lectures={lectures}
            activeExam={activeExam}
            nextLecture={nextLecture}
            isParent={isParent}
            isTeacher={isTeacher}
            onOpenAvatarDialog={() => setAvatarDialogOpen(true)}
          />
        }
        userName={profile?.full_name || "الطالب"}
        userRole={profile?.level_name || "المرحلة الثانوية"}
        userCode={`STU-${profile?.id?.slice(0, 6)?.toUpperCase() || "001"}`}
        userAvatar={profile?.avatar_url}
        subtitle={
          isParent
            ? "متابعة شاملة لدرجات وامتحانات وحضور الطالب مع إشعارات مباشرة بالتحديثات الأكاديمية."
            : "مرحباً بك في مساحتك الدراسية الذكية، يمكنك متابعة تقدمك ومواعيد الحصص ونتائج الامتحانات."
        }
        mobileOpen={mobileOpen}
        onToggleMobile={() => setMobileOpen((o) => !o)}
      >
        {isObserver && (
          <div className="parent-mode-banner mb-6">
            <div className="flex items-center gap-3">
              <span>
                <UsersRound className="h-5 w-5" />
              </span>
              <div>
                <strong>{isTeacher ? "وضع معاينة المدرس" : "وضع متابعة ولي الأمر"}</strong>
                <p>
                  {isTeacher
                    ? "اختر طالبًا لمعاينة لوحته كاملة. تظل أدوات الإدارة متاحة من قسم إدارة المنصة."
                    : "أنت تشاهد التقرير التفصيلي للطالب، ولا يمكن حل الامتحان من حساب ولي الأمر."}
                </p>
              </div>
            </div>
            {students.length > 0 && (
              <Select value={selectedStudentId} onValueChange={onStudentChange}>
                <SelectTrigger className="w-full bg-white/80 sm:w-64">
                  <SelectValue placeholder="اختر الطالب" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student: any) => (
                    <SelectItem key={student.id} value={student.id}>
                      {student.full_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        )}

        <div className="student-dashboard-content space-y-6">
          <section className="student-profile-hero" aria-labelledby="student-profile-title">
            <span className="student-profile-hero-grid" aria-hidden />
            <span className="student-profile-hero-orbit" aria-hidden />
            <div className="student-profile-primary">
              <div className="student-profile-avatar-wrap group">
                <button
                  type="button"
                  onClick={() => !isParent && setAvatarDialogOpen(true)}
                  disabled={isParent}
                  className={`student-avatar text-right ${
                    !isParent ? "cursor-pointer transition group-hover:scale-[1.03]" : ""
                  }`}
                  title={!isParent ? "تغيير الصورة الشخصية" : profile.full_name}
                  aria-label="تغيير الصورة الشخصية"
                >
                  {profile.avatar_url ? (
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name || "طالب"}
                      className="student-avatar-img"
                    />
                  ) : (
                    <UserRound aria-hidden />
                  )}
                  <small>{initials(profile.full_name || "طالب")}</small>
                </button>
                {!isParent && (
                  <button
                    type="button"
                    onClick={() => setAvatarDialogOpen(true)}
                    className="student-avatar-edit-badge"
                    title="تغيير الصورة الشخصية"
                    aria-label="تغيير الصورة الشخصية"
                  >
                    <Camera className="h-3.5 w-3.5" />
                  </button>
                )}
                {!isParent && (
                  <span className="student-avatar-edit-hint" aria-hidden>
                    <Camera /> تغيير الصورة
                  </span>
                )}
              </div>
              <div className="student-profile-identity min-w-0">
                <div className="student-profile-kicker">
                  <span className={`student-profile-status is-${accountState.tone}`}>
                    <i aria-hidden /> {accountState.label}
                  </span>
                  <span className="student-profile-code">
                    STU-{profile.id?.slice(0, 6).toUpperCase() || "001"}
                  </span>
                </div>
                <div className="student-profile-name-row">
                  <h2 id="student-profile-title" className="truncate">
                    {profile.full_name}
                  </h2>
                </div>
                <p className="student-profile-level">
                  <GraduationCap aria-hidden /> {profile.level_name ?? "المرحلة الثانوية"}
                </p>
                <div className="student-profile-tags">
                  <span>
                    <School aria-hidden />
                    <b>المدرسة</b> {profile.school_name || "غير مسجلة"}
                  </span>
                  <span>
                    <MapPin aria-hidden />
                    <b>المحافظة</b> {profile.governorate || "غير مسجلة"}
                  </span>
                  <span dir="ltr">
                    <Phone aria-hidden /> {profile.phone || "—"}
                  </span>
                  <span dir="ltr">
                    <Mail aria-hidden /> {profile.email}
                  </span>
                </div>
              </div>
            </div>
            <div className="student-profile-score" aria-label={`متوسط الأداء ${average}%`}>
              <div className="student-profile-score-heading">
                <span>بصمة التعلّم</span>
                <small>متوسط الأداء</small>
              </div>
              <span
                className="relative grid h-28 w-28 place-items-center rounded-full"
                style={{
                  background: `conic-gradient(var(--primary) ${average * 3.6}deg, oklch(0.93 0.02 240) 0deg)`,
                }}
              >
                <span className="grid h-22 w-22 place-items-center rounded-full bg-card text-center shadow-inner">
                  <strong className="text-2xl font-black text-primary">{average}%</strong>
                  <small className="block text-[10px] text-muted-foreground">الأداء</small>
                </span>
              </span>
              <p>
                <CheckCircle2 aria-hidden />{" "}
                {summary.exams_taken
                  ? `${summary.exams_taken} امتحان تمّت متابعته`
                  : "ابدأ أول امتحان لتظهر بصمتك"}
              </p>
            </div>
          </section>

          <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {[
              {
                icon: TrendingUp,
                label: "متوسط النتائج",
                value: `${average}%`,
                helper: `${summary.exams_taken} امتحان`,
                tone: "from-blue-600 to-cyan-500",
              },
              {
                icon: CalendarCheck,
                label: "نسبة الحضور",
                value: `${attendanceRate}%`,
                helper: `${summary.total_sessions} حصة`,
                tone: "from-emerald-600 to-teal-500",
              },
              {
                icon: Trophy,
                label: "امتحانات ناجحة",
                value: summary.exams_passed,
                helper: `من ${summary.exams_taken}`,
                tone: "from-amber-500 to-orange-500",
              },
              {
                icon: Target,
                label: "القادم",
                value: Number(!!nextLecture) + Number(!!activeExam),
                helper: "محاضرات وامتحانات",
                tone: "from-violet-600 to-fuchsia-500",
              },
            ].map(({ icon: Icon, label, value, helper, tone }, index) => (
              <article
                key={label}
                className="student-metric animate-fade-up"
                style={{ animationDelay: `${index * 60}ms` }}
              >
                <span className={`student-metric-icon bg-gradient-to-br ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <small>{label}</small>
                  <strong>{value}</strong>
                  <p>{helper}</p>
                </div>
              </article>
            ))}
          </section>

          <TabsContent value="courses" className="space-y-5">
            <RecordedCoursesView />
          </TabsContent>

          <TabsContent value="overview" className="space-y-5">
            <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
              <section className="portal-panel">
                <PanelTitle icon={TrendingUp} title="اتجاه الأداء" text="آخر خمس نتائج مسجلة" />
                {recentAttempts.length ? (
                  <div className="performance-bars">
                    {[...recentAttempts].reverse().map((attempt: any) => (
                      <div key={attempt.id} className="performance-bar-item">
                        <div className="performance-bar-track">
                          <span
                            style={{ height: `${Math.max(Number(attempt.percentage), 8)}%` }}
                            className={attempt.passed ? "passed" : "failed"}
                          />
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
                  <div className="mb-2 flex justify-between text-xs">
                    <span className="text-muted-foreground">الالتزام العام</span>
                    <strong>{attendanceRate}%</strong>
                  </div>
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
                action={
                  nextLecture
                    ? {
                        href: nextLecture.join_url,
                        label: lectureState(nextLecture) === "live" ? "انضم الآن" : "فتح الرابط",
                      }
                    : null
                }
                live={nextLecture && lectureState(nextLecture) === "live"}
              />
              <QuickAction
                icon={BookOpenCheck}
                eyebrow="الامتحان المتاح"
                title={activeExam?.title ?? "لا يوجد امتحان متاح الآن"}
                text={
                  activeExam
                    ? `${activeExam.duration_minutes} دقيقة · ${activeExam.total_points} درجة`
                    : "ستظهر الامتحانات الجديدة هنا"
                }
                exam={activeExam && !isObserver ? activeExam : null}
                parentLocked={!!activeExam && isObserver}
              />
            </section>
          </TabsContent>

          <TabsContent value="exams" className="space-y-4">
            <FilterBar>
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="ابحث باسم الامتحان..."
                  className="pr-10"
                />
              </div>
              {availableLevels.length > 0 && (
                <Select value={examLevelFilter} onValueChange={setExamLevelFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="كل الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الصفوف</SelectItem>
                    {availableLevels.map((lvl: string) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={examFilter} onValueChange={setExamFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="available">متاحة الآن</SelectItem>
                  <SelectItem value="upcoming">قادمة</SelectItem>
                  <SelectItem value="completed">تم تقديمها</SelectItem>
                  <SelectItem value="passed">ناجحة</SelectItem>
                  <SelectItem value="failed">تحتاج تحسين</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
            <p className="text-xs text-muted-foreground">
              عرض {filteredExams.length} من {exams.length} امتحان
            </p>
            {filteredExams.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredExams.map((exam: any) => (
                  <ExamCard key={exam.id} exam={exam} isParent={isObserver} />
                ))}
              </div>
            ) : (
              <MiniEmpty text="لا توجد امتحانات مطابقة للفلاتر المختارة." />
            )}
          </TabsContent>

          <TabsContent value="attendance" className="space-y-4">
            <FilterBar>
              <Select value={attendanceFilter} onValueChange={setAttendanceFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="present">حاضر</SelectItem>
                  <SelectItem value="absent">غائب</SelectItem>
                  <SelectItem value="late">متأخر</SelectItem>
                  <SelectItem value="excused">بعذر</SelectItem>
                </SelectContent>
              </Select>
              <Select value={attendancePeriod} onValueChange={setAttendancePeriod}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الفترات</SelectItem>
                  <SelectItem value="30">آخر 30 يومًا</SelectItem>
                  <SelectItem value="90">آخر 3 أشهر</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
            <div className="student-attendance-wrap overflow-x-auto rounded-2xl border border-border bg-card/80">
              <table className="student-attendance-table w-full min-w-[650px] text-sm">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th>الحصة</th>
                    <th>التاريخ</th>
                    <th>الحالة</th>
                    <th>ملاحظات المدرس</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAttendance.map((record: any) => (
                    <tr
                      key={`${record.session_id}-${record.status}`}
                      className="border-t border-border/70"
                    >
                      <td data-label="الحصة" className="font-bold">
                        {record.session?.title ?? "حصة دراسية"}
                      </td>
                      <td data-label="التاريخ">{fmt(record.session?.session_date, true)}</td>
                      <td data-label="الحالة">
                        <Badge className={`${attendanceTones[record.status]} border-0`}>
                          {attendanceLabels[record.status]}
                        </Badge>
                      </td>
                      <td data-label="ملاحظات المدرس" className="text-muted-foreground">
                        {record.notes || "—"}
                      </td>
                    </tr>
                  ))}
                  {!filteredAttendance.length && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-muted-foreground">
                        لا توجد سجلات مطابقة للفلاتر.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </TabsContent>

          <TabsContent value="lectures" className="space-y-4">
            <FilterBar>
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={lectureSearch}
                  onChange={(event) => setLectureSearch(event.target.value)}
                  placeholder="ابحث في المحاضرات..."
                  className="pr-10"
                />
              </div>
              {availableLectureLevels.length > 0 && (
                <Select value={lectureLevelFilter} onValueChange={setLectureLevelFilter}>
                  <SelectTrigger className="w-full sm:w-44">
                    <SelectValue placeholder="كل الصفوف" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الصفوف</SelectItem>
                    {availableLectureLevels.map((lvl: string) => (
                      <SelectItem key={lvl} value={lvl}>
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Select value={lectureFilter} onValueChange={setLectureFilter}>
                <SelectTrigger className="w-full sm:w-44">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كل الحالات</SelectItem>
                  <SelectItem value="active">القادمة والمباشرة</SelectItem>
                  <SelectItem value="live">مباشر الآن</SelectItem>
                  <SelectItem value="upcoming">قادمة</SelectItem>
                  <SelectItem value="ended">سابقة</SelectItem>
                </SelectContent>
              </Select>
            </FilterBar>
            <p className="text-xs text-muted-foreground">
              عرض {filteredLectures.length} من {lectures.length} محاضرة
            </p>
            {filteredLectures.length ? (
              <div className="grid gap-4 lg:grid-cols-2">
                {filteredLectures.map((lecture: any) => (
                  <LectureCard key={lecture.id} lecture={lecture} />
                ))}
              </div>
            ) : (
              <MiniEmpty text="لا توجد محاضرات مطابقة للفلاتر المختارة." />
            )}
          </TabsContent>

          <TabsContent value="profile">
            <section className="portal-panel">
              <PanelTitle
                icon={UserRound}
                title="بيانات الطالب"
                text="البيانات المسجلة لدى منصة الأستاذ عُبيدة"
              />
              <div className="mb-6 flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-gradient-to-l from-primary/5 via-card to-card p-5 sm:flex-row">
                <div className="relative">
                  <div className="student-avatar pointer-events-none">
                    {profile.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || "طالب"}
                        className="student-avatar-img"
                      />
                    ) : (
                      <UserRound aria-hidden />
                    )}
                    <small>{initials(profile.full_name || "طالب")}</small>
                  </div>
                </div>
                <div className="flex-1 text-center sm:text-right">
                  <h4 className="text-base font-bold text-foreground">الصورة الشخصية</h4>
                  <p className="mt-1 text-xs text-muted-foreground">
                    يمكنك رفع صورتك الخاصة لتظهر في لوحتك الدراسية وحسابك في المنصة، أو الاختيار من
                    الشخصيات الجاهزة.
                  </p>
                </div>
                {!isParent && (
                  <Button type="button" onClick={() => setAvatarDialogOpen(true)} className="gap-2">
                    <Camera className="h-4 w-4" />
                    تغيير الصورة
                  </Button>
                )}
              </div>
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
                  <div key={label}>
                    <span>
                      <Icon className="h-4 w-4" />
                    </span>
                    <small>{label}</small>
                    <strong>{value || "غير مسجل"}</strong>
                  </div>
                ))}
              </div>
            </section>
          </TabsContent>
        </div>
      </EnterpriseLayout>

      <StudentAvatarDialog
        open={avatarDialogOpen}
        onOpenChange={setAvatarDialogOpen}
        currentAvatar={profile.avatar_url ?? null}
        studentId={selectedStudentId}
        studentName={profile.full_name}
      />
    </Tabs>
  );
}

function PanelTitle({ icon: Icon, title, text }: { icon: any; title: string; text: string }) {
  return (
    <div className="portal-panel-title">
      <span>
        <Icon className="h-5 w-5" />
      </span>
      <div>
        <h3>{title}</h3>
        <p>{text}</p>
      </div>
    </div>
  );
}

function FilterBar({ children }: { children: React.ReactNode }) {
  return <div className="portal-filter-bar">{children}</div>;
}

function MiniEmpty({ text }: { text: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card/60 p-8 text-center text-sm text-muted-foreground">
      {text}
    </div>
  );
}

function QuickAction({ icon: Icon, eyebrow, title, text, action, live, exam, parentLocked }: any) {
  return (
    <article className={`quick-action-card ${live ? "live" : ""}`}>
      <span>
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <small>{eyebrow}</small>
        <h3 className="truncate">{title}</h3>
        <p>{text}</p>
      </div>
      {action && (
        <Button asChild size="sm" className={live ? "bg-red-500 hover:bg-red-600" : ""}>
          <a href={action.href} target="_blank" rel="noopener noreferrer">
            {action.label}
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
      )}
      {exam && (
        <Button asChild size="sm">
          <Link to="/exam/$examId" params={{ examId: exam.id }}>
            {exam.attempt?.status === "in_progress" ? "متابعة" : "ابدأ الآن"}
          </Link>
        </Button>
      )}
      {parentLocked && <Badge variant="secondary">للطالب فقط</Badge>}
    </article>
  );
}

function ExamCard({ exam, isParent }: { exam: any; isParent: boolean }) {
  const state = examState(exam);
  const labels: Record<string, string> = {
    available: "متاح الآن",
    upcoming: "قريبًا",
    ended: "انتهى",
    passed: "ناجح",
    failed: "يحتاج تحسين",
    grading: "قيد التصحيح",
    in_progress: "قيد الحل",
  };
  const done = ["passed", "failed", "grading"].includes(state);
  const stats = exam.attempt?.question_stats;
  return (
    <article className="portal-exam-card">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <span className="portal-card-icon">
            <ClipboardList className="h-5 w-5" />
          </span>
          {exam.level_name && (
            <Badge
              variant="outline"
              className="text-[11px] font-bold text-slate-700 bg-slate-100 border-slate-200"
            >
              {exam.level_name}
            </Badge>
          )}
        </div>
        <Badge
          className={`font-bold ${
            state === "available"
              ? "bg-blue-600 text-white hover:bg-blue-600"
              : state === "passed"
                ? "bg-emerald-600 text-white hover:bg-emerald-600"
                : state === "failed" || state === "ended"
                  ? "bg-slate-200 text-slate-700 hover:bg-slate-200"
                  : "bg-amber-500 text-white hover:bg-amber-500"
          }`}
        >
          {labels[state]}
        </Badge>
      </div>
      <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{exam.title}</h3>
      <div className="portal-card-meta">
        <span>
          <Clock className="h-3.5 w-3.5" /> {exam.duration_minutes} دقيقة
        </span>
        <span>
          <Target className="h-3.5 w-3.5" /> {exam.total_points} درجة
        </span>
      </div>
      <div className="portal-card-dates">
        <span>يفتح: {fmt(exam.opens_at)}</span>
        <span>يغلق: {fmt(exam.closes_at)}</span>
      </div>
      {done && exam.attempt?.percentage != null ? (
        <div className={`exam-result-summary ${exam.attempt.passed ? "is-passed" : "is-failed"}`}>
          <div className="exam-result-heading">
            <div>
              <span>درجتك</span>
              <strong>
                {exam.attempt.score ?? 0} <small>من {exam.total_points}</small>
              </strong>
            </div>
            <b>{Math.round(exam.attempt.percentage)}%</b>
          </div>
          <Progress value={exam.attempt.percentage} className="h-2" />
          {stats && (
            <div className="exam-answer-stats">
              <div className="total">
                <ClipboardList />
                <span>الأسئلة</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="correct">
                <CheckCircle2 />
                <span>صح</span>
                <strong>{stats.correct}</strong>
              </div>
              <div className="wrong">
                <XCircle />
                <span>غلط</span>
                <strong>{stats.wrong}</strong>
              </div>
              {stats.unanswered > 0 && (
                <div className="unanswered">
                  <AlertCircle />
                  <span>متروك</span>
                  <strong>{stats.unanswered}</strong>
                </div>
              )}
              {stats.pending > 0 && (
                <div className="pending">
                  <Clock />
                  <span>قيد التصحيح</span>
                  <strong>{stats.pending}</strong>
                </div>
              )}
            </div>
          )}
        </div>
      ) : done && state === "grading" ? (
        <div className="exam-result-summary is-grading">
          <div className="exam-result-heading">
            <div>
              <span>الدرجة الحالية</span>
              <strong>
                {exam.attempt?.objective_score ?? 0} <small>من {exam.total_points}</small>
              </strong>
            </div>
            <b>
              <Clock />
            </b>
          </div>
          {stats && (
            <div className="exam-answer-stats">
              <div className="total">
                <ClipboardList />
                <span>الأسئلة</span>
                <strong>{stats.total}</strong>
              </div>
              <div className="correct">
                <CheckCircle2 />
                <span>صح</span>
                <strong>{stats.correct}</strong>
              </div>
              <div className="wrong">
                <XCircle />
                <span>غلط</span>
                <strong>{stats.wrong}</strong>
              </div>
              {stats.unanswered > 0 && (
                <div className="unanswered">
                  <AlertCircle />
                  <span>متروك</span>
                  <strong>{stats.unanswered}</strong>
                </div>
              )}
              <div className="pending">
                <Clock />
                <span>قيد التصحيح</span>
                <strong>{stats.pending}</strong>
              </div>
            </div>
          )}
        </div>
      ) : state === "available" || state === "in_progress" ? (
        isParent ? (
          <Button disabled variant="secondary" className="w-full">
            حل الامتحان متاح من حساب الطالب
          </Button>
        ) : (
          <Button
            asChild
            className="w-full bg-blue-600 hover:bg-blue-700 font-bold text-white shadow-sm"
          >
            <Link to="/exam/$examId" params={{ examId: exam.id }}>
              {state === "in_progress" ? "متابعة الامتحان" : "بدء الامتحان الآن"}
            </Link>
          </Button>
        )
      ) : null}
    </article>
  );
}

function LectureCard({ lecture }: { lecture: any }) {
  const state = lectureState(lecture);
  const platform = meetingPlatform(lecture.join_url);
  return (
    <article className={`portal-lecture-card ${state === "live" ? "live" : ""}`}>
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <span className={`portal-card-icon text-white ${platform.tone}`}>
            {state === "live" ? (
              <Radio className="h-5 w-5 animate-pulse" />
            ) : (
              <Video className="h-5 w-5" />
            )}
          </span>
          {lecture.level_name && (
            <Badge
              variant="outline"
              className="text-[11px] font-bold text-slate-700 bg-slate-100 border-slate-200"
            >
              {lecture.level_name}
            </Badge>
          )}
          <span className="text-[11px] font-semibold text-slate-500">{platform.name}</span>
        </div>
        <Badge
          variant={state === "ended" ? "secondary" : state === "live" ? "destructive" : "default"}
        >
          {state === "live" ? "مباشر الآن" : state === "upcoming" ? "قادمة" : "انتهت"}
        </Badge>
      </div>
      <h3 className="mt-2 text-base font-bold text-slate-900 leading-snug">{lecture.title}</h3>
      {lecture.description && (
        <p className="line-clamp-2 text-xs text-slate-600 mt-1">{lecture.description}</p>
      )}
      <div className="portal-card-meta">
        <span>
          <CalendarDays className="h-3.5 w-3.5" /> {fmt(lecture.scheduled_at)}
        </span>
        <span>
          <Clock className="h-3.5 w-3.5" /> {lecture.duration_minutes} دقيقة
        </span>
      </div>
      {state !== "ended" && (
        <Button
          asChild
          className={`w-full font-bold ${state === "live" ? "bg-red-500 hover:bg-red-600" : "bg-blue-600 hover:bg-blue-700"}`}
        >
          <a href={lecture.join_url} target="_blank" rel="noopener noreferrer">
            {state === "live" ? "انضم إلى البث المباشر" : "فتح رابط المحاضرة"}
            <ExternalLink className="h-4 w-4" />
          </a>
        </Button>
      )}
    </article>
  );
}
