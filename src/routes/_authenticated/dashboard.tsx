import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, primaryRole, homePathForRole } from "@/hooks/use-auth";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: () => {
    const { roles, loading } = useAuth();
    const navigate = useNavigate();
    useEffect(() => {
      if (!loading) navigate({ to: homePathForRole(primaryRole(roles)), replace: true });
    }, [loading, roles, navigate]);
    return (
      <div className="flex min-h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  },
});