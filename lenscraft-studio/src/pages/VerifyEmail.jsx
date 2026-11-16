import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock3,
  KeyRound,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { verifyEmail, resendOtp } from "../api/authService";
import "../styles/VerifyEmail.css";

// ============================================================
// CONFIGURATION
// ============================================================

const OTP_LENGTH = 6;
const OTP_DURATION = 300;

// ============================================================
// HELPERS
// ============================================================

const getErrorMessage = (error) => {
  const data = error?.response?.data;

  if (!data) {
    return error?.message || "Network error. Please try again.";
  }

  if (typeof data === "string") return data;

  for (const key of [
    "detail",
    "message",
    "error",
    "otp",
    "email",
    "non_field_errors",
  ]) {
    const value = data[key];

    if (typeof value === "string") return value;
    if (Array.isArray(value)) return value.join(" ");
  }

  return "Something went wrong. Please try again.";
};

const unwrapResponse = (response) => response?.data ?? response;

const formatTime = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;

  return `${String(minutes).padStart(2, "0")}:${String(remaining).padStart(
    2,
    "0",
  )}`;
};

// ============================================================
// VERIFY EMAIL COMPONENT
// ============================================================

export default function VerifyEmail() {
  const navigate = useNavigate();
  const location = useLocation();

  const inputRefs = useRef([]);
  const requestRef = useRef(false);
  const redirectRef = useRef(null);

  // ============================================================
  // EMAIL — INTERNAL ONLY
  // ============================================================

  const [email] = useState(() => {
    const savedEmail =
      location.state?.email ||
      sessionStorage.getItem("lenscraft_verify_email") ||
      "";

    return savedEmail.trim().toLowerCase();
  });

  const validEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  // ============================================================
  // OTP STATE
  // ============================================================

  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(""));

  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [now, setNow] = useState(Date.now());

  // ============================================================
  // TIMER
  // ============================================================

  const [expiresAt, setExpiresAt] = useState(() => {
    const savedEmail = sessionStorage.getItem("lenscraft_otp_timer_email");

    const savedExpiry = Number(
      sessionStorage.getItem("lenscraft_otp_expires_at"),
    );

    if (email && savedEmail === email && savedExpiry > 0) {
      return savedExpiry;
    }

    return Date.now() + OTP_DURATION * 1000;
  });

  useEffect(() => {
    if (!validEmail || verified) return;

    sessionStorage.setItem("lenscraft_verify_email", email);

    const savedEmail = sessionStorage.getItem("lenscraft_otp_timer_email");

    if (savedEmail !== email) {
      const expiry = Date.now() + OTP_DURATION * 1000;

      setExpiresAt(expiry);

      sessionStorage.setItem("lenscraft_otp_expires_at", String(expiry));

      sessionStorage.setItem("lenscraft_otp_timer_email", email);
    }
  }, [email, validEmail, verified]);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    return () => {
      if (redirectRef.current) {
        clearTimeout(redirectRef.current);
      }
    };
  }, []);

  const timeRemaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));

  const otpValue = otp.join("");
  const isOtpComplete = /^\d{6}$/.test(otpValue);
  const isBusy = loading || resending;

  // ============================================================
  // OTP INPUT HANDLING
  // ============================================================

  const handleChange = (index, value) => {
    if (isBusy || verified) return;

    const digits = value.replace(/\D/g, "");
    const updated = [...otp];

    if (digits.length > 1) {
      const incoming = digits.slice(0, OTP_LENGTH - index).split("");

      incoming.forEach((digit, offset) => {
        updated[index + offset] = digit;
      });

      setOtp(updated);

      const nextIndex = Math.min(index + incoming.length, OTP_LENGTH - 1);

      inputRefs.current[nextIndex]?.focus();
    } else {
      updated[index] = digits;

      setOtp(updated);

      if (digits && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    setError("");
  };

  // ============================================================
  // KEYBOARD HANDLING
  // ============================================================

  const handleKeyDown = (index, event) => {
    if (isBusy || verified) return;

    if (event.key === "Backspace") {
      event.preventDefault();

      const updated = [...otp];

      if (updated[index]) {
        updated[index] = "";
      } else if (index > 0) {
        updated[index - 1] = "";
        inputRefs.current[index - 1]?.focus();
      }

      setOtp(updated);
      setError("");
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      inputRefs.current[index - 1]?.focus();
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      inputRefs.current[index + 1]?.focus();
    }
  };

  // ============================================================
  // PASTE OTP
  // ============================================================

  const handlePaste = (event) => {
    event.preventDefault();

    if (isBusy || verified) return;

    const pasted = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pasted) return;

    const updated = Array(OTP_LENGTH).fill("");

    pasted.split("").forEach((digit, index) => {
      updated[index] = digit;
    });

    setOtp(updated);
    setError("");

    inputRefs.current[Math.min(pasted.length, OTP_LENGTH - 1)]?.focus();
  };

  // ============================================================
  // VERIFY OTP
  // ============================================================

  const handleVerify = async (event) => {
    event.preventDefault();

    if (requestRef.current || verified) return;

    setError("");
    setSuccess("");

    // Check OTP first.
    if (!isOtpComplete) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    // Email is required by the Django backend.
    if (!validEmail) {
      setError(
        "Registration email not found. Please return to registration and try again.",
      );
      return;
    }

    requestRef.current = true;
    setLoading(true);

    try {
      const rawResponse = await verifyEmail(email, otpValue);

      const response = unwrapResponse(rawResponse);

      if (response?.verified === true) {
        setVerified(true);

        setSuccess(response.message || "OTP verified successfully.");

        // Clear verification session.
        sessionStorage.removeItem("lenscraft_verify_email");

        sessionStorage.removeItem("lenscraft_otp_expires_at");

        sessionStorage.removeItem("lenscraft_otp_timer_email");

        sessionStorage.removeItem("lenscraft_resend_available_at");

        // Redirect to login.
        redirectRef.current = setTimeout(() => {
          navigate("/login", {
            replace: true,
            state: {
              email,
              verified: true,
            },
          });
        }, 1800);
      } else {
        setError(
          response?.message ||
            response?.detail ||
            "OTP verification was not confirmed by the server.",
        );
      }
    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(getErrorMessage(err));
    } finally {
      requestRef.current = false;
      setLoading(false);
    }
  };

  // ============================================================
  // RESEND OTP
  // ============================================================

  const handleResend = async () => {
    if (requestRef.current || verified) return;

    setError("");
    setSuccess("");

    if (!validEmail) {
      setError(
        "Registration email not found. Please return to registration and try again.",
      );
      return;
    }

    requestRef.current = true;
    setResending(true);

    try {
      const rawResponse = await resendOtp(email);

      const response = unwrapResponse(rawResponse);

      setSuccess(
        response?.message ||
          "If your account is awaiting verification, a new OTP will be sent.",
      );

      // Reset OTP inputs.
      setOtp(Array(OTP_LENGTH).fill(""));

      // Reset display timer after successful request.
      const expiry = Date.now() + OTP_DURATION * 1000;

      setExpiresAt(expiry);
      setNow(Date.now());

      sessionStorage.setItem("lenscraft_verify_email", email);

      sessionStorage.setItem("lenscraft_otp_expires_at", String(expiry));

      sessionStorage.setItem("lenscraft_otp_timer_email", email);

      inputRefs.current[0]?.focus();
    } catch (err) {
      console.error("Resend OTP failed:", err);
      setError(getErrorMessage(err));
    } finally {
      requestRef.current = false;
      setResending(false);
    }
  };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <main className="verify-page">
      {/* BACKGROUND */}
      <div className="verify-background" aria-hidden="true">
        <div className="verify-orb verify-orb-one" />
        <div className="verify-orb verify-orb-two" />
      </div>

      <div className="verify-container">
        {/* BACK BUTTON */}
        <Link to="/register" className="verify-back">
          <ArrowLeft size={17} />
          Back to registration
        </Link>

        <div className="verify-card">
          {/* ICON */}
          <div className="verify-icon-wrapper">
            {verified ? <CheckCircle2 size={34} /> : <KeyRound size={34} />}
          </div>

          {/* EYEBROW */}
          <div className="verify-eyebrow">
            <ShieldCheck size={15} />
            SECURE OTP VERIFICATION
          </div>

          {/* TITLE */}
          <h1>
            {verified ? (
              <>
                OTP <span>Verified!</span>
              </>
            ) : (
              <>
                Verify Your <span>OTP.</span>
              </>
            )}
          </h1>

          {/* DESCRIPTION */}
          <p className="verify-description">
            {verified
              ? "Your Lenscraft account is ready. Redirecting you to login."
              : "Enter the 6-digit OTP sent to your registered email address."}
          </p>

          {/* OTP FORM */}
          {!verified && (
            <form onSubmit={handleVerify} noValidate>
              <label className="verify-input-label" htmlFor="verify-otp-0">
                Enter 6-digit OTP
              </label>

              {/* SIX OTP BOXES */}
              <div className="verify-otp-group">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    id={`verify-otp-${index}`}
                    ref={(element) => {
                      inputRefs.current[index] = element;
                    }}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={index === 0 ? 6 : 1}
                    value={digit}
                    onChange={(event) =>
                      handleChange(index, event.target.value)
                    }
                    onKeyDown={(event) => handleKeyDown(index, event)}
                    onPaste={handlePaste}
                    disabled={isBusy}
                    aria-label={`OTP digit ${index + 1}`}
                    className={digit ? "verify-otp-filled" : ""}
                  />
                ))}
              </div>

              {/* TIMER */}
              <div className="verify-timer">
                <Clock3 size={16} />

                {timeRemaining > 0 ? (
                  <span>
                    Code timer <strong>{formatTime(timeRemaining)}</strong>
                  </span>
                ) : (
                  <span className="verify-expired">
                    Timer ended. Request a new OTP if your code has expired.
                  </span>
                )}
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="verify-alert verify-alert-error" role="alert">
                  {error}
                </div>
              )}

              {/* SUCCESS MESSAGE */}
              {success && (
                <div
                  className="verify-alert verify-alert-success"
                  role="status"
                >
                  {success}
                </div>
              )}

              {/* VERIFY OTP BUTTON */}
              <button type="submit" className="verify-submit" disabled={isBusy}>
                {loading ? (
                  <>
                    <RefreshCw size={18} className="verify-spin" />
                    Verifying...
                  </>
                ) : (
                  <>
                    Verify OTP
                    <ArrowRight size={18} />
                  </>
                )}
              </button>

              {/* RESEND OTP */}
              <div className="verify-resend">
                <span>Didn't receive the OTP?</span>

                <button type="button" onClick={handleResend} disabled={isBusy}>
                  {resending ? (
                    <>
                      <RefreshCw size={14} className="verify-spin" />
                      Sending...
                    </>
                  ) : (
                    "Resend OTP"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* VERIFICATION SUCCESS */}
          {verified && (
            <div className="verify-success-content">
              <CheckCircle2 size={38} />

              <p>{success}</p>

              <Link
                to="/login"
                state={{
                  email,
                  verified: true,
                }}
                className="verify-submit"
              >
                Continue to Login
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* SECURITY FOOTER */}
          <div className="verify-footer">
            <ShieldCheck size={15} />
            Your account security matters to us.
          </div>
        </div>

        {/* BRAND FOOTER */}
        <div className="verify-bottom">
          <span>LENSCRAFT STUDIO</span>
          <span>Moments. Memories. Forever.</span>
        </div>
      </div>
    </main>
  );
}
