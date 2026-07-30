import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AlertCircle, GraduationCap, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/auth_/callback")({
  ssr: false,
  component: OAuthCallback,
});

function OAuthCallback() {
  const navigate = useNavigate();
  const started = useRef(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (started.current) return;
    started.current = true;

    void (async () => {
      try {
        const url = new URL(window.location.href);
        const query = url.searchParams;
        const hash = new URLSearchParams(url.hash.replace(/^#/, ""));
        const oauthError =
          query.get("error_description") ||
          hash.get("error_description") ||
          query.get("error") ||
          hash.get("error");

        if (oauthError) throw new Error(oauthError);

        const code = query.get("code");
        const accessToken = query.get("access_token") || hash.get("access_token");
        const refreshToken = query.get("refresh_token") || hash.get("refresh_token");

        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) throw exchangeError;
        } else if (accessToken && refreshToken) {
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (sessionError) throw sessionError;
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) throw sessionError;
        if (!data.session) {
          throw new Error("لم نتمكن من إكمال جلسة تسجيل الدخول. حاول مرة أخرى.");
        }

        window.history.replaceState({}, document.title, "/auth/callback");
        await navigate({ to: "/dashboard", replace: true });
      } catch (caught) {
        setError(caught instanceof Error ? caught.message : "تعذّر إكمال تسجيل الدخول بحساب Google");
      }
    })();
  }, [navigate]);

  return (
    <main
      className="relative flex min-h-screen items-center justify-center overflow-hidden bg-hero px-4"
      dir="rtl"
    >
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
      <div className="card-elegant relative w-full max-w-md p-8 text-center">
        <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow">
          {error ? <AlertCircle className="h-8 w-8" /> : <GraduationCap className="h-8 w-8" />}
        </div>

        {error ? (
          <>
            <h1 className="text-xl font-extrabold">تعذّر تسجيل الدخول بحساب Google</h1>
            <p className="mt-3 break-words text-sm leading-7 text-muted-foreground">{error}</p>
            <Button asChild className="mt-6 w-full">
              <Link to="/auth">العودة إلى تسجيل الدخول</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="mx-auto h-7 w-7 animate-spin text-primary" />
            <h1 className="mt-4 text-xl font-extrabold">جارٍ إكمال تسجيل الدخول</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              لحظات وسيتم تحويلك تلقائيًا إلى لوحة حسابك.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
