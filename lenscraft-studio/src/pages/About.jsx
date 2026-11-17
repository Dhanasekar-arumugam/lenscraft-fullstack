import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import {
  ArrowUpRight,
  ArrowRight,
  Aperture,
  Camera,
  Heart,
  Sparkles,
  MoveDownRight,
  Focus,
  ScanEye,
  Layers3,
  Check,
  Instagram,
} from "lucide-react";

import PhotographerTeam from "../components/PhotographerTeam";
import { photo } from "../assets/data";
import { getStudioInfo } from "../api/serviceService";
import "../styles/About.css";

const defaultStudio = {
  name: "Lenscraft Studio",
  story:
    "Lenscraft Studio began with a simple idea: the most meaningful images are the ones that make you feel something. Our approach combines artistic vision, careful attention to detail, and a relaxed, personal experience.",
  mission:
    "To create honest, artful photographs that celebrate individuality and preserve meaningful moments.",
  vision:
    "To make photography a beautiful and effortless experience, delivering images that grow more precious with time.",
};

const images = {
  hero: photo("photo-1542038784456-1ea8e935640e", 1800),
  story1: photo("photo-1452587925148-ce544e77e70d", 1000),
  story2: photo("photo-1502982720700-bfff97f2ecac", 800),
  experience: photo("photo-1516035069371-29a1b244cc32", 1200),
  wedding: photo("photo-1519741497674-611481863552", 900),
  portrait: photo("photo-1534528741775-53994a69daeb", 900),
  events: photo("photo-1492684223066-81342ee5ff30", 900),
};

const specialties = [
  {
    number: "01",
    title: "Wedding",
    subtitle: "Where love becomes timeless.",
    image: `${import.meta.env.BASE_URL}images/wedding.jpg`,
  },
  {
    number: "02",
    title: "Portrait",
    subtitle: "Every face tells a story.",
    image: `${import.meta.env.BASE_URL}images/pooja2.jpg`,
  },
  {
    number: "03",
    title: "Events",
    subtitle: "Moments worth remembering.",
    image: `${import.meta.env.BASE_URL}images/halloween.webp`,
  },
];

const principles = [
  {
    icon: Focus,
    number: "01",
    title: "Authentic Stories",
    description:
      "We focus on genuine emotions, natural expressions, and meaningful moments.",
  },
  {
    icon: ScanEye,
    number: "02",
    title: "Creative Perspective",
    description:
      "Every photograph is shaped by beautiful light, composition, and imagination.",
  },
  {
    icon: Layers3,
    number: "03",
    title: "Thoughtful Details",
    description:
      "We care about every part of the experience, from planning to final delivery.",
  },
];

const process = [
  {
    number: "01",
    title: "The Conversation",
    text: "We discover your story, your ideas, and what makes your vision special.",
  },
  {
    number: "02",
    title: "The Creative Direction",
    text: "We plan the mood, lighting, locations, and visual storytelling.",
  },
  {
    number: "03",
    title: "The Experience",
    text: "Relax, enjoy the moment, and let us capture the magic naturally.",
  },
  {
    number: "04",
    title: "The Memories",
    text: "Beautifully edited photographs that you'll treasure for years.",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 35 },
  visible: { opacity: 1, y: 0 },
};

function Reveal({ children, className = "", delay = 0 }) {
  return (
    <motion.div
      className={className}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.15 }}
      variants={fadeUp}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
}

