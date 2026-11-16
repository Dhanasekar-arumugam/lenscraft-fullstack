import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "motion/react";

import {
  ArrowLeft,
  ArrowUpRight,
  ArrowRight,
  Instagram,
  Camera,
  Aperture,
  CalendarDays,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

import { getPhotographerById } from "../api/photographerService";
import "../styles/PhotographerDetails.css";
import ReviewSection from "../components/ReviewSection";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/";

function getImageUrl(person) {
  const image = person?.image || person?.profile_image || person?.image_url;

  if (!image || typeof image !== "string") return "";

  try {
    return new URL(image, new URL(API_BASE).origin).href;
  } catch {
    return "";
  }
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

export default function PhotographerDetails() {
  const { id } = useParams();

  const [photographer, setPhotographer] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    let mounted = true;

    async function loadPhotographer() {
      setLoading(true);
      setError("");
      setImageFailed(false);
      setPhotographer(null);

      try {
        const response = await getPhotographerById(id);
        const data = response?.data ?? response;

        if (mounted) {
          setPhotographer(data);
        }
      } catch (err) {
        console.error("Photographer API error:", err);

        if (mounted) {
          setError("Unable to load photographer details.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadPhotographer();

    return () => {
      mounted = false;
    };
  }, [id]);

  useEffect(() => {
    if (photographer?.name) {
      document.title = `${photographer.name} | Lenscraft Studio`;
    } else {
      document.title = "Photographer | Lenscraft Studio";
    }
  }, [photographer]);

  if (loading) {
    return (
      <main className="pd-state-page">
        <div className="pd-loader">
          <Aperture size={46} strokeWidth={1.2} />
        </div>

        <h2>Finding the artist...</h2>
        <p>Preparing the photographer's profile.</p>
      </main>
    );
  }

  if (error || !photographer || photographer.active === false) {
    return (
      <main className="pd-state-page">
        <div className="pd-state-icon">
          <Camera size={38} strokeWidth={1.3} />
        </div>

        <h2>Photographer Not Found</h2>

        <p>{error || "This photographer profile is currently unavailable."}</p>

        <Link to="/about" className="pd-primary-button">
          <ArrowLeft size={18} />
          Back to Our Team
        </Link>
      </main>
    );
  }

  const imageUrl = getImageUrl(photographer);
  const experience = Number(photographer.experience) || 0;

  return (
    <main className="pd-page">
      {/* TOP BREADCRUMB */}

      <section className="pd-topbar">
        <div className="pd-container pd-topbar-inner">
          <Link to="/about" className="pd-back-link">
            <ArrowLeft size={17} />
            Back to Our Team
          </Link>

          <div className="pd-breadcrumb">
            <Link to="/">Home</Link>
            <span>/</span>
            <Link to="/about">Our Team</Link>
            <span>/</span>
            <strong>{photographer.name}</strong>
          </div>
        </div>
      </section>

      {/* MAIN PROFILE */}

      <section className="pd-profile-section">
        <div className="pd-container">
          <div className="pd-profile-grid">
            {/* PROFILE IMAGE */}

            <motion.div
              className="pd-visual"
              initial={{ opacity: 0, x: -35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
            >
              <div className="pd-image-frame">
                {imageUrl && !imageFailed ? (
                  <img
                    src={imageUrl}
                    alt={photographer.name}
                    className="pd-profile-image"
                    onError={() => setImageFailed(true)}
                  />
                ) : (
                  <div className="pd-image-placeholder">
                    <Camera size={75} strokeWidth={1} />
                    <span>LENSCRAFT STUDIO</span>
                  </div>
                )}

                <div className="pd-image-overlay">
                  <span>
                    <Aperture size={17} />
                    LENSCRAFT ARTIST
                  </span>
                </div>
              </div>

              <div className="pd-image-caption">
                <span>THE PEOPLE BEHIND THE LENS</span>
                <span>LC / {String(photographer.id).padStart(2, "0")}</span>
              </div>

              <div className="pd-visual-decoration" />
            </motion.div>

            {/* PROFILE INFORMATION */}

            <motion.div
              className="pd-profile-content"
              initial={{ opacity: 0, x: 35 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.1 }}
            >
              <div className="pd-eyebrow">
                <span className="pd-eyebrow-line" />
                MEET THE CREATIVE MIND
              </div>

              <h1 className="pd-name">
                {photographer.name}
                <span className="pd-name-dot">.</span>
              </h1>

              <div className="pd-role-line">
                <span className="pd-role">
                  {photographer.role || "Professional Photographer"}
                </span>

                <span className="pd-role-divider" />

                <Aperture size={19} strokeWidth={1.3} />
              </div>

              <div className="pd-intro-divider" />

              <div className="pd-intro-text">
                <Sparkles size={22} strokeWidth={1.5} />

                <p>
                  Creating photographs that preserve genuine emotions, beautiful
                  details, and unforgettable stories.
                </p>
              </div>

              {/* INFORMATION GRID */}

              <div className="pd-info-grid">
                <div className="pd-info-item">
                  <span className="pd-info-icon">
                    <Camera size={20} />
                  </span>

                  <div>
                    <span className="pd-info-label">SPECIALIZATION</span>

                    <h3>
                      {photographer.specialization || "Creative Photography"}
                    </h3>
                  </div>
                </div>

                <div className="pd-info-item">
                  <span className="pd-info-icon">
                    <CalendarDays size={20} />
                  </span>

                  <div>
                    <span className="pd-info-label">EXPERIENCE</span>

                    <h3>
                      {experience} {experience === 1 ? "Year" : "Years"}
                    </h3>
                  </div>
                </div>
              </div>

              {/* BIOGRAPHY */}

              <div className="pd-biography">
                <span className="pd-section-kicker">
                  01 / THE ARTIST'S STORY
                </span>

                <h2>Behind the Lens</h2>

                <p>
                  {photographer.biography ||
                    "Passionate about capturing meaningful moments, telling authentic stories, and creating timeless photographs through a unique creative perspective."}
                </p>
              </div>

              {/* ACTIONS */}

              <div className="pd-actions">
                <Link
                  to={`/book-photographer/${photographer.id}`}
                  className="pd-primary-button"
                >
                  Book This Photographer
                  <ArrowUpRight size={20} />
                </Link>

                {photographer.instagram_link && (
                  <a
                    href={photographer.instagram_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="pd-instagram-button"
                  >
                    <Instagram size={20} />
                    Instagram
                  </a>
                )}
              </div>

              <div className="pd-profile-footer">
                <CheckCircle2 size={17} />
                <span>Explore availability through our booking page</span>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CUSTOMER REVIEWS - DISPLAY ONLY */}

      <section
        className="pd-reviews-section"
        aria-label="Photographer customer reviews"
      >
        <div className="pd-container">
          <ReviewSection
            targetType="photographer"
            targetId={photographer.id}
            showForm={false}
          />
        </div>
      </section>

      {/* QUOTE SECTION */}

      <section className="pd-quote-section">
        <div className="pd-container">
          <motion.div
            className="pd-quote-content"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
          >
            <span className="pd-section-kicker">THE ART OF PHOTOGRAPHY</span>

            <Aperture size={32} strokeWidth={1} />

            <h2>
              Great photography isn't just about what you see.
              <em> It's about what you feel.</em>
            </h2>

            <span className="pd-quote-line" />

            <p>LENSCRAFT STUDIO — CREATIVE STORYTELLING</p>
          </motion.div>
        </div>
      </section>

      {/* BOOKING CTA */}

 

      {/* BOTTOM NAVIGATION */}

     
    </main>
  );
}
