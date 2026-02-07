import { createHash } from 'crypto';

/** SHA-256 of input string, hex-encoded. Matches server bodySha256 (empty string => sha256 of ''). */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input, 'utf8').digest('hex');
}
