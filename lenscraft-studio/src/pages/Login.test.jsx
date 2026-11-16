import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Login from "./Login";
import { loginUser } from "../api/authService";

vi.mock("../api/authService", () => ({
  loginUser: vi.fn(),
}));

// Reusable render function
const renderLogin = () => {
  return render(
    <MemoryRouter initialEntries={["/login"]}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<h1>Home Page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
};

// Password input selector
const getPasswordInput = () => {
  return screen.getByLabelText(/^password$/i, {
    selector: "input",
  });
};

describe("Login Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // 1. Render login page
  it("renders the login page correctly", () => {
    renderLogin();

    expect(
      screen.getByRole("heading", {
        name: /step into\s*your story/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();

    expect(getPasswordInput()).toBeInTheDocument();

    expect(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    ).toBeInTheDocument();
  });

  // 2. Required fields
  it("requires email and password", () => {
    renderLogin();

    expect(screen.getByLabelText(/email address/i)).toBeRequired();

    expect(getPasswordInput()).toBeRequired();
  });

  // 3. Toggle password visibility
  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    renderLogin();

    const passwordInput = getPasswordInput();

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", {
        name: /show password/i,
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", {
        name: /hide password/i,
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // 4. Successful login
  it("logs in successfully and redirects to home", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      user: {
        id: 1,
        email: "test@example.com",
        username: "testuser",
      },
    });

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(getPasswordInput(), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith("test@example.com", "Password123");
    });

    expect(await screen.findByText("Home Page")).toBeInTheDocument();

    expect(sessionStorage.getItem("lenscraft_user")).toBe(
      JSON.stringify({
        id: 1,
        email: "test@example.com",
        username: "testuser",
      }),
    );
  });

  // 5. Trim email whitespace
  it("trims whitespace from the email address", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({
      user: {
        id: 1,
        email: "test@example.com",
      },
    });

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "  test@example.com  ",
    );

    await user.type(getPasswordInput(), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    await waitFor(() => {
      expect(loginUser).toHaveBeenCalledWith("test@example.com", "Password123");
    });
  });

  // 6. Backend login error
  it("displays backend login errors", async () => {
    const user = userEvent.setup();

    loginUser.mockRejectedValue({
      response: {
        data: {
          detail: "Invalid email or password.",
        },
      },
    });

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "wrong@example.com",
    );

    await user.type(getPasswordInput(), "WrongPassword");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Invalid email or password.",
    );
  });

  // 7. Network error
  it("displays a network error message", async () => {
    const user = userEvent.setup();

    loginUser.mockRejectedValue(new Error("Network Error"));

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(getPasswordInput(), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot connect to the server.",
    );
  });

  // 8. Missing user information
  it("handles a response without user information", async () => {
    const user = userEvent.setup();

    loginUser.mockResolvedValue({});

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(getPasswordInput(), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "User information was not returned.",
    );
  });

  // 9. Loading state
  it("displays the loading state while login is pending", async () => {
    const user = userEvent.setup();

    let resolveLogin;

    loginUser.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveLogin = resolve;
        }),
    );

    renderLogin();

    await user.type(
      screen.getByLabelText(/email address/i),
      "test@example.com",
    );

    await user.type(getPasswordInput(), "Password123");

    await user.click(
      screen.getByRole("button", {
        name: /enter the studio/i,
      }),
    );

    const loadingButton = await screen.findByRole("button", {
      name: /signing in/i,
    });

    expect(loadingButton).toBeDisabled();

    resolveLogin({
      user: {
        id: 1,
        email: "test@example.com",
      },
    });

    expect(await screen.findByText("Home Page")).toBeInTheDocument();
  });
});
