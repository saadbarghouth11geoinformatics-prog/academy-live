import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "teacher" | "student" | "parent";

export interface AuthState {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
}

async function restoreSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  // Refresh shortly before expiry so a saved login keeps working after reopening the browser.
  const expiresAt = (data.session.expires_at ?? 0) * 1000;
  if (expiresAt && expiresAt <= Date.now() + 2 * 60_000) {
    const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
    if (!refreshError && refreshed.session) return refreshed.session;
  }

  return data.session;
}

export function useAuth(): AuthState {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const saved = localStorage.getItem("academy_user_roles");
      if (saved) return JSON.parse(saved);
    } catch {}
    return [];
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function loadRoles(userId: string) {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);
        if (error) {
          console.warn("loadRoles error:", error.message);
          return;
        }
        const fetchedRoles = (data ?? []).map((r) => r.role as AppRole);
        if (mounted) {
          if (fetchedRoles.length > 0) {
            setRoles(fetchedRoles);
            if (typeof window !== "undefined") {
              try {
                localStorage.setItem("academy_user_roles", JSON.stringify(fetchedRoles));
              } catch {}
            }
          }
        }
      } catch (err) {
        console.warn("loadRoles exception:", err);
      }
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) {
        setLoading(true);
        setTimeout(async () => {
          await loadRoles(s.user.id);
          if (mounted) setLoading(false);
        }, 0);
      } else {
        setRoles([]);
        if (typeof window !== "undefined") {
          try {
            localStorage.removeItem("academy_user_roles");
            localStorage.removeItem("academy_user_profile");
          } catch {}
        }
        setLoading(false);
      }
    });

    void (async () => {
      const session = await restoreSession();
      if (!mounted) return;
      setSession(session);
      if (session?.user) await loadRoles(session.user.id);
      if (mounted) setLoading(false);
    })();

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { session, user: session?.user ?? null, roles, loading };
}

export function primaryRole(roles: AppRole[]): AppRole | null {
  const order: AppRole[] = ["admin", "teacher", "parent", "student"];
  for (const r of order) if (roles.includes(r)) return r;
  return null;
}

export function homePathForRole(role: AppRole | null): string {
  switch (role) {
    case "admin":
      return "/teacher";
    case "teacher":
      return "/teacher";
    case "parent":
      return "/student";
    case "student":
      return "/student";
    default:
      return "/onboarding";
  }
}
