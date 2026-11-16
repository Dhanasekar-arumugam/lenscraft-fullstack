import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  ArrowRight,
  Aperture,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Camera,
  MapPin,
  UserRound,
  Mail,
  Phone,
  MessageSquare,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  LoaderCircle,
  MoveUpRight,
  Heart,
  Award,
} from "lucide-react";

import { createBooking } from "../api/bookingService";
import { getServicePackages } from "../api/serviceService";
import "../styles/Booking.css";

const initialForm = {
  customer_name: "",
  email: "",
  phone: "",
  service: "",
  event_date: "",
  event_time: "",
  event_location: "",
  special_requirements: "",
};

function getStoredUser() {
  try {
    return JSON.parse(sessionStorage.getItem("lenscraft_user") || "null");
  } catch {
    return null;
  }
}

function getLocalToday() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

function formatDate(value) {
  if (!value) return "To be decided";

  const [year, month, day] = String(value).slice(0, 10).split("-").map(Number);

  const date = new Date(year, month - 1, day);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
      });
}

function formatTime(value) {
  if (!value) return "To be decided";

  const [hours, minutes] = value.split(":").map(Number);

  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) {
    return value;
  }

  return new Date(2026, 0, 1, hours, minutes).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function getErrorMessage(error) {
  const data = error?.response?.data;

  if (typeof data === "string") return data;
  if (data?.detail) return String(data.detail);

  if (data && typeof data === "object") {
    return Object.entries(data)
      .map(([field, messages]) => {
        const text = Array.isArray(messages)
          ? messages.join(", ")
          : String(messages);

        return `${field.replaceAll("_", " ")}: ${text}`;
      })
      .join(" | ");
  }

  return error?.message || "Something went wrong.";
}

function SectionHeading({ number, title, subtitle }) {
  return (
    <div className="booking-section-heading">
      <span className="booking-section-number">{number}</span>

      <div>
        <h3>{title}</h3>
        <p>{subtitle}</p>
      </div>

      <span className="booking-section-line" />
    </div>
  );
}

