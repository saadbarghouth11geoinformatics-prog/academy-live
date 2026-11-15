const LAST_ROUTE_PREFIX = "academy_last_authenticated_route";

function isSafeAuthenticatedRoute(value: string | null | undefined): value is string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return false;

  const pathname = value.split(/[?#]/, 1)[0];
  return (
    pathname.startsWith("/student") ||
    pathname.startsWith("/teacher") ||
    pathname.startsWith("/curriculum") ||
    pathname.startsWith("/exams") ||
    pathname.startsWith("/exam/")
  );
}

function keyFor(userId: string) {
  return `${LAST_ROUTE_PREFIX}:${userId}`;
}

/** Stores only internal protected routes, scoped to the signed-in account. */
export function rememberAuthenticatedRoute(userId: string, href: string) {
  if (typeof window === "undefined" || !isSafeAuthenticatedRoute(href)) return;

  try {
    localStorage.setItem(keyFor(userId), href);
  } catch {
    // Storage can be unavailable in private browsing. Navigation should still work normally.
  }
}

/** Returns a safe route to resume, never an external URL or an auth page. */
export function getRememberedAuthenticatedRoute(userId: string) {
  if (typeof window === "undefined") return null;

  try {
    const saved = localStorage.getItem(keyFor(userId));
    return isSafeAuthenticatedRoute(saved) ? saved : null;
  } catch {
    return null;
  }
}

export function getSafeReturnRoute(value: string | null | undefined) {
  return isSafeAuthenticatedRoute(value) ? value : null;
}
