/**
 * Typed HTTP client for the Codempress FastAPI backend.
 *
 * Reads VITE_API_URL from the environment (defaults to "/api").
 * Automatically attaches the JWT token from localStorage.
 */

const BASE: string = import.meta.env.VITE_API_URL
  ? (import.meta.env.VITE_API_URL as string).replace(/\/$/, "")
  : "/api";

const TOKEN_KEY = "sf_token";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const token = getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  ok: boolean;
}

class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

async function request<T = unknown>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${BASE}${path}`;
  const headers = { ...getAuthHeaders(), ...(options.headers as Record<string, string> ?? {}) };

  const res = await fetch(url, { ...options, headers });

  // Handle 401 — token expired or invalid.
  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem("sf_user");
    if (typeof window !== "undefined") {
      window.location.href = "/auth";
    }
    throw new ApiError("Unauthorized", 401, null);
  }

  // Attempt to parse JSON regardless of status.
  let body: unknown;
  try {
    body = await res.json();
  } catch {
    body = null;
  }

  if (!res.ok) {
    throw new ApiError(
      `Request failed: ${res.status} ${res.statusText}`,
      res.status,
      body
    );
  }

  return body as T;
}

// ---------------------------------------------------------------------------
// Typed helpers
// ---------------------------------------------------------------------------

interface PaginatedParams {
  page?: number;
  per_page?: number;
}

function toQuery(params: Record<string, string | number | undefined>): string {
  const entries = Object.entries(params).filter(
    ([, v]) => v !== undefined && v !== ""
  );
  if (entries.length === 0) return "";
  return "?" + new URLSearchParams(
    entries.map(([k, v]) => [k, String(v)])
  ).toString();
}

// ---------------------------------------------------------------------------
// Exported client
// ---------------------------------------------------------------------------

export const apiClient = {
  get: <T = unknown>(path: string) => request<T>(path),
  post: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "POST",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  put: <T = unknown>(path: string, body?: unknown) =>
    request<T>(path, {
      method: "PUT",
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  delete: <T = unknown>(path: string) =>
    request<T>(path, { method: "DELETE" }),
};

// ---------------------------------------------------------------------------
// Mascot AI Chat
// ---------------------------------------------------------------------------

interface MascotChatResponse {
  reply: string;
  action: string;
}

export async function sendMascotMessage(
  message: string,
  mascotId: number
): Promise<MascotChatResponse | null> {
  try {
    return await request<MascotChatResponse>("/mascot/chat", {
      method: "POST",
      body: JSON.stringify({ message, mascot_id: mascotId }),
    });
  } catch {
    return null;
  }
}

export { ApiError };
export type { ApiResponse, PaginatedParams };
