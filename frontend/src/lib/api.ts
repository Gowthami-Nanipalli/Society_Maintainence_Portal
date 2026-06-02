// Tiny fetch wrapper that:
//   * prefixes a configurable API base URL
//   * attaches the JWT from sessionStorage as Authorization header
//   * surfaces server-side `detail` strings as Error.message
//   * triggers a logout-redirect on 401

export const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const TOKEN_KEY = "cm.token.v1";

export function getToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string) {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  sessionStorage.removeItem(TOKEN_KEY);
}

export type ApiOptions = RequestInit & {
  /** Skip the global 401 → login redirect (e.g. on the login endpoint itself). */
  skipUnauthorizedRedirect?: boolean;
};

export class ApiError extends Error {
  status: number;
  data: unknown;
  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

function extractMessage(data: unknown, fallback: string): string {
  if (typeof data === "string") return data;
  if (data && typeof data === "object") {
    const anyData = data as Record<string, unknown>;
    if (typeof anyData.detail === "string") return anyData.detail;
    if (Array.isArray(anyData.detail)) {
      const first = anyData.detail[0];
      if (first && typeof first === "object" && "msg" in first) {
        return String((first as { msg: unknown }).msg);
      }
    }
    if (typeof anyData.message === "string") return anyData.message;
  }
  return fallback;
}

export async function apiFetch<T = unknown>(
  path: string,
  options: ApiOptions = {}
): Promise<T> {
  const headers = new Headers(options.headers);
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  if (
    options.body !== undefined &&
    !(options.body instanceof FormData) &&
    !headers.has("Content-Type")
  ) {
    headers.set("Content-Type", "application/json");
  }
  const token = getToken();
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;

  let response: Response;
  try {
    response = await fetch(url, { ...options, headers });
  } catch (err) {
    throw new ApiError(
      "Cannot reach the server. Please check your connection and try again.",
      0,
      err
    );
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let data: unknown = null;
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    const text = await response.text();
    data = text ? text : null;
  }

  if (!response.ok) {
    const message = extractMessage(
      data,
      response.statusText || `Request failed with status ${response.status}`
    );
    if (response.status === 401 && !options.skipUnauthorizedRedirect) {
      clearToken();
      // Force a hard navigation so all in-memory React state is dropped.
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
    throw new ApiError(message, response.status, data);
  }

  return data as T;
}

export const api = {
  get: <T,>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...(options || {}), method: "GET" }),
  post: <T,>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, {
      ...(options || {}),
      method: "POST",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  patch: <T,>(path: string, body?: unknown, options?: ApiOptions) =>
    apiFetch<T>(path, {
      ...(options || {}),
      method: "PATCH",
      body: body === undefined ? undefined : JSON.stringify(body),
    }),
  delete: <T,>(path: string, options?: ApiOptions) =>
    apiFetch<T>(path, { ...(options || {}), method: "DELETE" }),
};
