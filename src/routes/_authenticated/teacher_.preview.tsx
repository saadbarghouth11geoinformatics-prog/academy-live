import { createFileRoute } from "@tanstack/react-router";
import { RoleGuard } from "@/components/role-guard";
import { StudentPortal } from "@/routes/_authenticated/student";

export const Route = createFileRoute("/_authenticated/teacher_/preview")({
  component: () => (
    <RoleGuard allow={["teacher", "admin"]}>
      <StudentPortal />
    </RoleGuard>
  ),
});
