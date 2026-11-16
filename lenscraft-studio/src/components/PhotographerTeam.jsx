import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";

import {
  Camera,
  Instagram,
  ArrowUpRight,
  ArrowRight,
  CalendarDays,
  RefreshCw,
  Aperture,
} from "lucide-react";

import { getPhotographers } from "../api/photographerService";
import "../styles/PhotographerTeam.css";

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/";

function getImageUrl(person) {
  const image = person?.image || person?.profile_image || person?.image_url;

  if (!image || typeof image !== "string") return "";

  try {
    return new URL(image, new URL(API_BASE).origin).href;
  } catch {
    return "";
  }
}

function PhotographerCard({ person, index }) {
  const [imageFailed, setImageFailed] = useState(false);
  const image = getImageUrl(person);

  useEffect(() => {
    setImageFailed(false);
  }, [image]);

  const experience = Number(person.experience) || 0;

  return (
    <motion.article
      className="pt-card"
      initial={{ opacity: 0, y: 35 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.55,
        delay: Math.min(index % 4, 3) * 0.08,
      }}
    >
      <div className="pt-portrait">
        {image && !imageFailed ? (
          <img
            src={image}
            alt={person.name}
            loading="lazy"
            onError={() => setImageFailed(true)}
          />
        ) : (
          <div className="pt-placeholder">
            <Camera size={48} strokeWidth={1.2} />
          </div>
        )}

        <div className="pt-photo-shade" />

        <span className="pt-photo-index">
          {String(index + 1).padStart(2, "0")}
        </span>

        {/* Poseify-inspired split hover panels */}

        <div className="pt-split pt-split-left">
          <span className="pt-split-kicker">THE ARTIST</span>

          <div className="pt-split-content">
            <span className="pt-detail-label">EXPERIENCE</span>
            <strong>
              {experience} {experience === 1 ? "Year" : "Years"}
            </strong>

            <span className="pt-detail-label">SPECIALIZATION</span>
            <strong>{person.specialization || "Creative Photography"}</strong>
          </div>
        </div>

        <div className="pt-split pt-split-right">
          <span className="pt-split-kicker">THE STORY</span>

          <p className="pt-hover-bio">
            {person.biography ||
              "Capturing genuine emotions and turning everyday moments into timeless visual stories."}
          </p>

          <div className="pt-hover-actions">
            <Link
              to={`/photographers/${person.id}`}
              className="pt-hover-link"
              aria-label={`View ${person.name}'s profile`}
            >
              <ArrowUpRight size={19} />
            </Link>

            <Link
              to={`/book-photographer/${person.id}`}
              className="pt-hover-link"
              aria-label={`Book ${person.name}`}
            >
              <CalendarDays size={18} />
            </Link>
          </div>
        </div>

        {/* Always visible name strip */}

        <div className="pt-name-strip">
          <div>
            <h3>{person.name}</h3>
            <p>{person.role || "Professional Photographer"}</p>
          </div>

          <ArrowUpRight size={22} />
        </div>
      </div>

      {/* Under-photo information */}

      <div className="pt-card-footer">
        <div className="pt-footer-top">
          <span className="pt-footer-label">
            {person.specialization || "Photography & Storytelling"}
          </span>

          {person.instagram_link && (
            <a
              href={person.instagram_link}
              target="_blank"
              rel="noopener noreferrer"
              className="pt-social-link"
              aria-label={`${person.name} Instagram`}
            >
              <Instagram size={18} />
            </a>
          )}
        </div>

        <div className="pt-card-links">
          <Link to={`/photographers/${person.id}`}>
            View Profile
            <ArrowUpRight size={16} />
          </Link>

          <Link to={`/book-photographer/${person.id}`} className="pt-book-link">
            Book Now
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </motion.article>
  );
}

export default function PhotographerTeam() {
  const [photographers, setPhotographers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPhotographers = useCallback(async (signal) => {
    setLoading(true);
    setError("");

    try {
      const response = await getPhotographers();

      if (signal?.aborted) return;

      const data = response?.data ?? response;

      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.results)
          ? data.results
          : [];

      setPhotographers(
        list.filter(
          (person) => person && person.id != null && person.active !== false,
        ),
      );
    } catch (err) {
      if (signal?.aborted) return;

      console.error("Photographer API error:", err);
      setError("Unable to load our creative team.");
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    loadPhotographers(controller.signal);

    return () => controller.abort();
  }, [loadPhotographers]);

  return (
    <section className="pt-section" id="our-team" aria-labelledby="pt-title">
      <div className="pt-container">
        {/* Heading */}

        <motion.div
          className="pt-heading"
          initial={{ opacity: 0, y: 25 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.65 }}
        >
          <span className="pt-eyebrow">
            <Aperture size={17} />
            LENSCRAFT CREATIVE COLLECTIVE
          </span>

          <h2 id="pt-title">
            Faces Behind
            <br />
            <em>The Frames.</em>
          </h2>

          <p>
            Meet the artists who turn fleeting moments into timeless memories.
            Discover their individual perspectives, creative specialties, and
            stories.
          </p>

          <span className="pt-heading-rule" />
        </motion.div>

        {loading && (
          <div className="pt-message" role="status">
            <RefreshCw size={30} className="pt-spin" />
            <p>Loading our creative team...</p>
          </div>
        )}

        {!loading && error && (
          <div className="pt-message" role="alert">
            <Camera size={36} />
            <h3>Unable to load photographers</h3>
            <p>{error}</p>

            <button
              type="button"
              className="pt-retry"
              onClick={() => loadPhotographers()}
            >
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        )}

        {!loading && !error && photographers.length === 0 && (
          <div className="pt-message">
            <Camera size={40} />
            <h3>Our Team Is Coming Soon</h3>
            <p>New artist profiles will appear here.</p>
          </div>
        )}

        {!loading && !error && photographers.length > 0 && (
          <>
            <div className="pt-grid-heading">
              <span>
                SELECTED ARTISTS /{" "}
                {String(photographers.length).padStart(2, "0")}
              </span>
              <span>EXPLORE THE COLLECTIVE</span>
            </div>

            <div className="pt-grid">
              {photographers.map((person, index) => (
                <PhotographerCard
                  key={person.id}
                  person={person}
                  index={index}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
}
