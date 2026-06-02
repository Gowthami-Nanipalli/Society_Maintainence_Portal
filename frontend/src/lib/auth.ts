import { api, clearToken, setToken } from "./api";
import type { AuthUser, UserRole } from "./types";

const USER_KEY = "cm.user.v1";

export function getCurrentUser(): AuthUser | null {
  try {
    const raw = sessionStorage.getItem(USER_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function setCurrentUser(user: AuthUser): void {
  sessionStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearCurrentUser(): void {
  sessionStorage.removeItem(USER_KEY);
}

export function logout(): void {
  clearToken();
  clearCurrentUser();
}

export type SignupInput = {
  name: string;
  email: string;
  mobile: string;
  house: string;
  plot_no?: string | null;
  password: string;
};

export async function signup(input: SignupInput): Promise<AuthUser> {
  return api.post<AuthUser>("/api/auth/signup", input, {
    skipUnauthorizedRedirect: true,
  });
}

export async function login(identifier: string, password: string): Promise<AuthUser> {
  const res = await api.post<{ access_token: string; user: AuthUser }>(
    "/api/auth/login",
    { identifier, password },
    { skipUnauthorizedRedirect: true }
  );
  setToken(res.access_token);
  setCurrentUser(res.user);
  return res.user;
}

export async function fetchMe(): Promise<AuthUser> {
  const user = await api.get<AuthUser>("/api/auth/me");
  setCurrentUser(user);
  return user;
}

export async function forgotPassword(identifier: string): Promise<void> {
  await api.post(
    "/api/auth/forgot-password",
    { identifier, password: "x" },
    { skipUnauthorizedRedirect: true }
  );
}

export function isOfficer(user: AuthUser | null): boolean {
  if (!user) return false;
  return user.role === "treasurer" || user.role === "president" || user.role === "secretary";
}

export function hasRole(user: AuthUser | null, ...roles: UserRole[]): boolean {
  if (!user) return false;
  return roles.includes(user.role);
}
