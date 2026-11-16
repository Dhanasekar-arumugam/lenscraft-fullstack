import api, {
  initializeCsrf,
  setAccessToken,
  invalidateAuthentication,
  restoreAuthentication,
} from "./axios";

// ============================================================
// 1. AUTHENTICATION HELPERS
// ============================================================

const USER_STORAGE_KEY = "lenscraft_user";

function notifyAuthChange() {
  window.dispatchEvent(new Event("lenscraft-auth-change"));
}

function saveUser(user) {
  if (!user) return;

  sessionStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

  notifyAuthChange();
}

function clearUserSession() {
  sessionStorage.removeItem(USER_STORAGE_KEY);
  notifyAuthChange();
}

function getErrorMessage(error) {
  const data = error.response?.data;

  if (typeof data?.detail === "string") {
    return data.detail;
  }

  if (typeof data?.message === "string") {
    return data.message;
  }

  if (typeof data === "object" && data !== null) {
    const firstError = Object.values(data)[0];

    if (Array.isArray(firstError)) {
      return firstError.join(", ");
    }

    if (typeof firstError === "string") {
      return firstError;
    }
  }

  return error.message || "Something went wrong.";
}

// ============================================================
// 2. INITIALIZE CSRF COOKIE
// ============================================================

export async function getCsrfToken() {
  return initializeCsrf();
}

// ============================================================
// 3. REGISTER USER — SEND EMAIL OTP
// ============================================================

export async function registerUser(userData) {
  try {
    const response = await api.post("auth/register/", userData);

    // Backend response:
    // {
    //   message: "...",
    //   email: "...",
    //   verification_required: true,
    //   otp_expires_in: 300
    // }

    return response.data;
  } catch (error) {
    console.error("Registration failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 4. VERIFY EMAIL OTP
// ============================================================

export async function verifyEmail(email, otp) {
  try {
    const response = await api.post("auth/verify-email/", {
      email: email.trim().toLowerCase(),
      otp: String(otp).trim(),
    });

    // Backend response:
    // {
    //   message: "...",
    //   verified: true,
    //   email: "..."
    // }

    return response.data;
  } catch (error) {
    console.error("Email verification failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 5. RESEND EMAIL OTP
// ============================================================

export async function resendOtp(email) {
  try {
    const response = await api.post("auth/resend-otp/", {
      email: email.trim().toLowerCase(),
    });

    return response.data;
  } catch (error) {
    console.error("Resend OTP failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 6. LOGIN USER — JWT AUTHENTICATION
// ============================================================

export async function loginUser(email, password) {
  try {
    const response = await api.post("auth/login/", {
      email: email.trim().toLowerCase(),
      password,
    });

    const accessToken = response.data?.access;

    if (!accessToken) {
      throw new Error("Login response does not contain an access token.");
    }

    // Invalidate any older pending refresh request.
    invalidateAuthentication();

    // Store JWT access token in memory.
    setAccessToken(accessToken);

    // Save user for Navbar and protected routes.
    if (response.data?.user) {
      saveUser(response.data.user);
    }

    return response.data;
  } catch (error) {
    console.error("Login failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 7. LOGOUT USER
// ============================================================

export async function logoutUser() {
  // Invalidate local authentication immediately.
  // Prevent old refresh requests from restoring it.
  invalidateAuthentication();

  try {
    const response = await api.post("auth/logout/", {});

    return response.data;
  } catch (error) {
    console.error("Logout request failed:", getErrorMessage(error));

    throw error;
  } finally {
    // Always clear frontend user state.
    clearUserSession();
  }
}

// ============================================================
// 8. GET AUTHENTICATED USER PROFILE
// ============================================================

export async function getProfile() {
  try {
    const response = await api.get("auth/profile/");

    return response.data;
  } catch (error) {
    console.error("Profile request failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 9. GET CURRENT USER
// ============================================================

export async function getCurrentUser() {
  try {
    const response = await api.get("auth/me/");

    return response.data;
  } catch (error) {
    console.error("Current user request failed:", getErrorMessage(error));

    throw error;
  }
}

// ============================================================
// 10. RESTORE AUTHENTICATION AFTER RELOAD
// ============================================================

export async function restoreSession() {
  try {
    const token = await restoreAuthentication();

    if (!token) {
      clearUserSession();
      return null;
    }

    return {
      access: token,
    };
  } catch (error) {
    console.error("Session restoration failed:", getErrorMessage(error));

    clearUserSession();
    return null;
  }
}

// ============================================================
// 11. OPTIONAL USER SESSION HELPER
// ============================================================

export function getStoredUser() {
  try {
    const stored = sessionStorage.getItem(USER_STORAGE_KEY);

    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}
