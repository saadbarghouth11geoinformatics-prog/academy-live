import { createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Loader2,
  Send,
  Clock,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Trophy,
  Sparkles,
  LayoutDashboard,
  ClipboardCheck,
  CircleHelp,
} from "lucide-react";
import { toast } from "sonner";
import { RoleGuard } from "@/components/role-guard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  startAttempt,
  getAttemptForTaking,
  submitAttempt,
  getExamPdfUrl,
  getAttemptReview,
} from "@/lib/academy.functions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/exam/$examId")({
  component: () => (
    <RoleGuard allow={["student", "parent", "admin", "teacher"]}>
      <ExamRunner />
    </RoleGuard>
  ),
});

function ExamRunner() {
  const { examId } = useParams({ from: "/_authenticated/exam/$examId" });
  const navigate = useNavigate();
  const qc = useQueryClient();
  const startFn = useServerFn(startAttempt);
  const getFn = useServerFn(getAttemptForTaking);
  const submitFn = useServerFn(submitAttempt);
  const reviewFn = useServerFn(getAttemptReview);
  const pdfFn = useServerFn(getExamPdfUrl);
  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [review, setReview] = useState<any | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const submittingRef = useRef(false);
  const startRequestedRef = useRef(false);

  useEffect(() => {
    if (startRequestedRef.current) return;
    startRequestedRef.current = true;
    startFn({ data: { exam_id: examId } })
      .then((r) => setAttemptId(r.attempt_id))
      .catch((e) => {
        const message = e?.message ?? "";
        if (message.includes("already_submitted")) {
          toast.info("تم تسليم هذا الامتحان من قبل، وستجد نتيجتك في السجل.");
        } else {
          toast.error("تعذّر بدء الامتحان: " + message);
        }
        qc.invalidateQueries({ queryKey: ["my-exams"] });
        qc.invalidateQueries({ queryKey: ["my-attempts"] });
        navigate({ to: "/student", replace: true });
      });
  }, [examId, startFn, navigate, qc]);

  const data = useQuery({
    queryKey: ["attempt", attemptId],
    enabled: !!attemptId,
    queryFn: () => getFn({ data: { attempt_id: attemptId! } }),
  });

  const pdfPath = data.data?.exam?.pdf_path ?? null;
  const pdf = useQuery({
    queryKey: ["exam-pdf", examId, pdfPath],
    enabled: !!pdfPath,
    queryFn: () => pdfFn({ data: { exam_id: examId } }),
  });

  const [answers, setAnswers] = useState<
    Record<string, { optionIds: string[]; textAnswer: string }>
  >({});

  const submit = useMutation({
    mutationFn: async () => {
      submittingRef.current = true;
      const payload = (data.data?.questions ?? []).map((q: any) => ({
        question_id: q.question_id,
        option_ids: answers[q.question_id]?.optionIds ?? [],
        text_answer: answers[q.question_id]?.textAnswer?.trim() || null,
      }));
      return submitFn({ data: { attempt_id: attemptId!, answers: payload } });
    },
    onSuccess: async (r) => {
      qc.invalidateQueries({ queryKey: ["my-exams"] });
      qc.invalidateQueries({ queryKey: ["my-attempts"] });
      setConfirmOpen(false);
      setResult(r);
      setResultOpen(true);
      setReviewLoading(true);
      try {
        const reviewData = await reviewFn({ data: { attempt_id: attemptId! } });
        setReview(reviewData);
      } catch (error: any) {
        toast.error("تم حفظ النتيجة، لكن تعذر تحميل مراجعة الإجابات: " + (error?.message ?? ""));
      } finally {
        setReviewLoading(false);
      }
    },
    onError: (e: any) => {
      submittingRef.current = false;
      toast.error("تعذّر التسليم: " + (e?.message ?? ""));
    },
  });

  const deadline = data.data?.attempt?.deadline_at
    ? new Date(data.data.attempt.deadline_at).getTime()
    : null;
  const [remaining, setRemaining] = useState<number>(0);
  useEffect(() => {
    if (!deadline) return;
    const tick = () => {
      const r = Math.max(0, deadline - Date.now());
      setRemaining(r);
      if (r <= 0 && !submittingRef.current) submit.mutate();
    };
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [deadline]); // eslint-disable-line react-hooks/exhaustive-deps

  const mmss = useMemo(() => {
    const s = Math.floor(remaining / 1000);
    return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  }, [remaining]);

  if (!attemptId || data.isLoading || !data.data) {
    return (
      <div className="flex min-h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (result) {
    return (
      <ExamReview
        result={result}
        review={review}
        loading={reviewLoading}
        resultOpen={resultOpen}
        onCloseResult={() => setResultOpen(false)}
        onDashboard={() => navigate({ to: "/student", replace: true })}
      />
    );
  }

  const { exam, questions } = data.data;
  const answered = Object.values(answers).filter(
    (answer) => answer.optionIds.length > 0 || answer.textAnswer.trim().length > 0,
  ).length;
  const hasPdf = !!exam?.pdf_path;

  return (
    <div className="exam-runner min-h-screen" dir="rtl">
      <header className="exam-header sticky top-0 z-20 border-b border-border/70 bg-card/90 backdrop-blur-xl">
        <div className="mx-auto max-w-5xl px-4 py-3 sm:px-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <span className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary sm:flex">
                <GraduationCap className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <h1 className="truncate font-black">{exam?.title}</h1>
                <p className="text-xs text-muted-foreground">
                  تم الرد على {answered} من {questions.length} · متبقي {questions.length - answered}
                </p>
              </div>
            </div>
            <div
              className={
                "flex shrink-0 items-center gap-2 rounded-xl px-3 py-2 font-black shadow-sm " +
                (remaining < 60000
                  ? "animate-pulse bg-destructive/10 text-destructive"
                  : "bg-primary/10 text-primary")
              }
            >
              <Clock className="h-4 w-4" /> <span dir="ltr">{mmss}</span>
            </div>
          </div>
          <div className="mt-3 flex items-center gap-3">
            <Progress value={(answered / Math.max(questions.length, 1)) * 100} className="h-2 flex-1" />
            <span className="text-[11px] font-bold text-muted-foreground">
              {Math.round((answered / Math.max(questions.length, 1)) * 100)}%
            </span>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-6 sm:px-6">
        <nav className="exam-navigator" aria-label="التنقل بين الأسئلة">
          <span className="shrink-0 text-xs font-bold text-muted-foreground">الأسئلة:</span>
          {questions.map((question: any, index: number) => {
            const answer = answers[question.question_id];
            const isAnswered = !!answer && (answer.optionIds.length > 0 || answer.textAnswer.trim().length > 0);
            return (
              <button
                key={question.question_id}
                type="button"
                className={`exam-nav-dot ${isAnswered ? "answered" : ""}`}
                onClick={() => document.getElementById(`question-${index}`)?.scrollIntoView({ behavior: "smooth", block: "center" })}
                aria-label={`الانتقال إلى السؤال ${index + 1}`}
              >
                {index + 1}
              </button>
            );
          })}
        </nav>
        {exam?.instructions && (
          <div className="flex gap-3 rounded-2xl border border-primary/15 bg-primary/5 p-4 text-sm text-muted-foreground">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
            <span className="leading-7">{exam.instructions}</span>
          </div>
        )}
        {hasPdf && (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <h3 className="text-sm font-semibold">ورقة الأسئلة (PDF)</h3>
              {pdf.data?.url && (
                <a
                  href={pdf.data.url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary underline"
                >
                  فتح في نافذة جديدة
                </a>
              )}
            </div>
            {pdf.data?.url ? (
              <iframe src={pdf.data.url} className="h-[70vh] w-full" title="exam pdf" />
            ) : (
              <div className="flex h-40 items-center justify-center text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin" />
              </div>
            )}
          </div>
        )}
        {questions.map((q: any, idx: number) => (
          <div
            id={`question-${idx}`}
            key={q.question_id}
            className="exam-question-card rounded-2xl border border-border bg-card p-5"
          >
            <div className="mb-3 flex items-start justify-between gap-3">
              <h3 className="font-semibold">
                <span className="ml-2 text-muted-foreground">س{idx + 1}.</span>
                {hasPdf ? "اختر الإجابة" : q.prompt}
              </h3>
              <span className="rounded-md bg-muted px-2 py-1 text-xs text-muted-foreground">
                {q.points} درجة
              </span>
            </div>
            {q.type === "short_answer" || q.type === "essay" ? (
              <div className="space-y-2">
                <Textarea
                  value={answers[q.question_id]?.textAnswer ?? ""}
                  onChange={(event) =>
                    setAnswers((current) => ({
                      ...current,
                      [q.question_id]: {
                        optionIds: current[q.question_id]?.optionIds ?? [],
                        textAnswer: event.target.value,
                      },
                    }))
                  }
                  rows={q.type === "essay" ? 8 : 3}
                  maxLength={10000}
                  placeholder={
                    q.type === "essay" ? "اكتب إجابتك المقالية بالتفصيل" : "اكتب الإجابة"
                  }
                />
                {q.type === "essay" && (
                  <p className="text-xs text-muted-foreground">
                    تتم مراجعة هذا السؤال بواسطة المدرس.
                  </p>
                )}
              </div>
            ) : (
              <div className={hasPdf ? "flex flex-wrap gap-2" : "space-y-2"}>
                {q.options.map((o: any) => {
                  const selectedIds = answers[q.question_id]?.optionIds ?? [];
                  const checked = selectedIds.includes(o.id);
                  const isMulti = q.type === "mcq_multi";
                  const changeAnswer = () =>
                    setAnswers((current) => {
                      const previous = current[q.question_id] ?? { optionIds: [], textAnswer: "" };
                      const optionIds = isMulti
                        ? checked
                          ? previous.optionIds.filter((id) => id !== o.id)
                          : [...previous.optionIds, o.id]
                        : [o.id];
                      return { ...current, [q.question_id]: { ...previous, optionIds } };
                    });
                  if (hasPdf) {
                    return (
                      <label
                        key={o.id}
                        className={
                          "flex min-w-[64px] cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-2 font-bold transition-colors " +
                          (checked
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border hover:bg-accent/40")
                        }
                      >
                        <input
                          type={isMulti ? "checkbox" : "radio"}
                          name={q.question_id}
                          className="sr-only"
                          checked={checked}
                          onChange={changeAnswer}
                        />
                        {o.label}
                      </label>
                    );
                  }
                  return (
                    <label
                      key={o.id}
                      className={
                        "flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors " +
                        (checked
                          ? "border-primary bg-primary/5"
                          : "border-border hover:bg-accent/40")
                      }
                    >
                      <input
                        type={isMulti ? "checkbox" : "radio"}
                        name={q.question_id}
                        className="h-4 w-4 accent-primary"
                        checked={checked}
                        onChange={changeAnswer}
                      />
                      <span>{o.label}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
        <div className="exam-submit-panel">
          <div>
            <strong>راجع إجاباتك قبل التسليم</strong>
            <p>أجبت عن {answered} سؤال، وما زال لديك {questions.length - answered} بدون إجابة.</p>
          </div>
          <Button
            size="lg"
            onClick={() => setConfirmOpen(true)}
            disabled={submit.isPending}
          >
            {submit.isPending ? (
              <Loader2 className="ml-2 h-4 w-4 animate-spin" />
            ) : (
              <Send className="ml-2 h-4 w-4" />
            )}
            تسليم الإجابات
          </Button>
        </div>
      </main>
      <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <DialogContent className="max-w-md overflow-hidden p-0">
          <div className="exam-confirm-dialog">
            <span className="exam-confirm-icon"><Send className="h-6 w-6" /></span>
            <DialogHeader>
              <DialogTitle className="text-center text-xl font-black">جاهز لتسليم الامتحان؟</DialogTitle>
              <DialogDescription className="text-center leading-7">بعد التسليم لا يمكنك تعديل إجاباتك، وستظهر لك المراجعة فورًا.</DialogDescription>
            </DialogHeader>
            <div className="exam-confirm-stats">
              <div><strong>{answered}</strong><span>تمت الإجابة</span></div>
              <div className={questions.length - answered ? "has-warning" : ""}><strong>{questions.length - answered}</strong><span>بدون إجابة</span></div>
              <div><strong>{questions.length}</strong><span>إجمالي الأسئلة</span></div>
            </div>
            {questions.length - answered > 0 && <div className="exam-confirm-warning"><AlertCircle className="h-4 w-4" /> لديك أسئلة بدون إجابة، ويمكنك الرجوع لاستكمالها قبل التسليم.</div>}
            <DialogFooter>
              <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submit.isPending}>العودة للمراجعة</Button>
              <Button onClick={() => submit.mutate()} disabled={submit.isPending}>
                {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} تأكيد وتسليم
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ExamReview({
  result,
  review,
  loading,
  resultOpen,
  onCloseResult,
  onDashboard,
}: {
  result: any;
  review: any;
  loading: boolean;
  resultOpen: boolean;
  onCloseResult: () => void;
  onDashboard: () => void;
}) {
  const percentage = Math.round(Number(result.percentage ?? 0));
  const pending = !!result.pending_manual_grading;
  const passed = result.passed === true;

  return (
    <div className="exam-review-page min-h-screen" dir="rtl">
      {resultOpen && (
        <div className="exam-result-overlay" role="dialog" aria-modal="true" aria-label="نتيجة الامتحان">
          <div className={`exam-result-celebration ${pending ? "is-pending" : passed ? "is-passed" : "is-improve"}`}>
            <div className="result-confetti" aria-hidden="true">{Array.from({ length: 12 }).map((_, index) => <i key={index} />)}</div>
            <span className="exam-result-main-icon">
              {pending ? <ClipboardCheck className="h-8 w-8" /> : passed ? <Trophy className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
            </span>
            <p className="exam-result-eyebrow">تم استلام إجاباتك بنجاح</p>
            <h1>{pending ? "أحسنت، تم تسليم الامتحان" : passed ? "ممتاز! نتيجة تستحق الاحتفال" : "خطوة جديدة في طريق التقدّم"}</h1>
            {pending ? (
              <div className="exam-result-pending-score"><strong>{result.objective_score ?? 0}</strong><span>درجة الأسئلة المصححة تلقائيًا<br />والنتيجة النهائية بعد مراجعة المدرس</span></div>
            ) : (
              <div className="exam-result-score" style={{ background: `conic-gradient(var(--result-color) ${percentage * 3.6}deg, var(--result-track) 0deg)` }}>
                <span><strong>{percentage}%</strong><small>{result.score}/{result.total} درجة</small></span>
              </div>
            )}
            <p className="exam-result-message">
              {pending
                ? "إجاباتك المقالية وصلت للمدرس، ويمكنك الآن مراجعة باقي الأسئلة وإجاباتها الصحيحة."
                : passed
                  ? "أداء رائع! راجع تفاصيل الإجابات لتثبّت نقاط قوتك وتتعلم من كل سؤال."
                  : "المحاولة جزء من النجاح. راجع التصحيح بالأسفل واعرف بالضبط أين تحتاج إلى تحسين."}
            </p>
            <div className="exam-result-actions">
              <Button size="lg" onClick={onCloseResult}><ClipboardCheck className="h-4 w-4" /> مراجعة الإجابات</Button>
              <Button size="lg" variant="outline" onClick={onDashboard}><LayoutDashboard className="h-4 w-4" /> العودة للوحة</Button>
            </div>
          </div>
        </div>
      )}

      <header className="exam-review-header">
        <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <div>
            <span className="inline-flex items-center gap-2 text-xs font-bold text-primary"><ClipboardCheck className="h-4 w-4" /> مراجعة وتصحيح الامتحان</span>
            <h1 className="mt-2 text-2xl font-black">{review?.exam?.title ?? "مراجعة إجاباتك"}</h1>
            <p className="mt-1 text-sm text-muted-foreground">شاهد إجابتك والإجابة الصحيحة لكل سؤال.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {!pending && <div className="review-summary-chip"><strong>{percentage}%</strong><span>النتيجة</span></div>}
            <div className="review-summary-chip"><strong>{result.objective_score ?? result.score ?? 0}</strong><span>درجة محققة</span></div>
            <Button variant="outline" onClick={onDashboard}><LayoutDashboard className="h-4 w-4" /> لوحة الطالب</Button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-7 sm:px-6">
        {loading ? (
          <div className="review-loading"><Loader2 className="h-7 w-7 animate-spin text-primary" /><p>جارٍ تجهيز تصحيح إجاباتك…</p></div>
        ) : !review ? (
          <div className="review-loading"><AlertCircle className="h-7 w-7 text-destructive" /><p>تعذر تحميل تفاصيل المراجعة، لكن نتيجتك محفوظة في لوحة الطالب.</p></div>
        ) : (
          <div className="space-y-4">
            {review.questions.map((question: any, index: number) => {
              const answer = question.answer;
              const selectedIds: string[] = answer?.selected_option_ids ?? [];
              const isEssay = question.type === "essay" || question.requires_manual_grading;
              const isCorrect = answer?.is_correct === true;
              const isPending = answer?.is_correct == null && isEssay;
              return (
                <article key={question.question_id} className={`review-question-card ${isPending ? "is-pending" : isCorrect ? "is-correct" : "is-wrong"}`}>
                  <div className="review-question-heading">
                    <span className="review-question-number">{index + 1}</span>
                    <div className="min-w-0 flex-1"><h2>{question.prompt || `السؤال ${index + 1}`}</h2><small>{question.points} درجة</small></div>
                    <span className="review-status">
                      {isPending ? <><CircleHelp className="h-4 w-4" /> ينتظر التصحيح</> : isCorrect ? <><CheckCircle2 className="h-4 w-4" /> إجابة صحيحة</> : <><XCircle className="h-4 w-4" /> إجابة غير صحيحة</>}
                    </span>
                  </div>

                  {question.options?.length ? (
                    <div className="review-options">
                      {question.options.map((option: any) => {
                        const selected = selectedIds.includes(option.id);
                        const correct = !!option.is_correct;
                        return (
                          <div key={option.id} className={`review-option ${correct ? "correct-answer" : ""} ${selected && !correct ? "student-wrong" : ""} ${selected ? "student-selected" : ""}`}>
                            <span>{correct ? <CheckCircle2 className="h-5 w-5" /> : selected ? <XCircle className="h-5 w-5" /> : <i />}</span>
                            <strong>{option.label}</strong>
                            <small>{correct && selected ? "إجابتك الصحيحة" : correct ? "الإجابة الصحيحة" : selected ? "إجابتك" : ""}</small>
                          </div>
                        );
                      })}
                    </div>
                  ) : isEssay ? (
                    <div className="review-text-answer">
                      <div><small>إجابتك</small><p>{answer?.text_answer || "لم تتم كتابة إجابة"}</p></div>
                      <div className="pending-note"><CircleHelp className="h-5 w-5" /><span><strong>بانتظار مراجعة المدرس</strong><small>ستظهر الدرجة النهائية والملاحظات في لوحة الطالب بعد التصحيح.</small></span></div>
                    </div>
                  ) : (
                    <div className="review-text-answer">
                      <div className={isCorrect ? "student-text-correct" : "student-text-wrong"}><small>إجابتك</small><p>{answer?.text_answer || "لم تتم كتابة إجابة"}</p></div>
                      {!isCorrect && <div className="correct-text-answer"><small>الإجابة الصحيحة</small><p>{question.accepted_answers?.join(" أو ") || "راجع المدرس"}</p></div>}
                    </div>
                  )}
                </article>
              );
            })}
            <div className="review-finish-card"><CheckCircle2 className="h-6 w-6" /><div><strong>انتهت المراجعة</strong><p>نتيجتك محفوظة ويمكنك الرجوع إليها في أي وقت من لوحة الطالب.</p></div><Button onClick={onDashboard}>العودة للوحة</Button></div>
          </div>
        )}
      </main>
    </div>
  );
}
