import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Camera,
  Aperture,
  Heart,
  Check,
  Sparkles,
  MoveUpRight,
} from "lucide-react";

import api from "../api/axios";
import Hero from "../components/Hero";
import Gallery from "../components/Gallery";
import { photo } from "../assets/data";
import "../styles/Home.css";

/* ==========================================
   IMAGE CONFIGURATION
========================================== */

const FALLBACK_IMAGE = `${import.meta.env.BASE_URL}images/photoimg.jpg`;

function getApiOrigin() {
  try {
    const apiBase =
      api.defaults.baseURL ||
      import.meta.env.VITE_API_BASE_URL ||
      window.location.origin;

    return new URL(apiBase, window.location.origin).origin;
  } catch (error) {
    console.error("Unable to determine API origin:", error);
    return window.location.origin;
  }
}

/* ==========================================
   IMAGE URL HELPER
========================================== */


function getImage(value, width = 1000) {
  if (!value || typeof value !== "string") {
    return FALLBACK_IMAGE;
  }

  const image = value.trim();

  if (!image) return FALLBACK_IMAGE;

  // External URLs
  if (/^(https?:\/\/|data:|blob:)/i.test(image)) {
    return image;
  }

  // Unsplash image IDs
  if (/^photo-[a-zA-Z0-9_-]+$/.test(image)) {
    return photo(image, width);
  }

  const normalized = image.replace(/\\/g, "/");

  // Remove Vite BASE_URL if already included
  const baseUrl = import.meta.env.BASE_URL;
  const withoutBase = normalized.startsWith(baseUrl)
    ? normalized.slice(baseUrl.length)
    : normalized.replace(/^\/+/, "");

  // Frontend public/images paths
  if (withoutBase.toLowerCase().startsWith("images/")) {
    return `${baseUrl}${withoutBase}`;
  }

  // Django media paths
  const apiOrigin = getApiOrigin();

  if (/^media\//i.test(withoutBase)) {
    return new URL(withoutBase, `${apiOrigin}/`).href;
  }

  if (normalized.startsWith("/")) {
    return new URL(normalized, apiOrigin).href;
  }

  return new URL(normalized, `${apiOrigin}/`).href;
}

/* ==========================================
   IMAGE ERROR HANDLER
========================================== */

function handleImageError(event) {
  const img = event.currentTarget;

  if (img.dataset.fallbackApplied === "true") {
    img.style.visibility = "hidden";
    console.error("Fallback image could not be loaded:", img.src);
    return;
  }

  img.dataset.fallbackApplied = "true";
  img.src = FALLBACK_IMAGE;

  console.warn("Image failed to load. Using fallback:", img.alt);
}

/* ==========================================
   STATIC PORTFOLIO
========================================== */

const portfolio = [
  {
    id: 1,
    title: "Timeless Romance",
    category: "Wedding Photography",
    image: `${import.meta.env.BASE_URL}images/portfolio-106.jpg`,
    size: "large",
  },
  {
    id: 2,
    title: "The Art of Portraits",
    category: "Portrait Photography",
    image: "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=800",
    size: "small",
  },
  {
    id: 3,
    title: "Beautiful Celebrations",
    category: "Event Photography",
    image: `${import.meta.env.BASE_URL}images/event.jpg`,
    size: "small",
  },
  {
    id: 4,
    title: "Creative Expressions",
    category: "Fashion Photography",
    image: `${import.meta.env.BASE_URL}images/fashion.jpg`,
    size: "large",
  },
];

/* ==========================================
   PROCESS STEPS
========================================== */

const processSteps = [
  {
    number: "01",
    title: "Let's Connect",
    description:
      "Tell us about your story, your ideas, and the moments you want to remember.",
  },
  {
    number: "02",
    title: "Creative Planning",
    description:
      "Together, we plan your location, styling, lighting, and creative direction.",
  },
  {
    number: "03",
    title: "The Photoshoot",
    description:
      "Enjoy the experience while we capture your most authentic moments.",
  },
  {
    number: "04",
    title: "Beautiful Delivery",
    description:
      "Receive a carefully edited collection of photographs you'll treasure.",
  },
];

/* ==========================================
   JOURNAL
========================================== */

