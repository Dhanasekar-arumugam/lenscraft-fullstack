import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, waitFor, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";

import Home from "./Home";
import api from "../api/axios";

// ============================================
// MOCK API
// ============================================

vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

// ============================================
// MOCK HERO
// ============================================

vi.mock("../components/Hero", () => ({
  default: ({ home }) => (
    <div data-testid="hero-component">{home ? "Homepage Hero" : "Hero"}</div>
  ),
}));

// ============================================
// MOCK GALLERY
// ============================================

vi.mock("../components/Gallery", () => ({
  default: () => <div data-testid="gallery-component">Gallery Section</div>,
}));

// ============================================
// MOCK MOTION
// ============================================

vi.mock("motion/react", async () => {
  const React = await import("react");

  // Cache motion components to preserve component identity.
  const componentCache = {};

  const motion = new Proxy(
    {},
    {
      get: (_, tag) => {
        if (!componentCache[tag]) {
          componentCache[tag] = React.forwardRef(
            ({ children, ...props }, ref) => {
              const {
                initial,
                animate,
                whileInView,
                viewport,
                transition,
                variants,
                ...htmlProps
              } = props;

              return React.createElement(tag, { ...htmlProps, ref }, children);
            },
          );
        }

        return componentCache[tag];
      },
    },
  );

  return {
    motion,
    useInView: () => false,
  };
});

// ============================================
// TEST HELPER
// ============================================

const renderHome = () => {
  return render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>,
  );
};

// ============================================
// SAMPLE SERVICES
// ============================================

const mockServices = [
  {
    id: 1,
    title: "Wedding Photography",
    description: "Beautiful wedding moments",
    image: "/images/wedding.jpg",
    active: true,
  },
  {
    id: 2,
    title: "Portrait Photography",
    description: "Professional portrait sessions",
    image: "/images/portrait.jpg",
    active: true,
  },
  {
    id: 3,
    title: "Fashion Photography",
    description: "Creative fashion photography",
    image: "/images/fashion.jpg",
    active: true,
  },
  {
    id: 4,
    title: "Event Photography",
    description: "Memorable event coverage",
    image: "/images/event.jpg",
    active: true,
  },
  {
    id: 5,
    title: "Product Photography",
    description: "Professional product images",
    image: "/images/product.jpg",
    active: true,
  },
  {
    id: 6,
    title: "Inactive Service",
    description: "This service should not appear",
    image: "/images/inactive.jpg",
    active: false,
  },
];

// ============================================
// SETUP
// ============================================

beforeEach(() => {
  vi.clearAllMocks();

  api.get.mockResolvedValue({
    data: [],
  });
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

// ============================================
// HOMEPAGE RENDERING TESTS
// ============================================

describe("Home Page Rendering", () => {
  it("renders the homepage successfully", async () => {
    renderHome();

    expect(screen.getByRole("main")).toBeInTheDocument();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/services/",
        expect.objectContaining({
          signal: expect.anything(),
        }),
      );
    });
  });

  it("renders the Hero component", () => {
    renderHome();

    expect(screen.getByTestId("hero-component")).toHaveTextContent(
      "Homepage Hero",
    );
  });

  it("renders the Photography Gallery component", () => {
    renderHome();

    expect(screen.getByTestId("gallery-component")).toBeInTheDocument();
  });

  it("sets the correct document title", async () => {
    renderHome();

    await waitFor(() => {
      expect(document.title).toBe("Lenscraft Studio | Creative Photography");
    });
  });
});

// ============================================
// HOMEPAGE SECTION TESTS
// ============================================

describe("Home Page Sections", () => {
  it("renders the photography collection section", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /an eye for the extraordinary/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the about section", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /life is made of\s*moments/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("link", {
        name: /explore our story/i,
      }),
    ).toHaveAttribute("href", "/about");
  });

  it("renders the featured services heading", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /our creative expertise/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the portfolio section", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /a collection of\s*beautiful moments/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders the photography journal section", () => {
    renderHome();

    expect(
      screen.getByRole("heading", {
        name: /stories, ideas &\s*inspiration/i,
      }),
    ).toBeInTheDocument();
  });

  it("renders all four creative process steps", () => {
    renderHome();

    expect(screen.getByText("Let's Connect")).toBeInTheDocument();
    expect(screen.getByText("Creative Planning")).toBeInTheDocument();
    expect(screen.getByText("The Photoshoot")).toBeInTheDocument();
    expect(screen.getByText("Beautiful Delivery")).toBeInTheDocument();
  });
});

// ============================================
// STATIC PORTFOLIO TESTS
// ============================================

describe("Home Portfolio", () => {
  it("renders all four portfolio cards", () => {
    renderHome();

    const titles = [
      "Timeless Romance",
      "The Art of Portraits",
      "Beautiful Celebrations",
      "Creative Expressions",
    ];

    titles.forEach((title) => {
      // Each title appears in both the image overlay and card footer.
      expect(screen.getAllByText(title).length).toBeGreaterThan(0);
    });
  });

  it("renders portfolio enquiry links", () => {
    renderHome();

    const enquiryLinks = screen.getAllByRole("link", {
      name: /enquire about/i,
    });

    expect(enquiryLinks).toHaveLength(4);

    enquiryLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/contact");
    });
  });

  it("toggles portfolio card details when clicked", async () => {
    const user = userEvent.setup();

    renderHome();

    const button = screen.getByRole("button", {
      name: /show timeless romance details/i,
    });

    expect(button).toHaveAttribute("aria-expanded", "false");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "true");

    await user.click(button);

    expect(button).toHaveAttribute("aria-expanded", "false");
  });
});

