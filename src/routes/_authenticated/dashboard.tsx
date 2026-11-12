import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, primaryRole, homePathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardRedirect,
});

function DashboardRedirect() {
  const { roles, loading } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    if (!loading) {
      const role = primaryRole(roles);
      if (role) navigate({ to: homePathForRole(role), replace: true });
    }
  }, [loading, navigate, roles]);
  return (
    <div className="flex min-h-screen items-center justify-center" dir="rtl">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
    </div>
  );
}
