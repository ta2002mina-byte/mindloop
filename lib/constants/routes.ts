export const ROUTES = {
  home: "/",
  login: "/login",
  signup: "/signup",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
  authCallback: "/auth/callback",
  dashboard: "/dashboard",
  thoughts: "/thoughts",
  newThought: "/thoughts/new",
  patterns: "/patterns",
  predictions: "/predictions",
  worryCapsules: "/worry-capsules",
  decisions: "/decisions",
  insights: "/insights",
  settings: "/settings",
  /** Printable report, outside the app shell so it prints cleanly. */
  report: "/report",
} as const;

/** Detail and edit routes for a single thought. */
export function thoughtRoute(id: string): string {
  return `${ROUTES.thoughts}/${id}`;
}

export function thoughtEditRoute(id: string): string {
  return `${ROUTES.thoughts}/${id}/edit`;
}

/** A single decision board. */
export function decisionRoute(id: string): string {
  return `${ROUTES.decisions}/${id}`;
}

/** The printable report for a range of days. */
export function reportRoute(rangeDays: number): string {
  return `${ROUTES.report}?range=${rangeDays}`;
}

/** Any path starting with one of these requires a signed-in user. */
export const PROTECTED_ROUTE_PREFIXES: readonly string[] = [
  ROUTES.dashboard,
  ROUTES.thoughts,
  ROUTES.patterns,
  ROUTES.predictions,
  ROUTES.worryCapsules,
  ROUTES.decisions,
  ROUTES.insights,
  ROUTES.settings,
  ROUTES.report,
];

/**
 * Pages that make no sense for a signed-in user, so we send them to the dashboard.
 * /reset-password is intentionally NOT here: a recovery link signs the user in first.
 */
export const AUTH_ONLY_ROUTES: readonly string[] = [ROUTES.login, ROUTES.signup, ROUTES.forgotPassword];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function isAuthOnlyPath(pathname: string): boolean {
  return AUTH_ONLY_ROUTES.includes(pathname);
}
