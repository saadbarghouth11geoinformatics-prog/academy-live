import {
  BarChart3,
  BookOpenCheck,
  CalendarCheck,
  Camera,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  LayoutDashboard,
  Radio,
  UserRound,
  Video,
  X,
  Zap,
} from "lucide-react";
import React from "react";

interface StudentProfile {
  id?: string | null;
  avatar_url?: string | null;
  full_name?: string | null;
  level_name?: string | null;
  registration_completed?: boolean | null;
}

interface StudentSummary {
  attendance_rate?: number | null;
  avg_percentage?: number | null;
  exams_passed?: number | null;
  exams_taken?: number | null;
}

interface StudentExam {
  opens_at: string;
  closes_at: string;
  attempt?: { status?: string | null } | null;
}

interface StudentLecture {
  scheduled_at: string;
  duration_minutes?: number | null;
}

export interface StudentSidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  mobileOpen?: boolean;
  onCloseMobile?: () => void;
  profile: StudentProfile | null;
  summary: StudentSummary | null;
  exams: StudentExam[];
  lectures: StudentLecture[];
  activeExam: StudentExam | null;
  nextLecture: StudentLecture | null;
  isParent?: boolean;
  isTeacher?: boolean;
  onOpenAvatarDialog?: () => void;
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
}

function getExamState(exam: StudentExam) {
  if (exam.attempt && exam.attempt.status !== "in_progress") return "done";
  if (exam.attempt?.status === "in_progress") return "in_progress";
  const now = Date.now();
  if (now < new Date(exam.opens_at).getTime()) return "upcoming";
  if (now > new Date(exam.closes_at).getTime()) return "ended";
  return "available";
}

export function StudentSidebar({
  activeTab,
  onSelectTab,
  onCloseMobile,
  profile,
  summary,
  exams,
  lectures,
  nextLecture,
  activeExam,
  isParent = false,
  onOpenAvatarDialog,
}: StudentSidebarProps) {
  const attendanceRate = summary?.attendance_rate ?? 0;
  const avgPercentage = summary?.avg_percentage ?? 0;
  const examsPassed = summary?.exams_passed ?? 0;
  const examsTaken = summary?.exams_taken ?? 0;
  const studentCode = profile?.id ? `STU-${profile.id.slice(0, 6).toUpperCase()}` : null;
  const isLectureLive = (() => {
    if (!nextLecture?.scheduled_at) return false;
    const start = new Date(nextLecture.scheduled_at).getTime();
    const end = start + (Number(nextLecture.duration_minutes) || 60) * 60_000;
    return Date.now() >= start && Date.now() <= end;
  })();
  const availableExams = exams?.filter((exam) => getExamState(exam) === "available").length ?? 0;
  const upcomingLectures =
    lectures?.filter((lecture) => Date.now() < new Date(lecture.scheduled_at).getTime()).length ??
    0;
  const profileStatus = profile?.registration_completed ? "مكتمل" : undefined;

  const tap = (key: string) => {
    onSelectTab(key);
    onCloseMobile?.();
  };

  const quickStats = [
    { label: "الأداء", value: `${avgPercentage}%`, color: "#60a5fa" },
    { label: "الحضور", value: `${attendanceRate}%`, color: "#34d399" },
    {
      label: "النتائج",
      value: examsTaken ? `${examsPassed}/${examsTaken}` : "—",
      color: "#a78bfa",
    },
    { label: "المتاح", value: availableExams, color: "#fbbf24" },
  ];

  const navSections = [
    {
      title: "مسارك الدراسي",
      items: [
        {
          key: "overview",
          label: "نظرة عامة",
          icon: LayoutDashboard,
          description: "ملخص تقدمك الدراسي",
        },
        {
          key: "courses",
          label: "المناهج والمواد",
          icon: BookOpenCheck,
          description: "الدروس والموارد المتاحة ضمن مسارك",
        },
        {
          key: "lectures",
          label: "المحاضرات والجلسات",
          icon: Video,
          description: "الجدول وروابط الجلسات",
          badge: isLectureLive
            ? "مباشر"
            : upcomingLectures
              ? `${upcomingLectures} قادمة`
              : undefined,
          badgeLive: isLectureLive,
        },
      ],
    },
    {
      title: "التقييم والمتابعة",
      items: [
        {
          key: "exams",
          label: "الاختبارات والنتائج",
          icon: ClipboardList,
          description: "الاختبارات والدرجات المسجلة",
          badge: availableExams ? `${availableExams} متاح` : undefined,
        },
        {
          key: "attendance",
          label: "الحضور والغياب",
          icon: CalendarCheck,
          description: "متابعة انتظامك في الجلسات",
          badge: `${attendanceRate}%`,
        },
      ],
    },
    {
      title: "الحساب",
      items: [
        {
          key: "profile",
          label: "بيانات الطالب",
          icon: UserRound,
          description: "المعلومات الشخصية والمدرسة",
          badge: profileStatus,
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
            <small>بوابة الطالب</small>
          </div>
        </div>
        {onCloseMobile && (
          <button
            type="button"
            onClick={onCloseMobile}
            className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            aria-label="إغلاق القائمة"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="student-sidebar-profile">
        <div className="student-sidebar-profile-row">
          <div className="student-sidebar-avatar">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name || "صورة الطالب"} />
            ) : (
              <span>{initials(profile?.full_name || "طالب")}</span>
            )}
            {!isParent && onOpenAvatarDialog && (
              <button
                type="button"
                onClick={onOpenAvatarDialog}
                className="student-sidebar-avatar-edit"
                aria-label="تغيير الصورة الشخصية"
              >
                <Camera className="h-3 w-3" />
              </button>
            )}
          </div>
          <div className="student-sidebar-profile-meta">
            <strong>{profile?.full_name || "الطالب"}</strong>
            <span>{profile?.level_name || "المرحلة الدراسية"}</span>
            {studentCode && <small>{studentCode}</small>}
          </div>
        </div>
      </div>

      <div className="sidebar-quick-stats" aria-label="ملخص الأداء">
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

      {isLectureLive && (
        <button type="button" onClick={() => tap("lectures")} className="sidebar-live-banner">
          <Radio className="h-3.5 w-3.5 animate-pulse" />
          <span>محاضرة مباشرة جارية الآن</span>
        </button>
      )}
      {activeExam && (
        <button type="button" onClick={() => tap("exams")} className="sidebar-exam-alert">
          <Zap className="h-3.5 w-3.5" />
          <span>يوجد اختبار متاح للحل</span>
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
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => tap(item.key)}
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
        <div className="sidebar-footer-heading">اختصارات سريعة</div>
        <div className="sidebar-footer-actions" aria-label="اختصارات سريعة">
          <button
            type="button"
            onClick={() => tap("overview")}
            className="sidebar-footer-btn"
            aria-label="نظرة عامة"
          >
            <BarChart3 className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => tap("courses")}
            className="sidebar-footer-btn"
            aria-label="المناهج"
          >
            <BookOpenCheck className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => tap("exams")}
            className="sidebar-footer-btn"
            aria-label="الاختبارات"
          >
            <ClipboardList className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => tap("profile")}
            className="sidebar-footer-btn"
            aria-label="بيانات الطالب"
          >
            <UserRound className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </>
  );
}
