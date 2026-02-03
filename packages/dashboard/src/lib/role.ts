export const ROLE_STORAGE_KEY = 'openwallet-role';

export type Role = 'agent' | 'human';

export function getStoredRole(): Role | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = localStorage.getItem(ROLE_STORAGE_KEY);
    if (v === 'agent' || v === 'human') return v;
    return null;
  } catch {
    return null;
  }
}

export function setStoredRole(role: Role): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(ROLE_STORAGE_KEY, role);
  } catch {
    // ignore
  }
}

export function clearStoredRole(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(ROLE_STORAGE_KEY);
  } catch {
    // ignore
  }
}
