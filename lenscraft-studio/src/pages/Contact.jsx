import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Phone,
  Mail,
  Clock3,
  Instagram,
  Facebook,
  MessageCircle,
  Camera,
  Heart,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Navigation,
  Sparkles,
  CalendarDays,
  Send,
  ShieldCheck,
  RefreshCw,
  X,
} from "lucide-react";

import api from "../api/axios";
import Hero from "../components/Hero";
import { services } from "../assets/data";
import "../styles/Contact.css";
import { motion } from "motion/react";
const emptyForm = {
  name: "",
  email: "",
  phone: "",
  service: "",
  date: "",
  location: "",
  message: "",
};

// Replace these values with your verified studio details.
const STUDIO = {
  address: "Chennai, Tamil Nadu, India",
  phone: "",
  email: "",
  instagram: "https://www.instagram.com/",
  facebook: "https://www.facebook.com/",
  whatsappNumber: "",
  mapQuery: "Chennai, Tamil Nadu, India",
  hours: "Monday – Saturday | 10 AM – 7 PM",
};

const mapUrl = `https://www.google.com/maps?q=${encodeURIComponent(
  STUDIO.mapQuery,
)}&output=embed`;

const directionsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
  STUDIO.mapQuery,
)}`;

const faqItems = [
  {
    question: "How early should I book my photography session?",
    answer:
      "We recommend contacting us as early as possible, especially for weddings and major events. Availability is confirmed by our studio team.",
  },
  {
    question: "Do you travel outside Chennai?",
    answer:
      "You can share your preferred shoot location in the inquiry form. Our team will discuss travel availability and any additional charges.",
  },
  {
    question: "Can I customize my photography package?",
    answer:
      "Yes. Tell us about your event, preferred style, and requirements. We can discuss a package that suits your needs.",
  },
  {
    question: "Does submitting an inquiry confirm my booking?",
    answer:
      "No. An inquiry starts a conversation with our team. Your booking is confirmed only after the details and availability are agreed upon.",
  },
];

function ContactInfoCard({ icon: Icon, label, children, href }) {
  return (
    <div className="lc-info-card">
      <div className="lc-info-icon">
        <Icon size={21} strokeWidth={1.7} />
      </div>

      <div className="lc-info-content">
        <span>{label}</span>

        {href ? (
          <a href={href} target="_blank" rel="noreferrer">
            {children}
            <ArrowUpRight size={15} />
          </a>
        ) : (
          <strong>{children}</strong>
        )}
      </div>
    </div>
  );
}

export default function Contact() {
  const route = useLocation();

  const [form, setForm] = useState({
    ...emptyForm,
    service: route.state?.service || "",
  });

  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [success, setSuccess] = useState(false);
  const [serverError, setServerError] = useState("");
  const [activeFaq, setActiveFaq] = useState(null);

  useEffect(() => {
    document.title = "Contact & Booking Inquiry | Lenscraft Studio";
  }, []);

  useEffect(() => {
    if (route.state?.service) {
      setForm((prev) => ({
        ...prev,
        service: route.state.service,
      }));
    }
  }, [route.state?.service]);

  const today = new Date();
  const minDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, "0"),
    String(today.getDate()).padStart(2, "0"),
  ].join("-");

  const update = (event) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setErrors((prev) => ({
      ...prev,
      [name]: "",
    }));

    setServerError("");
    setSuccess(false);
  };

  const submit = async (event) => {
    event.preventDefault();

    if (busy) return;

    const err = {};

    if (!form.name.trim()) {
      err.name = "Please enter your full name.";
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      err.email = "Please enter a valid email address.";
    }

    if (form.phone.replace(/\D/g, "").length < 10) {
      err.phone = "Please enter a valid phone number.";
    }

    if (!form.service) {
      err.service = "Please choose a photography service.";
    }

    if (!form.date) {
      err.date = "Please select your preferred date.";
    } else if (form.date < minDate) {
      err.date = "Please choose today or a future date.";
    }

    if (!form.message.trim()) {
      err.message = "Please tell us about your shoot.";
    }

    setErrors(err);
    setServerError("");

    if (Object.keys(err).length) return;

    setBusy(true);

    try {
      await api.post("/contacts/", {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        service: form.service,
        preferred_date: form.date,
        location: form.location.trim(),
        message: form.message.trim(),
      });

      setSuccess(true);
      setForm({ ...emptyForm });
    } catch (error) {
      const data = error.response?.data;

      if (data && typeof data === "object") {
        const mapped = {};

        Object.entries(data).forEach(([key, value]) => {
          const field = key === "preferred_date" ? "date" : key;

          if (field in emptyForm) {
            mapped[field] = Array.isArray(value)
              ? value.join(" ")
              : String(value);
          }
        });

        setErrors(mapped);
      }

      setServerError(
        "We couldn't send your inquiry. Please review the details and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const whatsappUrl = STUDIO.whatsappNumber
    ? `https://wa.me/${STUDIO.whatsappNumber.replace(/\D/g, "")}`
    : null;

  return (
    <main className="lc-contact-page">
      {/* HERO */}

      <section className="lc-contact-hero">
        <div className="lc-contact-hero-bg" />

        <div className="lc-contact-hero-overlay" />

        <motion.div
          className="lc-contact-hero-content"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div className="lc-contact-hero-eyebrow">
            <span className="lc-contact-hero-line" />
            LENSCRAFT STUDIO — GET IN TOUCH
          </div>

          <h1>
            Every Beautiful Story
            <br />
            <em>Begins With Hello.</em>
          </h1>

          <p>
            From unforgettable celebrations to intimate little moments, let's
            create photographs that tell your story beautifully.
          </p>

          <div className="lc-contact-hero-actions">
            <Link to="/contact#contact-form">Let's Create Together</Link>

            <a href="#studio-location" className="lc-contact-hero-secondary">
              <MapPin size={18} />
              Find Our Studio
            </a>
          </div>
        </motion.div>

        <div className="lc-contact-hero-bottom">
          <span>CAPTURING STORIES, CREATING MEMORIES</span>

          <a href="#contact-form" className="lc-contact-hero-scroll">
            SCROLL TO EXPLORE
            <span className="lc-contact-scroll-line" />
          </a>

          <span>CHENNAI · INDIA</span>
        </div>

        <div className="lc-contact-hero-number">01 / 04</div>
      </section>

      {/* INTRO */}
      <section className="lc-contact-intro">
        <div className="lc-container lc-intro-grid">
          <div>
            <span className="lc-eyebrow">
              <span className="lc-eyebrow-line" />
              GET IN TOUCH
            </span>

            <h2>
              Your Story Deserves
              <br />
              <em>To Be Remembered.</em>
            </h2>
          </div>

          <div className="lc-intro-right">
            <p>
              A wedding, a celebration, a portrait, or simply a moment worth
              keeping forever. Whatever your vision, we're here to listen,
              create, and capture it beautifully.
            </p>

            <a href="#contact-form" className="lc-text-link">
              Start your conversation
              <ArrowUpRight size={19} />
            </a>
          </div>
        </div>
      </section>

      {/* CONTACT + FORM */}
      <section className="lc-contact-main" id="contact-form">
        <div className="lc-container lc-main-grid">
          <aside className="lc-contact-sidebar">
            <div className="lc-sidebar-heading">
              <span className="lc-section-index">01 / CONNECT</span>

              <h2>
                We'd Love to
                <br />
                <em>Hear From You.</em>
              </h2>

              <p>
                Have a question, an exciting idea, or a special occasion coming
                up? Reach out and let's make something meaningful together.
              </p>
            </div>

            <div className="lc-contact-info-list">
              <ContactInfoCard
                icon={MapPin}
                label="OUR LOCATION"
                href={directionsUrl}
              >
                {STUDIO.address}
              </ContactInfoCard>

              <ContactInfoCard
                icon={Phone}
                label="CALL OUR STUDIO"
                href={
                  STUDIO.phone
                    ? `tel:${STUDIO.phone.replace(/[^\d+]/g, "")}`
                    : undefined
                }
              >
                {STUDIO.phone || "Number coming soon"}
              </ContactInfoCard>

              <ContactInfoCard
                icon={Mail}
                label="SEND AN EMAIL"
                href={STUDIO.email ? `mailto:${STUDIO.email}` : undefined}
              >
                {STUDIO.email || "Email coming soon"}
              </ContactInfoCard>

              <ContactInfoCard icon={Clock3} label="STUDIO HOURS">
                {STUDIO.hours}
              </ContactInfoCard>
            </div>

            <div className="lc-social-section">
              <span>FOLLOW OUR CREATIVE JOURNEY</span>

              <div className="lc-social-links">
                <a
                  href={STUDIO.instagram}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Instagram"
                >
                  <Instagram size={19} />
                </a>

                <a
                  href={STUDIO.facebook}
                  target="_blank"
                  rel="noreferrer"
                  aria-label="Facebook"
                >
                  <Facebook size={19} />
                </a>

                {whatsappUrl && (
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    aria-label="WhatsApp"
                  >
                    <MessageCircle size={19} />
                  </a>
                )}
              </div>
            </div>

            <div className="lc-quote-card">
              <Camera size={29} strokeWidth={1.4} />

              <p>
                "The most beautiful photographs begin with the stories people
                share."
              </p>

              <span>— LENSCRAFT STUDIO</span>
            </div>
          </aside>

          <div className="lc-form-panel">
            <div className="lc-form-header">
              <div className="lc-form-topline">
                <span className="lc-section-index">02 / YOUR INQUIRY</span>

                <span className="lc-form-decor">
                  <Sparkles size={20} />
                </span>
              </div>

              <h2>
                Tell Us About
                <br />
                <em>Your Vision.</em>
              </h2>

              <p>
                Fill in the details below and our team will get back to you to
                discuss your photography needs.
              </p>
            </div>

            <form className="lc-contact-form" onSubmit={submit} noValidate>
              <div className="lc-form-grid">
                <div className="lc-field">
                  <label htmlFor="lc-name">FULL NAME *</label>

                  <input
                    id="lc-name"
                    name="name"
                    type="text"
                    autoComplete="name"
                    value={form.name}
                    onChange={update}
                    placeholder="Your full name"
                    aria-invalid={!!errors.name}
                  />

                  {errors.name && (
                    <small className="lc-field-error">{errors.name}</small>
                  )}
                </div>

                <div className="lc-field">
                  <label htmlFor="lc-email">EMAIL ADDRESS *</label>

                  <input
                    id="lc-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    value={form.email}
                    onChange={update}
                    placeholder="you@example.com"
                    aria-invalid={!!errors.email}
                  />

                  {errors.email && (
                    <small className="lc-field-error">{errors.email}</small>
                  )}
                </div>

                <div className="lc-field">
                  <label htmlFor="lc-phone">PHONE NUMBER *</label>

                  <input
                    id="lc-phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    value={form.phone}
                    onChange={update}
                    placeholder="+91 98765 43210"
                    aria-invalid={!!errors.phone}
                  />

                  {errors.phone && (
                    <small className="lc-field-error">{errors.phone}</small>
                  )}
                </div>

                <div className="lc-field">
                  <label htmlFor="lc-service">PHOTOGRAPHY SERVICE *</label>

                  <select
                    id="lc-service"
                    name="service"
                    value={form.service}
                    onChange={update}
                    aria-invalid={!!errors.service}
                  >
                    <option value="">Select a service</option>

                    {services.map(([title]) => (
                      <option key={title} value={title}>
                        {title}
                      </option>
                    ))}
                  </select>

                  {errors.service && (
                    <small className="lc-field-error">{errors.service}</small>
                  )}
                </div>

                <div className="lc-field">
                  <label htmlFor="lc-date">PREFERRED SHOOT DATE *</label>

                  <input
                    id="lc-date"
                    name="date"
                    type="date"
                    min={minDate}
                    value={form.date}
                    onChange={update}
                    aria-invalid={!!errors.date}
                  />

                  {errors.date && (
                    <small className="lc-field-error">{errors.date}</small>
                  )}
                </div>

                <div className="lc-field">
                  <label htmlFor="lc-location">EVENT LOCATION</label>

                  <input
                    id="lc-location"
                    name="location"
                    value={form.location}
                    onChange={update}
                    placeholder="City or venue"
                    aria-invalid={!!errors.location}
                  />

                  {errors.location && (
                    <small className="lc-field-error">{errors.location}</small>
                  )}
                </div>

                <div className="lc-field lc-full">
                  <label htmlFor="lc-message">TELL US YOUR STORY *</label>

                  <textarea
                    id="lc-message"
                    name="message"
                    rows={6}
                    value={form.message}
                    onChange={update}
                    placeholder="Tell us about your event, ideas, preferred photography style, and any special requests..."
                    aria-invalid={!!errors.message}
                  />

                  {errors.message && (
                    <small className="lc-field-error">{errors.message}</small>
                  )}
                </div>
              </div>

              <div className="lc-form-footer">
                <p>
                  <ShieldCheck size={17} />
                  Your details are used to respond to your inquiry. Submitting
                  does not confirm a booking.
                </p>

                <button className="lc-submit-btn" type="submit" disabled={busy}>
                  <span>
                    {busy ? "Sending Inquiry..." : "Send Your Inquiry"}
                  </span>

                  {busy ? (
                    <span className="lc-spinner" />
                  ) : (
                    <ArrowUpRight size={20} />
                  )}
                </button>

                {serverError && (
                  <div className="lc-alert lc-alert-error" role="alert">
                    <AlertCircle size={19} />
                    {serverError}
                  </div>
                )}

                {success && (
                  <div className="lc-alert lc-alert-success" role="status">
                    <CheckCircle2 size={20} />
                    <span>
                      Thank you! Your inquiry has been received. Our team will
                      contact you soon.
                    </span>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </section>

      {/* GOOGLE MAP */}
      <section className="lc-map-section" id="studio-location">
        <div className="lc-container">
          <div className="lc-map-heading">
            <div>
              <span className="lc-eyebrow">
                <span className="lc-eyebrow-line" />
                FIND OUR STUDIO
              </span>

              <h2>
                Come Say <em>Hello.</em>
              </h2>
            </div>

            <p>
              Based in Chennai, creating memorable photography experiences.
              Explore our location below.
            </p>
          </div>

          <div className="lc-map-wrapper">
            <iframe
              title="Lenscraft Studio - Chennai Map"
              src={mapUrl}
              width="100%"
              height="460"
              style={{ border: 0 }}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              allowFullScreen
            />

            <div className="lc-map-overlay">
              <div className="lc-map-overlay-icon">
                <MapPin size={22} />
              </div>

              <div className="lc-map-overlay-text">
                <span>OUR LOCATION</span>
                <strong>Lenscraft Studio</strong>
                <p>{STUDIO.address}</p>
              </div>

              <a
                href={directionsUrl}
                target="_blank"
                rel="noreferrer"
                className="lc-map-directions"
              >
                <Navigation size={17} />
                Open Google Maps
              </a>
            </div>
          </div>

          <p className="lc-map-note">
            Map currently shows Chennai. Add your exact studio address to
            display the correct location.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="lc-faq-section">
        <div className="lc-container lc-faq-grid">
          <div className="lc-faq-intro">
            <span className="lc-eyebrow">
              <span className="lc-eyebrow-line" />
              GOOD TO KNOW
            </span>

            <h2>
              A Few Things
              <br />
              <em>You May Ask.</em>
            </h2>

            <p>
              Planning a photography session should feel exciting, not
              complicated. Here are a few helpful answers before we begin.
            </p>

            <a href="#contact-form" className="lc-text-link">
              Still have a question?
              <ArrowUpRight size={18} />
            </a>
          </div>

          <div className="lc-faq-list">
            {faqItems.map((item, index) => {
              const isOpen = activeFaq === index;

              return (
                <div
                  className={`lc-faq-item ${isOpen ? "active" : ""}`}
                  key={item.question}
                >
                  <button
                    type="button"
                    className="lc-faq-question"
                    aria-expanded={isOpen}
                    onClick={() => setActiveFaq(isOpen ? null : index)}
                  >
                    <span className="lc-faq-number">
                      {String(index + 1).padStart(2, "0")}
                    </span>

                    <span>{item.question}</span>

                    <ChevronDown size={19} />
                  </button>

                  {isOpen && (
                    <div className="lc-faq-answer">
                      <p>{item.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
    </main>
  );
}
