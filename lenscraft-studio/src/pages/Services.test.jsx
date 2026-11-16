import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  render,
  screen,
  waitFor,
  cleanup,
  fireEvent,
} from "@testing-library/react";

import { MemoryRouter } from "react-router-dom";

import Services from "./Services";

import { getServices, getServicePackages } from "../api/serviceService";

// ==========================================
// MOCK API
// ==========================================

vi.mock("../api/serviceService", () => ({
  getServices: vi.fn(),
  getServicePackages: vi.fn(),
}));

// ==========================================
// MOCK IMAGES
// ==========================================

vi.mock("../assets/data", () => ({
  photo: (id, width) => `https://example.com/${id}?width=${width}`,
}));

// ==========================================
// MOCK MOTION
// Keep component identity stable between renders.
// ==========================================

vi.mock("motion/react", async () => {
  const React = await import("react");

  const componentCache = {};

  const motion = new Proxy(
    {},
    {
      get: (_, tag) => {
        if (!componentCache[tag]) {
          componentCache[tag] = React.forwardRef(
            (
              {
                initial,
                animate,
                transition,
                whileInView,
                viewport,
                variants,
                ...props
              },
              ref,
            ) => React.createElement(tag, { ...props, ref }),
          );
        }

        return componentCache[tag];
      },
    },
  );

  return { motion };
});

// ==========================================
// TEST DATA
// ==========================================

const mockServices = [
  {
    id: 1,
    title: "Wedding Photography",
    description: "Beautiful wedding memories.",
    price: "25000",
    image: "https://example.com/wedding.jpg",
    active: true,
  },
  {
    id: 2,
    title: "Portrait Photography",
    description: "Professional portrait sessions.",
    price: "5000",
    image_url: "https://example.com/portrait.jpg",
    active: true,
  },
  {
    id: 3,
    title: "Event Photography",
    description: "Capture your special events.",
    price: "12000",
    active: false,
  },
];

const mockPackages = [
  {
    id: 1,
    name: "Premium Wedding Package",
    slug: "premium-wedding",
    description: "Complete wedding photography experience.",
    starting_price: "45000",
    duration: "2 Days",
    image_url: "https://example.com/package.jpg",
    is_active: true,
  },
  {
    id: 2,
    name: "Portrait Package",
    slug: "portrait-package",
    description: "A professional portrait experience.",
    starting_price: "8000",
    duration: "3 Hours",
    is_active: true,
  },
  {
    id: 3,
    name: "Inactive Package",
    slug: "inactive-package",
    description: "This package should not appear.",
    starting_price: "10000",
    is_active: false,
  },
];

// ==========================================
// HELPER
// ==========================================

const renderServices = () => {
  return render(
    <MemoryRouter>
      <Services />
    </MemoryRouter>,
  );
};

const createDeferred = () => {
  let resolve;
  let reject;

  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });

  return { promise, resolve, reject };
};

// ==========================================
// TEST SETUP
// ==========================================

