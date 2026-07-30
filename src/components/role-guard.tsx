import { ReactNode, useEffect, useState } from "react";
import { Navigate } from "@tanstack/react-router";
import { BookOpenCheck, GraduationCap, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import { useAuth, type AppRole, primaryRole, homePathForRole } from "@/hooks/use-auth";

export function RoleGuard({ allow, children }: { allow: AppRole[]; children: ReactNode }) {
  const { roles, loading } = useAuth();
  const [loadingStage, setLoadingStage] = useState(0);

  useEffect(() => {
    if (!loading) {
      setLoadingStage(0);
      return;
    }
    const timer = window.setInterval(
      () => setLoadingStage((current) => Math.min(current + 1, 2)),
      720,
    );
    return () => window.clearInterval(timer);
  }, [loading]);

  if (loading) {
    const messages = [
      "نتحقق من بيانات حسابك وصلاحيات الدخول…",
      "نجهّز المحتوى والبيانات المناسبة لك…",
      "اللمسات الأخيرة، مساحتك أصبحت جاهزة تقريبًا…",
    ];
    const steps = [
      { icon: UserRound, label: "الحساب" },
      { icon: BookOpenCheck, label: "المحتوى" },
      { icon: ShieldCheck, label: "الحماية" },
    ];
    return (
      <div className="role-loading-screen dashboard-shell" dir="rtl">
        <span className="role-loading-orb role-loading-orb-one" aria-hidden />
        <span className="role-loading-orb role-loading-orb-two" aria-hidden />
        <span className="role-loading-grid" aria-hidden />

        <div className="role-loading-card">
          <Sparkles className="role-loading-sparkle role-loading-sparkle-one" aria-hidden />
          <Sparkles className="role-loading-sparkle role-loading-sparkle-two" aria-hidden />

          <div className="role-loading-logo" aria-hidden>
            <span className="role-loading-logo-ring" />
            <span className="role-loading-logo-orbit"><i /></span>
            <span className="role-loading-logo-core"><GraduationCap /></span>
          </div>

          <span className="role-loading-kicker"><i /> اتصال آمن بالمنصة</span>
          <h1>بنجهّز لك كل حاجة</h1>
          <p key={loadingStage} className="role-loading-message">{messages[loadingStage]}</p>

          <div className="role-loading-progress" aria-label="جارٍ تحميل بيانات الحساب">
            <span style={{ width: `${34 + loadingStage * 27}%` }} />
          </div>

          <div className="role-loading-steps">
            {steps.map(({ icon: Icon, label }, index) => (
              <div key={label} className={index < loadingStage ? "is-complete" : index === loadingStage ? "is-active" : ""}>
                <span><Icon /></span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          <div className="role-loading-footer"><ShieldCheck /> بياناتك محمية ومشفرة</div>
        </div>
      </div>
    );
  }
  const ok = roles.some((r) => allow.includes(r));
  if (!ok) return <Navigate to={homePathForRole(primaryRole(roles))} replace />;
  return <>{children}</>;
}
