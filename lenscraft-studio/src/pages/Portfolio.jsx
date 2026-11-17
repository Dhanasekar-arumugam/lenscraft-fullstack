import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Aperture,
  Camera,
  ImageOff,
  Maximize2,
  RefreshCw,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { getPortfolioPhotos } from "../api/portfolioService";
import "../styles/Portfolio.css";
import { motion } from "motion/react";
const CATEGORIES = [
  { value: "all", label: "All Stories" },
  { value: "wedding", label: "Weddings" },
  { value: "portrait", label: "Portraits" },
  { value: "fashion", label: "Fashion" },
  { value: "event", label: "Events" },
  { value: "product", label: "Products" },
  { value: "other", label: "Others" },
];

const normalizeResults = (data) =>
  Array.isArray(data) ? data : data?.results || [];

export default function Portfolio() {
  const [photos, setPhotos] = useState([]);
  const [category, setCategory] = useState("all");
  const [selectedIndex, setSelectedIndex] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadPhotos = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const data = await getPortfolioPhotos();
      setPhotos(normalizeResults(data));
    } catch (err) {
      console.error("Portfolio loading failed:", err);
      setError("Unable to load portfolio photos.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    document.title = "Portfolio | Lenscraft Studio";
    loadPhotos();
  }, [loadPhotos]);

  const filteredPhotos = photos.filter(
    (photo) =>
      photo.is_active !== false &&
      (category === "all" || photo.category === category),
  );

  const selectedPhoto =
    selectedIndex !== null ? filteredPhotos[selectedIndex] : null;

  const closeLightbox = useCallback(() => {
    setSelectedIndex(null);
  }, []);

  const moveLightbox = useCallback(
    (direction) => {
      setSelectedIndex((current) => {
        if (current === null || filteredPhotos.length === 0) {
          return null;
        }

        return (
          (current + direction + filteredPhotos.length) % filteredPhotos.length
        );
      });
    },
    [filteredPhotos.length],
  );

  useEffect(() => {
    if (selectedIndex === null) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") closeLightbox();
      if (event.key === "ArrowRight") moveLightbox(1);
      if (event.key === "ArrowLeft") moveLightbox(-1);
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedIndex, closeLightbox, moveLightbox]);

  const selectCategory = (value) => {
    setCategory(value);
    setSelectedIndex(null);
  };

  return (
    <main className="portfolio-page">
      {/* HERO */}

      <section className="portfolio-hero">
        <div className="portfolio-hero-glow" />

        <motion.div
          className="portfolio-hero-content"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <span className="portfolio-kicker">
            <Aperture size={17} />
            THE LENSCRAFT COLLECTION
          </span>

          <h1>
            Stories Through
            <br />
            <em>Our Lens.</em>
          </h1>

          <p>
            Every frame holds a feeling. Explore the moments, people and
            beautiful stories captured through our lens.
          </p>

          <Link to="/portfolio#portfolio-gallery">
            Explore Our Work <ArrowUpRight size={18} />
          </Link>
        </motion.div>

        <div className="portfolio-hero-bottom">
          <span>CAPTURED WITH PASSION</span>

          <a href="#portfolio-gallery">SCROLL TO EXPLORE</a>
        </div>
      </section>

      {/* GALLERY */}

      <section className="portfolio-gallery-section" id="portfolio-gallery">
        <div className="portfolio-container">
          <div className="portfolio-section-heading">
            <div>
              <span className="portfolio-section-kicker">
                <Camera size={16} />
                OUR CREATIVE WORK
              </span>

              <h2>
                The Art of <em>Seeing.</em>
              </h2>

              <p>A curated collection of moments worth remembering.</p>
            </div>

            <span className="portfolio-photo-count">
              {filteredPhotos.length} PHOTOGRAPHS
            </span>
          </div>

          {/* FILTERS */}

          <div className="portfolio-filters">
            {CATEGORIES.map((item) => (
              <button
                key={item.value}
                type="button"
                className={`portfolio-filter ${
                  category === item.value ? "active" : ""
                }`}
                onClick={() => selectCategory(item.value)}
                aria-pressed={category === item.value}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* LOADING */}

          {loading && (
            <div className="portfolio-status">
              <RefreshCw className="portfolio-spinning" size={28} />
              <p>Loading beautiful moments...</p>
            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="portfolio-status">
              <ImageOff size={35} />
              <p>{error}</p>
              <button type="button" onClick={loadPhotos}>
                Try Again
              </button>
            </div>
          )}

          {/* EMPTY */}

          {!loading && !error && filteredPhotos.length === 0 && (
            <div className="portfolio-status">
              <Camera size={42} />
              <h3>No photographs yet</h3>
              <p>New stories are coming soon. Check back later.</p>
            </div>
          )}

          {/* PHOTO GRID */}

          {!loading && !error && filteredPhotos.length > 0 && (
            <div className="portfolio-masonry">
              {filteredPhotos.map((photo, index) => (
                <button
                  type="button"
                  key={photo.id}
                  className="portfolio-photo"
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`View ${photo.title}`}
                >
                  <img
                    src={photo.image_url}
                    alt={photo.title}
                    loading="lazy"
                    decoding="async"
                  />

                  {photo.featured && (
                    <span className="portfolio-featured">FEATURED</span>
                  )}

                  <div className="portfolio-photo-overlay">
                    <div>
                      <span>
                        {CATEGORIES.find(
                          (item) => item.value === photo.category,
                        )?.label || photo.category}
                      </span>
                      <h3>{photo.title}</h3>
                    </div>

                    <span className="portfolio-expand">
                      <Maximize2 size={19} />
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* BOTTOM */}

      <section className="portfolio-closing">
        <Aperture size={28} strokeWidth={1.3} />

        <h2>
          Every Moment <em>Matters.</em>
        </h2>

        <p>Let's create something unforgettable together.</p>

        <a href="/contact" className="portfolio-contact-link">
          Let's Connect
          <ArrowRight size={18} />
        </a>
      </section>

      {/* FULLSCREEN LIGHTBOX */}

      {selectedPhoto && (
        <div
          className="portfolio-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label="Photography viewer"
          onClick={closeLightbox}
        >
          <button
            type="button"
            className="portfolio-lightbox-close"
            onClick={closeLightbox}
            aria-label="Close viewer"
          >
            <X size={25} />
          </button>

          <button
            type="button"
            className="portfolio-lightbox-prev"
            onClick={(event) => {
              event.stopPropagation();
              moveLightbox(-1);
            }}
            aria-label="Previous photo"
          >
            <ArrowLeft size={25} />
          </button>

          <div
            className="portfolio-lightbox-content"
            onClick={(event) => event.stopPropagation()}
          >
            <img src={selectedPhoto.image_url} alt={selectedPhoto.title} />

            <div className="portfolio-lightbox-caption">
              <div>
                <h3>{selectedPhoto.title}</h3>
                {selectedPhoto.description && (
                  <p>{selectedPhoto.description}</p>
                )}
              </div>

              <span>
                {selectedIndex + 1} / {filteredPhotos.length}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="portfolio-lightbox-next"
            onClick={(event) => {
              event.stopPropagation();
              moveLightbox(1);
            }}
            aria-label="Next photo"
          >
            <ArrowRight size={25} />
          </button>
        </div>
      )}
    </main>
  );
}
