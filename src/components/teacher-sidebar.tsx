import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  ChevronDown,
  ClipboardList,
  Eye,
  GraduationCap,
  LayoutDashboard,
  Radio,
  ShieldCheck,
  UserCog,
  Users,
  Video,
  X,
} from "lucide-react";
import {
  listAttendanceSessions,
  listPlatformUsers,
  listStudents,
  listTeacherExams,
  listTeacherLectures,
} from "@/lib/academy.functions";

interface TeacherSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

interface TeacherExam {
  status?: string | null;
  opens_at?: string | null;
  closes_at?: string | null;
}

interface TeacherLecture {
  scheduled_at: string;
  duration_minutes?: number | null;
  title?: string | null;
}

function examTiming(exam: TeacherExam) {
  const now = Date.now();
  const opens = exam?.opens_at ? new Date(exam.opens_at).getTime() : 0;
  const closes = exam?.closes_at ? new Date(exam.closes_at).getTime() : Number.POSITIVE_INFINITY;

  if (exam?.status !== "published") return "draft";
  if (now < opens) return "upcoming";
  if (now <= closes) return "active";
  return "ended";
}

function lectureTiming(lecture: TeacherLecture) {
  const start = new Date(lecture.scheduled_at).getTime();
  const end = start + Number(lecture.duration_minutes) * 60_000;
  const now = Date.now();

  if (now < start) return "upcoming";
  if (now <= end) return "live";
  return "ended";
}