beforeEach(() => {
  vi.clearAllMocks();

  getServices.mockResolvedValue([]);
  getServicePackages.mockResolvedValue([]);

  vi.spyOn(console, "info").mockImplementation(() => {});
  vi.spyOn(console, "error").mockImplementation(() => {});
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ==========================================
// BASIC RENDERING
// ==========================================

describe("Services Page - Basic Rendering", () => {
  it("renders the Services page", async () => {
    renderServices();

    expect(screen.getByRole("main", { name: "" })).toBeInTheDocument();

    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(1);
      expect(getServicePackages).toHaveBeenCalledTimes(1);
    });
  });

  it("sets the correct document title", async () => {
    renderServices();

    expect(document.title).toBe("Photography Services | Lenscraft Studio");
  });

  it("renders the hero heading", async () => {
    renderServices();

    expect(
      screen.getByRole("heading", {
        name: /moments worth\s*remembering/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the hero description", async () => {
    renderServices();

    expect(
      screen.getByText(
        /we transform beautiful moments into timeless visual stories/i,
      ),
    ).toBeInTheDocument();
  });

  it("renders the introduction section", async () => {
    renderServices();

    expect(screen.getByText(/what we offer/i)).toBeInTheDocument();

    expect(  screen.getByText(/we believe every moment deserves to be remembered beautifully/i)

).toBeInTheDocument();
  });

  it("renders the Why Choose Lenscraft section", async () => {
    renderServices();

    expect(
      screen.getByRole("heading", {
        name: /why choose lenscraft/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Professional Photography")).toBeInTheDocument();

    expect(screen.getByText("Creative Storytelling")).toBeInTheDocument();

    expect(screen.getByText("Timely Delivery")).toBeInTheDocument();
  });

  it("renders all booking process steps", async () => {
    renderServices();

    expect(screen.getByText("Choose Your Service")).toBeInTheDocument();

    expect(screen.getByText("Book Your Date")).toBeInTheDocument();

    expect(screen.getByText("Capture Memories")).toBeInTheDocument();
  });
});

// ==========================================
// API CALLS
// ==========================================

describe("Services Page - API Calls", () => {
  it("calls both service APIs when the page loads", async () => {
    renderServices();

    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(1);
      expect(getServicePackages).toHaveBeenCalledTimes(1);
    });
  });

  it("shows separate loading messages", () => {
    getServices.mockReturnValue(new Promise(() => {}));
    getServicePackages.mockReturnValue(new Promise(() => {}));

    renderServices();

    expect(
      screen.getByText("Loading photography services..."),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Loading photography packages..."),
    ).toBeInTheDocument();
  });

  it("shows the services loading state while services are pending", () => {
    getServices.mockReturnValue(new Promise(() => {}));

    renderServices();

    expect(
      screen.getByText("Loading photography services..."),
    ).toBeInTheDocument();
  });

  it("shows the packages loading state while packages are pending", () => {
    getServicePackages.mockReturnValue(new Promise(() => {}));

    renderServices();

    expect(
      screen.getByText("Loading photography packages..."),
    ).toBeInTheDocument();
  });

  it("handles paginated service responses", async () => {
    getServices.mockResolvedValue({
      results: mockServices,
    });

    renderServices();

    expect(await screen.findByText("Wedding Photography")).toBeInTheDocument();

    expect(screen.getByText("Portrait Photography")).toBeInTheDocument();
  });

  it("handles paginated package responses", async () => {
    getServicePackages.mockResolvedValue({
      results: mockPackages,
    });

    renderServices();

    expect(
      await screen.findByText("Premium Wedding Package"),
    ).toBeInTheDocument();

    expect(screen.getByText("Portrait Package")).toBeInTheDocument();
  });
});

// ==========================================
// PHOTOGRAPHY SERVICES
// ==========================================

describe("Services Page - Photography Services", () => {
  it("displays active services returned by the API", async () => {
    getServices.mockResolvedValue(mockServices);

    renderServices();

    expect(await screen.findByText("Wedding Photography")).toBeInTheDocument();

    expect(screen.getByText("Portrait Photography")).toBeInTheDocument();
  });

  it("does not display inactive services", async () => {
    getServices.mockResolvedValue(mockServices);

    renderServices();

    await screen.findByText("Wedding Photography");

    expect(screen.queryByText("Event Photography")).not.toBeInTheDocument();
  });

  it("displays the service description", async () => {
    getServices.mockResolvedValue(mockServices);

    renderServices();

    expect(
      await screen.findByText("Beautiful wedding memories."),
    ).toBeInTheDocument();
  });

  it("formats service prices using Indian currency", async () => {
    getServices.mockResolvedValue(mockServices);

    renderServices();

    expect(await screen.findByText("₹25,000")).toBeInTheDocument();

    expect(screen.getByText("₹5,000")).toBeInTheDocument();
  });

  it("shows the empty state when no services are available", async () => {
    getServices.mockResolvedValue([]);

    renderServices();

    expect(
      await screen.findByText("No Services Available"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Our photography services will be available soon."),
    ).toBeInTheDocument();
  });

  it("shows an error when the services API fails", async () => {
    getServices.mockRejectedValue(new Error("API failed"));

    renderServices();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load photography services.",
    );
  });

  it("continues displaying packages when the services API fails", async () => {
    getServices.mockRejectedValue(new Error("Services failed"));
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    expect(
      await screen.findByText("Premium Wedding Package"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Unable to load photography services."),
    ).toBeInTheDocument();
  });

  it("uses the fallback image when a service has no image", async () => {
    getServices.mockResolvedValue([
      {
        id: 10,
        title: "Studio Photography",
        description: "Studio photography service.",
        price: "3000",
        active: true,
      },
    ]);

    renderServices();

    const image = await screen.findByAltText("Studio Photography");

    expect(image).toHaveAttribute(
      "src",
      "https://example.com/photo-1542038784456-1ea8e935640e?width=900",
    );
  });

  it("uses image_url when the service image field is unavailable", async () => {
    getServices.mockResolvedValue([mockServices[1]]);

    renderServices();

    const image = await screen.findByAltText("Portrait Photography");

    expect(image).toHaveAttribute("src", "https://example.com/portrait.jpg");
  });

  it("uses the fallback image when a service image fails to load", async () => {
    getServices.mockResolvedValue([
      {
        ...mockServices[0],
        image: "https://example.com/broken.jpg",
      },
    ]);

    renderServices();

    const image = await screen.findByAltText("Wedding Photography");

    fireEvent.error(image);

    expect(image).toHaveAttribute(
      "src",
      "https://example.com/photo-1542038784456-1ea8e935640e?width=900",
    );
  });
});

// ==========================================
// PHOTOGRAPHY PACKAGES
// ==========================================

describe("Services Page - Photography Packages", () => {
  it("displays active photography packages", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    expect(
      await screen.findByText("Premium Wedding Package"),
    ).toBeInTheDocument();

    expect(screen.getByText("Portrait Package")).toBeInTheDocument();
  });

  it("does not display inactive packages", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    await screen.findByText("Premium Wedding Package");

    expect(screen.queryByText("Inactive Package")).not.toBeInTheDocument();
  });

  it("displays package descriptions", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    expect(
      await screen.findByText("Complete wedding photography experience."),
    ).toBeInTheDocument();
  });

  it("displays formatted package prices", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    expect(await screen.findByText("₹45,000")).toBeInTheDocument();

    expect(screen.getByText("₹8,000")).toBeInTheDocument();
  });

  it("displays package duration when available", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    expect(await screen.findByText("2 Days")).toBeInTheDocument();

    expect(screen.getByText("3 Hours")).toBeInTheDocument();
  });

  it("shows the empty state when no packages are available", async () => {
    getServicePackages.mockResolvedValue([]);

    renderServices();

    expect(
      await screen.findByText("No Packages Available"),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Our photography packages will be available soon."),
    ).toBeInTheDocument();
  });

  it("shows an error when the packages API fails", async () => {
    getServicePackages.mockRejectedValue(new Error("Packages failed"));

    renderServices();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to load photography packages.",
    );
  });

  it("continues displaying services when the packages API fails", async () => {
    getServices.mockResolvedValue(mockServices);
    getServicePackages.mockRejectedValue(new Error("Packages failed"));

    renderServices();

    expect(await screen.findByText("Wedding Photography")).toBeInTheDocument();

    expect(
      screen.getByText("Unable to load photography packages."),
    ).toBeInTheDocument();
  });

  it("links each package to its booking page", async () => {
    getServicePackages.mockResolvedValue(mockPackages);

    renderServices();

    const bookingLink = await screen.findByRole("link", {
      name: /book premium wedding package/i,
    });

    expect(bookingLink).toHaveAttribute(
      "href",
      "/bookings?package=premium-wedding",
    );
  });

  it("links the Contact Us button when no packages are available", async () => {
    getServicePackages.mockResolvedValue([]);

    renderServices();

    const contactLink = await screen.findByRole("link", {
      name: /contact us/i,
    });

    expect(contactLink).toHaveAttribute("href", "/contact");
  });
});

