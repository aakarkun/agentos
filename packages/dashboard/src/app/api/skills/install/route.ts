import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

/**
 * Returns a shell script that downloads the OpenWallet skills config
 * and saves it to ~/.openclaw/skills/openwallet.json (or OPENCLAW_SKILLS_DIR).
 * Usage: curl -fsSL "https://your-dashboard/api/skills/install" | sh
 */
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const baseUrl = url.origin;
  const configUrl = `${baseUrl}/api/skills/config`;

  const script = `#!/bin/sh
# OpenWallet skills installer for OpenClaw / agent local config
# Run: curl -fsSL "${baseUrl}/api/skills/install" | sh
set -e
SKILLS_DIR="\${OPENCLAW_SKILLS_DIR:-\$HOME/.openclaw/skills}"
mkdir -p "$SKILLS_DIR"
echo "Downloading OpenWallet skills config..."
curl -fsSL "${configUrl}" -o "$SKILLS_DIR/openwallet.json"
echo "Saved to $SKILLS_DIR/openwallet.json"
echo "Add this to your OpenClaw (or agent) config to use OpenWallet skills."
`;

  return new NextResponse(script, {
    headers: {
      'Content-Type': 'application/x-sh',
      'Content-Disposition': 'inline; filename="install-openwallet-skills.sh"',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
