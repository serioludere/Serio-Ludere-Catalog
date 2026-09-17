// Where a successful admin login may send the owner next (docs/ADMIN_SPEC.md §9.3), pure.
//
// This module used to throttle logins too — per-address and global failure windows, an exponential
// Retry-After and an `auth.lockout` audit row. That went on 2026-09-17 at the owner's request: no
// attempt limits on any login. The `auth.lockout` audit action stays so old rows still read.

/** Only `/admin`, `/admin/...` with url-safe segments may be a post-login destination. */
export const NEXT_RE = /^\/admin(\/[A-Za-z0-9_\-/]*)?$/;

export function sanitiseNext(value: unknown, fallback = '/admin'): string {
  if (typeof value !== 'string') return fallback;
  const v = value.trim();
  if (!NEXT_RE.test(v) || v.startsWith('//') || v === '/admin/login' || v === '/admin/logout')
    return fallback;
  return v;
}
