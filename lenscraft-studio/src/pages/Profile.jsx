import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  UserRound,
  Mail,
  Phone,
  Save,
  ArrowLeft,
  Camera,
  Aperture,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Pencil,
  X,
  LockKeyhole,
  CalendarDays,
  Sparkles,
  LoaderCircle,
} from "lucide-react";

import api from "../api/axios";
import "../styles/Profile.css";

const initialForm = {
  first_name: "",
  last_name: "",
  email: "",
  phone: "",
};

const normalizeProfile = (data) => ({
  first_name: data?.first_name || "",
  last_name: data?.last_name || "",
  email: data?.email || "",
  phone: data?.phone || "",
});

export default function Profile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);
  const [savedProfile, setSavedProfile] = useState(initialForm);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    document.title = "My Account | Lenscraft Studio";

    let active = true;

    const fetchProfile = async () => {
      try {
        const response = await api.get("/auth/profile/");

        if (!active) return;

        const profile = normalizeProfile(response.data);

        setFormData(profile);
        setSavedProfile(profile);
      } catch (err) {
        if (!active) return;

        setError(
          err.response?.status === 401
            ? "Your session has expired. Please log in again."
            : "Unable to load your profile.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchProfile();

    return () => {
      active = false;
    };
  }, []);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData(savedProfile);
    setEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async (event) => {
    event.preventDefault();

    if (saving) return;

    setError("");
    setSuccess("");

    const firstName = formData.first_name.trim();
    const lastName = formData.last_name.trim();
    const phone = formData.phone.trim();

    if (!firstName) {
      setError("Please enter your first name.");
      return;
    }

    if (phone && !/^[6-9]\d{9}$/.test(phone)) {
      setError("Enter a valid 10-digit mobile number.");
      return;
    }

    setSaving(true);

    try {
      const response = await api.patch("/auth/profile/", {
        first_name: firstName,
        last_name: lastName,
        phone,
      });

      const profile = normalizeProfile(response.data);

      setFormData(profile);
      setSavedProfile(profile);

      // Preserve any other existing session user fields.
      let previousUser = {};

      try {
        previousUser =
          JSON.parse(sessionStorage.getItem("lenscraft_user") || "{}") || {};
      } catch {
        previousUser = {};
      }

      sessionStorage.setItem(
        "lenscraft_user",
        JSON.stringify({
          ...previousUser,
          ...response.data,
        }),
      );

      window.dispatchEvent(new Event("lenscraft-auth-change"));

      setSuccess("Your account details have been updated.");
      setEditing(false);
    } catch (err) {
      const details = err.response?.data;

      setError(
        details?.detail ||
          details?.phone?.[0] ||
          details?.first_name?.[0] ||
          "Failed to update your profile. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    [formData.first_name, formData.last_name]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    formData.email?.split("@")[0] ||
    "Lenscraft Member";

  const initials =
    [formData.first_name, formData.last_name]
      .filter(Boolean)
      .map((part) => part.charAt(0).toUpperCase())
      .join("")
      .slice(0, 2) || displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <main className="account-page">
        <div className="account-loading">
          <Aperture className="account-spin" size={38} />
          <span>PREPARING YOUR ACCOUNT</span>
          <p>Loading your personal details...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="account-page">
      <div className="account-shell">
        {/* TOP NAVIGATION */}
        <div className="account-topbar">
          <button
            type="button"
            className="account-back"
            onClick={() => navigate("/")}
          >
            <ArrowLeft size={17} />
            BACK TO HOME
          </button>

          <div className="account-brand">
            <Aperture size={23} />
            <span>LENSCRAFT</span>
            <small>STUDIO</small>
          </div>

          <span className="account-top-caption">PERSONAL SPACE / 001</span>
        </div>

        {/* DARK EDITORIAL HEADER */}
        <header className="account-hero">
          <div className="account-hero-inner">
            <div className="account-hero-copy">
              <span className="account-kicker">
                <span className="account-kicker-dot" />
                THE PERSONAL ATELIER
              </span>

              <h1>
                Your space.
                <br />
                <em>Your story.</em>
              </h1>

              <p>
                A little corner of Lenscraft that belongs to you. Keep your
                details beautifully organised and your photography journey
                connected.
              </p>
            </div>

            <div className="account-hero-art" aria-hidden="true">
              <span className="account-art-circle account-art-circle-one" />
              <span className="account-art-circle account-art-circle-two" />
              <Aperture size={115} strokeWidth={0.65} />
              <small>THE ART OF REMEMBERING</small>
            </div>
          </div>

          <div className="account-hero-bottom">
            <span>ACCOUNT / PERSONAL INFORMATION</span>
            <span>EST. IN STORIES</span>
          </div>
        </header>

        {/* MAIN TWO-COLUMN LAYOUT */}
        <div className="account-layout">
          {/* IDENTITY PANEL */}
          <aside className="account-sidebar">
            <div className="account-identity">
              <div className="account-avatar-wrap">
                <div className="account-avatar">
                  <span>{initials}</span>
                </div>

                <span className="account-avatar-decoration">
                  <Camera size={15} />
                </span>
              </div>

              <span className="account-identity-label">LENSCRAFT MEMBER</span>

              <h2>{displayName}</h2>

              <p>{formData.email}</p>

              <div className="account-member-status">
                <span />
                PERSONAL ACCOUNT
              </div>
            </div>

            <div className="account-sidebar-links">
              <span className="account-sidebar-heading">YOUR SPACE</span>

              <div className="account-sidebar-current">
                <UserRound size={19} />
                <span>Personal Information</span>
                <ArrowUpRight size={16} />
              </div>

              <Link to="/my-bookings" className="account-sidebar-link">
                <CalendarDays size={19} />
                <span>My Bookings</span>
                <ArrowUpRight size={16} />
              </Link>
            </div>

            <div className="account-sidebar-note">
              <Sparkles size={22} />
              <p>Every story deserves to be remembered.</p>
              <small>WITH LOVE, LENSCRAFT</small>
            </div>
          </aside>

          {/* PERSONAL DETAILS PANEL */}
          <section className="account-content">
            <div className="account-content-top">
              <span>01 / ACCOUNT DETAILS</span>

              <div className="account-content-icon">
                <Aperture size={25} />
              </div>
            </div>

            <div className="account-content-heading">
              <span className="account-eyebrow">YOUR INFORMATION</span>

              <h2>
                The details
                <br />
                <em>that make you, you.</em>
              </h2>

              <p>
                Review your personal information or make changes whenever you
                need to.
              </p>
            </div>

            {error && (
              <div className="account-alert account-alert-error" role="alert">
                <AlertCircle size={19} />

                <span>{error}</span>

                {error.includes("session has expired") && (
                  <button type="button" onClick={() => navigate("/login")}>
                    Login
                  </button>
                )}
              </div>
            )}

            {success && (
              <div
                className="account-alert account-alert-success"
                role="status"
              >
                <CheckCircle2 size={19} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleSave}>
              {/* FORM SECTION TITLE */}
              <div className="account-section-title">
                <div className="account-section-number">01</div>

                <div>
                  <h3>Personal details</h3>
                  <p>How we know and contact you.</p>
                </div>

                <div className="account-section-line" />
              </div>

              <div className="account-form-grid">
                <div className="account-field">
                  <label htmlFor="first_name">FIRST NAME</label>

                  <div className="account-input-wrap">
                    <UserRound size={18} />

                    <input
                      id="first_name"
                      name="first_name"
                      type="text"
                      value={formData.first_name}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      placeholder="Your first name"
                      autoComplete="given-name"
                      required
                    />
                  </div>
                </div>

                <div className="account-field">
                  <label htmlFor="last_name">LAST NAME</label>

                  <div className="account-input-wrap">
                    <UserRound size={18} />

                    <input
                      id="last_name"
                      name="last_name"
                      type="text"
                      value={formData.last_name}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      placeholder="Your last name"
                      autoComplete="family-name"
                    />
                  </div>
                </div>

                <div className="account-field account-field-full">
                  <label htmlFor="email">EMAIL ADDRESS</label>

                  <div className="account-input-wrap account-locked">
                    <Mail size={18} />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      disabled
                    />

                    <LockKeyhole size={17} className="account-lock-icon" />
                  </div>

                  <small className="account-field-note">
                    <ShieldCheck size={14} />
                    Your email is linked to your verified account and cannot be
                    changed here.
                  </small>
                </div>

                <div className="account-field account-field-full">
                  <label htmlFor="phone">PHONE NUMBER</label>

                  <div className="account-input-wrap">
                    <Phone size={18} />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={!editing || saving}
                      placeholder="Your 10-digit mobile number"
                      autoComplete="tel"
                      maxLength={10}
                    />
                  </div>
                </div>  
              </div>

              {/* ACCOUNT NOTICE */}
              <div className="account-security-note">
                <div className="account-security-icon">
                  <ShieldCheck size={22} />
                </div>

                <div>
                  <h4>Your account information</h4>
                  <p>
                    Your personal details are managed through your authenticated
                    Lenscraft account.
                  </p>
                </div>
              </div>

              {/* ACTIONS */}
              <div className="account-actions">
                <span className="account-action-caption">
                  {editing
                    ? "EDITING YOUR PERSONAL DETAILS"
                    : "YOUR ACCOUNT IS READY"}
                </span>

                <div className="account-action-buttons">
                  {!editing ? (
                    <button
                      type="button"
                      className="account-edit-button"
                      onClick={() => {
                        setEditing(true);
                        setSuccess("");
                      }}
                    >
                      <Pencil size={17} />
                      Edit information
                      <ArrowUpRight size={17} />
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="account-cancel-button"
                        onClick={handleCancel}
                        disabled={saving}
                      >
                        <X size={17} />
                        Cancel
                      </button>

                      <button
                        type="submit"
                        className="account-save-button"
                        disabled={saving}
                      >
                        {saving ? (
                          <LoaderCircle className="account-spin" size={18} />
                        ) : (
                          <Save size={18} />
                        )}

                        {saving ? "Saving..." : "Save changes"}

                        {!saving && <ArrowUpRight size={17} />}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </form>
          </section>
        </div>

        {/* FOOTER */}
        <footer className="account-footer">
          <span>THE ART OF REMEMBERING</span>
          <Aperture size={23} />
          <span>LENSCRAFT STUDIO</span>
        </footer>
      </div>
    </main>
  );
}
