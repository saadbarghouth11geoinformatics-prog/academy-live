import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/_authenticated/onboarding")({
  component: () => (
    <AppShell title="حسابك بانتظار التفعيل" subtitle="لم يتم تعيين دور لحسابك بعد">
      <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted-foreground">
        يرجى التواصل مع المعلم لتفعيل الحساب أو التأكد من تسجيل الدخول ببيانات الطالب الصحيحة.
      </div>
    </AppShell>
  ),
});