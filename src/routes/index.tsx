import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Award,
  BarChart3,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardCheck,
  GraduationCap,
  Play,
  Rocket,
  ShieldCheck,
  Sparkles,
  Trophy,
  Users,
  Video,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth, primaryRole, homePathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "منصة الأستاذ عُبيدة" },
      {
        name: "description",
        content: "منصة الأستاذ عُبيدة المتكاملة لتعليم اللغة العربية ومتابعة طلاب الصفين الثاني والثالث الثانوي.",
      },
      { property: "og:title", content: "منصة الأستاذ عُبيدة" },
      {
        property: "og:description",
        content: "كل أدوات التعلّم والمتابعة في مكان واحد.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const winners = [
  {
    name: "آية جمال عبد الهادي",
    image: "/images/ايه جمال.jpg.jpeg",
    total: "95%",
    arabic: "76.5",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "gold",
  },
  {
    name: "بطة علاء",
    image: "/images/بطة علاء.jpg.jpeg",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "cyan",
  },
  {
    name: "جني عطا إسماعيل",
    image: "/images/جني-1.jpg.jpeg",
    total: "95%",
    arabic: "75",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "gold",
  },
  {
    name: "ريناد وليد محمد",
    image: "/images/ريناد وليد محمد.jpg.jpeg",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "cyan",
  },
  {
    name: "زياد حمدي جودة",
    image: "/images/زياد-1.jpg.jpeg",
    total: "91%",
    arabic: "75",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "gold",
  },
  {
    name: "عمر محمد يحيى",
    image: "/images/عمر محمد يحى1.jpg.jpeg",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "cyan",
  },
  {
    name: "محمود أحمد رمضان",
    image: "/images/محمود أحمد رمضان.jpg.jpeg",
    arabic: "75",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "gold",
  },
  {
    name: "مرام عرفات",
    image: "/images/مرام عرفات.jpg.jpeg",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "cyan",
  },
  {
    name: "ملك محمود",
    image: "/images/ملك محمود.jpg.jpeg",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "gold",
  },
  {
    name: "يوسف محمود",
    image: "/images/يوسف-1.jpg.jpeg",
    arabic: "76.5",
    message: "من أوائل الجمهورية — الثانوية العامة 2026",
    color: "cyan",
  },
];

const features = [
  {
    icon: ClipboardCheck,
    title: "امتحانات ذكية",
    desc: "اختبارات إلكترونية منظمة وتصحيح فوري يساعدك على معرفة مستواك الحقيقي.",
  },
  {
    icon: Video,
    title: "حصص مباشرة",
    desc: "محاضرات مباشرة وتواصل مستمر يجعل التعلّم أقرب وأسهل في كل وقت.",
  },
  {
    icon: BarChart3,
    title: "متابعة دقيقة",
    desc: "تقارير واضحة للطالب وولي الأمر عن الدرجات والحضور والتقدّم.",
  },
];

const platformHighlights = [
  { value: "2", label: "الثاني والثالث الثانوي", icon: GraduationCap },
  { value: "فوري", label: "تصحيح ونتيجة الامتحان", icon: ClipboardCheck },
  { value: "مباشر", label: "دروس وروابط حضور سهلة", icon: Video },
  { value: "شامل", label: "متابعة الطالب وولي الأمر", icon: BarChart3 },
];

const learningJourney = [
  {
    icon: Users,
    tone: "account",
    number: "01",
    title: "أنشئ حسابك",
    desc: "سجّل بياناتك الدراسية مرة واحدة لتظهر لك كل المحتويات المناسبة لصفك.",
  },
  {
    icon: Video,
    tone: "live",
    number: "02",
    title: "احضر وتعلّم",
    desc: "تابع مواعيد المحاضرات وادخل إلى Zoom أو Google Meet من لوحتك مباشرة.",
  },
  {
    icon: ClipboardCheck,
    tone: "exam",
    number: "03",
    title: "اختبر مستواك",
    desc: "حل امتحانات منظمة بمؤقت واضح وتسليم آمن ومحاولة واحدة عادلة لكل طالب.",
  },
  {
    icon: Trophy,
    tone: "progress",
    number: "04",
    title: "شاهد تقدمك",
    desc: "اعرف درجتك فورًا وراجع تاريخ نتائجك ومتوسط أدائك من لوحة واحدة.",
  },
];