const journal = [
  {
    id: 1,
    category: "WEDDING STORIES",
    title: "The Beauty of Candid Wedding Photography",
    image: "photo-1519741497674-611481863552",
    description:
      "The most beautiful wedding moments are often the ones that happen naturally.",
  },
  {
    id: 2,
    category: "PORTRAIT STORIES",
    title: "Creating Beautiful Portraits With Natural Light",
    image: "photo-1534528741775-53994a69daeb",
    description:
      "Discover how light, expression, and composition create meaningful portraits.",
  },
  {
    id: 3,
    category: "BEHIND THE LENS",
    title: "The Art Behind Every Perfect Photograph",
    image: "photo-1542038784456-1ea8e935640e",
    description:
      "A closer look at the creativity and passion behind professional photography.",
  },
];

/* ==========================================
   ANIMATIONS
========================================== */

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: "easeOut",
    },
  },
};

/* ==========================================
   API RESPONSE HELPER
========================================== */

function getResults(data) {
  if (Array.isArray(data)) return data;
  return Array.isArray(data?.results) ? data.results : [];
}

/* ==========================================
   ANIMATED COUNTER
========================================== */

function Counter({ target, label }) {
  const ref = useRef(null);

  const seen = useInView(ref, {
    once: true,
    amount: 0.4,
  });

  const [value, setValue] = useState(0);

  useEffect(() => {
    if (!seen) return;

    let start;
    let frame;

    const animate = (time) => {
      if (start === undefined) start = time;

      const progress = Math.min((time - start) / 1700, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setValue(Math.floor(target * eased));

      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    };

    frame = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(frame);
  }, [seen, target]);

  return (
    <div className="stat" ref={ref}>
      <strong>{value}+</strong>
      <span>{label}</span>
    </div>
  );
}

/* ==========================================
   PHOTOGRAPHY TICKER
========================================== */

function PhotographyTicker() {
  const categories = [
    { number: "01", name: "Weddings", detail: "Love, beautifully preserved" },
    { number: "02", name: "Portraits", detail: "The art of being you" },
    { number: "03", name: "Fashion", detail: "A statement in every frame" },
    { number: "04", name: "Celebrations", detail: "Moments worth remembering" },
    { number: "05", name: "Products", detail: "Beauty in the details" },
    { number: "06", name: "Editorial", detail: "Stories beyond the ordinary" },
  ];

  return (
    <section
      className="signature-ticker"
      aria-label="Our photography collection"
    >
      <div className="signature-ticker-intro">
        <div className="signature-intro-left">
          <span className="signature-eyebrow">
            <span className="signature-sparkle">✦</span>
            THE LENSCRAFT COLLECTION
          </span>

          <h2>
            An eye for <em>the extraordinary.</em>
          </h2>
        </div>

        <div className="signature-intro-right">
          <span className="signature-intro-line" />

          <p>
            CURATED WITH LOVE
            <br />
            CAPTURED WITH PURPOSE
          </p>
        </div>
      </div>

      <div className="signature-marquee">
        <div className="signature-track">
          {[0, 1].map((copy) => (
            <div
              className="signature-group"
              key={copy}
              aria-hidden={copy === 1}
            >
              {categories.map((category) => (
                <div
                  className="signature-item"
                  key={`${copy}-${category.number}`}
                >
                  <span className="signature-number">{category.number}</span>

                  <div className="signature-item-content">
                    <span className="signature-name">{category.name}</span>

                    <span className="signature-detail">{category.detail}</span>
                  </div>

                  <span className="signature-diamond" aria-hidden="true">
                    ✧
                  </span>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className="signature-ticker-footer">
        <span>CRAFTED IN LIGHT</span>

        <span className="signature-footer-center">
          <span>✦</span>A TIMELESS PERSPECTIVE<span>✦</span>
        </span>

        <span>MADE TO BE REMEMBERED</span>
      </div>
    </section>
  );
}

/* ==========================================
   PORTFOLIO CARD
========================================== */

function PortfolioCard({ item }) {
  const [active, setActive] = useState(false);

  return (
    <motion.article
      className={`portfolio-card ${item.size} ${active ? "is-active" : ""}`}
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.65 }}
    >
      <button
        type="button"
        className="portfolio-image-button"
        onClick={() => setActive((prev) => !prev)}
        aria-expanded={active}
        aria-label={`Show ${item.title} details`}
      >
        <img
          src={getImage(item.image, 1100)}
          alt={item.title}
          loading="lazy"
          onError={handleImageError}
        />

        <span className="portfolio-view-icon">
          <MoveUpRight size={22} />
        </span>

        <span className="portfolio-overlay">
          <span className="portfolio-content">
            <span className="portfolio-category">{item.category}</span>
            <strong>{item.title}</strong>

            <span className="portfolio-hint">
              Discover this story <ArrowUpRight size={17} />
            </span>
          </span>
        </span>
      </button>

      <div className="portfolio-card-footer">
        <div>
          <span>{item.category}</span>
          <h3>{item.title}</h3>
        </div>

        <Link
          to="/contact"
          className="portfolio-footer-link"
          aria-label={`Enquire about ${item.title}`}
        >
          <ArrowUpRight size={20} />
        </Link>
      </div>
    </motion.article>
  );
}

/* ==========================================
   HOME PAGE
========================================== */

export default function Home() {
  const [remoteServices, setRemoteServices] = useState([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [servicesError, setServicesError] = useState(false);

  /* ==========================================
     PAGE TITLE
  ========================================== */

  useEffect(() => {
    document.title = "Lenscraft Studio | Creative Photography";
  }, []);

  /* ==========================================
     FETCH SERVICES FROM DJANGO
  ========================================== */

  useEffect(() => {
    const controller = new AbortController();

    async function fetchServices() {
      try {
        setServicesLoading(true);
        setServicesError(false);

        const response = await api.get("/services/", {
          signal: controller.signal,
        });

        if (controller.signal.aborted) return;

        setRemoteServices(getResults(response.data));
      } catch (error) {
        if (error.code === "ERR_CANCELED" || controller.signal.aborted) {
          return;
        }

        console.error("Unable to load services:", error);
        setServicesError(true);
      } finally {
        if (!controller.signal.aborted) {
          setServicesLoading(false);
        }
      }
    }

    fetchServices();

    return () => controller.abort();
  }, []);

  /* ==========================================
     HOME: MAXIMUM 4 ACTIVE SERVICES
  ========================================== */

  const displayedServices = remoteServices
    .filter((service) => service.active !== false)
    .slice(0, 4)
    .map((service) => ({
      id: service.id,
      title: service.title,
      description: service.description,
      image: service.image || service.image_url,
    }));

  return (
    <main className="lenscraft-home">
      {/* HERO */}
      <Hero home />

      {/* PHOTOGRAPHY TICKER */}
      <PhotographyTicker />

      {/* ======================================
          ABOUT SECTION
      ====================================== */}

      <section className="section about-preview">
        <div className="container about-preview-inner">
          <motion.div
            className="about-top-heading"
            initial={{ opacity: 0, y: 35 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <div className="about-top-label">
              <span className="about-label-dot" />
              <span>THE LENSCRAFT PHILOSOPHY</span>
            </div>

            <div className="about-heading-row">
              <h2>
                Life is made of<em> moments.</em>
              </h2>

              <span className="about-heading-index">01 / 04</span>
            </div>
          </motion.div>

          <div className="about-preview-grid">
            <motion.div
              className="about-preview-visual"
              initial={{ opacity: 0, x: -35 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <span className="about-visual-outline" />

              <button
                type="button"
                className="about-main-image"
                aria-label="Show main photograph in front"
              >
                <img
                  src={`${import.meta.env.BASE_URL}images/photoimg.jpg`}
                  alt="Beautiful photography moments"
                  loading="lazy"
                  onError={handleImageError}
                />
              </button>

              <button
                type="button"
                className="about-small-image"
                aria-label="Show second photograph in front"
              >
                <img
                  src={`${import.meta.env.BASE_URL}images/camtool.webp`}
                  alt="Behind the lens at Lenscraft"
                  loading="lazy"
                  onError={handleImageError}
                />
              </button>

              <div className="about-orbit-seal" aria-hidden="true">
                <Aperture size={34} strokeWidth={1.2} />
                <span>MADE WITH PASSION</span>
              </div>

              <span className="about-visual-footnote">
                BEAUTY LIVES IN THE DETAILS
              </span>
            </motion.div>

            <motion.div
              className="about-preview-content"
              initial={{ opacity: 0, y: 35 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.1 }}
            >
              <div className="about-content-kicker">
                <span className="about-kicker-line" />A LITTLE ABOUT OUR WORLD
              </div>

              <h3>
                We see the
                <br />
                <em>extraordinary</em>
                <br />
                in everyday life.
              </h3>

              <p className="about-lead">
                The smallest gestures often become our most treasured memories.
              </p>

              <p className="about-description">
                At Lenscraft Studio, we create photographs that capture more
                than appearances. We preserve emotions, connections, and stories
                that deserve to live beyond a single moment.
              </p>

              <p className="about-description">
                From unforgettable celebrations to intimate portraits, every
                frame is thoughtfully created with passion and an artistic eye.
              </p>

              <div className="about-features">
                {[
                  "Authentic Storytelling",
                  "Creative Direction",
                  "Thoughtful Editing",
                  "Personal Experiences",
                ].map((feature) => (
                  <div className="about-feature" key={feature}>
                    <Check size={15} />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <Link to="/about" className="about-story-link">
                <span>EXPLORE OUR STORY</span>

                <span className="about-story-arrow">
                  <ArrowUpRight size={22} />
                </span>
              </Link>
            </motion.div>
          </div>

          <div className="about-bottom-signature">
            <span>ARTISTRY IN EVERY FRAME</span>
            <span className="about-signature-line" />
            <span>LENSCRAFT STUDIO</span>
          </div>
        </div>
      </section>

      {/* ======================================
          FEATURED SERVICES
      ====================================== */}

      <section className="section home-services">
        <div className="container">
          <motion.div
            className="section-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="eyebrow">WHAT WE LOVE TO DO</p>

            <h2>
              Our Creative <em>Expertise.</em>
            </h2>

            <p>
              From intimate portraits to unforgettable celebrations, every story
              deserves its own artistic perspective.
            </p>
          </motion.div>

          {servicesLoading ? (
            <p role="status" className="home-services-message">
              Loading our services...
            </p>
          ) : servicesError ? (
            <p role="alert" className="home-services-message">
              Services are temporarily unavailable.
            </p>
          ) : displayedServices.length === 0 ? (
            <p className="home-services-message">
              Our services will be available soon.
            </p>
          ) : (
            <div className="home-services-grid">
              {displayedServices.map((service, i) => (
                <motion.article
                  key={service.id ?? i}
                  className="home-service-item"
                  initial={{ opacity: 0, y: 45 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    duration: 0.65,
                    delay: Math.min(i * 0.1, 0.4),
                  }}
                >
                  <div className="home-service-card">
                    <div className="home-service-image">
                      <img
                        src={getImage(service.image, 900)}
                        alt={service.title || "Lenscraft photography service"}
                        loading="lazy"
                        onError={handleImageError}
                      />

                      <span className="home-service-number">
                        {String(i + 1).padStart(2, "0")}
                      </span>

                      <span className="home-service-image-brand">
                        LENSCRAFT / STUDIO
                      </span>

                      <div className="home-service-overlay">
                        <Link
                          to="/services"
                          className="home-service-view"
                          aria-label={`Explore ${service.title}`}
                        >
                          <ArrowUpRight size={25} />
                        </Link>
                      </div>
                    </div>

                    <div className="home-service-info">
                      <div className="home-service-topline">
                        <span className="home-service-label">
                          LENSCRAFT STUDIO
                        </span>

                        <Aperture size={18} />
                      </div>

                      <h3>{service.title}</h3>
                      <p>{service.description}</p>

                      <Link to="/services" className="home-service-link">
                        <span>Discover Service</span>

                        <span className="home-service-link-icon">
                          <ArrowUpRight size={19} />
                        </span>
                      </Link>
                    </div>
                  </div>
                </motion.article>
              ))}
            </div>
          )}

          <div className="section-bottom-link">
            <Link to="/services" className="editorial-button">
              Explore All Services <ArrowRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* ======================================
          PORTFOLIO
      ====================================== */}

      <section className="section portfolio-section" id="portfolio">
        <div className="container">
          <motion.div
            className="section-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="eyebrow">THE STORIES WE TELL</p>

            <h2>
              A Collection of<em> Beautiful Moments.</em>
            </h2>

            <p>
              Real emotions, artistic compositions, and memories captured
              through our lens.
            </p>
          </motion.div>

          <div className="portfolio-grid">
            {portfolio.map((item) => (
              <PortfolioCard key={item.id} item={item} />
            ))}
          </div>

          <div className="section-bottom-link">
            <Link to="/contact" className="editorial-button">
              Start Your Own Story <ArrowUpRight size={19} />
            </Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <Gallery />

      {/* ======================================
          STATISTICS
      ====================================== */}

      <section className="stats-section">
        <div className="container stats-grid">
          {[
            [500, "Happy Clients"],
            [1000, "Beautiful Photoshoots"],
            [8, "Years of Creativity"],
            [50, "Creative Projects"],
          ].map(([number, label]) => (
            <Counter key={label} target={number} label={label} />
          ))}
        </div>

        <p className="stats-note">
          Illustrative studio metrics — replace with verified figures.
        </p>
      </section>

      {/* ======================================
          WHY CHOOSE US
      ====================================== */}

      <section className="section why-choose-section">
        <div className="container why-choose-grid">
          <motion.div
            className="why-choose-content"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="eyebrow">THE LENSCRAFT EXPERIENCE</p>

            <h2>
              It's Not Just a Photo.<em> It's a Feeling.</em>
            </h2>

            <p>
              We believe the best photographs are created when people feel
              comfortable, confident, and free to be themselves.
            </p>

            <div className="why-features">
              {[
                {
                  icon: Camera,
                  title: "Creative Vision",
                  description:
                    "Thoughtful compositions and artistic storytelling in every frame.",
                },
                {
                  icon: Heart,
                  title: "Genuine Emotions",
                  description:
                    "We focus on natural expressions and meaningful moments.",
                },
                {
                  icon: Sparkles,
                  title: "Beautiful Finishing",
                  description:
                    "Carefully edited photographs with a timeless visual style.",
                },
              ].map((feature) => {
                const Icon = feature.icon;

                return (
                  <div className="why-feature" key={feature.title}>
                    <div className="why-icon">
                      <Icon size={24} />
                    </div>

                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            <Link to="/about" className="editorial-button">
              Get to Know Us <ArrowUpRight size={19} />
            </Link>
          </motion.div>

          <motion.div
            className="why-choose-image"
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <img
              src={`${import.meta.env.BASE_URL}images/photographer.jpg`}
              alt="Professional photographer"
              loading="lazy"
              onError={handleImageError}
            />

            <div className="why-image-label">
              <Aperture size={23} />
              <span>Made With Passion</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ======================================
          CREATIVE PROCESS
      ====================================== */}

      <section className="section process-section">
        <div className="container">
          <motion.div
            className="section-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="eyebrow">THE CREATIVE JOURNEY</p>

            <h2>
              From Your Vision<em> to Beautiful Memories.</em>
            </h2>

            <p>
              A thoughtful photography experience designed around your story.
            </p>
          </motion.div>

          <div className="process-grid">
            {processSteps.map((step, i) => (
              <motion.div
                className="process-card"
                key={step.number}
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <span className="process-number">{step.number}</span>
                <div className="process-line" />
                <h3>{step.title}</h3>
                <p>{step.description}</p>
                <ArrowUpRight className="process-arrow" size={23} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================================
          PHOTOGRAPHY JOURNAL
      ====================================== */}

      <section className="section journal-section">
        <div className="container">
          <motion.div
            className="section-heading"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <p className="eyebrow">THE PHOTOGRAPHY JOURNAL</p>

            <h2>
              Stories, Ideas &<em> Inspiration.</em>
            </h2>

            <p>
              A collection of creative thoughts, photography stories, and
              inspiration from behind the lens.
            </p>
          </motion.div>

          <div className="journal-grid">
            {journal.map((item, i) => (
              <motion.article
                key={item.id}
                className="journal-card"
                initial={{ opacity: 0, y: 35 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="journal-image">
                  <img
                    src={getImage(item.image, 850)}
                    alt={item.title}
                    loading="lazy"
                    onError={handleImageError}
                  />

                  <span className="journal-category">{item.category}</span>
                </div>

                <div className="journal-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <Link to="/contact" className="journal-link">
                    Plan Your Photoshoot <ArrowUpRight size={18} />
                  </Link>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}
