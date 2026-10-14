/**
 * Customer-facing routes. No login, no app Header.
 * Quote view and invoice view only. Any other route is protected.
 */
const PUBLIC_PATTERNS: RegExp[] = [
  /^\/quotes\/[^/]+\/view\/?$/,
  /^\/inv\/[^/]+\/?$/,
];

export function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATTERNS.some((re) => re.test(pathname));
}
