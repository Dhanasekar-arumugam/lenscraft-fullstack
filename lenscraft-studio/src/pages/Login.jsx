import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Aperture,
  ArrowRight,
  ArrowUpRight,
  Eye,
  EyeOff,
  Lock,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { loginUser } from "../api/authService";
import "../styles/Login.css";

// ============================================
// LENSCRAFT — CINEMATIC LOGIN
// ============================================

export default function Login() {
  const navigate = useNavigate();

  const pageRef = useRef(null);
  const typingTimer = useRef(null);

  // ============================================
  // FORM STATE
  // ============================================

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [focusedField, setFocusedField] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [typing, setTyping] = useState(false);

  const [pulse, setPulse] = useState(0);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState("");

  // ============================================
  // MOUSE SPOTLIGHT
  // ============================================

  const [mouse, setMouse] = useState({
    x: 50,
    y: 50,
  });

  // ============================================
  // PAGE INITIALIZATION
  // ============================================

  useEffect(() => {
    document.title = "Welcome Back | Lenscraft Studio";

    return () => {
      clearTimeout(typingTimer.current);
    };
  }, []);

  // ============================================
  // MOUSE MOVEMENT
  // ============================================

  const handleMouseMove = (event) => {
    if (event.pointerType === "touch") return;

    const rect = pageRef.current?.getBoundingClientRect();

    if (!rect) return;

    setMouse({
      x: ((event.clientX - rect.left) / rect.width) * 100,
      y: ((event.clientY - rect.top) / rect.height) * 100,
    });
  };

  // ============================================
  // HANDLE INPUT CHANGE
  // ============================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFocusedField(name);

    setTyping(true);

    setPulse((prev) => prev + 1);

    setError("");

    clearTimeout(typingTimer.current);

    typingTimer.current = setTimeout(() => {
      setTyping(false);
    }, 450);
  };

  // ============================================
  // HANDLE LOGIN
  // ============================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setLoading(true);
    setError("");

    try {
      // Authenticate using existing API service
      const data = await loginUser(formData.email.trim(), formData.password);

      // Validate returned user
      if (!data?.user) {
        throw new Error("User information was not returned.");
      }

      // Save logged-in user information
      sessionStorage.setItem("lenscraft_user", JSON.stringify(data.user));

      // Notify Navbar and other components
      window.dispatchEvent(new Event("lenscraft-auth-change"));

      // ========================================
      // REDIRECT ALL USERS TO HOME PAGE
      // ========================================

      navigate("/", {
        replace: true,
      });
    } catch (err) {
      const details = err.response?.data;

      let message = "Unable to sign in. Please check your credentials.";

      if (typeof details?.detail === "string") {
        message = details.detail;
      } else if (details?.non_field_errors?.length) {
        message = details.non_field_errors[0];
      } else if (details?.email?.length) {
        message = details.email[0];
      } else if (!err.response) {
        message =
          err.message === "Network Error"
            ? "Cannot connect to the server."
            : err.message || message;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // INTERACTIVE BACKGROUND TYPOGRAPHY
  // ============================================

  const backgroundWord =
    focusedField === "email"
      ? "WELCOME"
      : focusedField === "password"
        ? "PRIVATE SPACE"
        : "LENSCRAFT";

  const activeLength =
    focusedField === "email"
      ? formData.email.length
      : focusedField === "password"
        ? formData.password.length
        : 0;

  // Decorative symbols only.
  // Never display actual credentials in background.

  const decorativeSymbols =
    focusedField === "password"
      ? "●".repeat(Math.min(activeLength, 12))
      : "✦".repeat(Math.min(activeLength, 12));

  // ============================================
  // JSX
  // ============================================

  return (
    <main
      ref={pageRef}
      className="spotlight-login"
      onPointerMove={handleMouseMove}
      style={{
        "--mouse-x": `${mouse.x}%`,
        "--mouse-y": `${mouse.y}%`,
      }}
    >
      {/* ========================================
          BACKGROUND IMAGE
      ======================================== */}

      <div className="spotlight-background" aria-hidden="true">
        <img src="/images/login.webp" alt="" />
      </div>

      {/* DARK OVERLAY */}

      <div className="spotlight-overlay" aria-hidden="true" />

      {/* MOUSE SPOTLIGHT */}

      <div className="spotlight-mouse-light" aria-hidden="true" />

      {/* ========================================
          INTERACTIVE BACKGROUND TEXT
      ======================================== */}

      <div className="spotlight-typography" aria-hidden="true">
        <span className="spotlight-type-label">
          {focusedField
            ? "YOUR STORY IS UNFOLDING"
            : "A WORLD OF BEAUTIFUL MOMENTS"}
        </span>

        <div className="spotlight-type-main">
          <span key={backgroundWord}>{backgroundWord}</span>
        </div>

        <div className="spotlight-type-symbols">
          {decorativeSymbols && (
            <>
              <span>{decorativeSymbols}</span>

              <i className={typing ? "typing" : ""} />
            </>
          )}
        </div>
      </div>

      {/* ========================================
          KEYSTROKE ANIMATION
      ======================================== */}

      {typing && (
        <div key={pulse} className="spotlight-keystroke" aria-hidden="true" />
      )}

      {/* ========================================
          TOP BRAND
      ======================================== */}

      <div className="spotlight-topbar">
        <Link to="/" className="spotlight-brand">
          <Aperture size={27} strokeWidth={1.5} />

          <span>LENSCRAFT</span>
        </Link>

        <span className="spotlight-top-caption">
          PHOTOGRAPHY & TIMELESS STORIES
        </span>
      </div>

      {/* ========================================
          CENTER LOGIN CARD
      ======================================== */}

      <section className="spotlight-center">
        <div className="spotlight-card">
          {/* CARD GLOW */}

          <div className="spotlight-card-glow" />

          <div className="spotlight-card-inner">
            {/* EMBLEM */}

            <div className="spotlight-emblem">
              <Aperture size={29} strokeWidth={1.4} />
            </div>

            {/* EYEBROW */}

            <div className="spotlight-eyebrow">
              <Sparkles size={14} />

              <span>WELCOME TO LENSCRAFT</span>
            </div>

            {/* HEADING */}

            <h1>
              Step into
              <br />
              <em>your story.</em>
            </h1>

            {/* DESCRIPTION */}

            <p className="spotlight-subtitle">
              Your memories deserve a beautiful place. Sign in to continue.
            </p>

            {/* ====================================
                LOGIN FORM
            ==================================== */}

            <form onSubmit={handleSubmit}>
              {/* EMAIL */}

              <div className="spotlight-field">
                <label htmlFor="spotlight-email">EMAIL ADDRESS</label>

                <div
                  className={`spotlight-input ${
                    focusedField === "email" ? "active" : ""
                  }`}
                >
                  <Mail size={18} />

                  <input
                    id="spotlight-email"
                    type="email"
                    name="email"
                    placeholder="Your email address"
                    autoComplete="email"
                    value={formData.email}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("email")}
                    onBlur={() => setFocusedField("")}
                    required
                  />

                  <span className="spotlight-input-beam" />
                </div>
              </div>

              {/* PASSWORD */}

              <div className="spotlight-field">
                <label htmlFor="spotlight-password">PASSWORD</label>

                <div
                  className={`spotlight-input ${
                    focusedField === "password" ? "active" : ""
                  }`}
                >
                  <Lock size={18} />

                  <input
                    id="spotlight-password"
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="Your password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    onFocus={() => setFocusedField("password")}
                    onBlur={() => setFocusedField("")}
                    required
                  />

                  {/* SHOW / HIDE PASSWORD */}

                  <button
                    type="button"
                    className="spotlight-eye"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>

                  <span className="spotlight-input-beam" />
                </div>
              </div>

              {/* ====================================
                  ERROR MESSAGE
              ==================================== */}

              {error && (
                <div className="spotlight-error" role="alert">
                  {error}
                </div>
              )}

              {/* ====================================
                  LOGIN BUTTON
              ==================================== */}

              <button
                type="submit"
                className="spotlight-submit"
                disabled={loading}
              >
                <span>{loading ? "Signing in..." : "Enter the Studio"}</span>

                {loading ? (
                  <span className="spotlight-spinner" />
                ) : (
                  <ArrowRight size={19} />
                )}
              </button>
            </form>

            {/* ====================================
                REGISTER LINK
            ==================================== */}

            <div className="spotlight-register">
              <span>New to Lenscraft?</span>

              <Link to="/register">
                Create an account
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* ====================================
                SECURITY MESSAGE
            ==================================== */}

            <div className="spotlight-security">
              <ShieldCheck size={16} />

              <span>YOUR MEMORIES ARE IN SAFE HANDS</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================
          BOTTOM FOOTER
      ======================================== */}

      <footer className="spotlight-footer">
        <span>© {new Date().getFullYear()} LENSCRAFT STUDIO</span>

        <span>CAPTURE THE FEELING</span>

        <Link to="/">
          BACK TO HOME
          <ArrowUpRight size={14} />
        </Link>
      </footer>
    </main>
  );
}
