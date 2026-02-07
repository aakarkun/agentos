import type { Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sha256Hex } from './crypto';

const PREFIX = 'AgentOS Agent API';

/** Build canonical message for Agent API signed auth. */
export function buildCanonicalMessage(
  address: string,
  timestamp: string,
  path: string,
  bodySha256: string
): string {
  return `${PREFIX}\naddress=${address}\ntimestamp=${timestamp}\npath=${path}\nbodySha256=${bodySha256}`;
}

export interface SignedRequestParams {
  baseUrl: string;
  path: string;
  method: 'GET' | 'POST';
  body?: string;
  privateKey: Hex;
}

/** Build headers and signed message for one request. */
export async function signRequest(params: SignedRequestParams): Promise<{
  headers: Record<string, string>;
  address: string;
}> {
  const { baseUrl, path, method, body = '', privateKey } = params;
  const account = privateKeyToAccount(privateKey);
  const address = account.address;
  const timestamp = String(Date.now());
  const bodySha256 = sha256Hex(body);
  const pathname = path.startsWith('/') ? path : `/${path}`;
  const message = buildCanonicalMessage(address, timestamp, pathname, bodySha256);

  const signature = await account.signMessage({ message });

  const headers: Record<string, string> = {
    'x-agent-address': address,
    'x-agent-signature': signature,
    'x-agent-timestamp': timestamp,
  };
  return { headers, address };
}