export function TeacherSidebar({ activeTab, onSelectTab, onCloseMobile }: TeacherSidebarProps) {
  const studentsFn = useServerFn(listStudents);
  const examsFn = useServerFn(listTeacherExams);
  const lecturesFn = useServerFn(listTeacherLectures);
  const sessionsFn = useServerFn(listAttendanceSessions);
  const usersFn = useServerFn(listPlatformUsers);

  const students = useQuery({ queryKey: ["students"], queryFn: () => studentsFn() });
  const exams = useQuery({ queryKey: ["teacher-exams"], queryFn: () => examsFn() });
  const lectures = useQuery({ queryKey: ["teacher-lectures"], queryFn: () => lecturesFn() });
  const sessions = useQuery({ queryKey: ["att-sessions"], queryFn: () => sessionsFn() });
  const users = useQuery({ queryKey: ["platform-users"], queryFn: () => usersFn() });

  const metrics = useMemo(() => {
    const studentList: unknown[] = students.data ?? [];
    const examList = (exams.data ?? []) as TeacherExam[];
    const lectureList = (lectures.data ?? []) as TeacherLecture[];
    const sessionList: unknown[] = sessions.data ?? [];
    const userList: unknown[] = users.data ?? [];
    const upcomingLecture = lectureList
      .filter((lecture) => lectureTiming(lecture) === "upcoming")
      .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())[0];

    return {
      totalStudents: studentList.length,
      totalUsers: userList.length,
      totalExams: examList.length,
      draftExams: examList.filter((exam) => examTiming(exam) === "draft").length,
      activeExams: examList.filter((exam) => examTiming(exam) === "active").length,
      totalLectures: lectureList.length,
      liveLectures: lectureList.filter((lecture) => lectureTiming(lecture) === "live").length,
      upcomingLectures: lectureList.filter((lecture) => lectureTiming(lecture) === "upcoming")
        .length,
      totalSessions: sessionList.length,
      upcomingLecture,
    };
  }, [students.data, exams.data, lectures.data, sessions.data, users.data]);

  const handleTabClick = (tabKey: string) => {
    onSelectTab(tabKey);
    onCloseMobile();
  };

  const quickStats = [
    { label: "الطلاب", value: metrics.totalStudents, color: "#60a5fa" },
    { label: "الاختبارات", value: metrics.totalExams, color: "#a78bfa" },
    { label: "جلسات الحضور", value: metrics.totalSessions, color: "#34d399" },
    { label: "المحاضرات", value: metrics.totalLectures, color: "#fbbf24" },
  ];

  const navSections = [
    {
      title: "لوحة الإدارة",
      items: [
        {
          key: "overview",
          label: "نظرة عامة",
          icon: LayoutDashboard,
          description: "ملخص الأداء والمتابعة اليومية",
        },
        {
          key: "courses",
          label: "المناهج والمواد",
          icon: BookOpenCheck,
          description: "تنظيم محتوى التعلم والموارد",
        },
      ],
    },
    {
      title: "الأشخاص والصلاحيات",
      items: [
        {
          key: "students",
          label: "سجل الطلاب",
          icon: Users,
          badge: metrics.totalStudents ? `${metrics.totalStudents}` : undefined,
          description: "بيانات الطلاب وتقدمهم الدراسي",
        },
        {
          key: "users",
          label: "المستخدمون والصلاحيات",
          icon: UserCog,
          badge: metrics.totalUsers ? `${metrics.totalUsers}` : undefined,
          description: "الحسابات والأدوار داخل المنصة",
        },
      ],
    },
    {
      title: "المحتوى والتقييم",
      items: [
        {
          key: "lectures",
          label: "المحاضرات والجلسات",
          icon: Video,
          badge: metrics.liveLectures
            ? "مباشر"
            : metrics.upcomingLectures
              ? `${metrics.upcomingLectures} قادمة`
              : undefined,
          badgeLive: metrics.liveLectures > 0,
          description: "الجدول وروابط البث المباشر",
        },
        {
          key: "exams",
          label: "بنك الاختبارات",
          icon: ClipboardList,
          badge: metrics.activeExams
            ? `${metrics.activeExams} متاح`
            : metrics.draftExams
              ? `${metrics.draftExams} مسودة`
              : undefined,
          description: "إنشاء الاختبارات وإدارتها",
        },
        {
          key: "results",
          label: "نتائج الاختبارات",
          icon: Eye,
          description: "مراجعة الإجابات والدرجات",
        },
      ],
    },
    {
      title: "المتابعة",
      items: [
        {
          key: "attendance",
          label: "الحضور والغياب",
          icon: CalendarCheck,
          badge: metrics.totalSessions ? `${metrics.totalSessions}` : undefined,
          description: "متابعة انتظام الطلاب في الجلسات",
        },
      ],
    },
    {
      title: "معاينة المنصة",
      items: [
        {
          key: "__student_preview__",
          label: "بوابة الطالب",
          icon: GraduationCap,
          description: "معاينة تجربة الطالب",
          isLink: "/student",
        },
      ],
    },
  ];

  return (
    <>
      <div className="enterprise-sidebar-header">
        <div className="enterprise-sidebar-brand">
          <span className="enterprise-sidebar-logo">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div className="enterprise-sidebar-title">
            <strong>منصة الأستاذ عبيدة</strong>
            <small>نظام التعليم والمتابعة</small>
          </div>
        </div>
        <button
          type="button"
          onClick={onCloseMobile}
          className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          aria-label="إغلاق القائمة"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="sidebar-quick-stats" aria-label="ملخص المنصة">
        {quickStats.map((stat) => (
          <div
            key={stat.label}
            className="sidebar-stat-chip"
            style={{ "--chip-color": stat.color } as React.CSSProperties}
          >
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      {metrics.liveLectures > 0 && (
        <button
          type="button"
          className="sidebar-live-banner"
          onClick={() => handleTabClick("lectures")}
        >
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>توجد {metrics.liveLectures} محاضرة مباشرة الآن</span>
        </button>
      )}

      {metrics.liveLectures === 0 && metrics.upcomingLecture && (
        <button
          type="button"
          className="sidebar-context-card"
          onClick={() => handleTabClick("lectures")}
        >
          <span>الجلسة التالية</span>
          <strong>{metrics.upcomingLecture.title || "محاضرة مجدولة"}</strong>
          <small>
            {new Intl.DateTimeFormat("ar-EG", {
              day: "numeric",
              month: "short",
              hour: "numeric",
              minute: "2-digit",
            }).format(new Date(metrics.upcomingLecture.scheduled_at))}
          </small>
        </button>
      )}

      <nav className="enterprise-sidebar-nav" aria-label="التنقل الرئيسي">
        {navSections.map((section) => (
          <section key={section.title} className="enterprise-nav-group">
            <div className="enterprise-group-header">
              <span>{section.title}</span>
              <ChevronDown />
            </div>
            <div className="space-y-0.5">
              {section.items.map((item) => {
                const Icon = item.icon;
                if (item.isLink) {
                  return (
                    <a
                      key={item.key}
                      href={item.isLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="enterprise-tab-item"
                    >
                      <span className="enterprise-tab-item-content">
                        <Icon />
                        <span className="enterprise-tab-item-text">
                          <span>{item.label}</span>
                          <small className="enterprise-tab-desc">{item.description}</small>
                        </span>
                      </span>
                    </a>
                  );
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => handleTabClick(item.key)}
                    className={`enterprise-tab-item ${activeTab === item.key ? "is-active" : ""}`}
                  >
                    <span className="enterprise-tab-item-content">
                      <Icon />
                      <span className="enterprise-tab-item-text">
                        <span>{item.label}</span>
                        <small className="enterprise-tab-desc">{item.description}</small>
                      </span>
                    </span>
                    {item.badge && (
                      <span className={`enterprise-tab-badge ${item.badgeLive ? "is-live" : ""}`}>
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </section>
        ))}
      </nav>

      <div className="enterprise-sidebar-footer">
        <div className="enterprise-footer-user">
          <span className="enterprise-footer-avatar-wrap" aria-hidden>
            <img src="/images/teacher-app-icon.png" alt="" className="enterprise-footer-avatar" />
          </span>
          <div className="enterprise-footer-meta">
            <strong className="enterprise-footer-name">الأستاذ عُبيدة</strong>
            <span className="enterprise-footer-sub">
              <ShieldCheck className="h-3 w-3 text-blue-400" />
              معلم اللغة العربية
            </span>
          </div>
        </div>
        <div className="sidebar-footer-actions" aria-label="اختصارات">
          <button
            type="button"
            onClick={() => handleTabClick("overview")}
            className="sidebar-footer-btn"
            aria-label="نظرة عامة"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("students")}
            className="sidebar-footer-btn"
            aria-label="الطلاب"
          >
            <Users className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("exams")}
            className="sidebar-footer-btn"
            aria-label="الاختبارات"
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => handleTabClick("attendance")}
            className="sidebar-footer-btn"
            aria-label="الحضور"
          >
            <CalendarCheck className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
