import type { Account } from "./accounts";

const SESSION_KEY = "cm.session.v1";

export type SessionUser = Pick<Account, "name" | "email" | "mobile" | "house" | "role">;

export function setCurrentUser(user: SessionUser) {
  localStorage.setItem(SESSION_KEY, JSON.stringify(user));
}

export function getCurrentUser(): SessionUser | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SessionUser;
  } catch {
    return null;
  }
}

export function clearCurrentUser() {
  localStorage.removeItem(SESSION_KEY);
}

export function updateCurrentUser(partial: Partial<SessionUser>): SessionUser | null {
  const current = getCurrentUser();
  if (!current) return null;
  const next = { ...current, ...partial };
  setCurrentUser(next);
  return next;
}
