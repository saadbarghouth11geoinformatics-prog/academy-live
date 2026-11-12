import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { BookOpenCheck, CheckCircle2, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { homePathForRole, primaryRole, useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface CachedProfile {
  avatar?: string;
  name?: string;
  role?: AppRole;
}

const teacherPhoto = "/images/teacher-app-icon.png";

function readCachedProfile(): CachedProfile {
  if (typeof window === "undefined") return {};
  try {
    const value = localStorage.getItem("academy_user_profile");
    return value ? (JSON.parse(value) as CachedProfile) : {};
  } catch {
    return {};
  }
}

export function RoleGuard({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { roles, loading, user } = useAuth();
  const [profile, setProfile] = useState<CachedProfile>(readCachedProfile);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;

    const syncProfile = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", user.id)
        .maybeSingle();
      if (!active) return;

      const cached = readCachedProfile();
      const role = primaryRole(roles) ?? "student";
      const nextProfile: CachedProfile = {
        avatar: data?.avatar_url ?? cached.avatar,
        name: data?.full_name ?? user.user_metadata.full_name?.toString() ?? cached.name,
        role,
      };
      setProfile(nextProfile);
      try {
        localStorage.setItem("academy_user_profile", JSON.stringify(nextProfile));
      } catch {
        // Local storage can be unavailable in private browser sessions.
      }
    };

    void syncProfile();
    return () => {
      active = false;
    };
  }, [roles, user?.id, user?.user_metadata]);

  if (loading) {
    const isTeacher =
      roles.includes("teacher") || roles.includes("admin") || profile.role === "teacher";
    const displayName = isTeacher ? "الأستاذ عُبيدة" : profile.name || "الطالب";
    const identityPhoto = isTeacher ? profile.avatar || teacherPhoto : profile.avatar;
    const roleLabel = isTeacher ? "المعلم المشرف" : "طالب مسجّل";
    const levelLabel = isTeacher ? "اللغة العربية · الثانوية العامة" : "المساحة الدراسية";
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(-2)
      .map((word) => word[0])
      .join("");

    return (
      <main className="role-loading-screen dashboard-shell" dir="rtl" aria-live="polite">
        <span className="role-loading-grid" aria-hidden />
        <section className="role-loading-card" aria-label="جاري تجهيز الحساب">
          <header className="role-loading-header">
            <div className="role-loading-brand">
              <GraduationCap aria-hidden />
              <span>منصة الأستاذ عُبيدة</span>
            </div>
            <span className="role-loading-status">
              <i aria-hidden /> اتصال آمن
            </span>
          </header>

          <div className="role-loading-identity">
            <div className={`role-loading-logo ${identityPhoto ? "has-photo" : ""}`}>
              <span className="role-loading-logo-ring" aria-hidden />
              <div className="role-loading-logo-core">
                {identityPhoto ? (
                  <img
                    src={identityPhoto}
                    alt={`صورة ${displayName}`}
                    onError={() => setProfile((current) => ({ ...current, avatar: undefined }))}
                  />
                ) : (
                  <span aria-label={`الأحرف الأولى من اسم ${displayName}`}>
                    {initials || <GraduationCap />}
                  </span>
                )}
              </div>
              <span className="role-loading-verified-badge" title="حساب موثّق">
                <CheckCircle2 />
              </span>
            </div>

            <p className="role-loading-kicker">
              <i aria-hidden /> {roleLabel} <b>•</b> {levelLabel}
            </p>
            <h1>
              مرحباً بك، <strong>{displayName}</strong>
            </h1>
            <p className="role-loading-message">نتحقق من بيانات حسابك ونجهّز مساحتك التعليمية.</p>
          </div>

          <div className="role-loading-progress-wrap">
            <div className="role-loading-progress-label">
              <span>جاري تجهيز الحساب</span>
              <b>72%</b>
            </div>
            <div
              className="role-loading-progress"
              role="progressbar"
              aria-valuenow={72}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <span style={{ width: "72%" }} />
            </div>
          </div>

          <div className="role-loading-steps" aria-label="مراحل الدخول">
            {[
              { icon: UserCheck, label: "الحساب والأمان", state: "is-complete" },
              { icon: BookOpenCheck, label: "المحتوى والدروس", state: "is-active" },
              { icon: ShieldCheck, label: "جاهز للدخول", state: "" },
            ].map(({ icon: Icon, label, state }) => (
              <div key={label} className={state}>
                <span>
                  <Icon aria-hidden />
                </span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          <footer className="role-loading-footer">
            <ShieldCheck aria-hidden /> تُحمى بياناتك بمعايير أمان المنصة
          </footer>
        </section>
      </main>
    );
  }

  if (!roles.some((role) => allow.includes(role))) {
    return <Navigate to={homePathForRole(primaryRole(roles))} replace />;
  }

  return <>{children}</>;
}