// ==========================================
// NAVIGATION
// ==========================================

describe("Services Page - Navigation", () => {
  it("links the hero Let's Talk button to Contact", () => {
    renderServices();

    expect(
      screen.getByRole("link", {
        name: /let's talk/i,
      }),
    ).toHaveAttribute("href", "/contact");
  });

  it("links the Explore Our Services button to the services introduction", () => {
    renderServices();

    expect(
      screen.getByRole("link", {
        name: /explore our services/i,
      }),
    ).toHaveAttribute("href", "#services-intro");
  });

  it("links service enquiry buttons to Contact", async () => {
    getServices.mockResolvedValue(mockServices);

    renderServices();

    await screen.findByText("Wedding Photography");

    const enquiryLinks = screen.getAllByRole("link", {
      name: /enquire now/i,
    });

    expect(enquiryLinks.length).toBe(2);

    enquiryLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/contact");
    });
  });
});

// ==========================================
// COMPONENT CLEANUP
// ==========================================

describe("Services Page - Cleanup", () => {
  it("does not update state after the component unmounts", async () => {
    const deferred = createDeferred();

    getServices.mockReturnValue(deferred.promise);

    const { unmount } = renderServices();

    unmount();

    deferred.resolve(mockServices);

    await waitFor(() => {
      expect(getServices).toHaveBeenCalledTimes(1);
    });
  });

  it("does not update packages after the component unmounts", async () => {
    const deferred = createDeferred();

    getServicePackages.mockReturnValue(deferred.promise);

    const { unmount } = renderServices();

    unmount();

    deferred.resolve(mockPackages);

    await waitFor(() => {
      expect(getServicePackages).toHaveBeenCalledTimes(1);
    });
  });
});
