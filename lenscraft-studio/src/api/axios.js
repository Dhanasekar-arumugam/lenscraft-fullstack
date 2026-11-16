import axios from "axios";

// ============================================================
// 1. API CONFIGURATION
// ============================================================

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/").replace(
    /\/+$/,
    "",
  ) + "/";

const commonConfig = {
  baseURL: API_BASE_URL,

  // Send Django cookies with requests.
  withCredentials: true,

  // Axios automatically reads the csrftoken cookie
  // and sends X-CSRFToken on supported requests.
  withXSRFToken: true,

  xsrfCookieName: "csrftoken",
  xsrfHeaderName: "X-CSRFToken",

  timeout: 30000,
};

const api = axios.create(commonConfig);

// Separate client to avoid refresh interceptor loops.
const refreshClient = axios.create(commonConfig);

// ============================================================
// 2. ACCESS TOKEN MANAGEMENT
// ============================================================

// Access token stays in memory.
// Refresh token stays in an HttpOnly cookie.

let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

export const getAccessToken = () => accessToken;

export const clearAccessToken = () => {
  accessToken = null;
};

// ============================================================
// 3. AUTHENTICATION SESSION MANAGEMENT
// ============================================================

let refreshing = null;
let csrfInitializing = null;

let authVersion = 0;

export const invalidateAuthentication = () => {
  authVersion += 1;
  clearAccessToken();
};

// ============================================================
// 4. CSRF INITIALIZATION
// ============================================================

// Django endpoint:
// GET /api/auth/csrf/
//
// Django sets the csrftoken cookie and returns
// a matching masked CSRF token.

export async function initializeCsrf() {
  if (csrfInitializing) {
    return csrfInitializing;
  }

  const csrfPromise = (async () => {
    const response = await refreshClient.get("auth/csrf/");

    const csrfToken = response.data?.csrfToken;

    if (!csrfToken) {
      throw new Error("Django did not return a CSRF token.");
    }

    return csrfToken;
  })();

  csrfInitializing = csrfPromise;

  try {
    return await csrfPromise;
  } catch (error) {
    console.error(
      "CSRF initialization failed:",
      error.response?.data || error.message,
    );

    throw error;
  } finally {
    if (csrfInitializing === csrfPromise) {
      csrfInitializing = null;
    }
  }
}

// ============================================================
// 5. HELPER — IDENTIFY API ENDPOINT
// ============================================================

function getRequestPath(config) {
  try {
    return new URL(config.url || "", config.baseURL || API_BASE_URL).pathname;
  } catch {
    return "";
  }
}

function isAuthenticationEndpoint(config) {
  const requestPath = getRequestPath(config);

  const excludedPaths = [
    "/auth/login/",
    "/auth/logout/",
    "/auth/refresh/",
    "/auth/csrf/",
    "/auth/register/",
    "/auth/verify-email/",
    "/auth/resend-otp/",
  ];

  return excludedPaths.some((path) => requestPath.endsWith(path));
}

// ============================================================
// 6. HELPER — CSRF REQUIRED METHODS
// ============================================================

function requiresCsrf(config) {
  const method = (config.method || "get").toLowerCase();

  return ["post", "put", "patch", "delete"].includes(method);
}

// ============================================================
// 7. REQUEST INTERCEPTOR
// ============================================================

api.interceptors.request.use(
  async (config) => {
    // ----------------------------------------
    // JWT ACCESS TOKEN
    // ----------------------------------------

    if (accessToken) {
      config.headers.set("Authorization", `Bearer ${accessToken}`);
    } else {
      config.headers.delete("Authorization");
    }

    // ----------------------------------------
    // DJANGO CSRF PROTECTION
    // ----------------------------------------

    if (requiresCsrf(config)) {
      // Fetch a fresh CSRF token and ensure Django
      // initializes the csrftoken cookie.
      //
      // We explicitly send the returned token as a
      // header. The browser sends the cookie through
      // withCredentials: true.

      const csrfToken = await initializeCsrf();

      config.headers.set("X-CSRFToken", csrfToken);
    }

    // ----------------------------------------
    // MULTIPART FILE UPLOAD
    // ----------------------------------------

    if (config.data instanceof FormData) {
      config.headers.setContentType(undefined);
    }

    return config;
  },

  (error) => Promise.reject(error),
);

// ============================================================
// 8. REFRESH ACCESS TOKEN
// ============================================================

// Only one refresh request runs at a time.
// Concurrent requests share the same promise.

async function refreshAccessToken() {
  if (refreshing) {
    return refreshing;
  }

  const version = authVersion;

  const refreshPromise = (async () => {
    // Refresh requests bypass the normal api
    // interceptor, so initialize CSRF explicitly.
    const csrfToken = await initializeCsrf();

    const response = await refreshClient.post(
      "auth/refresh/",
      {},
      {
        headers: {
          "X-CSRFToken": csrfToken,
        },
      },
    );

    const token = response.data?.access;

    if (!token) {
      throw new Error("Refresh response does not contain an access token.");
    }

    // Prevent stale refresh requests from
    // restoring an old session.
    if (version !== authVersion) {
      throw new Error("Authentication changed during token refresh.");
    }

    setAccessToken(token);

    return token;
  })();

  refreshing = refreshPromise;

  try {
    return await refreshPromise;
  } finally {
    if (refreshing === refreshPromise) {
      refreshing = null;
    }
  }
}

// ============================================================
// 9. RESPONSE INTERCEPTOR
// AUTOMATIC JWT TOKEN REFRESH
// ============================================================

api.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (!originalRequest) {
      return Promise.reject(error);
    }

    const isUnauthorized = error.response?.status === 401;

    const alreadyRetried = originalRequest._retry === true;

    // Don't refresh for:
    // - Non-401 errors
    // - Already retried requests
    // - Authentication endpoints
   if (
     !isUnauthorized ||
     alreadyRetried ||
     isAuthenticationEndpoint(originalRequest) ||
     !accessToken
   ) {
     return Promise.reject(error);
   }

    originalRequest._retry = true;

    const version = authVersion;

    try {
      const newAccessToken = await refreshAccessToken();

      if (version !== authVersion) {
        return Promise.reject(error);
      }

      originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);

      // Preserve multipart uploads.
      if (originalRequest.data instanceof FormData) {
        originalRequest.headers.setContentType(undefined);
      }

      // Retry original request with new JWT.
      return api(originalRequest);
    } catch (refreshError) {
      const refreshStatus = refreshError.response?.status;

      if (version === authVersion) {
        if (refreshStatus === 400 || refreshStatus === 401) {
          invalidateAuthentication();
        } else {
          clearAccessToken();

          console.error(
            "Authentication refresh failed:",
            refreshError.response?.data || refreshError.message,
          );
        }
      }

      return Promise.reject(refreshError);
    }
  },
);

// ============================================================
// 10. RESTORE AUTHENTICATION
// ============================================================

export async function restoreAuthentication() {
  if (accessToken) {
    return accessToken;
  }

  try {
    return await refreshAccessToken();
  } catch (error) {
    const responseStatus = error.response?.status;

    if (responseStatus === 400 || responseStatus === 401) {
      invalidateAuthentication();
      return null;
    }

    clearAccessToken();

    console.error(
      "Unable to restore authentication:",
      error.response?.data || error.message,
    );

    return null;
  }
}

// ============================================================
// 11. EXPORT AXIOS INSTANCE
// ============================================================

export default api;
