import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { toast } from "sonner";
import {
  GraduationCap,
  Loader2,
  Sparkles,
  ShieldCheck,
  ArrowLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  ArrowUpLeft,
  Mail,
  KeyRound,
  UserRound,
  School,
  LayoutDashboard,
  LogIn,
  BellRing,
  TrendingUp,
  BookOpenCheck,
  Presentation,
  UsersRound,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth, primaryRole, homePathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/auth")({ ssr: false, component: AuthPage });

function showAccountCreatedToast() {
  toast.custom(
    (toastId) => (
      <button type="button" className="account-success-toast" dir="rtl" onClick={() => toast.dismiss(toastId)} aria-label="إغلاق رسالة نجاح إنشاء الحساب">
        <span className="success-toast-glow" aria-hidden />
        <Sparkles className="success-toast-sparkle success-toast-sparkle-one" aria-hidden />
        <Sparkles className="success-toast-sparkle success-toast-sparkle-two" aria-hidden />
        <span className="account-success-icon"><CheckCircle2 className="h-6 w-6" /></span>
        <div className="min-w-0 flex-1">
          <strong>حسابك أصبح جاهزًا!</strong>
          <p>أهلًا بك في منصة عُبيدة، ننقلك الآن إلى لوحة المتابعة.</p>
        </div>
        <span className="account-success-next"><ArrowUpLeft className="h-4 w-4" /></span>
      </button>
    ),
    { duration: 4500 },
  );
}

function showWelcomeBackToast(role: "student" | "teacher") {
  const isTeacher = role === "teacher";
  toast.custom(
    (toastId) => (
      <button type="button" className={`account-success-toast welcome-back-toast welcome-${role}-toast`} dir="rtl" onClick={() => toast.dismiss(toastId)} aria-label="إغلاق رسالة الترحيب">
        <span className="success-toast-glow" aria-hidden />
        <Sparkles className="success-toast-sparkle success-toast-sparkle-one" aria-hidden />
        <Sparkles className="success-toast-sparkle success-toast-sparkle-two" aria-hidden />
        <span className="account-success-icon welcome-back-icon">
          {isTeacher ? <Presentation className="welcome-role-icon" aria-hidden /> : <BookOpenCheck className="welcome-role-icon" aria-hidden />}
          <span className="welcome-online-dot" aria-hidden />
        </span>
        <div className="min-w-0 flex-1 text-right">
          <span className="welcome-toast-kicker">{isTeacher ? <GraduationCap aria-hidden /> : <Sparkles aria-hidden />} {isTeacher ? "مساحة المدرس" : "مساحة الطالب"}</span>
          <strong>{isTeacher ? "أهلاً بعودتك يا أستاذ!" : "أهلاً بعودتك يا بطل!"}</strong>
          <p>{isTeacher ? "طلابك ومحتواك في انتظارك داخل لوحة المدرس." : "محاضراتك وتقدّمك محفوظان.. كمّل من حيث توقفت."}</p>
          <div className="welcome-toast-meta">
            <span>{isTeacher ? <UsersRound aria-hidden /> : <TrendingUp aria-hidden />} {isTeacher ? "إدارة الطلاب جاهزة" : "تقدّمك محفوظ"}</span>
            <span className="welcome-loading-label"><LayoutDashboard aria-hidden /> جاري فتح اللوحة <i /><i /><i /></span>
          </div>
        </div>
        <span className="account-success-next welcome-next"><ArrowUpLeft className="h-4 w-4" /></span>
      </button>
    ),
    { duration: 5000 },
  );
}

function AuthPage() {
  const { session, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signup");

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: homePathForRole(primaryRole(roles)), replace: true });
    }
  }, [loading, session, roles, navigate]);

  return (
    <div className={`auth-page auth-page-${mode}`} dir="rtl">
      <span className="auth-ambient auth-ambient-one" aria-hidden />
      <span className="auth-ambient auth-ambient-two" aria-hidden />
      <span className="auth-grid-light" aria-hidden />

      <div className={`auth-stage ${mode === "signup" ? "is-signup" : "is-signin"}`}>
        <aside className="auth-showcase">
          <div className="auth-showcase-effects" aria-hidden>
            <span className="auth-orbit-ring auth-orbit-ring-one" />
            <span className="auth-orbit-ring auth-orbit-ring-two" />
            <span className="auth-light-streak" />
            <i className="auth-particle auth-particle-one" />
            <i className="auth-particle auth-particle-two" />
            <i className="auth-particle auth-particle-three" />
          </div>
          <div className="auth-showcase-content">
            <Link to="/" className="auth-showcase-brand" aria-label="العودة إلى منصة عُبيدة">
              <span><GraduationCap /></span>
              <div><strong>منصة عُبيدة</strong><small>العربية ببساطة.. والتفوق بثقة</small></div>
            </Link>
            <div key={mode} className="auth-showcase-message">
              <span className="auth-showcase-eyebrow"><Sparkles /> {mode === "signup" ? "بداية بسيطة.. أثر كبير" : "رجوع سريع لمساحتك"}</span>
              <h1>{mode === "signup" ? "خطوتك الأولى تبدأ من هنا" : "كمّل رحلتك من حيث توقفت"}</h1>
              <p>{mode === "signup" ? "دقيقتان فقط لإنشاء مساحتك التعليمية وتجهيز كل ما يناسب صفك." : "محاضراتك ونتائجك ومواعيدك محفوظة وجاهزة لك."}</p>

              {mode === "signup" ? (
                <div className="auth-showcase-path auth-signup-path">
                  {[
                    { number: "01", title: "بياناتك", text: "عرّفنا بك", icon: UserRound },
                    { number: "02", title: "صفّك", text: "نجهّز محتواك", icon: School },
                    { number: "03", title: "لوحتك", text: "ابدأ فورًا", icon: LayoutDashboard },
                  ].map(({ number, title, text, icon: Icon }, index) => (
                    <article key={number} style={{ animationDelay: `${120 + index * 100}ms` }}>
                      <span className="auth-step-icon"><Icon aria-hidden /><b>{number}</b></span>
                      <div><strong>{title}</strong><small>{text}</small></div>
                      {index < 2 && <i aria-hidden />}
                    </article>
                  ))}
                </div>
              ) : (
                <div className="auth-showcase-path auth-signin-path">
                  {[
                    { number: "01", title: "دخول فوري", text: "ببياناتك المعتادة", icon: LogIn },
                    { number: "02", title: "كل جديدك أمامك", text: "المحاضرات والمواعيد", icon: BellRing },
                    { number: "03", title: "تقدمك محفوظ", text: "كمّل من آخر نقطة", icon: TrendingUp },
                  ].map(({ number, title, text, icon: Icon }, index) => (
                    <article key={number} style={{ animationDelay: `${120 + index * 90}ms` }}>
                      <span className="auth-return-icon"><Icon aria-hidden /></span>
                      <div><strong>{title}</strong><small>{text}</small></div>
                      <em>{number}</em>
                    </article>
                  ))}
                </div>
              )}
            </div>

            <div className="auth-teacher-note">
              <span><GraduationCap /></span>
              <div><small>رسالة من الأستاذ عبيدة</small><strong>كل خطوة بتاخدها النهارده بتقرّبك من هدفك.</strong></div>
            </div>
          </div>
        </aside>

        <section className="auth-form-column">
          <div className="auth-mobile-brand">
            <Link to="/"><GraduationCap /></Link>
            <div><strong>منصة عُبيدة</strong><small>العربية ببساطة.. والتفوق بثقة</small></div>
          </div>
          <div className="auth-form-heading">
            <span>{mode === "signup" ? "تسجيل سريع وآمن" : "دخول آمن"}</span>
            <h2>{mode === "signup" ? "جهّز مساحتك التعليمية" : "أهلًا بعودتك"}</h2>
            <p>{mode === "signup" ? "أدخل بيانات الطالب مرة واحدة، وسنتولى ترتيب الباقي." : "أدخل بياناتك وسنفتح لك لوحتك مباشرة."}</p>
          </div>

          <div className={`auth-card card-elegant p-5 sm:p-7 ${mode === "signup" ? "auth-card-signup" : "auth-card-signin"}`}>
          <div className="auth-mode-tabs mb-4 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1 text-sm">
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={mode === "signup" ? "is-active" : ""}
            >
              حساب جديد
            </button>
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={mode === "signin" ? "is-active" : ""}
            >
              دخول
            </button>
          </div>

          {mode === "signin" && (
            <>
              <GoogleButton />
              <div className="my-4 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                <span>أو بالبريد الإلكتروني</span>
                <div className="h-px flex-1 bg-border" />
              </div>
            </>
          )}

          {mode === "signup" ? <SignUpForm /> : <LoginForm />}

          <p className="mt-4 flex items-center justify-center gap-1 text-center text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" />
            بياناتك مشفّرة ولا تظهر إلا لصاحب الصلاحية
          </p>

          <TeacherSetup />
          </div>

          <div className="auth-back-link">
            <Link to="/"><ArrowLeft /> العودة للصفحة الرئيسية</Link>
          </div>
        </section>
      </div>
    </div>
  );
}

