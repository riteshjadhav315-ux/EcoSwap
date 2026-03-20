const stripTrailingSlash = (value: string) => value.replace(/\/+$/, "");

const envApiUrl = (import.meta.env.VITE_API_URL || "").trim();

export const API_ORIGIN = envApiUrl
  ? stripTrailingSlash(
      envApiUrl.endsWith("/api") ? envApiUrl.slice(0, -4) : envApiUrl
    )
  : import.meta.env.DEV
    ? "http://localhost:3000"
    : window.location.origin;

export const API_BASE_URL = `${API_ORIGIN}/api`;
export const SOCKET_URL = API_ORIGIN;

export const buildApiUrl = (endpoint: string) => {
  if (!endpoint) {
    return API_BASE_URL;
  }

  if (/^https?:\/\//i.test(endpoint)) {
    return endpoint;
  }

  if (endpoint === "/api") {
    return API_BASE_URL;
  }

  if (endpoint.startsWith("/api/")) {
    return `${API_BASE_URL}${endpoint.slice(4)}`;
  }

  return `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
};

const buildHeaders = (options: RequestInit) => {
  const headers = new Headers(options.headers);
  const token = localStorage.getItem("token");

  if (!headers.has("Accept")) {
    headers.set("Accept", "application/json");
  }

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  return headers;
};

const parseResponse = async <T>(response: Response): Promise<T | null> => {
  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    return null;
  }

  return response.json() as Promise<T>;
};

export const apiFetch = async <T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const response = await fetch(buildApiUrl(endpoint), {
    ...options,
    headers: buildHeaders(options),
  });

  const data = await parseResponse<T>(response);

  if (!response.ok) {
    const errorMessage =
      data && typeof data === "object"
        ? ((data as Record<string, unknown>).error as string | undefined) ||
          ((data as Record<string, unknown>).message as string | undefined)
        : undefined;

    throw new Error(errorMessage || `Request failed with status ${response.status}`);
  }

  return data as T;
};