export default function About() {
  const [studio, setStudio] = useState(defaultStudio);

  useEffect(() => {
    document.title = "About Us | Lenscraft Studio";
    let mounted = true;

    const loadStudio = async () => {
      try {
        const response = await getStudioInfo();
        const data = response?.data ?? response;

        if (
          mounted &&
          data &&
          typeof data === "object" &&
          !Array.isArray(data)
        ) {
          setStudio({ ...defaultStudio, ...data });
        }
      } catch (error) {
        console.error("Unable to load studio:", error);
      }
    };

    loadStudio();

    return () => {
      mounted = false;
    };
  }, []);

  return (
    <main className="about-page">
      {/* ============== HERO ============== */}

      {/* ============== FULLSCREEN ABOUT HERO ============== */}

      <section className="about-hero about-family-hero">
        <div className="about-family-overlay" />

        <motion.div
          className="about-family-content"
          initial={{ opacity: 0, y: 35 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, ease: "easeOut" }}
        >
          <div className="about-family-eyebrow">
            <Aperture size={19} />
            <span>WELCOME TO LENSCRAFT STUDIO</span>
          </div>

          <h1>
            Every Moment
            <br />
            <em>Has a Story.</em>
          </h1>

          <p>
            Capturing genuine emotions, beautiful connections, and unforgettable
            memories that last a lifetime.
          </p>

          <div className="about-family-actions">
            <Link to="/about#about-intro">
              DISCOVER OUR STORY <ArrowUpRight size={19} />
            </Link>

            <Link to="/contact" className="about-family-secondary">
              GET IN TOUCH
              <ArrowRight size={19} />
            </Link>
          </div>
        </motion.div>

        <a href="#about-intro" className="about-family-scroll">
          SCROLL TO EXPLORE
          <MoveDownRight size={19} />
        </a>
      </section>

      {/* ============== INTRO ============== */}
      <section id="about-intro" className="about-intro-section">
        <div className="about-container">
          <Reveal className="about-intro-header">
            <span className="about-kicker">01 / WHO WE ARE</span>

            <h2>
              We Believe In
              <br />
              <span>The Beauty Of</span>
              <br />
              <em>Real Moments.</em>
            </h2>
          </Reveal>

          <div className="about-intro-bottom">
            <Reveal>
              <div className="about-intro-symbol">
                <Aperture size={65} strokeWidth={1} />
              </div>
            </Reveal>

            <Reveal className="about-intro-description" delay={0.15}>
              <p className="about-intro-lead">
                We're not just photographers. We're observers, artists, and
                storytellers.
              </p>

              <p>{studio.story || defaultStudio.story}</p>

              <Link to="/services" className="about-arrow-link">
                EXPLORE OUR WORK <ArrowUpRight size={19} />
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== IMAGE STORY ============== */}

      <section className="about-visual-story about-story-v2">
        <div className="about-story-v2-bgtext" aria-hidden="true">
          THE ART OF SEEING
        </div>

        <div className="about-container">
          <Reveal className="about-story-v2-header">
            <div className="about-story-v2-eyebrow">
              <span className="about-story-v2-line" />
              <Sparkles size={17} strokeWidth={1.5} />
              <span>BEYOND THE ORDINARY</span>
            </div>

            <div className="about-story-v2-header-row">
              <h2>
                Stories that
                <br />
                <em>stay with you.</em>
              </h2>

              <p>
                Every photograph is a doorway to a feeling, a memory, a moment
                that deserves to live forever.
              </p>
            </div>
          </Reveal>

          <div className="about-story-v2-grid">
            {/* LARGE FEATURE IMAGE */}
            <Reveal className="about-story-v2-feature">
              <div className="about-story-v2-image-main">
                <img
                  src={images.story1}
                  alt="Creative photography in action"
                  loading="lazy"
                />

                <div className="about-story-v2-image-shade" />

                <div className="about-story-v2-image-top">
                  <span>01 / THE ART OF OBSERVATION</span>
                  <Aperture size={25} strokeWidth={1.2} />
                </div>

                <div className="about-story-v2-image-caption">
                  <span>THROUGH OUR LENS</span>
                  <strong>
                    The beauty is
                    <br />
                    in the details.
                  </strong>
                </div>

                <div className="about-story-v2-image-corner">
                  <ArrowUpRight size={22} />
                </div>
              </div>

              <div className="about-story-v2-image-foot">
                <span>AUTHENTIC / INTIMATE / TIMELESS</span>
                <span>FRAME NO. 001</span>
              </div>
            </Reveal>

            {/* RIGHT EDITORIAL CONTENT */}
            <Reveal className="about-story-v2-side" delay={0.15}>
              <div className="about-story-v2-secondary">
                <div className="about-story-v2-secondary-image">
                  <img
                    src={images.story2}
                    alt="Professional photography camera"
                    loading="lazy"
                  />
                </div>

                <div className="about-story-v2-floating-tag">
                  <Aperture size={21} strokeWidth={1.4} />
                  <span>MADE WITH FEELING</span>
                </div>
              </div>

              <div className="about-story-v2-copy">
                <div className="about-story-v2-copy-index">
                  <span>02 — OUR PERSPECTIVE</span>
                  <span className="about-story-v2-copy-rule" />
                </div>

                <h3>
                  Every frame
                  <br />
                  <em>has a feeling.</em>
                </h3>

                <p>
                  The quiet smiles, unexpected laughter, and beautiful
                  connections. We capture the moments that words could never
                  fully describe.
                </p>

                <a href="#about-values" className="about-story-v2-link">
                  EXPLORE OUR PHILOSOPHY
                  <span>
                    <ArrowUpRight size={19} />
                  </span>
                </a>
              </div>
            </Reveal>
          </div>

          <div className="about-story-v2-bottom">
            <span>NOT JUST IMAGES. EXPERIENCES.</span>
            <span>THE LENSCRAFT JOURNAL — 002</span>
          </div>
        </div>
      </section>

      {/* ============== MISSION VISION ============== */}
      <section className="about-purpose">
        <div className="about-container">
          <Reveal className="about-purpose-heading">
            <span className="about-kicker light">02 / OUR PURPOSE</span>
            <h2>
              Guided By Passion.
              <br />
              <em>Driven By Creativity.</em>
            </h2>
          </Reveal>

          <div className="about-purpose-grid">
            <Reveal className="about-purpose-item">
              <div className="about-purpose-top">
                <Camera size={35} strokeWidth={1.3} />
                <span>01</span>
              </div>

              <h3>Our Mission.</h3>
              <p>{studio.mission || defaultStudio.mission}</p>

              <div className="about-purpose-bottom">
                CREATE WITH PURPOSE <ArrowUpRight size={19} />
              </div>
            </Reveal>

            <Reveal className="about-purpose-item" delay={0.15}>
              <div className="about-purpose-top">
                <Heart size={35} strokeWidth={1.3} />
                <span>02</span>
              </div>

              <h3>Our Vision.</h3>
              <p>{studio.vision || defaultStudio.vision}</p>

              <div className="about-purpose-bottom">
                INSPIRE THROUGH ART <ArrowUpRight size={19} />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ============== SPECIALTIES ============== */}
      <section className="about-specialties">
        <div className="about-container">
          <Reveal className="about-section-title">
            <div>
              <span className="about-kicker">03 / WHAT WE CREATE</span>
              <h2>
                Stories We <em>Love To Tell.</em>
              </h2>
            </div>

            <Link to="/services" className="about-arrow-link">
              VIEW ALL SERVICES <ArrowUpRight size={19} />
            </Link>
          </Reveal>

          <div className="about-specialties-grid">
            {specialties.map((item, index) => (
              <Reveal
                className="about-specialty"
                key={item.number}
                delay={index * 0.1}
              >
                <Link to="/services" className="about-specialty-image">
                  <img src={item.image} alt={item.title} loading="lazy" />
                  <span className="about-specialty-arrow">
                    <ArrowUpRight size={23} />
                  </span>
                </Link>

                <div className="about-specialty-info">
                  <span>{item.number}</span>
                  <div>
                    <h3>{item.title}</h3>
                    <p>{item.subtitle}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== EXPERIENCE ============== */}
      <section className="about-experience">
        <div className="about-experience-image">
          <img
            src="/images/feel2.jpg"
            alt="Lenscraft photography experience"
            loading="lazy"
          />
        </div>

        <div className="about-container about-experience-inner">
          <Reveal className="about-experience-content">
            <span className="about-kicker light">04 / THE EXPERIENCE</span>

            <h2>
              Feel The Moment.
              <br />
              <em>We'll Capture It.</em>
            </h2>

            <p>
              We believe photography should feel natural, personal, and
              enjoyable. From the first conversation to the final photograph,
              we're here to make it special.
            </p>

            <Link to="/contact" className="about-white-button">
              LET'S TALK <ArrowUpRight size={19} />
            </Link>
          </Reveal>
        </div>
      </section>

      {/* ============== PROCESS ============== */}
      <section className="about-process">
        <div className="about-container">
          <Reveal className="about-section-title">
            <div>
              <span className="about-kicker">05 / HOW WE WORK</span>
              <h2>
                Simple Process.
                <br />
                <em>Beautiful Results.</em>
              </h2>
            </div>
          </Reveal>

          <div className="about-process-list">
            {process.map((step, index) => (
              <Reveal
                className="about-process-row"
                key={step.number}
                delay={index * 0.06}
              >
                <span className="about-process-number">{step.number}</span>
                <h3>{step.title}</h3>
                <p>{step.text}</p>
                <ArrowUpRight size={23} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ============== TEAM ============== */}
      <section className="about-team-section">
        <PhotographerTeam />
      </section>

      {/* ============== PRINCIPLES ============== */}
      <section className="about-principles">
        <div className="about-container">
          <Reveal className="about-section-title">
            <div>
              <span className="about-kicker">07 / OUR PHILOSOPHY</span>
              <h2>
                What Makes Us <em>Different.</em>
              </h2>
            </div>
          </Reveal>

          <div className="about-principles-grid">
            {principles.map((item, index) => {
              const Icon = item.icon;

              return (
                <Reveal
                  className="about-principle"
                  key={item.number}
                  delay={index * 0.1}
                >
                  <div className="about-principle-top">
                    <Icon size={34} strokeWidth={1.4} />
                    <span>{item.number}</span>
                  </div>

                  <h3>{item.title}</h3>
                  <p>{item.description}</p>

                  <div className="about-principle-line" />
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* ============== CTA ============== */}
    </main>
  );
}
