import { useState, useEffect, useCallback, useRef, useMemo } from "react";

import { motion, AnimatePresence } from "motion/react";

import {
  X,
  ChevronLeft,
  ChevronRight,
  ArrowUpRight,
  Camera,
  Aperture,
  Images,
  Sparkles,
  MoveUpRight,
} from "lucide-react";

import api from "../api/axios";
import "../styles/Gallery.css";

/* =========================================
   NEW PHOTOGRAPHY COLLECTION
   Used when Django has no portfolio images
========================================= */

const demoGallery = [
  {
    id: "demo-1",
    category: "Weddings",
    title: "A Love Beyond Words",
    description: "Beautiful moments of love and celebration.",
    image:
      "https://images.unsplash.com/photo-1519741497674-611481863552?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-2",
    category: "Portraits",
    title: "The Art of Expression",
    description: "Authentic emotions captured in every portrait.",
    image:
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-3",
    category: "Nature",
    title: "Into the Wilderness",
    description: "Discovering beauty in the natural world.",
    image:
      "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-4",
    category: "Fashion",
    title: "Editorial Elegance",
    description: "Where fashion meets visual storytelling.",
    image:
      "https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-5",
    category: "Events",
    title: "Moments of Celebration",
    description: "The energy and joy of unforgettable events.",
    image:
      "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-6",
    category: "Weddings",
    title: "Forever Begins Here",
    description: "A timeless story of two hearts.",
    image:
      "https://images.unsplash.com/photo-1537633552985-df8429e8048b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-7",
    category: "Portraits",
    title: "Natural Beauty",
    description: "The simplicity of a beautiful portrait.",
    image:
      "https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-8",
    category: "Nature",
    title: "Mountain Dreams",
    description: "A breathtaking journey through nature.",
    image:
      "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-9",
    category: "Fashion",
    title: "Modern Muse",
    description: "A creative exploration of contemporary style.",
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-10",
    category: "Events",
    title: "Golden Celebrations",
    description: "Capturing the atmosphere of special occasions.",
    image:
      "https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-11",
    category: "Weddings",
    title: "Our Beautiful Beginning",
    description: "Romantic moments that last a lifetime.",
    image:
      "https://images.unsplash.com/photo-1511285560929-80b456fea0bc?auto=format&fit=crop&w=1400&q=85",
  },
  {
    id: "demo-12",
    category: "Nature",
    title: "The Quiet Horizon",
    description: "Finding peace in the beauty of landscapes.",
    image:
      "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&w=1400&q=85",
  },
];

const categories = [
  "All",
  "Weddings",
  "Portraits",
  "Nature",
  "Events",
  "Fashion",
];

/* =========================================
   IMAGE URL HELPER
========================================= */

const getImageUrl = (image) => {
  if (!image) return "";

  const value = String(image);

  if (
    value.startsWith("http://") ||
    value.startsWith("https://") ||
    value.startsWith("data:") ||
    value.startsWith("blob:")
  ) {
    return value;
  }

  if (value.startsWith("/media/")) {
    const base = api.defaults.baseURL || "";
    const origin = new URL(base, window.location.origin).origin;

    return `${origin}${value}`;
  }

  if (value.startsWith("/")) {
    return value;
  }

  if (value.startsWith("media/")) {
    const base = api.defaults.baseURL || "";
    const origin = new URL(base, window.location.origin).origin;

    return `${origin}/${value}`;
  }

  return `/images/${value}`;
};

/* =========================================
   FALLBACK IMAGE
========================================= */

const handleImageError = (event) => {
  const image = event.currentTarget;

  if (image.dataset.fallbackApplied) return;

  image.dataset.fallbackApplied = "true";

  image.src =
    "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?auto=format&fit=crop&w=1200&q=80";
};

/* =========================================
   GALLERY COMPONENT
========================================= */

export default function Gallery() {
  const [remoteGallery, setRemoteGallery] = useState([]);
  const [filter, setFilter] = useState("All");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);

  /* FETCH DJANGO PORTFOLIO */

  useEffect(() => {
    let mounted = true;

    const fetchPortfolio = async () => {
      try {
        const response = await api.get("/portfolio/");

        if (!mounted) return;

        const data = response.data;

        const results = Array.isArray(data)
          ? data
          : Array.isArray(data?.results)
            ? data.results
            : [];

        setRemoteGallery(results);
      } catch (error) {
        console.warn("Portfolio API unavailable. Showing demo gallery.", error);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchPortfolio();

    return () => {
      mounted = false;
    };
  }, []);

  /* NORMALIZE API DATA */

  const galleryItems = useMemo(() => {
    if (!remoteGallery.length) {
      return demoGallery;
    }

    return remoteGallery.map((item, index) => ({
      id: item.id ?? `remote-${index}`,
      category: item.category || "Photography",
      title: item.title || `${item.category || "Creative"} Photography`,
      description:
        item.description || "A beautiful moment captured through our lens.",
      image: item.image || item.image_url || "",
    }));
  }, [remoteGallery]);

  /* FILTERED IMAGES */

  const items = useMemo(() => {
    if (filter === "All") return galleryItems;

    return galleryItems.filter(
      (item) => item.category.toLowerCase() === filter.toLowerCase(),
    );
  }, [galleryItems, filter]);

  /* CATEGORY COUNTS */

  const categoryCount = (category) => {
    if (category === "All") return galleryItems.length;

    return galleryItems.filter(
      (item) => item.category.toLowerCase() === category.toLowerCase(),
    ).length;
  };

  /* FILTER CHANGE */

  const handleFilter = (category) => {
    setFilter(category);
    setSelected(null);
  };

  /* LIGHTBOX */

  const closeLightbox = useCallback(() => {
    setSelected(null);
  }, []);

  const move = useCallback(
    (direction) => {
      setSelected((current) => {
        if (current === null || !items.length) {
          return null;
        }

        return (current + direction + items.length) % items.length;
      });
    },
    [items.length],
  );

  const openLightbox = (index) => {
    previousFocusRef.current = document.activeElement;
    setSelected(index);
  };

  /* KEYBOARD SUPPORT */

  useEffect(() => {
    if (selected === null) return;

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        closeLightbox();
      }

      if (event.key === "ArrowRight") {
        move(1);
      }

      if (event.key === "ArrowLeft") {
        move(-1);
      }

      if (event.key === "Tab") {
        const dialog = document.querySelector(".lc-gallery-lightbox");

        const buttons = [...(dialog?.querySelectorAll("button") || [])];

        if (!buttons.length) return;

        const first = buttons[0];
        const last = buttons[buttons.length - 1];

        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selected, closeLightbox, move]);

  useEffect(() => {
    if (selected === null) {
      previousFocusRef.current?.focus?.();
    }
  }, [selected]);

  const activeItem = selected !== null ? items[selected] : null;

 
}
