import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Aperture,
  Camera,
  CalendarDays,
  Clock3,
  MapPin,
  Mail,
  Phone,
  UserRound,
  MessageSquare,
  Check,
  CheckCircle2,
  AlertCircle,
  LoaderCircle,
  ShieldCheck,
  Sparkles,
  Award,
  MoveUpRight,
} from "lucide-react";

import api from "../api/axios";
import { createPhotographerBooking } from "../api/bookingService";
import "../styles/BookPhotographer.css";

const emptyForm = {
  customer_name: "",
  email: "",
  phone: "",
  event_date: "",
  event_time: "",
  event_location: "",
  special_requirements: "",
};

function today() {
  const date = new Date();
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
  if (!value) return "To be decided";
  const [y, m, d] = String(value).slice(0, 10).split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value) {
  if (!value) return "Flexible";
  const [hours, minutes] = value.split(":").map(Number);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return value;
  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function FormField({
  name,
  label,
  icon: Icon,
  value,
  onChange,
  error,
  placeholder,
  type = "text",
  required = false,
  full = false,
  min,
  maxLength,
}) {
  return (
    <div className={`atelier-field ${full ? "atelier-field-full" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span> *</span>}
      </label>

      <div className={`atelier-input ${error ? "atelier-invalid" : ""}`}>
        <Icon size={18} strokeWidth={1.7} />
        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          min={min}
          maxLength={maxLength}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>

      {error && (
        <small id={`${name}-error`} className="atelier-error-text">
          {error}
        </small>
      )}
    </div>
  );
}

function SectionHeading({ number, title, subtitle }) {
  return (
    <div className="atelier-section-heading">
      <span className="atelier-section-number">{number}</span>
      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>
      <span className="atelier-section-line" />
    </div>
  );
}

export default function BookPhotographer() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [booking, setBooking] = useState(null);
  const [imageActive, setImageActive] = useState(false);

  useEffect(() => {
    document.title = "Book Your Photographer | Lenscraft";

    let mounted = true;

    setLoading(true);
    setPhotographer(null);
    setBooking(null);
    setImageActive(false);
    setServerError("");

    if (!/^\d+$/.test(id || "")) {
      setServerError("Invalid photographer ID.");
      setLoading(false);
      return;
    }

    async function loadPhotographer() {
      try {
        const response = await api.get(`photographers/${id}/`);
        if (mounted) setPhotographer(response.data);
      } catch (error) {
        if (mounted) {
          setServerError(
            error?.response?.status === 404
              ? "Photographer not found."
              : "Unable to load photographer details.",
          );
        }
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadPhotographer();

    return () => {
      mounted = false;
    };
  }, [id]);

  const getImage = () => {
    const image =
      photographer?.image ||
      photographer?.profile_image ||
      photographer?.image_url;

    if (!image || typeof image !== "string") return "";

    if (/^(https?:|data:|blob:)/i.test(image)) return image;

    try {
      return new URL(image, api.defaults.baseURL).href;
    } catch {
      return image;
    }
  };

  const image = getImage();

  const handleChange = (event) => {
    const { name, value } = event.target;

    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));

    setServerError("");
  };

  const validate = () => {
    const next = {};

    if (form.customer_name.trim().length < 3) {
      next.customer_name = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(form.phone.trim())) {
      next.phone = "Enter a valid 10-digit mobile number.";
    }

    if (!form.event_date) {
      next.event_date = "Select an event date.";
    } else if (form.event_date < today()) {
      next.event_date = "Select today or a future date.";
    }

    if (form.event_location.trim().length < 3) {
      next.event_location = "Enter your event location.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submitBooking = async (event) => {
    event.preventDefault();

    if (submitting || !validate()) return;

    if (!photographer?.active) {
      setServerError("This photographer is currently unavailable.");
      return;
    }

    try {
      setSubmitting(true);
      setServerError("");

      const payload = {
        ...form,
        customer_name: form.customer_name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        event_location: form.event_location.trim(),
        special_requirements: form.special_requirements.trim(),
      };

      const response = await createPhotographerBooking(Number(id), payload);

      setBooking(response);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      const message =
        error?.response?.data?.detail ||
        error?.message ||
        "Unable to submit your booking.";

      if (
        error?.response?.status === 401 ||
        /authentication|log in|login/i.test(String(message))
      ) {
        navigate("/login", {
          state: { from: `/book-photographer/${id}` },
        });
        return;
      }

      setServerError(
        typeof message === "string"
          ? message
          : "Please check your details and try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main className="atelier-page">
        <div className="atelier-state">
          <LoaderCircle className="atelier-spin" size={34} />
          <h2>Preparing your experience</h2>
          <p>Just a moment while we prepare your booking.</p>
        </div>
      </main>
    );
  }

  if (!photographer) {
    return (
      <main className="atelier-page">
        <div className="atelier-state">
          <Camera size={38} />
          <h2>Photographer unavailable</h2>
          <p>{serverError}</p>
          <Link to="/services" className="atelier-button">
            Explore Services <ArrowRight size={18} />
          </Link>
        </div>
      </main>
    );
  }

  if (booking) {
    return (
      <main className="atelier-page">
        <section className="atelier-success">
          <div className="atelier-success-icon">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>

          <span className="atelier-eyebrow">YOUR STORY STARTS HERE</span>

          <h1>
            Something beautiful
            <br />
            <em>is on its way.</em>
          </h1>

          <p>
            Your booking request has been received. Our team will review the
            details and confirm photographer availability.
          </p>

          <div className="atelier-success-details">
            <div>
              <small>REFERENCE</small>
              <strong>{booking.id ? `#${booking.id}` : "Submitted"}</strong>
            </div>
            <div>
              <small>PHOTOGRAPHER</small>
              <strong>{photographer.name}</strong>
            </div>
            <div>
              <small>EVENT DATE</small>
              <strong>
                {formatDate(booking.event_date || form.event_date)}
              </strong>
            </div>
            <div>
              <small>STATUS</small>
              <strong>{booking.status || "Pending"}</strong>
            </div>
          </div>

          <div className="atelier-success-actions">
            <Link to="/my-bookings" className="atelier-button">
              View My Bookings <ArrowRight size={18} />
            </Link>
            <Link to="/" className="atelier-button-outline">
              Back Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="atelier-page">
      <div className="atelier-container">
        {/* TOP NAVIGATION */}
        <div className="atelier-topbar">
          <Link to="/services" className="atelier-back">
            <ArrowLeft size={17} />
            BACK TO SERVICES
          </Link>

          <span className="atelier-brand">
            <Aperture size={21} />
            LENSCRAFT <span>STUDIO</span>
          </span>

          <span className="atelier-top-index">EST. IN STORIES / 001</span>
        </div>

        {/* NEW DARK EDITORIAL HERO */}
        <header className="atelier-hero">
          <div className="atelier-hero-content">
            <span className="atelier-eyebrow">
              <span className="atelier-small-dot" />
              THE PHOTOGRAPHY ATELIER
            </span>

            <h1>
              Let's make
              <br />
              something <em>timeless.</em>
            </h1>

            <p>
              Every remarkable photograph begins with a story. Tell us yours,
              and we'll take care of the beautiful details.
            </p>

            <div className="atelier-hero-meta">
              <span>
                <Sparkles size={15} /> Personal experience
              </span>
              <span>
                <Check size={15} /> Thoughtful storytelling
              </span>
            </div>
          </div>

          <div className="atelier-hero-mark" aria-hidden="true">
            <Aperture size={145} strokeWidth={0.55} />
            <span>MADE TO BE REMEMBERED</span>
          </div>

          <span className="atelier-hero-vertical" aria-hidden="true">
            THE ART OF CAPTURING FEELING
          </span>
        </header>

        {/* EDITORIAL LAYOUT */}
        <div className="atelier-layout">
          {/* LEFT PHOTOGRAPHER FEATURE */}
          <aside className="atelier-left">
            <div className="atelier-photo-heading">
              <span>01 / YOUR PHOTOGRAPHER</span>
              <MoveUpRight size={18} />
            </div>

            <button
              type="button"
              className={`atelier-photo ${imageActive ? "atelier-photo-active" : ""}`}
              aria-pressed={imageActive}
              aria-label={
                imageActive
                  ? "Remove photo shadow overlay"
                  : "Show photo shadow overlay"
              }
              onClick={() => setImageActive((value) => !value)}
            >
              {image ? (
                <img src={image} alt={photographer.name} />
              ) : (
                <div className="atelier-photo-placeholder">
                  <Camera size={65} strokeWidth={1} />
                </div>
              )}

              <span className="atelier-photo-shadow" />
              <span className="atelier-photo-corner" />

              <span className="atelier-photo-bottom">
                <span>THE PERSON BEHIND THE LENS</span>
                <Aperture size={26} />
              </span>

              <span className="atelier-photo-hint">TAP TO EXPLORE</span>
            </button>

            <div className="atelier-photographer-info">
              <span className="atelier-eyebrow">MEET YOUR ARTIST</span>

              <h2>{photographer.name}</h2>

              <p className="atelier-role">
                {photographer.role || "Professional Photographer"}
              </p>

              {photographer.biography && (
                <p className="atelier-bio">{photographer.biography}</p>
              )}

              <div className="atelier-facts">
                {photographer.experience != null &&
                  photographer.experience !== "" && (
                    <div>
                      <Award size={20} />
                      <span>
                        <small>EXPERIENCE</small>
                        <strong>{photographer.experience} years</strong>
                      </span>
                    </div>
                  )}

                {photographer.specialization && (
                  <div>
                    <Camera size={20} />
                    <span>
                      <small>EXPERTISE</small>
                      <strong>{photographer.specialization}</strong>
                    </span>
                  </div>
                )}
              </div>

              <div
                className={`atelier-availability ${!photographer.active ? "atelier-unavailable" : ""}`}
              >
                <span className="atelier-availability-dot" />
                <div>
                  <strong>
                    {photographer.active
                      ? "Open for booking requests"
                      : "Currently unavailable"}
                  </strong>
                  <small>Subject to studio confirmation</small>
                </div>
              </div>
            </div>

            <div className="atelier-quote">
              <span>“</span>
              <p>
                The best moments aren't posed.
                <em> They're felt.</em>
              </p>
              <small>— THE LENSCRAFT PHILOSOPHY</small>
            </div>
          </aside>

          {/* RIGHT BOOKING FORM */}
          <section className="atelier-form-panel">
            <div className="atelier-form-top">
              <span>02 / THE BOOKING EXPERIENCE</span>
              <Aperture size={25} />
            </div>

            <div className="atelier-form-intro">
              <span className="atelier-eyebrow">LET'S BEGIN</span>
              <h2>
                Tell us about
                <br />
                <em>your moment.</em>
              </h2>
              <p>
                Share a few details about your occasion. We'll help bring your
                photography vision to life.
              </p>
            </div>

            {serverError && (
              <div className="atelier-error-banner" role="alert">
                <AlertCircle size={19} />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={submitBooking} noValidate>
              <SectionHeading
                number="01"
                title="The essentials"
                subtitle="First, we'd love to know you."
              />

              <div className="atelier-form-grid">
                <FormField
                  label="YOUR FULL NAME"
                  name="customer_name"
                  icon={UserRound}
                  value={form.customer_name}
                  onChange={handleChange}
                  error={errors.customer_name}
                  placeholder="Enter your name"
                  required
                />

                <FormField
                  label="EMAIL ADDRESS"
                  name="email"
                  type="email"
                  icon={Mail}
                  value={form.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="you@example.com"
                  required
                />

                <FormField
                  label="PHONE NUMBER"
                  name="phone"
                  type="tel"
                  icon={Phone}
                  value={form.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="Your mobile number"
                  maxLength={10}
                  full
                  required
                />
              </div>

              <SectionHeading
                number="02"
                title="The occasion"
                subtitle="Every beautiful story has a setting."
              />

              <div className="atelier-form-grid">
                <FormField
                  label="EVENT DATE"
                  name="event_date"
                  type="date"
                  icon={CalendarDays}
                  value={form.event_date}
                  onChange={handleChange}
                  error={errors.event_date}
                  min={today()}
                  required
                />

                <FormField
                  label="EVENT TIME"
                  name="event_time"
                  type="time"
                  icon={Clock3}
                  value={form.event_time}
                  onChange={handleChange}
                />

                <FormField
                  label="EVENT LOCATION"
                  name="event_location"
                  icon={MapPin}
                  value={form.event_location}
                  onChange={handleChange}
                  error={errors.event_location}
                  placeholder="Venue, city or event address"
                  full
                  required
                />

                <div className="atelier-field atelier-field-full">
                  <label htmlFor="special_requirements">
                    YOUR VISION{" "}
                    <span className="atelier-optional">OPTIONAL</span>
                  </label>

                  <div className="atelier-textarea">
                    <MessageSquare size={19} />
                    <textarea
                      id="special_requirements"
                      name="special_requirements"
                      value={form.special_requirements}
                      onChange={handleChange}
                      placeholder="Tell us what makes this moment special, your preferred style, or anything else we should know..."
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              {/* SUMMARY */}
              <div className="atelier-summary">
                <div className="atelier-summary-header">
                  <div>
                    <span>YOUR SESSION / AT A GLANCE</span>
                    <h3>The little details.</h3>
                  </div>
                  <Aperture size={29} strokeWidth={1.2} />
                </div>

                <div className="atelier-summary-items">
                  <div>
                    <small>PHOTOGRAPHER</small>
                    <strong>{photographer.name}</strong>
                  </div>

                  <div>
                    <small>DATE</small>
                    <strong>{formatDate(form.event_date)}</strong>
                  </div>

                  <div>
                    <small>TIME</small>
                    <strong>{formatTime(form.event_time)}</strong>
                  </div>

                  <div>
                    <small>LOCATION</small>
                    <strong>{form.event_location || "To be decided"}</strong>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="atelier-submit"
                disabled={submitting || !photographer.active}
              >
                <span>
                  {submitting
                    ? "Sending your request..."
                    : photographer.active
                      ? "Request your session"
                      : "Photographer unavailable"}
                </span>

                {submitting ? (
                  <LoaderCircle className="atelier-spin" size={21} />
                ) : (
                  <ArrowRight size={22} />
                )}
              </button>

              <p className="atelier-disclaimer">
                <ShieldCheck size={17} />
                Your request is subject to photographer availability and studio
                confirmation.
              </p>
            </form>
          </section>
        </div>

        <footer className="atelier-footer">
          <span>THE ART OF REMEMBERING</span>
          <Aperture size={23} />
          <span>LENSCRAFT STUDIO</span>
        </footer>
      </div>
    </main>
  );
}
