/**
 * Public origin for pay_url etc. Prefer x-forwarded-* when behind a proxy.
 * - Both proto + host → use them (proto defaults to https when we have host).
 * - Host only (proto missing) → assume https (safe default).
 * - Proto only (host missing) → fall back to req.nextUrl.origin.
 * Never default to http when using forwarded host.
 */

import type { NextRequest } from 'next/server';

/** Take first value from comma-separated header (e.g. "https,http" or "example.com, internal") and trim. */
function firstHeaderValue(header: string): string {
  return (header.split(',')[0] ?? '').trim();
}

export function getPublicOrigin(req: NextRequest): string {
  const protoRaw = (req.headers.get('x-forwarded-proto') ?? '').trim();
  const hostRaw = (req.headers.get('x-forwarded-host') ?? '').trim();
  // (1) x-forwarded-proto may be comma-separated ("https,http") or contain spaces — take first value.
  const proto = firstHeaderValue(protoRaw);
  // (2) x-forwarded-host may be comma-separated ("example.com, internal") or contain spaces — take first value. (3) Host may include port (e.g. example.com:443); keep it.
  const host = firstHeaderValue(hostRaw);
  if (host) {
    const scheme = proto === 'https' ? 'https' : proto === 'http' ? 'http' : 'https';
    return `${scheme}://${host}`;
  }
  if (proto) {
    return req.nextUrl.origin;
  }
  return req.nextUrl.origin;
}
