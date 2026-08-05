import axios from "axios";

export const API_URL = "/api";

// ── Simple in-memory cache for GET requests ───────────────────────────────────
// Avoids refetching reference data (statusTypes, structure, etc.)
// within a short window. TTL = 30 seconds.
const _cache = new Map<string, { data: any; ts: number }>();
const CACHE_TTL = 30_000; // ms

export function getCached<T>(key: string): T | null {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL) { _cache.delete(key); return null; }
  return entry.data as T;
}

export function setCache(key: string, data: any) {
  _cache.set(key, { data, ts: Date.now() });
}

export function invalidateCache(pattern?: string) {
  if (!pattern) { _cache.clear(); return; }
  for (const key of Array.from(_cache.keys())) {
    if (key.includes(pattern)) _cache.delete(key);
  }
}

// ── Axios instance ────────────────────────────────────────────────────────────
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 
    "Content-Type": "application/json"
  },
  // Reasonable timeout so hung requests don't block the UI
  timeout: 15_000,
});

// Request interceptor — attach token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) config.headers.Authorization = `Bearer ${token}`;
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor — handle 401 and silent refresh via HttpOnly Cookie
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null) => {
  failedQueue.forEach((p) => {
    if (error) {
      p.reject(error);
    } else {
      p.resolve(token);
    }
  });
  failedQueue = [];
};

const clearAuthState = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("locked_user");
  if (window.location.pathname !== "/login") {
    window.location.href = "/login";
  }
};

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/security/login") &&
      !originalRequest.url?.includes("/security/refresh")
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            if (token && originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return apiClient(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Attempt silent refresh via HttpOnly Cookie
        const { data } = await apiClient.post("/security/refresh", {}, { withCredentials: true });

        const newToken = data.access_token || data.token;
        if (!newToken) {
          throw new Error("Refresh token failed");
        }

        localStorage.setItem("token", newToken);
        processQueue(null, newToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }

        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        clearAuthState();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
