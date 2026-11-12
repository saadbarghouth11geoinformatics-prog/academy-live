import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  GraduationCap,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { useAuth, primaryRole, homePathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: () => <OnboardingView />,
});

function OnboardingView() {
  const { roles, loading, user } = useAuth();
  const navigate = useNavigate();
  const role = primaryRole(roles);
  const targetPath = homePathForRole(role);

  // If user already has a valid role, automatically forward them to their dashboard
  useEffect(() => {
    if (!loading && role) {
      navigate({ to: targetPath, replace: true });
    }
  }, [loading, role, targetPath, navigate]);

  if (role) {
    return (
      <AppShell title="مرحباً بك في المنصة" subtitle="تم تفعيل حسابك بنجاح">
        <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm space-y-4 max-w-lg mx-auto">
          <div className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-100 text-emerald-600 mx-auto">
            <GraduationCap className="h-8 w-8" />
          </div>
          <h2 className="text-xl font-black text-slate-900">حسابك مفعل وجاهز للاستخدام!</h2>
          <p className="text-sm text-muted-foreground">
            تم التعرف على صلاحياتك بنجاح. جاري توجيهك إلى مساحتك الدراسية...
          </p>
          <div className="pt-2">
            <Button asChild className="gap-2 bg-blue-600 hover:bg-blue-700 font-bold px-6">
              <Link to={targetPath}>
                <LayoutDashboard className="h-4 w-4" />
                الدخول إلى لوحة التحكم الآن
              </Link>
            </Button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="حسابك بانتظار التفعيل" subtitle="لم يتم تعيين دور لحسابك بعد">
      <div className="rounded-2xl border border-border bg-card p-10 text-center shadow-sm space-y-4 max-w-lg mx-auto">
        <div className="grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600 mx-auto">
          <Clock className="h-8 w-8" />
        </div>
        <h2 className="text-xl font-black text-slate-900">طلبك قيد المراجعة</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          يرجى التواصل مع إدارة المنصة أو الأستاذ عُبيدة لتفعيل اشتراكك وتحديد الصف الدراسي المناسب
          لك.
        </p>
        <div className="pt-4 flex flex-wrap items-center justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => window.location.reload()}
            className="font-bold text-xs"
          >
            إعادة فحص حالة الحساب
          </Button>
          <Button
            asChild
            className="font-bold text-xs bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <a href="https://wa.me/201000000000" target="_blank" rel="noopener noreferrer">
              تواصل عبر واتساب للتفعيل
            </a>
          </Button>
        </div>
      </div>
    </AppShell>
  );
}