// ============================================
// SERVICES LOADING TESTS
// ============================================

describe("Home Services API", () => {
  it("shows loading message while services are being fetched", async () => {
    let resolveRequest;

    api.get.mockReturnValue(
      new Promise((resolve) => {
        resolveRequest = resolve;
      }),
    );

    renderHome();

    expect(screen.getByRole("status")).toHaveTextContent(
      "Loading our services...",
    );

    // Finish the request so the test does not leave it pending.
    resolveRequest({
      data: [],
    });

    expect(
      await screen.findByText("Our services will be available soon."),
    ).toBeInTheDocument();
  });

  it("fetches services from the Django API", async () => {
    renderHome();

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(
        "/services/",
        expect.objectContaining({
          signal: expect.anything(),
        }),
      );
    });
  });

  it("renders services returned by the API", async () => {
    api.get.mockResolvedValue({
      data: mockServices,
    });

    renderHome();

    expect(
      await screen.findByRole("heading", {
        name: "Wedding Photography",
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("Beautiful wedding moments")).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Portrait Photography",
      }),
    ).toBeInTheDocument();
  });

  it("displays a maximum of four active services", async () => {
    api.get.mockResolvedValue({
      data: mockServices,
    });

    renderHome();

    await screen.findByRole("heading", {
      name: "Wedding Photography",
    });

    const serviceHeadings = screen
      .getAllByRole("heading", { level: 3 })
      .map((heading) => heading.textContent);

    expect(serviceHeadings).toContain("Wedding Photography");
    expect(serviceHeadings).toContain("Portrait Photography");
    expect(serviceHeadings).toContain("Fashion Photography");
    expect(serviceHeadings).toContain("Event Photography");

    expect(serviceHeadings).not.toContain("Product Photography");
    expect(serviceHeadings).not.toContain("Inactive Service");
  });

  it("does not display inactive services", async () => {
    api.get.mockResolvedValue({
      data: mockServices,
    });

    renderHome();

    await screen.findByRole("heading", {
      name: "Wedding Photography",
    });

    expect(
      screen.queryByRole("heading", {
        name: "Inactive Service",
      }),
    ).not.toBeInTheDocument();
  });

  it("supports paginated API responses containing results", async () => {
    api.get.mockResolvedValue({
      data: {
        count: 2,
        results: mockServices.slice(0, 2),
      },
    });

    renderHome();

    expect(
      await screen.findByRole("heading", {
        name: "Wedding Photography",
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: "Portrait Photography",
      }),
    ).toBeInTheDocument();
  });

  it("shows empty message when no services are available", async () => {
    api.get.mockResolvedValue({
      data: [],
    });

    renderHome();

    expect(
      await screen.findByText("Our services will be available soon."),
    ).toBeInTheDocument();
  });

  it("shows empty message when all services are inactive", async () => {
    api.get.mockResolvedValue({
      data: [
        {
          id: 1,
          title: "Inactive Wedding Service",
          description: "Inactive service",
          active: false,
        },
      ],
    });

    renderHome();

    expect(
      await screen.findByText("Our services will be available soon."),
    ).toBeInTheDocument();
  });

  it("shows an error message when the API request fails", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    api.get.mockRejectedValue(new Error("Network Error"));

    renderHome();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Services are temporarily unavailable.",
    );

    expect(consoleSpy).toHaveBeenCalled();
  });
});

// ============================================
// NAVIGATION TESTS
// ============================================

describe("Home Page Navigation", () => {
  it("renders navigation to the services page", () => {
    renderHome();

    const servicesLink = screen.getByRole("link", {
      name: /explore all services/i,
    });

    expect(servicesLink).toHaveAttribute("href", "/services");
  });

  it("renders links to the about page", () => {
    renderHome();

    const aboutLinks = screen.getAllByRole("link", {
      name: /explore our story|get to know us/i,
    });

    expect(aboutLinks.length).toBeGreaterThanOrEqual(2);

    aboutLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/about");
    });
  });

  it("renders contact page navigation links", () => {
    renderHome();

    expect(
      screen.getByRole("link", {
        name: /start your own story/i,
      }),
    ).toHaveAttribute("href", "/contact");
  });

  it("renders links from service cards to services page", async () => {
    api.get.mockResolvedValue({
      data: mockServices.slice(0, 2),
    });

    renderHome();

    await screen.findByRole("heading", {
      name: "Wedding Photography",
    });

    const serviceLinks = screen.getAllByRole("link", {
      name: /discover service/i,
    });

    expect(serviceLinks).toHaveLength(2);

    serviceLinks.forEach((link) => {
      expect(link).toHaveAttribute("href", "/services");
    });
  });
});
