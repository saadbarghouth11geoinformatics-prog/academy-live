import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async () => {
    const { data: stored, error: sessionError } = await supabase.auth.getSession();
    if (sessionError || !stored.session) throw redirect({ to: "/auth" });

    const expiresAt = (stored.session.expires_at ?? 0) * 1000;
    if (expiresAt && expiresAt <= Date.now() + 2 * 60_000) {
      const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError || !refreshed.session) throw redirect({ to: "/auth" });
      return { user: refreshed.session.user };
    }

    return { user: stored.session.user };
  },
  component: () => <Outlet />,
});
