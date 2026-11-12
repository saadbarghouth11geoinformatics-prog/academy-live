import { useEffect, useState, type ReactNode } from "react";
import { Navigate } from "@tanstack/react-router";
import { BookOpenCheck, CheckCircle2, GraduationCap, ShieldCheck, UserCheck } from "lucide-react";
import { homePathForRole, primaryRole, useAuth, type AppRole } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";

interface CachedProfile {
  avatar?: string;
  name?: string;
  role?: string;
}

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

      const role = primaryRole(roles) ?? "student";
      const cached = readCachedProfile();
      const nextProfile: CachedProfile = {
        avatar: data?.avatar_url ?? cached.avatar,
        name: data?.full_name ?? user.user_metadata.full_name?.toString() ?? cached.name,
        role,
      };
      setProfile(nextProfile);
      try {
        localStorage.setItem("academy_user_profile", JSON.stringify(nextProfile));
      } catch {
        // The app works normally when browser storage is unavailable.
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
    const displayName = profile.name || (isTeacher ? "الأستاذ عُبيدة" : "الطالب");
    const roleLabel = isTeacher ? "المعلم المشرف" : "طالب معتمد";
    const levelLabel = isTeacher ? "اللغة العربية · الثانوية العامة" : "المرحلة الثانوية";
    const initials = displayName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join("");

    return (
      <div className="role-loading-screen dashboard-shell" dir="rtl">
        <span className="role-loading-orb role-loading-orb-one" aria-hidden />
        <span className="role-loading-orb role-loading-orb-two" aria-hidden />
        <span className="role-loading-grid" aria-hidden />
        <div className="role-loading-card">
          <div className="role-loading-logo">
            <span className="role-loading-logo-ring" />
            <span className="role-loading-logo-orbit">
              <i />
            </span>
            <div className={`role-loading-logo-core ${profile.avatar ? "has-avatar" : ""}`}>
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt={displayName}
                  onError={() => setProfile((current) => ({ ...current, avatar: undefined }))}
                />
              ) : (
                <span className="text-base font-black text-white">
                  {initials || <GraduationCap className="h-6 w-6" />}
                </span>
              )}
            </div>
            <span className="role-loading-verified-badge" title="حساب موثّق">
              <CheckCircle2 className="h-3 w-3" />
            </span>
          </div>

          <span className="role-loading-kicker">
            <i /> {roleLabel} · {levelLabel}
          </span>
          <h1 className="personalized">مرحباً بك، {displayName}</h1>
          <p className="role-loading-message">
            نتحقق من بيانات حسابك ونجهّز مساحتك التعليمية الآمنة.
          </p>
          <div className="role-loading-progress" aria-label="جاري تجهيز بيانات الحساب">
            <span style={{ width: "72%" }} />
          </div>
          <div className="role-loading-steps">
            {[
              { icon: UserCheck, label: "الحساب والأمان" },
              { icon: BookOpenCheck, label: "المنهج والدروس" },
              { icon: ShieldCheck, label: "جاهز للدخول" },
            ].map(({ icon: Icon, label }, index) => (
              <div
                key={label}
                className={index === 1 ? "is-active" : index === 0 ? "is-complete" : ""}
              >
                <span>
                  <Icon />
                </span>
                <small>{label}</small>
              </div>
            ))}
          </div>
          <div className="role-loading-footer">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" /> اتصال آمن ومشفّر · منصة الأستاذ
            عُبيدة
          </div>
        </div>
      </div>
    );
  }

  if (!roles.some((role) => allow.includes(role))) {
    return <Navigate to={homePathForRole(primaryRole(roles))} replace />;
  }
  return <>{children}</>;
}
