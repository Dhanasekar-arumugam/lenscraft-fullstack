import { useEffect, useState } from "react";
import { Navigate, Outlet, Link, useLocation } from "react-router-dom";
import "../styles/AdminRoute.css";
import {
  ShieldAlert,
  LoaderCircle,
  ArrowLeft,
  Home,
  RefreshCw,
} from "lucide-react";

import api from "../api/axios";

export default function AdminRoute() {
  const location = useLocation();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const verifyAdmin = async () => {
      setLoading(true);
      setError("");

      try {
        const response = await api.get("auth/profile/");

        if (!active) return;

        setUser(response.data);
      } catch (err) {
        if (!active) return;

        setUser(null);

        const status = err.response?.status;

        if (status !== 401 && status !== 403) {
          setError(
            "We couldn't verify your access permissions. Please try again.",
          );
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    verifyAdmin();

    return () => {
      active = false;
    };
  }, [location.pathname]);

  // ==========================================
  // LOADING SCREEN
  // ==========================================

  if (loading) {
    return (
      <div className="admin-access-page">
        <LoaderCircle size={42} className="admin-loading-icon" />

        <h2>Verifying Access</h2>

        <p>Please wait while we verify your administrator permissions.</p>
      </div>
    );
  }

  // ==========================================
  // VERIFICATION ERROR
  // ==========================================

  if (error) {
    return (
      <div className="admin-access-page">
        <ShieldAlert size={55} color="#d4af37" />

        <h1>Verification Failed</h1>

        <p>{error}</p>

        <button
          className="admin-access-btn"
          onClick={() => window.location.reload()}
        >
          <RefreshCw size={18} />
          Try Again
        </button>
      </div>
    );
  }

  // ==========================================
  // NOT LOGGED IN
  // ==========================================

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  // ==========================================
  // NORMAL USER - ACCESS DENIED
  // ==========================================

  if (user.is_staff !== true) {
    return (
      <div className="admin-access-page">
        <div className="admin-access-icon">
          <ShieldAlert size={55} />
        </div>

        <span className="admin-access-label">RESTRICTED AREA</span>

        <h1>Access Denied</h1>

        <p>
          You don't have permission to access this page. This dashboard is
          exclusively available to Lenscraft Studio administrators.
        </p>

        <div className="admin-access-actions">
          <Link to="/" className="admin-access-btn">
            <Home size={18} />
            Back to Home
          </Link>

          <Link to="/profile" className="admin-access-secondary">
            <ArrowLeft size={18} />
            My Profile
          </Link>
        </div>
      </div>
    );
  }

  // ==========================================
  // ADMIN ACCESS GRANTED
  // ==========================================

  return <Outlet />;
}
