import { ReactNode, type PointerEvent as ReactPointerEvent, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useRouter, useRouterState } from "@tanstack/react-router";
import {
  BookOpenCheck,
  CalendarDays,
  ChevronDown,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  UserRound,
  X,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth, primaryRole } from "@/hooks/use-auth";

const roleNames = {
  admin: "مدير المنصة",
  teacher: "المعلم",
  student: "طالب",
  parent: "ولي أمر",
} as const;

function usableArabicName(value?: string | null) {
  const name = value?.trim();
  return name && !/^[?\s�]+$/.test(name) ? name : null;
}

export function AppShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const qc = useQueryClient();
  const { user, roles } = useAuth();
  const [name, setName] = useState("");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);
  const pointerFrame = useRef<number | null>(null);
  const role = primaryRole(roles);

  useEffect(() => {
    if (!user) return;
    let active = true;
    void supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!active) return;
        const fallback = role === "teacher" || role === "admin" ? "الأستاذ عبيدة" : "مستخدم المنصة";
        setName(
          usableArabicName(data?.full_name) ||
            usableArabicName(user.user_metadata?.full_name) ||
            fallback,
        );
      });
    return () => {
      active = false;
    };
  }, [user, role]);

  const initials = useMemo(() => {
    const source = name || user?.email || "AL";
    return source
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0])
      .join("")
      .toUpperCase();
  }, [name, user?.email]);

  const today = useMemo(
    () =>
      new Intl.DateTimeFormat("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date()),
    [],
  );

  async function signOut() {
    setSigningOut(true);
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    router.invalidate();
    navigate({ to: "/auth", replace: true });
  }

  const isTeacher = role === "teacher" || role === "admin";

  function trackPointer(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || window.innerWidth < 900) return;
    const x = event.clientX;
    const y = event.clientY;
    if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
    pointerFrame.current = requestAnimationFrame(() => {
      shellRef.current?.style.setProperty("--pointer-x", `${x}px`);
      shellRef.current?.style.setProperty("--pointer-y", `${y}px`);
    });
  }

  useEffect(() => () => {
    if (pointerFrame.current) cancelAnimationFrame(pointerFrame.current);
  }, []);

  return (
    <div ref={shellRef} onPointerMove={trackPointer} className={`dashboard-shell dashboard-${isTeacher ? "teacher" : "student"} min-h-screen`} dir="rtl">
      <div className="dashboard-pointer-glow" aria-hidden />
      <div className="dashboard-orb dashboard-orb-one" aria-hidden />
      <div className="dashboard-orb dashboard-orb-two" aria-hidden />

      <header className="dashboard-header sticky top-0 z-40">
        <div className="mx-auto flex h-[72px] max-w-7xl items-center gap-3 px-4 sm:px-6">
          <Link to="/" className="group flex shrink-0 items-center gap-2.5" aria-label="منصة عُبيدة">
            <span className="platform-brand-icon flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow transition duration-300 group-hover:-rotate-6 group-hover:scale-105">
              <GraduationCap className="h-5 w-5" />
            </span>
            <span className="hidden sm:block">
              <strong className="block text-sm font-black leading-tight text-foreground">منصة عُبيدة</strong>
              <small className="text-[10px] font-medium text-muted-foreground">العربية ببساطة.. والتفوق بثقة</small>
            </span>
          </Link>

          <nav className="mr-5 hidden items-center gap-1 rounded-2xl border border-border/70 bg-background/55 p-1.5 shadow-sm lg:flex">
            {isTeacher ? (
              <>
                <Link
                  to="/teacher"
                  className={`dashboard-nav-link ${pathname === "/teacher" ? "active" : ""}`}
                >
                  <LayoutDashboard className="h-4 w-4" /> إدارة المنصة
                </Link>
                <Link
                  to="/teacher/preview"
                  className={`dashboard-nav-link ${pathname.startsWith("/teacher/preview") ? "active" : ""}`}
                >
                  <BookOpenCheck className="h-4 w-4" /> معاينة الطلاب
                </Link>
              </>
            ) : (
              <Link
                to="/student"
                className={`dashboard-nav-link ${pathname.startsWith("/student") ? "active" : ""}`}
              >
                <LayoutDashboard className="h-4 w-4" /> لوحة المتابعة
              </Link>
            )}
          </nav>

          <div className="mr-auto hidden items-center gap-2 text-xs text-muted-foreground md:flex">
            <CalendarDays className="h-4 w-4 text-primary" />
            <span>{today}</span>
          </div>

          <div className="relative mr-auto md:mr-0">
            <button
              type="button"
              onClick={() => setProfileOpen((open) => !open)}
              className="dashboard-profile-trigger flex items-center gap-2 rounded-2xl border border-border/70 bg-background/65 p-1.5 pl-2.5 text-right shadow-sm transition hover:border-primary/25 hover:bg-background"
              aria-expanded={profileOpen}
            >
              <span className="dashboard-profile-avatar grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-primary to-cyan-500 text-xs font-black text-white">
                {initials}
              </span>
              <span className="hidden max-w-40 sm:block">
                <strong className="block truncate text-xs font-extrabold text-foreground">{name || "أهلًا بك"}</strong>
                <small className="block truncate text-[10px] text-muted-foreground">
                  {role ? roleNames[role] : "حساب المنصة"}
                </small>
              </span>
              <ChevronDown className={`hidden h-3.5 w-3.5 text-muted-foreground transition sm:block ${profileOpen ? "rotate-180" : ""}`} />
            </button>

            {profileOpen && (
              <div className="dashboard-profile-menu absolute left-0 top-[calc(100%+10px)] z-50 w-72 overflow-hidden rounded-2xl border border-border bg-card p-2 shadow-elegant">
                <div className="rounded-xl bg-gradient-to-l from-primary/10 to-cyan-500/5 p-3">
                  <div className="flex items-center gap-2">
                    <UserRound className="h-4 w-4 text-primary" />
                    <span className="truncate text-sm font-bold">{name || "حسابك"}</span>
                  </div>
                  <p className="mt-1 truncate text-xs text-muted-foreground" dir="ltr">{user?.email}</p>
                </div>
                <div className="mt-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs text-emerald-700">
                  <ShieldCheck className="h-4 w-4" /> جلسة آمنة ومحفوظة
                </div>
                <Button
                  variant="ghost"
                  className="mt-1 w-full justify-start text-destructive hover:bg-destructive/10 hover:text-destructive"
                  onClick={signOut}
                  disabled={signingOut}
                >
                  <LogOut className="ml-2 h-4 w-4" /> {signingOut ? "جارٍ الخروج..." : "تسجيل الخروج"}
                </Button>
              </div>
            )}
          </div>

          <Button
            variant="outline"
            size="icon"
            className="shrink-0 rounded-xl lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="فتح القائمة"
          >
            {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </Button>
        </div>

        {mobileOpen && (
          <nav className="dashboard-mobile-nav border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur-xl lg:hidden">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {isTeacher && (
                <Link to="/teacher" className="dashboard-mobile-link" onClick={() => setMobileOpen(false)}>
                  <LayoutDashboard className="h-4 w-4" /> إدارة المنصة
                </Link>
              )}
              <Link to={isTeacher ? "/teacher/preview" : "/student"} className="dashboard-mobile-link" onClick={() => setMobileOpen(false)}>
                <BookOpenCheck className="h-4 w-4" /> {isTeacher ? "معاينة لوحة الطالب" : "لوحة المتابعة"}
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-4 pb-16 pt-7 sm:px-6 sm:pt-10">
        <section className="dashboard-welcome mb-8 animate-fade-up">
          <div className="relative z-10">
            <Badge variant="secondary" className="mb-3 gap-1.5 border border-primary/10 bg-primary/8 text-primary">
              <Sparkles className="h-3.5 w-3.5" /> مساحة التعلم الذكية
            </Badge>
            <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-4xl">{title}</h1>
            {subtitle && <p className="mt-2 max-w-2xl text-sm leading-7 text-muted-foreground sm:text-base">{subtitle}</p>}
          </div>
          <div className="dashboard-welcome-mark" aria-hidden>
            <GraduationCap />
          </div>
        </section>
        {children}
      </main>
    </div>
  );
}
