import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import {
  Camera,
  Clock3,
  ArrowUpRight,
  ArrowRight,
  Sparkles,
  CalendarDays,
} from "lucide-react";

import { photo } from "../assets/data";

import { getServices, getServicePackages } from "../api/serviceService";

import "../styles/Services.css";

// ==========================================
// FALLBACK IMAGE
// ==========================================

const fallbackImage = photo("photo-1542038784456-1ea8e935640e", 900);

// ==========================================
// WHY CHOOSE US
// ==========================================

const features = [
  {
    icon: Camera,
    title: "Professional Photography",
    description:
      "Beautifully composed photographs captured with creativity, precision, and attention to detail.",
  },
  {
    icon: Sparkles,
    title: "Creative Storytelling",
    description:
      "Every photograph tells a unique story, preserving emotions and meaningful memories.",
  },
  {
    icon: Clock3,
    title: "Timely Delivery",
    description:
      "A thoughtful editing process and clear communication throughout your photography experience.",
  },
];

// ==========================================
// BOOKING PROCESS
// ==========================================

const bookingSteps = [
  {
    number: "01",
    title: "Choose Your Service",
    description:
      "Explore our photography packages and select the one that matches your occasion.",
  },
  {
    number: "02",
    title: "Book Your Date",
    description:
      "Share your event date, location, and photography requirements.",
  },
  {
    number: "03",
    title: "Capture Memories",
    description:
      "Our photographers capture your special moments with creativity and care.",
  },
];

// ==========================================
// ANIMATION
// ==========================================

const fadeUp = {
  hidden: {
    opacity: 0,
    y: 35,
  },
  visible: {
    opacity: 1,
    y: 0,
  },
};

// ==========================================
// SERVICES COMPONENT
// ==========================================

