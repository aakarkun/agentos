import { NextResponse } from 'next/server';
import { buildSkillsConfig } from '@/lib/skills-config';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const config = buildSkillsConfig(origin);
  return NextResponse.json(config, {
    headers: {
      'Content-Disposition': 'attachment; filename="openwallet-skills.json"',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
