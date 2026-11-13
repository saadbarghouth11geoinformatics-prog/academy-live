import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  AlertCircle,
  ArrowLeft,
  BookOpenCheck,
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  FileQuestion,
  Loader2,
  LockKeyhole,
  Play,
  Search,
  Target,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { RoleGuard } from "@/components/role-guard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getStudentPortal } from "@/lib/academy.functions";
import { primaryRole, useAuth } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/exams")({
  component: () => (
    <RoleGuard allow={["student", "parent", "admin", "teacher"]}>
      <TeacherExamsPage />
    </RoleGuard>
  ),
});

type ExamState = "available" | "in_progress" | "upcoming" | "completed" | "ended";

function getExamState(exam: any): ExamState {
  if (exam.attempt && exam.attempt.status !== "in_progress") return "completed";
  if (exam.attempt?.status === "in_progress") return "in_progress";
  const now = Date.now();
  if (now < new Date(exam.opens_at).getTime()) return "upcoming";
  if (now > new Date(exam.closes_at).getTime()) return "ended";
  return "available";
}

function formatDate(value?: string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("ar-EG", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

const stateMeta: Record<ExamState, { label: string; tone: string }> = {
  available: { label: "متاح الآن", tone: "available" },
  in_progress: { label: "قيد الحل", tone: "progress" },
  upcoming: { label: "يفتح قريبًا", tone: "upcoming" },
  completed: { label: "تم التسليم", tone: "completed" },
  ended: { label: "انتهى الموعد", tone: "ended" },
};

function TeacherExamsPage() {
  const { roles } = useAuth();
  const role = primaryRole(roles);
  const observer = role === "parent" || role === "teacher" || role === "admin";
  const portalFn = useServerFn(getStudentPortal);
  const portal = useQuery({
    queryKey: ["teacher-exam-hub"],
    queryFn: () => portalFn({ data: { student_id: null } }),
    refetchInterval: 60_000,
  });
  const [filter, setFilter] = useState<"all" | ExamState>("all");
  const [level, setLevel] = useState("all");
  const [search, setSearch] = useState("");

  const exams = portal.data?.dashboard?.exams ?? [];
  const levels = useMemo(
    () => [...new Set(exams.map((exam: any) => exam.level_name).filter(Boolean))] as string[],
    [exams],
  );
  const filtered = useMemo(
    () =>
      exams.filter((exam: any) => {
        const state = getExamState(exam);
        const matchingState = filter === "all" || state === filter;
        const matchingLevel = level === "all" || exam.level_name === level;
        const matchingSearch = exam.title.toLowerCase().includes(search.trim().toLowerCase());
        return matchingState && matchingLevel && matchingSearch;
      }),
    [exams, filter, level, search],
  );
  const counts = useMemo(
    () => ({
      available: exams.filter((exam: any) => getExamState(exam) === "available").length,
      in_progress: exams.filter((exam: any) => getExamState(exam) === "in_progress").length,
      upcoming: exams.filter((exam: any) => getExamState(exam) === "upcoming").length,
      completed: exams.filter((exam: any) => getExamState(exam) === "completed").length,
    }),
    [exams],
  );
  const priority = exams.find((exam: any) => ["in_progress", "available"].includes(getExamState(exam)));

  return (
    <AppShell
      title="اختبارات الأستاذ"
      subtitle="اختبارات ينشرها الأستاذ منفصلة عن تدريبات المنهج والمواد"
    >
      <main className="teacher-exam-hub" dir="rtl">
        <header className="teacher-exam-hub__intro">
          <div>
            <div className="teacher-exam-hub__crumb">
              <ClipboardCheck aria-hidden /> <span>التقييم والمتابعة</span>
              <span className="teacher-exam-hub__crumb-separator">/</span>
              <strong>اختبارات الأستاذ</strong>
            </div>
            <h1>مركز اختبارات الأستاذ</h1>
            <p>هنا تظهر الامتحانات المنشورة من الأستاذ فقط. تدريبات الدروس والمواد ستجدها ضمن صفحة المنهج.</p>
          </div>
          <Link to="/student" className="teacher-exam-hub__back-link">
            <ArrowLeft /> العودة للوحة الطالب
          </Link>
        </header>

        {portal.isLoading ? (
          <ExamHubLoading />
        ) : portal.isError || !portal.data?.dashboard ? (
          <ExamHubFailure />
        ) : (
          <>
            {observer && (
              <div className="teacher-exam-hub__observer">
                <LockKeyhole />
                <span>وضع المتابعة: يمكنك الاطلاع على حالة الاختبارات، أما البدء والتسليم فمتاحان من حساب الطالب.</span>
              </div>
            )}

            <section className="teacher-exam-hub__ledger" aria-label="ملخص الاختبارات">
              <Metric label="متاح الآن" value={counts.available} tone="blue" />
              <Metric label="قيد الحل" value={counts.in_progress} tone="amber" />
              <Metric label="قادم" value={counts.upcoming} tone="slate" />
              <Metric label="مكتمل" value={counts.completed} tone="green" />
            </section>

            <section className="teacher-exam-hub__priority" aria-labelledby="next-exam-title">
              <div className="teacher-exam-hub__priority-number" aria-hidden>01</div>
              <div className="teacher-exam-hub__priority-content">
                <span className="teacher-exam-hub__section-kicker">الاختبار التالي</span>
                <h2 id="next-exam-title">{priority?.title ?? "لا يوجد اختبار مفتوح الآن"}</h2>
                <p>
                  {priority
                    ? `آخر موعد للتسليم: ${formatDate(priority.closes_at)}`
                    : "ستظهر هنا أولاً الاختبارات التي ينشرها الأستاذ عند فتحها لك."}
                </p>
                {priority && (
                  <div className="teacher-exam-hub__priority-meta">
                    <span><Clock3 /> {priority.duration_minutes} دقيقة</span>
                    <span><Target /> {priority.total_points} درجة</span>
                    {priority.level_name && <span><BookOpenCheck /> {priority.level_name}</span>}
                  </div>
                )}
              </div>
              {priority && !observer ? (
                <Button asChild className="teacher-exam-hub__primary-action">
                  <Link to="/exam/$examId" params={{ examId: priority.id }}>
                    <Play /> {getExamState(priority) === "in_progress" ? "استكمال الاختبار" : "بدء الاختبار"}
                  </Link>
                </Button>
              ) : priority ? (
                <Button disabled className="teacher-exam-hub__primary-action"><LockKeyhole /> للعرض فقط</Button>
              ) : null}
            </section>

            <section className="teacher-exam-hub__content">
              <div className="teacher-exam-hub__main-column">
                <div className="teacher-exam-hub__toolbar">
                  <div className="teacher-exam-hub__search">
                    <Search />
                    <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث باسم الاختبار" />
                  </div>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger><SelectValue placeholder="كل الصفوف" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">كل الصفوف</SelectItem>
                      {levels.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="teacher-exam-hub__filters" aria-label="تصفية حالة الاختبارات">
                  {([
                    ["all", "الكل"],
                    ["available", "متاح"],
                    ["in_progress", "قيد الحل"],
                    ["upcoming", "قادم"],
                    ["completed", "مكتمل"],
                  ] as const).map(([key, label]) => (
                    <button key={key} type="button" onClick={() => setFilter(key)} className={filter === key ? "is-active" : ""}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="teacher-exam-hub__collection-header">
                  <div><span className="teacher-exam-hub__section-kicker">سجل الاختبارات</span><h2>اختبارات منشورة لك</h2></div>
                  <span>{filtered.length} اختبار</span>
                </div>
                {filtered.length ? (
                  <div className="teacher-exam-hub__exam-list">
                    {filtered.map((exam: any, index: number) => <ExamRow key={exam.id} exam={exam} index={index} observer={observer} />)}
                  </div>
                ) : (
                  <div className="teacher-exam-hub__empty"><FileQuestion /><h2>لا توجد اختبارات مطابقة</h2><p>غيّر التصفية أو عد لاحقًا عند نشر الأستاذ لاختبار جديد.</p></div>
                )}
              </div>

              <aside className="teacher-exam-hub__rail">
                <section className="teacher-exam-hub__rail-card teacher-exam-hub__rail-card--dark">
                  <span className="teacher-exam-hub__section-kicker">قبل البدء</span>
                  <h2>تأكد من هذه النقاط</h2>
                  <ol>
                    <li><span>01</span><p>راجع وقت الفتح وموعد الإغلاق قبل البدء.</p></li>
                    <li><span>02</span><p>استعد بهدوء وتأكد من اتصال الإنترنت قبل فتح الأسئلة.</p></li>
                    <li><span>03</span><p>بعد التسليم ستظهر لك النتيجة أو حالة انتظار التصحيح.</p></li>
                  </ol>
                </section>
                <section className="teacher-exam-hub__rail-card">
                  <BookOpenCheck />
                  <h2>ما الفرق؟</h2>
                  <p>تدريبات المنهج موجودة داخل الدروس لمراجعة المحتوى، أما هذه الصفحة فمخصصة للاختبارات المنشورة من الأستاذ ونتائجها.</p>
                  <Link to="/student">الذهاب إلى المنهج والمواد <ArrowLeft /></Link>
                </section>
              </aside>
            </section>
          </>
        )}
      </main>
    </AppShell>
  );
}

function Metric({ label, value, tone }: { label: string; value: number; tone: string }) {
  return <div className={`teacher-exam-hub__metric teacher-exam-hub__metric--${tone}`}><strong>{String(value).padStart(2, "0")}</strong><span>{label}</span></div>;
}

function ExamRow({ exam, index, observer }: { exam: any; index: number; observer: boolean }) {
  const state = getExamState(exam);
  const meta = stateMeta[state];
  const attempt = exam.attempt;
  return (
    <article className="teacher-exam-hub__exam-row">
      <span className="teacher-exam-hub__row-number">{String(index + 1).padStart(2, "0")}</span>
      <div className="teacher-exam-hub__row-body">
        <div className="teacher-exam-hub__row-topline"><Badge className={`teacher-exam-hub__status teacher-exam-hub__status--${meta.tone}`}>{meta.label}</Badge>{exam.level_name && <span>{exam.level_name}</span>}</div>
        <h3>{exam.title}</h3>
        <div className="teacher-exam-hub__row-meta">
          <span><Clock3 /> {exam.duration_minutes} دقيقة</span><span><Target /> {exam.total_points} درجة</span><span><CalendarClock /> يفتح: {formatDate(exam.opens_at)}</span>
        </div>
        {state === "completed" && (
          <div className={`teacher-exam-hub__result ${attempt?.pending_manual_grading ? "is-pending" : ""}`}>
            {attempt?.pending_manual_grading ? "تم التسليم — في انتظار التصحيح" : <>النتيجة: {attempt?.score ?? 0} من {exam.total_points} ({Math.round(attempt?.percentage ?? 0)}%)</>}
          </div>
        )}
      </div>
      <div className="teacher-exam-hub__row-action">
        <span>يغلق: {formatDate(exam.closes_at)}</span>
        {!observer && (state === "available" || state === "in_progress") ? <Button asChild size="sm"><Link to="/exam/$examId" params={{ examId: exam.id }}>{state === "in_progress" ? "استكمال" : "ابدأ"} <ArrowLeft /></Link></Button> : observer ? <Button size="sm" variant="outline" disabled>للعرض فقط</Button> : state === "completed" ? <CheckCircle2 className="text-emerald-600" /> : null}
      </div>
    </article>
  );
}

function ExamHubLoading() {
  return <div className="teacher-exam-hub__loading"><Loader2 className="animate-spin" /><span>يجري تجهيز سجل اختبارات الأستاذ...</span><div /><div /><div /></div>;
}

function ExamHubFailure() {
  return <div className="teacher-exam-hub__failure"><AlertCircle /><h2>تعذر تحميل الاختبارات</h2><p>حدّث الصفحة، ثم تأكد من اتصال حسابك بالصف الدراسي.</p><Button asChild><Link to="/student">العودة للوحة الطالب</Link></Button></div>;
}