function BookingField({
  label,
  name,
  icon: Icon,
  type = "text",
  value,
  onChange,
  placeholder,
  error,
  required = false,
  full = false,
  min,
  maxLength,
  autoComplete,
}) {
  return (
    <div className={`booking-field ${full ? "booking-field-full" : ""}`}>
      <label htmlFor={name}>
        {label}
        {required && <span className="booking-required"> *</span>}
      </label>

      <div className={`booking-input-wrap ${error ? "booking-invalid" : ""}`}>
        <Icon size={18} strokeWidth={1.7} />

        <input
          id={name}
          name={name}
          type={type}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          min={min}
          maxLength={maxLength}
          autoComplete={autoComplete}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${name}-error` : undefined}
        />
      </div>

      {error && (
        <small id={`${name}-error`} className="booking-field-error">
          {error}
        </small>
      )}
    </div>
  );
}

export default function Booking() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const selectedPackage = searchParams.get("package") || "";

  const [formData, setFormData] = useState(initialForm);
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState({});
  const [apiError, setApiError] = useState("");
  const [bookingResult, setBookingResult] = useState(null);

  const today = getLocalToday();

  useEffect(() => {
    document.title = "Book a Photoshoot | Lenscraft Studio";
  }, []);

  // PREFILL LOGGED-IN USER DETAILS
  useEffect(() => {
    const user = getStoredUser();
    if (!user) return;

    const fullName =
      [user.first_name, user.last_name].filter(Boolean).join(" ") ||
      user.username ||
      "";

    setFormData((prev) => ({
      ...prev,
      customer_name: prev.customer_name || fullName,
      email: prev.email || user.email || "",
      phone: prev.phone || user.phone || "",
    }));
  }, []);

  // LOAD PHOTOGRAPHY PACKAGES
  useEffect(() => {
    let active = true;

    const fetchPackages = async () => {
      setLoadingPackages(true);

      try {
        const data = await getServicePackages();

        if (!active) return;

        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setPackages(list);

        if (selectedPackage) {
          const matched = list.find(
            (item) =>
              item.slug === selectedPackage || item.name === selectedPackage,
          );

          if (matched) {
            setFormData((prev) => ({
              ...prev,
              service: matched.name,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load packages:", error);

        if (active) {
          setApiError("Unable to load photography packages. Please try again.");
        }
      } finally {
        if (active) setLoadingPackages(false);
      }
    };

    fetchPackages();

    return () => {
      active = false;
    };
  }, [selectedPackage]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setApiError("");
  };

  // KEEP EXISTING VALIDATION RULES
  const validateForm = () => {
    const next = {};

    if (formData.customer_name.trim().length < 3) {
      next.customer_name = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      next.email = "Enter a valid email address.";
    }

    if (!/^[6-9]\d{9}$/.test(formData.phone.trim())) {
      next.phone = "Enter a valid 10-digit Indian mobile number.";
    }

    if (!formData.service) {
      next.service = "Please select a photography package.";
    }

    if (!formData.event_date) {
      next.event_date = "Select an event date.";
    } else if (formData.event_date < today) {
      next.event_date = "Event date cannot be in the past.";
    }

    if (!formData.event_time) {
      next.event_time = "Select an event time.";
    }

    if (formData.event_date && formData.event_time) {
      const selectedDateTime = new Date(
        `${formData.event_date}T${formData.event_time}`,
      );

      if (selectedDateTime <= new Date()) {
        next.event_time = "Please select a future date and time.";
      }
    }

    if (!formData.event_location.trim()) {
      next.event_location = "Please enter the event location.";
    }

    setErrors(next);

    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (submitting) return;

    setApiError("");

    if (!validateForm()) return;

    const user = getStoredUser();

    if (!user) {
      navigate(
        `/login?next=${encodeURIComponent(
          window.location.pathname + window.location.search,
        )}`,
      );
      return;
    }

    try {
      setSubmitting(true);

      const payload = {
        customer_name: formData.customer_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        service: formData.service,
        event_date: formData.event_date,
        event_time: formData.event_time,
        event_location: formData.event_location.trim(),
        special_requirements: formData.special_requirements.trim(),
      };

      const result = await createBooking(payload);

      setBookingResult(result);

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } catch (error) {
      console.error("Booking failed:", error);

      if (error?.response?.status === 401 || error?.response?.status === 403) {
        setApiError(
          "Your login session is missing or expired. Please log in again.",
        );
      } else {
        setApiError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (bookingResult) {
    return (
      <main className="booking-page">
        <section className="booking-success">
          <div className="booking-success-icon">
            <CheckCircle2 size={48} strokeWidth={1.5} />
          </div>

          <span className="booking-eyebrow">YOUR STORY STARTS HERE</span>

          <h1>
            Something beautiful
            <br />
            <em>is on its way.</em>
          </h1>

          <p>
            Your photography booking request has been received. Our team will
            review the details and confirm your session.
          </p>

          <div className="booking-success-details">
            <div>
              <small>BOOKING REFERENCE</small>
              <strong>
                {bookingResult.id ? `#${bookingResult.id}` : "Submitted"}
              </strong>
            </div>

            <div>
              <small>PHOTOGRAPHY PACKAGE</small>
              <strong>{bookingResult.service || formData.service}</strong>
            </div>

            <div>
              <small>EVENT DATE</small>
              <strong>
                {formatDate(bookingResult.event_date || formData.event_date)}
              </strong>
            </div>

            <div>
              <small>STATUS</small>
              <strong className="booking-pending">
                {bookingResult.status || "Pending"}
              </strong>
            </div>
          </div>

          <div className="booking-success-actions">
            <Link to="/my-bookings" className="booking-primary-btn">
              View My Bookings
              <ArrowRight size={18} />
            </Link>

            <Link to="/" className="booking-secondary-btn">
              Back to Home
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="booking-page">
      <div className="booking-container">
        {/* TOP BAR */}
        <div className="booking-topbar">
          <Link to="/services" className="booking-back-link">
            <ArrowLeft size={17} />
            BACK TO SERVICES
          </Link>

          <span className="booking-brand">
            <Aperture size={21} />
            LENSCRAFT <span>STUDIO</span>
          </span>

          <span className="booking-top-index">THE BOOKING ATELIER / 002</span>
        </div>

        {/* EDITORIAL HERO */}
        <header className="booking-hero">
          <div className="booking-hero-content">
            <span className="booking-eyebrow">
              <span className="booking-small-dot" />
              THE PHOTOGRAPHY ATELIER
            </span>

            <h1>
              Your moments.
              <br />
              Our <em>masterpiece.</em>
            </h1>

            <p>
              Every occasion has a story worth preserving. From intimate
              celebrations to unforgettable milestones, let's create photographs
              that feel like you.
            </p>

            <div className="booking-hero-meta">
              <span>
                <Sparkles size={15} /> Thoughtfully crafted
              </span>
              <span>
                <Check size={15} /> Personalised experience
              </span>
            </div>
          </div>

          <div className="booking-hero-mark" aria-hidden="true">
            <Aperture size={145} strokeWidth={0.55} />
            <span>MADE TO BE REMEMBERED</span>
          </div>

          <span className="booking-hero-vertical" aria-hidden="true">
            THE ART OF CAPTURING FEELING
          </span>
        </header>

        <div className="booking-layout">
          {/* LEFT EDITORIAL PANEL */}
          <aside className="booking-info-panel">
            <div className="booking-photo-heading">
              <span>01 / THE EXPERIENCE</span>
              <MoveUpRight size={18} />
            </div>

            <div className="booking-visual">
              <div className="booking-visual-content">
                <span className="booking-visual-label">
                  <Camera size={14} />
                  LENSCRAFT STORIES
                </span>

                <div>
                  <span className="booking-visual-kicker">
                    EVERY FRAME HAS A FEELING
                  </span>

                  <h2>
                    More than
                    <br />
                    a photograph.
                    <br />
                    <em>A feeling.</em>
                  </h2>
                </div>

                <div className="booking-visual-bottom">
                  <span>THE ART OF REMEMBERING</span>
                  <Aperture size={27} />
                </div>
              </div>
            </div>

            <div className="booking-experience-info">
              <span className="booking-eyebrow">THE LENSCRAFT PROMISE</span>

              <h2>
                Beautifully planned.
                <br />
                <em>Honestly captured.</em>
              </h2>

              <p>
                We believe the best photographs are the ones that bring you
                right back to how a moment felt. Your experience starts with
                understanding your story.
              </p>

              <div className="booking-benefits">
                <div>
                  <Camera size={20} />
                  <span>
                    <small>CREATIVE EXPERTISE</small>
                    <strong>Professional photography</strong>
                  </span>
                </div>

                <div>
                  <Heart size={20} />
                  <span>
                    <small>MADE FOR YOU</small>
                    <strong>Personalised packages</strong>
                  </span>
                </div>

                <div>
                  <Award size={20} />
                  <span>
                    <small>THOUGHTFUL SERVICE</small>
                    <strong>Dedicated booking support</strong>
                  </span>
                </div>
              </div>

              <div className="booking-info-note">
                <span className="booking-info-note-dot" />

                <div>
                  <strong>Booking requests are open</strong>
                  <small>
                    Session availability is confirmed by our studio.
                  </small>
                </div>
              </div>
            </div>

            <div className="booking-quote">
              <span>“</span>
              <p>
                The moments you live once
                <em> deserve to be felt forever.</em>
              </p>
              <small>— THE LENSCRAFT PHILOSOPHY</small>
            </div>
          </aside>

          {/* RIGHT FORM */}
          <section className="booking-form-panel">
            <div className="booking-form-top">
              <span>02 / YOUR BOOKING REQUEST</span>
              <Aperture size={25} />
            </div>

            <div className="booking-form-heading">
              <span className="booking-eyebrow">LET'S BEGIN</span>

              <h2>
                Tell us about
                <br />
                <em>your moment.</em>
              </h2>

              <p>
                A few thoughtful details are all we need to begin planning your
                photography experience.
              </p>
            </div>

            {apiError && (
              <div className="booking-api-error" role="alert">
                <AlertCircle size={19} />
                <span>{apiError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="booking-form" noValidate>
              <SectionHeading
                number="01"
                title="The essentials"
                subtitle="First, we'd love to know you."
              />

              <div className="booking-form-grid">
                <BookingField
                  label="YOUR FULL NAME"
                  name="customer_name"
                  icon={UserRound}
                  value={formData.customer_name}
                  onChange={handleChange}
                  error={errors.customer_name}
                  placeholder="Enter your name"
                  autoComplete="name"
                  full
                  required
                />

                <BookingField
                  label="EMAIL ADDRESS"
                  name="email"
                  icon={Mail}
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  error={errors.email}
                  placeholder="you@example.com"
                  autoComplete="email"
                  required
                />

                <BookingField
                  label="PHONE NUMBER"
                  name="phone"
                  icon={Phone}
                  type="tel"
                  value={formData.phone}
                  onChange={handleChange}
                  error={errors.phone}
                  placeholder="10-digit mobile number"
                  maxLength={10}
                  autoComplete="tel"
                  required
                />
              </div>

              <SectionHeading
                number="02"
                title="The occasion"
                subtitle="Let's shape the experience around your story."
              />

              <div className="booking-form-grid">
                {/* PACKAGE */}
                <div className="booking-field booking-field-full">
                  <label htmlFor="service">
                    PHOTOGRAPHY PACKAGE
                    <span className="booking-required"> *</span>
                  </label>

                  <div
                    className={`booking-input-wrap ${errors.service ? "booking-invalid" : ""}`}
                  >
                    <Camera size={18} strokeWidth={1.7} />

                    <select
                      id="service"
                      name="service"
                      value={formData.service}
                      onChange={handleChange}
                      disabled={loadingPackages}
                      aria-invalid={!!errors.service}
                      aria-describedby={
                        errors.service ? "service-error" : undefined
                      }
                    >
                      <option value="">
                        {loadingPackages
                          ? "Loading packages..."
                          : "Select your photography experience"}
                      </option>

                      {packages.map((pkg) => (
                        <option key={pkg.id} value={pkg.name}>
                          {pkg.name}
                          {pkg.starting_price
                            ? ` — ₹${Number(pkg.starting_price).toLocaleString("en-IN")}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>

                  {errors.service && (
                    <small id="service-error" className="booking-field-error">
                      {errors.service}
                    </small>
                  )}
                </div>

                <BookingField
                  label="EVENT DATE"
                  name="event_date"
                  icon={CalendarDays}
                  type="date"
                  value={formData.event_date}
                  onChange={handleChange}
                  error={errors.event_date}
                  min={today}
                  required
                />

                <BookingField
                  label="EVENT TIME"
                  name="event_time"
                  icon={Clock3}
                  type="time"
                  value={formData.event_time}
                  onChange={handleChange}
                  error={errors.event_time}
                  required
                />

                <BookingField
                  label="EVENT LOCATION"
                  name="event_location"
                  icon={MapPin}
                  value={formData.event_location}
                  onChange={handleChange}
                  error={errors.event_location}
                  placeholder="Venue, city or event address"
                  full
                  required
                />

                <div className="booking-field booking-field-full">
                  <label htmlFor="special_requirements">
                    YOUR VISION
                    <span className="booking-optional">OPTIONAL</span>
                  </label>

                  <div className="booking-textarea-wrap">
                    <MessageSquare size={19} />

                    <textarea
                      id="special_requirements"
                      name="special_requirements"
                      value={formData.special_requirements}
                      onChange={handleChange}
                      placeholder="Tell us what makes your event special, your preferred photography style, or any moments you want captured..."
                      rows={5}
                    />
                  </div>
                </div>
              </div>

              {/* LIVE SUMMARY */}
              <div className="booking-summary">
                <div className="booking-summary-header">
                  <div>
                    <span>YOUR EXPERIENCE / AT A GLANCE</span>
                    <h3>The little details.</h3>
                  </div>

                  <Aperture size={29} strokeWidth={1.2} />
                </div>

                <div className="booking-summary-items">
                  <div>
                    <small>PACKAGE</small>
                    <strong>{formData.service || "Not selected"}</strong>
                  </div>

                  <div>
                    <small>EVENT DATE</small>
                    <strong>{formatDate(formData.event_date)}</strong>
                  </div>

                  <div>
                    <small>EVENT TIME</small>
                    <strong>{formatTime(formData.event_time)}</strong>
                  </div>

                  <div>
                    <small>LOCATION</small>
                    <strong>
                      {formData.event_location.trim() || "To be decided"}
                    </strong>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="booking-submit-btn"
                disabled={submitting || loadingPackages}
              >
                <span>
                  {submitting
                    ? "Sending your request..."
                    : "Request your session"}
                </span>

                {submitting ? (
                  <LoaderCircle className="booking-spin" size={21} />
                ) : (
                  <ArrowRight size={22} />
                )}
              </button>

              <p className="booking-disclaimer">
                <ShieldCheck size={17} />
                Your request is submitted securely and remains pending until our
                studio confirms the booking.
              </p>
            </form>
          </section>
        </div>

        <footer className="booking-footer">
          <span>THE ART OF REMEMBERING</span>
          <Aperture size={23} />
          <span>LENSCRAFT STUDIO</span>
        </footer>
      </div>
    </main>
  );
}
