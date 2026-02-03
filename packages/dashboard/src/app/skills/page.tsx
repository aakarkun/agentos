'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { OPENWALLET_SKILLS } from '@/lib/skills-config';

export default function SkillsPage() {
  const [copied, setCopied] = useState<'curl' | 'config' | null>(null);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
  const curlOneLiner = `curl -fsSL "${baseUrl}/api/skills/install" | sh`;
  const configUrl = `${baseUrl}/api/skills/config`;

  const copyToClipboard = async (text: string, key: 'curl' | 'config') => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(key);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      // ignore
    }
  };

  const readSkills = OPENWALLET_SKILLS.filter((s) => s.type === 'read');
  const writeSkills = OPENWALLET_SKILLS.filter((s) => s.type === 'write');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">
          Skills
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Skills that agents can use with OpenWallet. Store this config in your local OpenClaw (or agent) config so agents can check balances, list wallets, and propose or approve transfers.
        </p>
      </div>

      {/* Install with curl */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Install with curl</CardTitle>
          <CardDescription>
            Run this in your terminal to download the OpenWallet skills config and save it to <code className="text-xs rounded bg-muted px-1">~/.openclaw/skills/openwallet.json</code>. Override the directory with <code className="text-xs rounded bg-muted px-1">OPENCLAW_SKILLS_DIR</code>.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="rounded-2xl border border-border bg-muted/50 p-4 text-sm font-mono text-foreground overflow-x-auto">
            <code>{curlOneLiner}</code>
          </pre>
          <Button
            size="sm"
            variant="outline"
            className="rounded-full"
            onClick={() => copyToClipboard(curlOneLiner, 'curl')}
          >
            {copied === 'curl' ? 'Copied!' : 'Copy curl command'}
          </Button>
        </CardContent>
      </Card>

      {/* Download config directly */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Download config (JSON)</CardTitle>
          <CardDescription>
            Download the skills config file directly, or reference it in your agent config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <pre className="rounded-2xl border border-border bg-muted/50 p-4 text-sm font-mono text-muted-foreground overflow-x-auto">
            <code>curl -fsSL &quot;{configUrl}&quot; -o openwallet-skills.json</code>
          </pre>
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="outline"
              className="rounded-full"
              onClick={() => copyToClipboard(`curl -fsSL "${configUrl}" -o openwallet-skills.json`, 'config')}
            >
              {copied === 'config' ? 'Copied!' : 'Copy command'}
            </Button>
            <Button size="sm" className="rounded-full" asChild>
              <a href={configUrl} download="openwallet-skills.json">
                Download JSON
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* List of skills */}
      <Card className="rounded-3xl border-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Available skills</CardTitle>
          <CardDescription>
            Skills agents can use when the config is loaded in OpenClaw or your local agent config.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Read</h3>
            <ul className="space-y-2">
              {readSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-col gap-0.5 rounded-xl border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="font-mono text-sm text-foreground">{skill.id}</span>
                  <span className="text-sm text-muted-foreground">{skill.description}</span>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-medium text-foreground mb-2">Write</h3>
            <ul className="space-y-2">
              {writeSkills.map((skill) => (
                <li
                  key={skill.id}
                  className="flex flex-col gap-0.5 rounded-xl border border-border bg-muted/30 px-3 py-2"
                >
                  <span className="font-mono text-sm text-foreground">{skill.id}</span>
                  <span className="text-sm text-muted-foreground">{skill.description}</span>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
