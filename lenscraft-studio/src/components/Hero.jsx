// src/components/Hero.jsx

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  ArrowDown,
  Pause,
  Play,
} from "lucide-react";

import { photo } from "../assets/data";
import "../styles/Hero.css";

const slides = [
  {
    kicker: "01 / WEDDING STORIES",
    title: "Love, in every",
    accent: "little moment.",
    description:
      "The fleeting glances. The unforgettable celebrations. Photographs that let you feel it all again.",
    image: "images/wedding.png",
    label: "Weddings",
  },
  {
    kicker: "02 / FASHION EDITORIAL",
    title: "Make a bold",
    accent: "impression.",
    description:
      "Expressive imagery with a fresh perspective. Your individuality, beautifully in focus.",
    image: "images/fasion1.jpg",
    label: "Fashion",
  },
  {
    kicker: "03 / PORTRAIT STORIES",
    title: "The beauty of",
    accent: "being you.",
    description:
      "Authentic portraits filled with personality, warmth, and the magic of natural moments.",
    image: "images/preity.jpg",
    label: "Portraits",
  },
];

export default function Hero({ home = true, title, subtitle }) {
  const [active, setActive] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [hovered, setHovered] = useState(false);

  const go = (index) => {
    setActive((index + slides.length) % slides.length);
  };

  useEffect(() => {
    if (!playing || hovered || !home) return;

    const timer = setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6500);

    return () => clearInterval(timer);
  }, [active, playing, hovered, home]);

  if (!home) {
    return (
      <section className="pose-page-hero">
        <span>THE LENSCRAFT EXPERIENCE</span>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>
    );
  }

  const slide = slides[active];

  return (
    <section
      className="pose-hero"
      aria-label="Photography showcase"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Background slider */}
      <AnimatePresence initial={false}>
        <motion.div
          key={active}
          className="pose-hero-image"
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            opacity: { duration: 1 },
            scale: { duration: 7 },
          }}
          style={{
            backgroundImage: `url("${slide.image}")`,
          }}
        />
      </AnimatePresence>

      <div className="pose-hero-shade" />

      {/* Main content */}
      <div className="pose-hero-inner">
        <motion.div
          key={active}
          className="pose-hero-copy"
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65 }}
        >
          <span className="pose-kicker">
            <i />
            {slide.kicker}
          </span>

          <h1>
            {slide.title}
            <br />
            <em>{slide.accent}</em>
          </h1>

          <p>{slide.description}</p>

          <div className="pose-hero-actions">
            <Link to="/services" className="pose-btn-primary">
              Explore Our Work
              <ArrowUpRight size={19} />
            </Link>

            <Link to="/contact" className="pose-btn-outline">
              Book a Session
              <ArrowUpRight size={18} />
            </Link>
          </div>
        </motion.div>
      </div>

      {/* Bottom navigation */}
      <div className="pose-hero-bottom">
        <a href="#portfolio" className="pose-scroll">
          SCROLL TO DISCOVER
          <ArrowDown size={16} />
        </a>

        <div className="pose-hero-tabs">
          {slides.map((item, index) => (
            <button
              key={item.label}
              type="button"
              onClick={() => go(index)}
              className={active === index ? "selected" : ""}
              aria-label={`Show ${item.label}`}
            >
              <small>0{index + 1}</small>
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="pose-hero-arrows">
          <button
            type="button"
            aria-label={playing ? "Pause carousel" : "Play carousel"}
            onClick={() => setPlaying((previous) => !previous)}
          >
            {playing ? <Pause size={17} /> : <Play size={17} />}
          </button>

          <button
            type="button"
            aria-label="Previous slide"
            onClick={() => go(active - 1)}
          >
            <ChevronLeft />
          </button>

          <button
            type="button"
            aria-label="Next slide"
            onClick={() => go(active + 1)}
          >
            <ChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
}