function Index() {
  const { session, roles, loading } = useAuth();
  const navigate = useNavigate();
  const [activeWinner, setActiveWinner] = useState(0);
  const [paused, setPaused] = useState(false);
  const progressRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!loading && session) {
      navigate({ to: homePathForRole(primaryRole(roles)), replace: true });
    }
  }, [loading, session, roles, navigate]);

  useEffect(() => {
    if (paused) return;
    const interval = window.setInterval(
      () => setActiveWinner((current) => (current + 1) % winners.length),
      5000,
    );
    return () => window.clearInterval(interval);
  }, [paused]);

  useEffect(() => {
    const revealItems = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"));
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const observer = reduceMotion
      ? null
      : new IntersectionObserver(
          (entries) => {
            entries.forEach((entry) => {
              if (!entry.isIntersecting) return;
              const item = entry.target as HTMLElement;
              item.addEventListener("transitionend", () => item.style.transitionDelay = "0ms", { once: true });
              item.classList.add("is-visible");
              observer?.unobserve(entry.target);
            });
          },
          { threshold: 0.14, rootMargin: "0px 0px -7%" },
        );
    revealItems.forEach((item) => reduceMotion ? item.classList.add("is-visible") : observer?.observe(item));

    const hero = document.querySelector<HTMLElement>(".hero-stage");
    let frame = 0;
    const updateScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollable = Math.max(document.documentElement.scrollHeight - window.innerHeight, 1);
        const progress = Math.min(window.scrollY / scrollable, 1);
        if (progressRef.current) progressRef.current.style.transform = `scaleX(${progress})`;
        hero?.style.setProperty("--hero-scroll", `${Math.min(window.scrollY * 0.07, 48)}px`);
      });
    };
    const updatePointer = (event: PointerEvent) => {
      if (!hero || event.pointerType === "touch") return;
      const rect = hero.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      hero.style.setProperty("--pointer-x", `${x * 100}%`);
      hero.style.setProperty("--pointer-y", `${y * 100}%`);
      hero.style.setProperty("--hero-x", `${(x - 0.5) * 14}px`);
      hero.style.setProperty("--hero-y", `${(y - 0.5) * 10}px`);
      hero.style.setProperty("--copy-x", `${(x - 0.5) * -5}px`);
      hero.style.setProperty("--copy-y", `${(y - 0.5) * -3}px`);
      hero.style.setProperty("--copy-rotate-x", `${(0.5 - y) * 1.4}deg`);
      hero.style.setProperty("--copy-rotate-y", `${(x - 0.5) * -1.6}deg`);
    };
    const resetPointer = () => {
      hero?.style.setProperty("--hero-x", "0px");
      hero?.style.setProperty("--hero-y", "0px");
      hero?.style.setProperty("--copy-x", "0px");
      hero?.style.setProperty("--copy-y", "0px");
      hero?.style.setProperty("--copy-rotate-x", "0deg");
      hero?.style.setProperty("--copy-rotate-y", "0deg");
    };
    updateScroll();
    window.addEventListener("scroll", updateScroll, { passive: true });
    hero?.addEventListener("pointermove", updatePointer, { passive: true });
    hero?.addEventListener("pointerleave", resetPointer, { passive: true });
    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScroll);
      hero?.removeEventListener("pointermove", updatePointer);
      hero?.removeEventListener("pointerleave", resetPointer);
    };
  }, []);

  const showWinner = (index: number) => {
    setActiveWinner((index + winners.length) % winners.length);
  };

  return (
    <div className="academy-page min-h-screen" dir="rtl">
      <div className="page-scroll-progress" aria-hidden="true"><span ref={progressRef} /></div>
      <header className="academy-header">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
          <Link
            to="/"
            className="group flex items-center gap-3"
            aria-label="منصة الأستاذ عُبيدة - الرئيسية"
          >
            <span className="brand-mark">
              <img src="/images/teacher-app-icon.png" alt="" aria-hidden="true" />
            </span>
            <span>
              <strong className="block text-base text-white sm:text-lg">منصة الأستاذ عُبيدة</strong>
              <small className="hidden text-[10px] text-white/55 sm:block">
                العربية ببساطة.. والتفوق بثقة
              </small>
            </span>
          </Link>

          <nav
            className="hidden items-center gap-7 text-sm font-semibold text-white/70 md:flex"
            aria-label="التنقل الرئيسي"
          >
            <a href="#success" className="nav-link">
              أوائلنا
            </a>
            <a href="#features" className="nav-link">
              المميزات
            </a>
            <a href="#start" className="nav-link">
              ابدأ الآن
            </a>
          </nav>

          <div className="flex items-center gap-2">
            <Button
              asChild
              variant="ghost"
              className="hidden text-white hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link to="/auth">تسجيل الدخول</Link>
            </Button>
            <Button asChild className="gold-button rounded-full px-4 sm:px-6">
              <Link to="/auth">
                انضم الآن <ArrowLeft className="mr-1 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="hero-stage">
          <div className="hero-noise" aria-hidden="true" />
          <div className="confetti confetti-one" aria-hidden="true" />
          <div className="confetti confetti-two" aria-hidden="true" />
          <div className="confetti confetti-three" aria-hidden="true" />
          <div className="hero-layout mx-auto grid min-h-[760px] max-w-7xl items-center px-4 pb-14 pt-28 sm:px-6 lg:grid-cols-2 lg:pt-20">
            <div className="hero-copy relative z-10 max-w-2xl animate-fade-up">
              <div className="hero-copy-inner">
              <span className="success-pill">
                <Sparkles className="h-4 w-4" /> نحتفل بالاجتهاد والتميّز
              </span>
              <h1 className="mt-7 text-4xl font-black leading-[1.25] text-white sm:text-6xl lg:text-7xl">
                لكل مجتهد
                <span className="block gold-text">لحظة تستحق الاحتفال</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-white/70 sm:text-lg">
                نفخر بأوائل الثانوية العامة من طلابنا، ونؤمن أن كل خطوة في رحلة النجاح تبدأ بمعلم
                داعم وطالب لا يتوقف عن المحاولة.
              </p>
              <div className="hero-actions mt-9 flex flex-wrap gap-3">
                <Button
                  asChild
                  size="lg"
                  className="hero-primary-action gold-button rounded-full px-7 shadow-xl shadow-amber-500/15"
                >
                  <a href="#success">
                    <Trophy className="ml-2 h-5 w-5" /> شاهد أوائلنا
                  </a>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="hero-secondary-action rounded-full border-white/20 bg-white/5 px-7 text-white backdrop-blur hover:bg-white/10 hover:text-white"
                >
                  <Link to="/auth">
                    <Play className="ml-2 h-4 w-4 fill-current" /> ابدأ رحلتك
                  </Link>
                </Button>
              </div>
              <div className="hero-trust mt-10 flex flex-wrap gap-x-7 gap-y-3 text-sm text-white/60">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" /> متابعة مستمرة
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" /> شرح متميز
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-cyan-300" /> نتائج نفتخر بها
                </span>
              </div>
              </div>
            </div>

            <div className="hero-badge-area" aria-label="المدرس يهنئ أوائل الثانوية العامة">
              <div className="teacher-badge">
                <span className="teacher-badge-icon">
                  <Award className="h-5 w-5" />
                </span>
                <span>
                  <small>رسالة من المدرس</small>
                  <strong>فخور بكل واحد فيكم</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="hero-wave" aria-hidden="true" />
        </section>

        <div className="achievement-ticker" aria-label="مميزات منصة الأستاذ عُبيدة">
          <div className="achievement-ticker-track">
            {["شرح يبني الفهم", "تدريب يصنع الثقة", "متابعة تكشف التقدّم", "نتائج تستحق الاحتفال", "شرح يبني الفهم", "تدريب يصنع الثقة", "متابعة تكشف التقدّم", "نتائج تستحق الاحتفال"].map((text, index) => (
              <span key={`${text}-${index}`}><Sparkles className="h-3.5 w-3.5" /> {text}</span>
            ))}
          </div>
        </div>

        <section className="platform-stats" aria-label="مميزات المنصة بالأرقام">
          <div className="mx-auto grid max-w-7xl grid-cols-2 gap-px px-4 sm:px-6 lg:grid-cols-4">
            {platformHighlights.map(({ value, label, icon: Icon }, index) => (
              <article
                key={label}
                className="platform-stat scroll-reveal"
                data-reveal
                style={{ transitionDelay: `${index * 70}ms` }}
              >
                <span className="platform-stat-icon"><Icon className="h-5 w-5" /></span>
                <div>
                  <strong>{value}</strong>
                  <p>{label}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="success" className="success-section scroll-mt-24 py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="section-heading scroll-reveal mx-auto max-w-2xl text-center" data-reveal>
              <span className="eyebrow">
                <Trophy className="h-4 w-4" /> لوحة الشرف
              </span>
              <h2 className="mt-4 text-3xl font-black text-slate-950 sm:text-5xl">
                نجاحات تستحق أن تُروى
              </h2>
              <p className="mt-4 leading-7 text-slate-600">
                نبارك لطلابنا وطالباتنا المتفوقين، ونوثّق هنا نماذج حقيقية من النجاح والاجتهاد.
              </p>
            </div>

            <div
              className="winner-showcase scroll-reveal mt-12"
              data-reveal
              onMouseEnter={() => setPaused(true)}
              onMouseLeave={() => setPaused(false)}
            >
              <div className="winner-visual">
                <span
                  className="winner-backdrop"
                  style={{ backgroundImage: `url("${winners[activeWinner].image}")` }}
                  aria-hidden="true"
                />
                <img
                  key={winners[activeWinner].image}
                  src={winners[activeWinner].image}
                  alt={`تهنئة الطالب ${winners[activeWinner].name} من أوائل الثانوية العامة`}
                  loading="lazy"
                />
                <div className="winner-visual-shade" />
                <div className="winner-photo-label" key={`label-${activeWinner}`}>
                  <Trophy className="h-4 w-4" /> قصة نجاح {activeWinner + 1} من {winners.length}
                </div>
              </div>

              <div className="winner-panel">
                <span className={`winner-rank ${winners[activeWinner].color}`}>
                  <Award className="h-5 w-5" /> دفعة التميز
                </span>
                <div className="winner-copy" key={`copy-${activeWinner}`}>
                  <p className="text-sm font-bold text-sky-600">{winners[activeWinner].message}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-950 sm:text-5xl">
                    {winners[activeWinner].name}
                  </h3>
                  {(winners[activeWinner].total || winners[activeWinner].arabic) && (
                    <div className="winner-scores" aria-label="درجات الطالب">
                      {winners[activeWinner].total && (
                        <span><strong>{winners[activeWinner].total}</strong> المجموع</span>
                      )}
                      {winners[activeWinner].arabic && (
                        <span><strong>{winners[activeWinner].arabic}</strong> اللغة العربية</span>
                      )}
                    </div>
                  )}
                  <p className="mt-5 max-w-md leading-8 text-slate-600">
                    ألف مبروك على هذا التفوق المشرف. الاجتهاد والاستمرار صنعا هذه اللحظة الجميلة،
                    والقادم أجمل بإذن الله مع الأستاذ عُبيدة.
                  </p>
                </div>
                <div className="mt-9 flex items-center justify-between gap-4">
                  <div className="flex gap-2" role="tablist" aria-label="اختيار الطالبة">
                    {winners.map((winner, index) => (
                      <button
                        key={winner.name}
                        type="button"
                        className={`winner-dot ${index === activeWinner ? "active" : ""}`}
                        onClick={() => showWinner(index)}
                        aria-label={`عرض تهنئة ${winner.name}`}
                        aria-selected={index === activeWinner}
                        role="tab"
                      />
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      className="slider-button"
                      onClick={() => showWinner(activeWinner - 1)}
                      aria-label="التهنئة السابقة"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      className="slider-button"
                      onClick={() => showWinner(activeWinner + 1)}
                      aria-label="التهنئة التالية"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="success-gallery scroll-reveal" data-reveal aria-label="معرض أوائل الثانوية العامة">
              <div className="success-gallery-head">
                <div>
                  <strong>كل قصص النجاح</strong>
                  <span>اضغط على أي صورة لعرضها كاملة</span>
                </div>
                <span>{winners.length} نماذج مشرفة</span>
              </div>
              <div className="success-gallery-track" role="tablist" aria-label="اختيار قصة نجاح">
                {winners.map((winner, index) => (
                  <button
                    key={winner.name}
                    type="button"
                    className={`success-thumbnail ${index === activeWinner ? "active" : ""}`}
                    onClick={() => showWinner(index)}
                    aria-label={`عرض تهنئة ${winner.name}`}
                    aria-selected={index === activeWinner}
                    role="tab"
                  >
                    <img src={winner.image} alt="" loading="lazy" />
                    <span><small>قصة نجاح</small><strong>{winner.name}</strong></span>
                  </button>
                ))}
              </div>
            </div>

            <div className="booking-showcase scroll-reveal" data-reveal>
              <div className="booking-copy">
                <span className="booking-kicker"><Sparkles className="h-4 w-4" /> دفعة 2027</span>
                <h3>مكانك وسط الأوائل يبدأ من قرارك اليوم</h3>
                <p>انضم إلى منصة الأستاذ عُبيدة وابدأ رحلة منظمة في الشرح والتدريب والمتابعة.</p>
                <Button asChild size="lg" className="gold-button rounded-full px-8">
                  <Link to="/auth">احجز مكانك الآن <ArrowLeft className="h-4 w-4" /></Link>
                </Button>
              </div>
              <a className="booking-poster" href="/images/فتح باب الحجز-1.jpg.jpeg" target="_blank" rel="noreferrer">
                <img src="/images/فتح باب الحجز-1.jpg.jpeg" alt="فتح باب الحجز لدفعة 2027 مع الأستاذ عُبيدة" loading="lazy" />
                <span>اضغط لعرض الإعلان كاملًا</span>
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="features-section scroll-mt-24 py-20 sm:py-24">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="scroll-reveal grid items-end gap-5 md:grid-cols-2" data-reveal>
              <div>
                <span className="eyebrow">
                  <Sparkles className="h-4 w-4" /> منصة الأستاذ عُبيدة
                </span>
                <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">
                  بيئة تعليمية تصنع الفارق
                </h2>
              </div>
              <p className="max-w-lg leading-8 text-white/60 md:justify-self-end">
                كل ما يحتاجه الطالب من شرح وتدريب ومتابعة، في تجربة عربية بسيطة ومصممة للنجاح.
              </p>
            </div>
            <div className="mt-12 grid gap-5 md:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }, index) => (
                <article
                  key={title}
                  className="feature-card scroll-reveal"
                  data-reveal
                  style={{ transitionDelay: `${index * 90}ms` }}
                >
                  <span className="feature-icon">
                    <Icon className="h-6 w-6" />
                  </span>
                  <h3 className="mt-6 text-xl font-extrabold text-white">{title}</h3>
                  <p className="mt-3 text-sm leading-7 text-white/55">{desc}</p>
                  <span className="feature-number">0{index + 1}</span>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="journey-section py-20 sm:py-28">
          <div className="mx-auto max-w-7xl px-4 sm:px-6">
            <div className="scroll-reveal mx-auto max-w-2xl text-center" data-reveal>
              <span className="eyebrow">
                <Rocket className="h-4 w-4" /> رحلتك داخل المنصة
              </span>
              <h2 className="mt-4 text-3xl font-black text-white sm:text-5xl">
                من أول تسجيل لحد النتيجة… كل شيء واضح
              </h2>
              <p className="mt-4 leading-8 text-white/60">
                تجربة مصممة لتقلل التشتت وتخلي الطالب مركز في أهم شيء: الفهم والتدريب والتقدم المستمر.
              </p>
            </div>

            <div className="journey-grid mt-14">
              {learningJourney.map(({ icon: Icon, tone, number, title, desc }, index) => (
                <article key={title} className={`journey-card journey-card-${tone} scroll-reveal`} data-reveal style={{ transitionDelay: `${index * 80}ms` }}>
                  <span className="journey-number">{number}</span>
                  <span className="journey-icon" aria-hidden>
                    <Icon className="h-6 w-6" strokeWidth={2.15} />
                  </span>
                  <h3>{title}</h3>
                  <p>{desc}</p>
                  {index < learningJourney.length - 1 && <span className="journey-line" aria-hidden />}
                </article>
              ))}
            </div>

            <div className="platform-promise scroll-reveal mt-14" data-reveal>
              <div>
                <ShieldCheck className="h-8 w-8" />
                <span>
                  <strong>خصوصية وأمان من البداية</strong>
                  <small>كل طالب يرى بياناته فقط، والمدرس يدير المحتوى بصلاحيات واضحة وآمنة.</small>
                </span>
              </div>
              <Button asChild size="lg" className="gold-button rounded-full px-8">
                <Link to="/auth">ابدأ حسابك الآن <ArrowLeft className="h-4 w-4" /></Link>
              </Button>
            </div>
          </div>
        </section>

        <section id="start" className="px-4 py-20 sm:px-6 sm:py-28">
          <div className="cta-card scroll-reveal mx-auto max-w-7xl" data-reveal>
            <div className="cta-orb" aria-hidden="true" />
            <div className="relative z-10 max-w-2xl">
              <span className="inline-flex items-center gap-2 text-sm font-bold text-cyan-200">
                <Users className="h-4 w-4" /> انضم إلى طلابنا
              </span>
              <h2 className="mt-4 text-3xl font-black leading-tight text-white sm:text-5xl">
                ابدأ اليوم، وقد تكون أنت بطل قصتنا القادمة
              </h2>
              <p className="mt-5 leading-8 text-white/65">
                أنشئ حسابك وابدأ رحلة تعليمية فيها كل الدعم الذي تحتاجه للوصول إلى هدفك.
              </p>
              <Button asChild size="lg" className="gold-button mt-8 rounded-full px-8">
                <Link to="/auth">
                  <Rocket className="ml-2 h-5 w-5" /> أنشئ حسابك الآن
                </Link>
              </Button>
            </div>
            <GraduationCap className="cta-cap" aria-hidden="true" />
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white py-8 text-center text-sm text-slate-500">
        © {new Date().getFullYear()} منصة الأستاذ عُبيدة — كل الحقوق محفوظة.
      </footer>
    </div>
  );
}
