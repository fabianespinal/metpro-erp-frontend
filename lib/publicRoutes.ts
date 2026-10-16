/**
 * Customer-facing routes. No login, no app Header.
 * Public quote (by token) and invoice view only. Any other route is protected.
 * /quotes/[id]/view is internal and requires login.
 */
const PUBLIC_PATTERNS: RegExp[] = [
  /^\/q\/[^/]+\/?$/,
  /^\/inv\/[^/]+\/?$/,
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((re) => re.test(pathname));
}
