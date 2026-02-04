/**
 * Agent API env: server signer (optional). Do not log or expose.
 */

export function getServerSignerPrivateKey(): string | null {
  const raw = (process.env.AGENTOS_SERVER_SIGNER_PRIVATE_KEY ?? '').trim();
  return raw || null;
}

export function hasServerSigner(): boolean {
  return !!getServerSignerPrivateKey();
}

/** If AGENTOS_REPLAY_REQUIRED=1 or true, replay insert failure (other than duplicate) must fail auth with 401. */
export function isReplayRequired(): boolean {
  const v = (process.env.AGENTOS_REPLAY_REQUIRED ?? '').trim().toLowerCase();
  return v === '1' || v === 'true';
}
