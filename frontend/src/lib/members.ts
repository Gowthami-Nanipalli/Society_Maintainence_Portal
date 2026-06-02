import { api } from "./api";
import type { AuthUser, UserRole, UserStatus } from "./types";

export type UpdateProfileInput = {
  name: string;
  mobile: string;
  house?: string | null;
  plot_no?: string | null;
};

export function listMembers(filters?: {
  status?: UserStatus;
  role?: UserRole;
}): Promise<AuthUser[]> {
  const params = new URLSearchParams();
  if (filters?.status) params.set("status", filters.status);
  if (filters?.role) params.set("role", filters.role);
  const qs = params.toString();
  return api.get<AuthUser[]>(`/api/members${qs ? `?${qs}` : ""}`);
}

export function listPendingMembers(): Promise<AuthUser[]> {
  return api.get<AuthUser[]>("/api/members/pending");
}

export function decideApproval(memberId: number, approve: boolean): Promise<AuthUser> {
  return api.post<AuthUser>(`/api/members/${memberId}/approval`, { approve });
}

export function updateMyProfile(input: UpdateProfileInput): Promise<AuthUser> {
  return api.patch<AuthUser>("/api/members/me", input);
}

export function changeMyEmail(email: string, current_password: string): Promise<AuthUser> {
  return api.post<AuthUser>("/api/members/me/change-email", {
    email,
    current_password,
  });
}

export function changeMyPassword(current_password: string, new_password: string): Promise<void> {
  return api.post<void>("/api/members/me/change-password", {
    current_password,
    new_password,
  });
}
