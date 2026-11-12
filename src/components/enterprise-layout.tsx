import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import {
  GraduationCap,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
  X,
  Clock,
  Radio,
  ExternalLink,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface EnterpriseLayoutProps {
  sidebar: ReactNode;
  userName: string;
  userRole: string;
  userCode: string;
  userAvatar?: string | null;
  subtitle?: string;
  mobileOpen: boolean;
  onToggleMobile: () => void;
  children: ReactNode;
}

export function EnterpriseLayout({
  sidebar,
  userName,
  userRole,
  userCode,
  subtitle,
  mobileOpen,
  onToggleMobile,
  children,
}: EnterpriseLayoutProps) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString("ar-EG", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        }),
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  async function handleSignOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="enterprise-shell" dir="rtl">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="enterprise-sidebar-backdrop lg:hidden"
          onClick={onToggleMobile}
          aria-hidden="true"
        />
      )}

      {/* The Dark Navy Sidebar Docked to Far Right (100vh) */}
      <div className={`enterprise-sidebar ${mobileOpen ? "is-open" : ""}`}>{sidebar}</div>

      {/* Main Content Area on the Left */}
      <div className="enterprise-main">
        {/* Top White / Light Content Header */}
        <header className="enterprise-top-header">
          {/* Right side (in RTL): Brand & Emblem */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onToggleMobile}
              className="lg:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100"
              aria-label="القائمة الجانبية"
            >
              <Menu className="h-5 w-5" />
            </button>

            <Link to="/" className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white shadow-sm">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="hidden sm:block">
                <strong className="block text-sm font-black text-slate-900 leading-tight">
                  منصة الأستاذ عُبيدة
                </strong>
                <small className="text-[10px] text-slate-500 font-medium">
                  العربية ببساطة.. والتفوق بثقة
                </small>
              </div>
            </Link>
          </div>

          {/* Left side (in RTL): Live Status Pill & Quick Logout */}
          <div className="flex items-center gap-3">
            <div className="enterprise-top-status">
              <span className="pulse-dot animate-ping" />
              <span className="font-mono text-xs">{timeStr || "00:00:00"}</span>
              <span className="text-emerald-800 font-medium hidden sm:inline">| متصل سحابياً</span>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="text-xs font-bold text-slate-600 hover:text-red-600 hover:bg-red-50 gap-1.5"
              title="تسجيل الخروج"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">خروج</span>
            </Button>
          </div>
        </header>

        {/* Content Body */}
        <div className="enterprise-content-body">
          {/* Greeting Hero Card (Matching Reference Screenshot) */}
          <section className="enterprise-welcome-hero">
            <div className="relative z-10">
              <div className="enterprise-welcome-badges">
                <span className="enterprise-hero-badge">{userRole}</span>
                <span className="enterprise-hero-badge code-badge">{userCode}</span>
              </div>
              <h1>مرحباً بك مجدداً، {userName}</h1>
              <p>
                {subtitle ||
                  "مرحباً بك في المنصة التعليمية الذكية، يمكنك متابعة الحضور والامتحانات ومؤشر الأداء الدراسي بكل سهولة."}
              </p>
            </div>
          </section>

          {/* Main Dashboard Tabs & Panels */}
          {children}
        </div>
      </div>
    </div>
  );
}