export default function Services() {
  const [services, setServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState("");
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ========================================
  // FETCH DJANGO SERVICE PACKAGES
  // ========================================

  useEffect(() => {
    document.title = "Photography Services | Lenscraft Studio";
    let active = true;

    // Fetch each resource independently. A slow packages endpoint must not
    // prevent the services list from appearing, or vice versa.
    const loadServices = async () => {
      const started = performance.now();
      try {
        const data = await getServices();
        if (!active) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        setServices(list.filter((item) => item.active !== false));
        setServicesError("");
      } catch (err) {
        if (!active) return;
        console.error("Services API error:", err);
        setServicesError("Unable to load photography services.");
      } finally {
        if (active) {
          setServicesLoading(false);
          if (import.meta.env.DEV) {
            console.info(
              `Services API completed in ${Math.round(performance.now() - started)}ms`,
            );
          }
        }
      }
    };

    const loadPackages = async () => {
      const started = performance.now();
      try {
        const data = await getServicePackages();
        if (!active) return;
        const list = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];
        setPackages(list.filter((pkg) => pkg.is_active === true));
        setError("");
      } catch (err) {
        if (!active) return;
        console.error("Packages API error:", err);
        setError("Unable to load photography packages.");
      } finally {
        if (active) {
          setLoading(false);
          if (import.meta.env.DEV) {
            console.info(
              `Packages API completed in ${Math.round(performance.now() - started)}ms`,
            );
          }
        }
      }
    };

    void loadServices();
    void loadPackages();
    return () => {
      active = false;
    };
  }, []);

  // ========================================
  // FORMAT PRICE
  // ========================================

  const formatPrice = (price) => {
    const value = Number(price);

    if (!Number.isFinite(value)) {
      return "Contact for pricing";
    }

    return `₹${value.toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  };

  return (
    <main className="services-page">
      {/* =====================================
          HERO SECTION
      ===================================== */}

      <section className="services-cinematic-hero">
        <div className="services-hero-overlay" />

        <motion.div
          className="services-hero-content"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div className="services-hero-label">
            <Camera size={17} />
            <span>THE ART OF PHOTOGRAPHY</span>
          </div>

          <h1>
            Moments Worth
            <br />
            <em>Remembering.</em>
          </h1>

          <div className="services-hero-divider">
            <span />
            <span>01 / OUR EXPERTISE</span>
          </div>

          <p>
            From intimate celebrations to extraordinary occasions, we transform
            beautiful moments into timeless visual stories.
          </p>

          <div className="services-hero-actions">
            <Link to="/services#services-intro">
              EXPLORE OUR SERVICES <ArrowUpRight size={18} />
            </Link>

            <Link to="/contact" className="services-hero-secondary">
              LET'S TALK <ArrowRight size={18} />
            </Link>
          </div>
        </motion.div>

        <div className="services-hero-side-text">
          LENSCRAFT — CAPTURING WHAT MATTERS
        </div>

        <a href="#services-intro" className="services-hero-scroll">
          <span className="services-scroll-line" />
          SCROLL TO DISCOVER
        </a>
      </section>

      {/* =====================================
          INTRODUCTION
      ===================================== */}

      <section id="services-intro" className="section container services-intro">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeUp}
          transition={{ duration: 0.6 }}
        >
          <p className="eyebrow">WHAT WE OFFER</p>

          <h2>
            Capturing Moments.
            <br />
            <em>Creating Memories.</em>
          </h2>

          <p>
            At Lenscraft Studio, we believe every moment deserves to be
            remembered beautifully. From weddings and celebrations to portraits
            and commercial photography, we bring your vision to life through
            timeless imagery.
          </p>
        </motion.div>

        <motion.div
          className="services-intro-image"
          initial={{ opacity: 0, x: 40 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <img
            src={photo("photo-1452587925148-ce544e77e70d", 1000)}
            alt="Professional photography camera"
            loading="lazy"
            decoding="async"
          />
        </motion.div>
      </section>

      {/* =====================================
          SERVICES MANAGED IN ADMIN DASHBOARD
      ===================================== */}
      <section className="section services-packages-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">OUR EXPERTISE</p>
            <h2>
              Our Photography <em>Services</em>
            </h2>
            <p>
              Explore the photography services available at Lenscraft Studio.
            </p>
          </div>

          {servicesLoading && (
            <div className="services-status" role="status">
              <div className="services-spinner" />
              <p>Loading photography services...</p>
            </div>
          )}

          {!servicesLoading && servicesError && (
            <div className="services-status" role="alert">
              <p>{servicesError}</p>
            </div>
          )}

          {!servicesLoading && !servicesError && services.length === 0 && (
            <div className="services-status">
              <Camera size={42} />
              <h3>No Services Available</h3>
              <p>Our photography services will be available soon.</p>
            </div>
          )}

          {!servicesLoading && !servicesError && services.length > 0 && (
            <div className="services-grid">
              {services.map((service, index) => (
                <motion.article
                  className="service-card"
                  key={service.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.08, 0.4),
                  }}
                >
                  <div className="service-image">
                    <img
                      src={service.image || service.image_url || fallbackImage}
                      alt={service.title}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="400"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                    />
                    <span className="service-image-badge">
                      <Camera size={14} />
                      Photography
                    </span>
                  </div>
                  <div className="service-content">
                    <h3>{service.title}</h3>
                    <p className="service-description">{service.description}</p>
                    <div className="service-bottom">
                      <div className="service-price">
                        <span>STARTING FROM</span>
                        <strong>{formatPrice(service.price)}</strong>
                      </div>
                      <Link to="/contact" className="service-book-btn">
                        Enquire Now
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          PHOTOGRAPHY PACKAGES
      ===================================== */}

      <section className="section services-packages-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">EXPLORE OUR SERVICES</p>

            <h2>
              Our Photography <em>Packages</em>
            </h2>

            <p>
              Discover photography experiences designed around your special
              moments.
            </p>
          </div>

          {loading && (
            <div className="services-status" role="status">
              <div className="services-spinner" />
              <p>Loading photography packages...</p>
            </div>
          )}

          {!loading && error && (
            <div className="services-status" role="alert">
              <p>{error}</p>
            </div>
          )}

          {!loading && !error && packages.length === 0 && (
            <div className="services-status">
              <Camera size={42} />

              <h3>No Packages Available</h3>

              <p>Our photography packages will be available soon.</p>

              <Link to="/contact" className="btn btn-gold">
                Contact Us
                <ArrowUpRight size={18} />
              </Link>
            </div>
          )}

          {!loading && !error && packages.length > 0 && (
            <div className="services-grid">
              {packages.map((pkg, index) => (
                <motion.article
                  className="service-card"
                  key={pkg.id}
                  initial={{ opacity: 0, y: 35 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.5,
                    delay: Math.min(index * 0.08, 0.4),
                  }}
                >
                  <div className="service-image">
                    <img
                      src={pkg.image_url || fallbackImage}
                      alt={pkg.name}
                      loading="lazy"
                      decoding="async"
                      width="600"
                      height="400"
                      onError={(event) => {
                        event.currentTarget.onerror = null;
                        event.currentTarget.src = fallbackImage;
                      }}
                    />

                    <span className="service-image-badge">
                      <Camera size={14} />
                      Photography
                    </span>
                  </div>

                  <div className="service-content">
                    <h3>{pkg.name}</h3>

                    <p className="service-description">{pkg.description}</p>

                    <div className="service-meta">
                      {pkg.duration && (
                        <span>
                          <Clock3 size={16} />
                          {pkg.duration}
                        </span>
                      )}
                    </div>

                    <div className="service-bottom">
                      <div className="service-price">
                        <span>STARTING FROM</span>

                        <strong>{formatPrice(pkg.starting_price)}</strong>
                      </div>

                      <Link
                        to={`/bookings?package=${encodeURIComponent(pkg.slug)}`}
                        className="service-book-btn"
                        aria-label={`Book ${pkg.name}`}
                      >
                        Book Now
                        <ArrowUpRight size={17} />
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* =====================================
          WHY CHOOSE US
      ===================================== */}

      <section className="section container">
        <div className="section-heading">
          <p className="eyebrow">THE LENSCRAFT EXPERIENCE</p>

          <h2>
            Why Choose <em>Lenscraft?</em>
          </h2>
        </div>

        <div className="services-features-grid">
          {features.map((feature, index) => {
            const Icon = feature.icon;

            return (
              <motion.article
                className="services-feature-card"
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.1,
                }}
              >
                <div className="services-feature-icon">
                  <Icon size={29} />
                </div>

                <h3>{feature.title}</h3>

                <p>{feature.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>

      {/* =====================================
          BOOKING PROCESS
      ===================================== */}

      <section className="section services-process-section">
        <div className="container">
          <div className="section-heading">
            <p className="eyebrow">SIMPLE & SEAMLESS</p>

            <h2>
              How It <em>Works</em>
            </h2>

            <p>Three simple steps to capture your special moments.</p>
          </div>

          <div className="services-process-grid">
            {bookingSteps.map((step, index) => (
              <motion.article
                className="services-process-card"
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{
                  duration: 0.5,
                  delay: index * 0.12,
                }}
              >
                <span className="services-step-number">{step.number}</span>

                <h3>{step.title}</h3>

                <p>{step.description}</p>

                {index < bookingSteps.length - 1 && (
                  <ArrowRight className="services-step-arrow" size={24} />
                )}
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================
          CTA
      ===================================== */}
    </main>
  );
}
