import { useEffect, useState } from "react";

import api, {
  restoreAuthentication,
  invalidateAuthentication,
} from "../api/axios";

// Share initialization across React Strict Mode remounts.
let initializationPromise = null;

function initializeSession() {
  if (!initializationPromise) {
    initializationPromise = (async () => {
      const token = await restoreAuthentication();

      if (!token) {
        sessionStorage.removeItem("lenscraft_user");
        window.dispatchEvent(new Event("lenscraft-auth-change"));
        return null;
      }

      try {
        const response = await api.get("auth/profile/");

        sessionStorage.setItem("lenscraft_user", JSON.stringify(response.data));

        window.dispatchEvent(new Event("lenscraft-auth-change"));

        return response.data;
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) {
          invalidateAuthentication();
          sessionStorage.removeItem("lenscraft_user");
          window.dispatchEvent(new Event("lenscraft-auth-change"));
        } else {
          console.error(
            "Authentication initialization failed:",
            error.response?.data || error.message,
          );
        }

        return null;
      }
    })().finally(() => {
      initializationPromise = null;
    });
  }

  return initializationPromise;
}

export default function AuthInitializer({ children }) {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    initializeSession()
      .catch((error) => {
        console.error("Session initialization error:", error);
      })
      .finally(() => {
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#0b0b0b",
          color: "#f26b5e",
          fontFamily: "'Inter', sans-serif",
          fontSize: "18px",
          fontWeight: "600",
          letterSpacing: "1px",
        }}
      >
        Loading Lenscraft Studio...
      </div>
    );
  }

  return children;
}
