import { Link } from "react-router-dom";
import {
  ArrowUpRight,
  ArrowUp,
  Camera,
  Mail,
  MapPin,
  Clock3,
} from "lucide-react";

import {
  FaFacebookF,
  FaInstagram,
  FaTwitter,
  FaWhatsapp,
} from "react-icons/fa";

import "../styles/Footer.css";

export default function Footer() {
  const expertise = [
    "Wedding Photography",
    "Portrait Photography",
    "Event Photography",
    "Fashion Photography",
  ];

  return (
    <footer className="pose-footer">
      {/* =====================================
          BOOKING CALL TO ACTION
      ===================================== */}

      <div className="pose-footer-cta">
        <div>
          <span>HAVE A STORY TO TELL?</span>

          <h2>
            Let's create something
            <em> beautiful.</em>
          </h2>
        </div>

        <Link to="/contact">
          Start Your Story
          <ArrowUpRight size={23} />
        </Link>
      </div>

      {/* =====================================
          MAIN FOOTER
      ===================================== */}

      <div className="pose-footer-main">
        {/* Brand */}
        <div className="pose-footer-about">
          <Link to="/" className="pose-footer-brand">
            <Camera size={29} />
            LENSCRAFT
            <small>STUDIO</small>
          </Link>

          <p>
            Capturing real emotions, unforgettable moments and beautiful stories
            through the art of photography.
          </p>

          <div className="pose-socials">
            <a
              href="https://www.instagram.com/"
              className="pose-social-instagram"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
            >
              <FaInstagram />
            </a>

            <a
              href="https://www.facebook.com/"
              className="pose-social-facebook"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Facebook"
            >
              <FaFacebookF />
            </a>

            <a
              href="https://wa.me/YOUR_NUMBER"
              className="pose-social-whatsapp"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="WhatsApp"
            >
              <FaWhatsapp />
            </a>
            <a
              href="https://twitter.com/"
              className="pose-social-twitter"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Twitter"
            >
              <FaTwitter />
            </a>
          </div>
        </div>

        {/* Explore */}
        <div className="pose-footer-col">
          <h3>Explore</h3>

          <Link to="/">Home</Link>
          <Link to="/about">Our Story</Link>
          <Link to="/services">Services</Link>
          <Link to="/contact">Contact</Link>
          <Link to="/login">Login</Link>
        </div>

        {/* Services */}
        <div className="pose-footer-col">
          <h3>Our Expertise</h3>

          {expertise.map((service) => (
            <Link key={service} to="/contact" state={{ service }}>
              {service}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="pose-footer-col pose-footer-contact">
          <h3>Get in Touch</h3>

          <p>
            <MapPin size={17} />
            Chennai, Tamil Nadu, India
          </p>

          <p>
            <Mail size={17} />
            hello@lenscraft.example
          </p>

          <p>
            <Clock3 size={17} />
            Mon – Sat, 10 AM – 7 PM
          </p>

          <small>Demo contact details — update before launch.</small>
        </div>
      </div>

      {/* =====================================
          LARGE BRAND WATERMARK
      ===================================== */}

      <div className="pose-footer-wordmark" aria-hidden="true">
        LENSCRAFT
      </div>

      {/* =====================================
          COPYRIGHT
      ===================================== */}

      <div className="pose-footer-bottom">
        <span>
          © {new Date().getFullYear()} Lenscraft Studio. All rights reserved.
        </span>

        <span>CRAFTED WITH PASSION · CAPTURED WITH LOVE</span>

        <button
          type="button"
          onClick={() =>
            window.scrollTo({
              top: 0,
              behavior: "smooth",
            })
          }
        >
          Back to Top
          <ArrowUp size={16} />
        </button>
      </div>
    </footer>
  );
}
