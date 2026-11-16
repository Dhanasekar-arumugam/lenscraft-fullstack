import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import {
  Aperture,
  ArrowRight,
  ArrowUpRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { registerUser } from "../api/authService";
import "../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();

  // ============================================================
  // FORM STATE
  // ============================================================

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [focusedField, setFocusedField] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // ============================================================
  // PAGE TITLE
  // ============================================================

  useEffect(() => {
    document.title = "Create Account | Lenscraft Studio";
  }, []);

  // ============================================================
  // INPUT HANDLING
  // ============================================================

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // ============================================================
  // PASSWORD VALIDATION
  // ============================================================

  const passwordChecks = [
    {
      label: "8 characters",
      valid: form.password.length >= 8,
    },
    {
      label: "Uppercase letter",
      valid: /[A-Z]/.test(form.password),
    },
    {
      label: "Number",
      valid: /\d/.test(form.password),
    },
  ];

  const passwordsMatch =
    form.confirmPassword.length > 0 && form.password === form.confirmPassword;

  // ============================================================
  // ERROR HANDLING
  // ============================================================

  const getErrorMessage = (err) => {
    const details = err?.response?.data;

    let message = "Registration failed. Please try again.";

    if (typeof details?.detail === "string") {
      return details.detail;
    }

    if (typeof details?.message === "string") {
      return details.message;
    }

    if (details && typeof details === "object") {
      const firstError = Object.values(details)[0];

      if (Array.isArray(firstError)) {
        return firstError.join(" ");
      }

      if (typeof firstError === "string") {
        return firstError;
      }
    }

    if (!err?.response) {
      message =
        err?.message === "Network Error"
          ? "Cannot connect to the server."
          : err?.message || message;
    }

    return message;
  };

  // ============================================================
  // REGISTER USER
  // ============================================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    setError("");

    // Validate full name.
    if (!form.fullName.trim()) {
      setError("Please enter your full name.");
      return;
    }

    // Normalize email.
    const registeredEmail = form.email.trim().toLowerCase();

    // Validate email.
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(registeredEmail)) {
      setError("Please enter a valid email address.");
      return;
    }

    // Validate password match.
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // Validate password requirements.
    if (!passwordChecks.every((check) => check.valid)) {
      setError(
        "Use at least 8 characters, one uppercase letter and one number.",
      );
      return;
    }

    setLoading(true);

    try {
      // ========================================================
      // STEP 1: REGISTER USER IN DJANGO
      // ========================================================

      await registerUser({
        email: registeredEmail,
        password: form.password,
        full_name: form.fullName.trim(),
      });

      // ========================================================
      // STEP 2: SAVE EMAIL FOR OTP VERIFICATION
      // ========================================================

      sessionStorage.setItem("lenscraft_verify_email", registeredEmail);

      // Reset any previous OTP timer.
      sessionStorage.removeItem("lenscraft_otp_expires_at");

      sessionStorage.removeItem("lenscraft_otp_timer_email");

      sessionStorage.removeItem("lenscraft_resend_available_at");

      // ========================================================
      // STEP 3: REDIRECT TO OTP PAGE
      // ========================================================

      navigate("/verify-email", {
        replace: true,
        state: {
          email: registeredEmail,
        },
      });
    } catch (err) {
      console.error("Registration failed:", err);

      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="register-editorial">
      {/* ==========================================
          DECORATIVE BACKGROUND
      ========================================== */}

      <div className="register-grain" aria-hidden="true" />

      <div className="register-orbit register-orbit-one" aria-hidden="true" />

      <div className="register-orbit register-orbit-two" aria-hidden="true" />

      {/* ==========================================
          TOP BRAND
      ========================================== */}

      <header className="register-header">
        <Link to="/" className="register-brand">
          <Aperture size={27} strokeWidth={1.5} />

          <span>LENSCRAFT</span>
        </Link>

        <Link to="/login" className="register-header-link">
          Already a member?
          <ArrowUpRight size={17} />
        </Link>
      </header>

      {/* ==========================================
          MAIN LAYOUT
      ========================================== */}

      <section className="register-layout">
        {/* ========================================
            LEFT — EDITORIAL STORY
        ======================================== */}

        <div className="register-story">
          <div className="register-story-top">
            <span className="register-story-line" />
            <span>THE ART OF BEAUTIFUL MEMORIES</span>
          </div>

          <div className="register-story-content">
            <span className="register-kicker">
              <Sparkles size={16} />
              YOUR JOURNEY STARTS HERE
            </span>

            <h1>
              A place for
              <br />
              <em>every</em>
              <br />
              beautiful
              <br />
              moment<span>.</span>
            </h1>

            <p>
              Join Lenscraft and turn your most meaningful moments into memories
              that last a lifetime.
            </p>

            <div className="register-story-signature">
              <span className="register-signature-line" />
              <span>CREATE. CAPTURE. REMEMBER.</span>
            </div>
          </div>

          <div className="register-story-footer">
            <span>01 / BEGIN YOUR STORY</span>

            <div className="register-story-symbol">
              <Aperture size={38} strokeWidth={1} />
            </div>
          </div>
        </div>

        {/* ========================================
            RIGHT — REGISTER FORM
        ======================================== */}

        <div className="register-panel">
          {/* PANEL TOP */}

          <div className="register-panel-top">
            <div className="register-panel-icon">
              <UserRound size={22} strokeWidth={1.6} />
            </div>

            <span>NEW ACCOUNT</span>
          </div>

          {/* PANEL HEADING */}

          <div className="register-panel-heading">
            <h2>
              Create your
              <br />
              <em>account.</em>
            </h2>

            <p>A few details and you're ready to begin.</p>
          </div>

          {/* ======================================
              REGISTRATION FORM
          ====================================== */}

          <form onSubmit={handleSubmit} className="register-form">
            {/* FULL NAME */}

            <div className="register-field">
              <label htmlFor="register-name">FULL NAME</label>

              <div
                className={`register-input ${
                  focusedField === "fullName" ? "active" : ""
                }`}
              >
                <UserRound size={18} />

                <input
                  id="register-name"
                  type="text"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("fullName")}
                  onBlur={() => setFocusedField("")}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                />
              </div>
            </div>

            {/* EMAIL */}

            <div className="register-field">
              <label htmlFor="register-email">EMAIL ADDRESS</label>

              <div
                className={`register-input ${
                  focusedField === "email" ? "active" : ""
                }`}
              >
                <Mail size={18} />

                <input
                  id="register-email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("email")}
                  onBlur={() => setFocusedField("")}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* PASSWORD */}

            <div className="register-field">
              <label htmlFor="register-password">PASSWORD</label>

              <div
                className={`register-input ${
                  focusedField === "password" ? "active" : ""
                }`}
              >
                <LockKeyhole size={18} />

                <input
                  id="register-password"
                  type={showPassword ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("password")}
                  onBlur={() => setFocusedField("")}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* PASSWORD REQUIREMENTS */}

            <div className="register-password-checks">
              {passwordChecks.map((check) => (
                <span key={check.label} className={check.valid ? "valid" : ""}>
                  <Check size={12} />
                  {check.label}
                </span>
              ))}
            </div>

            {/* CONFIRM PASSWORD */}

            <div className="register-field">
              <label htmlFor="register-confirm">CONFIRM PASSWORD</label>

              <div
                className={`register-input ${
                  focusedField === "confirmPassword" ? "active" : ""
                }`}
              >
                <LockKeyhole size={18} />

                <input
                  id="register-confirm"
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  onFocus={() => setFocusedField("confirmPassword")}
                  onBlur={() => setFocusedField("")}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  required
                />

                <button
                  type="button"
                  className="register-eye"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? "Hide confirm password"
                      : "Show confirm password"
                  }
                >
                  {showConfirmPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>

              {form.confirmPassword && (
                <span
                  className={`register-match ${
                    passwordsMatch ? "matched" : "unmatched"
                  }`}
                >
                  {passwordsMatch
                    ? "Passwords match"
                    : "Passwords do not match"}
                </span>
              )}
            </div>

            {/* ERROR MESSAGE */}

            {error && (
              <div className="register-error" role="alert">
                {error}
              </div>
            )}

            {/* SUBMIT BUTTON */}

            <button
              type="submit"
              className="register-submit"
              disabled={loading}
            >
              <span>
                {loading ? "Creating your account..." : "Create My Account"}
              </span>

              {loading ? (
                <span className="register-spinner" />
              ) : (
                <ArrowRight size={20} />
              )}
            </button>
          </form>

          {/* LOGIN LINK */}

          <div className="register-login-link">
            Already have an account?
            <Link to="/login">
              Sign in
              <ArrowUpRight size={15} />
            </Link>
          </div>

          {/* SECURITY NOTE */}

          <div className="register-security">
            <ShieldCheck size={16} />
            <span>EMAIL VERIFICATION REQUIRED</span>
          </div>
        </div>
      </section>

      {/* ==========================================
          FOOTER
      ========================================== */}

      <footer className="register-footer">
        <span>© {new Date().getFullYear()} LENSCRAFT STUDIO</span>

        <span>EVERY FRAME TELLS A STORY</span>
      </footer>
    </main>
  );
}
