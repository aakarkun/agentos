/**
 * Consistent JSON envelope for all /api/agent/* responses.
 */

import { NextResponse } from 'next/server';

export type AgentApiResponse<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; details?: unknown } };

export function ok<T>(data: T, status = 200): NextResponse {
  return NextResponse.json({ ok: true as const, data }, { status });
}

export function fail(
  code: string,
  message: string,
  details?: unknown,
  status = 400
): NextResponse {
  return NextResponse.json(
    { ok: false as const, error: { code, message, ...(details !== undefined && { details }) } },
    { status }
  );
}

export const status = {
  ok: 200,
  badRequest: 400,
  unauthorized: 401,
  notFound: 404,
  serverError: 500,
} as const;
