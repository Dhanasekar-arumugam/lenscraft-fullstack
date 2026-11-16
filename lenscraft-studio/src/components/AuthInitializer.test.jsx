import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { render, screen, waitFor, cleanup } from "@testing-library/react";

import AuthInitializer from "./AuthInitializer";

import api, {
  restoreAuthentication,
  invalidateAuthentication,
} from "../api/axios";

// Mock Axios module
vi.mock("../api/axios", () => ({
  default: {
    get: vi.fn(),
  },
  restoreAuthentication: vi.fn(),
  invalidateAuthentication: vi.fn(),
}));

describe("AuthInitializer", () => {
  const mockUser = {
    id: 1,
    email: "test@example.com",
    first_name: "Dhana",
  };

  beforeEach(() => {
    cleanup();

    vi.clearAllMocks();

    sessionStorage.clear();

    restoreAuthentication.mockResolvedValue("mock-access-token");

    api.get.mockResolvedValue({
      data: mockUser,
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  // 1. Loading screen
  it("displays loading screen initially", async () => {
    let resolveRestore;

    restoreAuthentication.mockReturnValue(
      new Promise((resolve) => {
        resolveRestore = resolve;
      }),
    );

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    expect(screen.getByText("Loading Lenscraft Studio...")).toBeInTheDocument();

    expect(screen.queryByText("Dashboard Content")).not.toBeInTheDocument();

    // Resolve the promise to prevent shared state leaking.
    resolveRestore(null);

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });
  });

  // 2. No authentication token
  it("removes saved user when no token is restored", async () => {
    restoreAuthentication.mockResolvedValue(null);

    sessionStorage.setItem("lenscraft_user", JSON.stringify(mockUser));

    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });

    expect(restoreAuthentication).toHaveBeenCalledTimes(1);

    expect(sessionStorage.getItem("lenscraft_user")).toBeNull();

    expect(api.get).not.toHaveBeenCalled();

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "lenscraft-auth-change",
      }),
    );
  });

  // 3. Successful authentication
  it("fetches profile when authentication token exists", async () => {
    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith("auth/profile/");
    });

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  // 4. Save profile in sessionStorage
  it("saves user profile in sessionStorage", async () => {
    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(sessionStorage.getItem("lenscraft_user")).not.toBeNull();
    });

    expect(JSON.parse(sessionStorage.getItem("lenscraft_user"))).toEqual(
      mockUser,
    );
  });

  // 5. Handle 401 error
  it("invalidates authentication when API returns 401", async () => {
    api.get.mockRejectedValue({
      response: {
        status: 401,
        data: {
          detail: "Unauthorized",
        },
      },
    });

    sessionStorage.setItem("lenscraft_user", JSON.stringify(mockUser));

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(invalidateAuthentication).toHaveBeenCalledTimes(1);
    });

    expect(sessionStorage.getItem("lenscraft_user")).toBeNull();

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  // 6. Handle 403 error
  it("invalidates authentication when API returns 403", async () => {
    api.get.mockRejectedValue({
      response: {
        status: 403,
      },
    });

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(invalidateAuthentication).toHaveBeenCalledTimes(1);
    });

    expect(sessionStorage.getItem("lenscraft_user")).toBeNull();

    expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
  });

  // 7. Handle server/network error
  it("does not invalidate authentication for non-authentication errors", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    api.get.mockRejectedValue({
      response: {
        status: 500,
        data: {
          detail: "Internal server error",
        },
      },
    });

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(screen.getByText("Dashboard Content")).toBeInTheDocument();
    });

    expect(invalidateAuthentication).not.toHaveBeenCalled();

    expect(consoleSpy).toHaveBeenCalled();
  });

  // 8. Dispatch authentication change after profile restoration
  it("dispatches authentication change event after profile restoration", async () => {
    const dispatchSpy = vi.spyOn(window, "dispatchEvent");

    render(
      <AuthInitializer>
        <div>Dashboard Content</div>
      </AuthInitializer>,
    );

    await waitFor(() => {
      expect(sessionStorage.getItem("lenscraft_user")).not.toBeNull();
    });

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "lenscraft-auth-change",
      }),
    );
  });
});
