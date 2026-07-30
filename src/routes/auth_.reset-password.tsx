import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Eye, EyeOff, KeyRound, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/auth_/reset-password")({
  ssr: false,
  component: ResetPasswordPage,
});

const passwordSchema = z.string().min(8, "كلمة المرور يجب ألا تقل عن 8 أحرف").max(128);

function ResetPasswordPage() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [linkState, setLinkState] = useState<"checking" | "ready" | "error">("checking");
  const [linkError, setLinkError] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void (async () => {
      try {
        const url = new URL(window.location.href);
        const query = url.searchParams;
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const recoveryError = query.get("error_description") || hash.get("error_description") || query.get("error") || hash.get("error");
        if (recoveryError) throw new Error(recoveryError);

        const code = query.get("code");
        const accessToken = query.get("access_token") || hash.get("access_token");
        const refreshToken = query.get("refresh_token") || hash.get("refresh_token");
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        } else if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
          if (error) throw error;
        }

        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (!data.session) throw new Error("رابط الاستعادة غير صالح أو انتهت صلاحيته.");
        window.history.replaceState({}, document.title, "/auth/reset-password");
        setLinkState("ready");
      } catch (error) {
        setLinkError(error instanceof Error ? error.message : "تعذّر التحقق من رابط الاستعادة.");
        setLinkState("error");
      }
    })();
  }, []);

  async function updatePassword(event: React.FormEvent) {
    event.preventDefault();
    const parsed = passwordSchema.safeParse(password);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "كلمة المرور غير صالحة");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: parsed.data });
      if (error) {
        toast.error("تعذّر تحديث كلمة المرور: " + error.message);
        return;
      }
      toast.success("تم تعيين كلمة المرور الجديدة بنجاح");
      await navigate({ to: "/dashboard", replace: true });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10" dir="rtl">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-3xl" />
      <section className="card-elegant relative w-full max-w-md overflow-hidden p-7 sm:p-8">
        {linkState === "checking" && (
          <div className="py-8 text-center">
            <span className="password-reset-page-icon"><Loader2 className="h-8 w-8 animate-spin" /></span>
            <h1 className="mt-5 text-xl font-black">جارٍ تأمين رابط الاستعادة</h1>
            <p className="mt-2 text-sm text-muted-foreground">لحظات ونجهّز لك صفحة كلمة المرور الجديدة.</p>
          </div>
        )}

        {linkState === "error" && (
          <div className="py-5 text-center">
            <span className="password-reset-page-icon is-error"><AlertCircle className="h-8 w-8" /></span>
            <h1 className="mt-5 text-xl font-black">الرابط غير متاح</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">{linkError || "ربما انتهت صلاحية الرابط أو تم استخدامه من قبل."}</p>
            <Button asChild className="mt-6 w-full"><Link to="/auth">اطلب رابطًا جديدًا</Link></Button>
          </div>
        )}

        {linkState === "ready" && (
          <form onSubmit={updatePassword}>
            <div className="text-center">
              <span className="password-reset-page-icon"><KeyRound className="h-8 w-8" /></span>
              <h1 className="mt-5 text-2xl font-black">أنشئ كلمة مرور جديدة</h1>
              <p className="mt-2 text-sm leading-7 text-muted-foreground">اختر كلمة قوية لا تقل عن 8 أحرف ولا تستخدمها في حساب آخر.</p>
            </div>
            <div className="mt-7 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password">كلمة المرور الجديدة</Label>
                <div className="relative">
                  <Input id="new-password" dir="ltr" type={showPassword ? "text" : "password"} autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} className="pl-11" />
                  <button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}>{showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}</button>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">تأكيد كلمة المرور</Label>
                <Input id="confirm-password" dir="ltr" type={showPassword ? "text" : "password"} autoComplete="new-password" value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} />
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-primary/5 p-3 text-xs text-muted-foreground"><ShieldCheck className="h-4 w-4 shrink-0 text-primary" /> سيتم تشفير كلمة المرور وحفظها بصورة آمنة.</div>
              <Button type="submit" className="w-full" size="lg" disabled={busy || password.length < 8 || !confirmPassword}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />} حفظ كلمة المرور الجديدة
              </Button>
            </div>
          </form>
        )}
      </section>
    </main>
  );
}