const loginSchema = z.object({
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }),
});

const signupSchema = z.object({
  full_name: z.string().trim().min(3, "اكتب الاسم بالكامل").max(120),
  email: z.string().trim().email({ message: "بريد إلكتروني غير صالح" }),
  password: z.string().min(6, { message: "كلمة المرور 6 أحرف على الأقل" }).max(128),
  phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "رقم هاتف الطالب غير صحيح"),
  guardian_phone: z
    .string()
    .trim()
    .regex(/^\+?[0-9]{10,15}$/, "رقم هاتف ولي الأمر غير صحيح"),
  educational_level_id: z.string().uuid("اختر الصف الدراسي"),
  school_name: z.string().trim().min(2, "اكتب اسم المدرسة").max(160),
  governorate: z.string().trim().min(2, "اكتب المحافظة").max(80),
});

function LoginForm() {
  const requestInFlight = useRef(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetBusy, setResetBusy] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const openPasswordReset = () => {
    setResetEmail(email.trim().toLowerCase());
    setResetSent(false);
    setResetOpen(true);
  };

  async function sendResetLink(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    event.stopPropagation();
    const parsed = z.string().trim().email("اكتب بريدًا إلكترونيًا صحيحًا").safeParse(resetEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "البريد الإلكتروني غير صحيح");
      return;
    }
    setResetBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.toLowerCase(), {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });
      if (error) {
        toast.error(
          error.status === 429
            ? "تم إرسال طلب مؤخرًا. انتظر دقيقة ثم حاول مرة أخرى."
            : "تعذّر إرسال رابط الاستعادة: " + error.message,
        );
        return;
      }
      setResetSent(true);
    } finally {
      setResetBusy(false);
    }
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestInFlight.current) return;
    const parsed = loginSchema.safeParse({ email: email.trim().toLowerCase(), password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    requestInFlight.current = true;
    setBusy(true);
    try {
      const { data: signInData, error } = await supabase.auth.signInWithPassword(parsed.data);
      if (error) {
        const message =
          error.code === "invalid_credentials"
            ? "البريد الإلكتروني أو كلمة المرور غير صحيحة. تأكد من كتابتهما ثم حاول مرة أخرى."
            : error.code === "email_not_confirmed"
              ? "الحساب يحتاج إلى تفعيل البريد الإلكتروني."
              : "تعذّر تسجيل الدخول: " + error.message;
        toast.error(message);
        return;
      }
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", signInData.user.id);
      const isTeacher = (roleRows ?? []).some(({ role }) => role === "teacher" || role === "admin");
      showWelcomeBackToast(isTeacher ? "teacher" : "student");
    } finally {
      requestInFlight.current = false;
      setBusy(false);
    }
  }

  return (
    <>
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="login-email">البريد الإلكتروني</Label>
        <Input
          id="login-email"
          type="email"
          dir="ltr"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <Label htmlFor="login-password">كلمة المرور</Label>
          <button type="button" onClick={openPasswordReset} className="text-xs font-bold text-primary transition hover:text-primary/75 hover:underline">
            نسيت كلمة المرور؟
          </button>
        </div>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            dir="ltr"
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="pl-11"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-primary animate-gradient text-primary-foreground shadow-glow"
        disabled={busy}
      >
        {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} دخول
      </Button>
    </form>
      <Dialog open={resetOpen} onOpenChange={setResetOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          {resetSent ? (
            <div className="password-reset-sent">
              <span><Mail className="h-7 w-7" /></span>
              <h2>راجع بريدك الإلكتروني</h2>
              <p>إذا كان البريد مسجلًا لدينا، ستصلك رسالة تحتوي على رابط آمن لتعيين كلمة مرور جديدة.</p>
              <strong dir="ltr">{resetEmail}</strong>
              <Button type="button" className="mt-5 w-full" onClick={() => setResetOpen(false)}>حسنًا، فهمت</Button>
            </div>
          ) : (
            <form onSubmit={sendResetLink} className="p-6">
              <DialogHeader>
                <span className="password-reset-dialog-icon"><KeyRound className="h-6 w-6" /></span>
                <DialogTitle className="mt-3 text-xl font-black">استعادة كلمة المرور</DialogTitle>
                <DialogDescription className="leading-6">أدخل بريد حسابك وسنرسل لك رابطًا آمنًا لإنشاء كلمة مرور جديدة.</DialogDescription>
              </DialogHeader>
              <div className="mt-5 space-y-2">
                <Label htmlFor="reset-email">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input id="reset-email" dir="ltr" type="email" autoComplete="email" value={resetEmail} onChange={(event) => setResetEmail(event.target.value)} className="pr-10" placeholder="name@example.com" autoFocus />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="button" variant="outline" onClick={() => setResetOpen(false)}>إلغاء</Button>
                <Button type="submit" disabled={resetBusy || !resetEmail.trim()}>
                  {resetBusy && <Loader2 className="h-4 w-4 animate-spin" />} إرسال رابط الاستعادة
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SignUpForm() {
  const navigate = useNavigate();
  const requestInFlight = useRef(false);
  const [full_name, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [levelId, setLevelId] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [governorate, setGovernorate] = useState("");
  const [levels, setLevels] = useState<{ id: string; name: string }[]>([]);
  const [optionsLoading, setOptionsLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const signupChecks = [
    full_name.trim().length >= 3,
    /^\+?[0-9]{10,15}$/.test(phone),
    /^\+?[0-9]{10,15}$/.test(guardianPhone),
    Boolean(levelId),
    schoolName.trim().length >= 2,
    governorate.trim().length >= 2,
    /^\S+@\S+\.\S+$/.test(email),
    password.length >= 6,
  ];
  const signupProgress = Math.round((signupChecks.filter(Boolean).length / signupChecks.length) * 100);

  useEffect(() => {
    let mounted = true;
    supabase
      .from("educational_levels")
      .select("id, name")
      .order("sort_order")
      .then((levelResult) => {
        if (!mounted) return;
        setLevels(levelResult.data ?? []);
        setOptionsLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (requestInFlight.current) return;
    const parsed = signupSchema.safeParse({
      full_name,
      email: email.trim().toLowerCase(),
      password,
      phone,
      guardian_phone: guardianPhone,
      educational_level_id: levelId,
      school_name: schoolName,
      governorate,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    requestInFlight.current = true;
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: parsed.data.full_name,
          phone: parsed.data.phone,
          guardian_phone: parsed.data.guardian_phone,
          educational_level_id: parsed.data.educational_level_id,
          school_name: parsed.data.school_name,
          governorate: parsed.data.governorate,
        },
      },
    });
    if (error) {
      requestInFlight.current = false;
      setBusy(false);
      toast.error("تعذّر إنشاء الحساب: " + error.message);
      return;
    }
    let session = data.session;
    if (!data.session) {
      if (data.user?.identities?.length === 0) {
        requestInFlight.current = false;
        setBusy(false);
        toast.error("هذا البريد مسجل بالفعل. اختر «دخول» واكتب كلمة مرور الحساب.");
        return;
      }
      const signInResult = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      session = signInResult.data.session;
      if (signInResult.error) {
        requestInFlight.current = false;
        setBusy(false);
        toast.error("تم إنشاء الحساب، لكن تعذر الدخول التلقائي: " + signInResult.error.message);
        return;
      }
    }
    requestInFlight.current = false;
    setBusy(false);
    showAccountCreatedToast();
    if (session) await navigate({ to: "/student", replace: true });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="auth-signup-progress" aria-label={`تم استكمال ${signupProgress}% من البيانات`}>
        <div><span>اكتمال بياناتك</span><strong>{signupProgress}%</strong></div>
        <span><i style={{ width: `${signupProgress}%` }} /></span>
        <small>{signupProgress === 100 ? "ممتاز، كل شيء جاهز لإنشاء الحساب" : "أكمل الحقول لنجهّز لوحتك تلقائيًا"}</small>
      </div>
      <div className="space-y-2">
        <Label htmlFor="su-name">الاسم الكامل</Label>
        <Input
          id="su-name"
          value={full_name}
          onChange={(e) => setFullName(e.target.value)}
          required
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="su-phone">رقم هاتف الطالب</Label>
          <Input
            id="su-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            autoComplete="tel"
            placeholder="01xxxxxxxxx"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[\s-]/g, ""))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-guardian-phone">هاتف ولي الأمر</Label>
          <Input
            id="su-guardian-phone"
            type="tel"
            dir="ltr"
            inputMode="tel"
            placeholder="01xxxxxxxxx"
            value={guardianPhone}
            onChange={(e) => setGuardianPhone(e.target.value.replace(/[\s-]/g, ""))}
            required
          />
        </div>
        <div className="space-y-2">
          <Label>الصف الدراسي</Label>
          <Select value={levelId} onValueChange={setLevelId} disabled={optionsLoading}>
            <SelectTrigger>
              <SelectValue placeholder={optionsLoading ? "جاري التحميل..." : "اختر الصف"} />
            </SelectTrigger>
            <SelectContent>
              {levels.map((level) => (
                <SelectItem key={level.id} value={level.id}>
                  {level.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-school">المدرسة</Label>
          <Input
            id="su-school"
            value={schoolName}
            onChange={(e) => setSchoolName(e.target.value)}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-governorate">المحافظة</Label>
          <Input
            id="su-governorate"
            value={governorate}
            onChange={(e) => setGovernorate(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="su-email">البريد الإلكتروني</Label>
          <Input id="su-email" type="email" dir="ltr" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="su-pass">كلمة المرور</Label>
          <Input id="su-pass" type="password" dir="ltr" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </div>
      </div>
      <Button
        type="submit"
        className="w-full bg-gradient-primary animate-gradient text-primary-foreground shadow-glow"
        disabled={busy}
      >
        {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} إنشاء الحساب والبدء
      </Button>
    </form>
  );
}

function GoogleButton() {
  const [busy, setBusy] = useState(false);
  async function onClick() {
    setBusy(true);
    try {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
      const response = await fetch(`${supabaseUrl}/auth/v1/settings`, {
        headers: { apikey: publishableKey },
      });
      const settings = await response.json();
      if (!settings?.external?.google) {
        toast.error(
          "تسجيل الدخول بحساب Google غير مُفعّل بعد. استخدم البريد وكلمة المرور مؤقتًا.",
        );
        setBusy(false);
        return;
      }
    } catch {
      toast.error("تعذّر التحقق من إعدادات Google. حاول مرة أخرى.");
      setBusy(false);
      return;
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: "offline",
          prompt: "select_account",
        },
      },
    });
    if (error) {
      setBusy(false);
      toast.error(
        error.message.toLowerCase().includes("provider")
          ? "تسجيل Google غير مُفعّل في إعدادات Supabase بعد."
          : "تعذّر الدخول بجوجل: " + error.message,
      );
      return;
    }
  }
  return (
    <Button
      type="button"
      variant="outline"
      className="w-full hover-lift"
      onClick={onClick}
      disabled={busy}
    >
      {busy ? (
        <Loader2 className="ml-2 h-4 w-4 animate-spin" />
      ) : (
        <svg className="ml-2 h-4 w-4" viewBox="0 0 48 48" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
          />
          <path
            fill="#4285F4"
            d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
          />
          <path
            fill="#FBBC05"
            d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
          />
          <path
            fill="#34A853"
            d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
          />
        </svg>
      )}
      الدخول باستخدام حساب Google
    </Button>
  );
}

const teacherSchema = z.object({
  full_name: z.string().trim().min(3).max(120),
  email: z.string().trim().email().max(255),
  password: z.string().min(8, "كلمة المرور 8 أحرف على الأقل").max(128),
});

function TeacherSetup() {
  const [open, setOpen] = useState(false);
  const [exists, setExists] = useState<boolean | null>(null);
  const [values, setValues] = useState({
    full_name: "الأستاذ عبيدة",
    email: "saadbarghouth11geoinformatics@gmail.com",
    password: "",
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    supabase.rpc("teacher_exists").then(({ data }) => setExists(Boolean(data)));
  }, []);

  if (exists === null || exists === true) return null;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = teacherSchema.safeParse(values);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message ?? "بيانات غير صحيحة");
      return;
    }
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: parsed.data.email,
      password: parsed.data.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: { full_name: parsed.data.full_name },
      },
    });
    if (error || !data.user) {
      setBusy(false);
      toast.error("تعذّر إنشاء الحساب: " + (error?.message ?? ""));
      return;
    }
    const { error: rpcErr } = await supabase.rpc("bootstrap_first_teacher");
    setBusy(false);
    if (rpcErr) {
      toast.error("تعذّر تفعيل حساب المعلم: " + rpcErr.message);
      return;
    }
    toast.success("تم إنشاء حساب المعلم");
  }

  return (
    <div className="mt-6 border-t border-border pt-4">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="text-sm text-primary hover:underline"
        >
          إعداد حساب المعلم لأول مرة
        </button>
      ) : (
        <form onSubmit={onSubmit} className="space-y-3">
          <p className="text-sm text-muted-foreground">
            أنشئ حساب المعلم الرئيسي (يتم مرة واحدة فقط).
          </p>
          <div className="space-y-2">
            <Label htmlFor="t-name">الاسم</Label>
            <Input
              id="t-name"
              value={values.full_name}
              onChange={(e) => setValues((s) => ({ ...s, full_name: e.target.value }))}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-email">البريد الإلكتروني</Label>
            <Input id="t-email" dir="ltr" type="email" value={values.email} readOnly required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="t-pass">كلمة المرور</Label>
            <Input
              id="t-pass"
              dir="ltr"
              type="password"
              value={values.password}
              onChange={(e) => setValues((s) => ({ ...s, password: e.target.value }))}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>
            {busy && <Loader2 className="ml-2 h-4 w-4 animate-spin" />} إنشاء حساب المعلم
          </Button>
        </form>
      )}
    </div>
  );
}
