

export const photo = (id, w = 1200) => {
  if (!id || typeof id !== "string") return "";

  const value = id.trim();

  if (!value) return "";

  if (/^(https?:\/\/|data:|blob:)/i.test(value)) {
    return value;
  }

  if (value.startsWith("/")) {
    return value;
  }

  return `https://images.unsplash.com/${value}?auto=format&fit=crop&w=${w}&q=85`;
};


// ===============================
// PHOTOGRAPHY SERVICES
// ===============================

export const services = [
  [
    "Wedding Photography",
    "Timeless love stories, thoughtfully captured.",
    "/images/portfolio-106.jpg",
  ],
  [
    "Pre-Wedding Photography",
    "A beautiful beginning before the big day.",
    "photo-1529636798458-92182e662485",
  ],
  [
    "Portrait Photography",
    "Authentic portraits with a cinematic touch.",
    "photo-1534528741775-53994a69daeb",
  ],
  [
    "Event Photography",
    "Every celebration deserves to be remembered.",
    "photo-1492684223066-81342ee5ff30",
  ],
  [
    "Fashion Photography",
    "Editorial images that make a statement.",
    "photo-1539109136881-3be0616acf4b",
  ],
  [
    "Product Photography",
    "Details and textures that tell your brand story.",
    "photo-1548036328-c9fa89d128fa",
  ],
];

// ===============================
// PHOTOGRAPHY GALLERY
// ===============================

export const gallery = [
  [
    "Weddings",
    "/images/wedding-couple.png",
  ],
  [
    "Portraits",
    "photo-1534528741775-53994a69daeb",
  ],
  [
    "Nature",
    "photo-1470252649378-9c29740c9fa8",
  ],
  [
    "Events",
    "photo-1492684223066-81342ee5ff30",
  ],
  [
    "Fashion",
    "photo-1539109136881-3be0616acf4b",
  ],
  [
    "Weddings",
    "photo-1537633552985-df8429e8048b",
  ],
  [
    "Nature",
    "photo-1441974231531-c6227db76b6e",
  ],
  [
    "Portraits",
    "photo-1506794778202-cad84cf45f1d",
  ],
  [
    "Fashion",
    "photo-1525507119028-ed4c629a60a3",
  ],
];
