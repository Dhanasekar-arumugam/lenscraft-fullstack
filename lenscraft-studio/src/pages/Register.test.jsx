import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Routes, Route } from "react-router-dom";

import Register from "./Register";
import { registerUser } from "../api/authService";

vi.mock("../api/authService", () => ({
  registerUser: vi.fn(),
}));

// Reusable render function
const renderRegister = () => {
  return render(
    <MemoryRouter initialEntries={["/register"]}>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/verify-email" element={<h1>Verify Email Page</h1>} />
        <Route path="/login" element={<h1>Login Page</h1>} />
        <Route path="/" element={<h1>Home Page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
};

// Reusable input selectors
const getNameInput = () => screen.getByLabelText(/full name/i);
const getEmailInput = () => screen.getByLabelText(/email address/i);
const getPasswordInput = () => screen.getByLabelText(/^password$/i);

const getConfirmPasswordInput = () =>
  screen.getByLabelText(/^confirm password$/i);

// Reusable valid form data
const fillValidForm = async (user) => {
  await user.type(getNameInput(), "Test User");
  await user.type(getEmailInput(), "test@example.com");
  await user.type(getPasswordInput(), "Password123");
  await user.type(getConfirmPasswordInput(), "Password123");
};

// Submit button selector
const getSubmitButton = () =>
  screen.getByRole("button", {
    name: /create my account/i,
  });

describe("Register Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  // 1. Render registration page
  it("renders the registration page correctly", () => {
    renderRegister();

    expect(
      screen.getByRole("heading", {
        name: /a place foreverybeautifulmoment\./i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByRole("heading", {
        name: /create your\s*account/i,
      }),
    ).toBeInTheDocument();

    expect(getNameInput()).toBeInTheDocument();
    expect(getEmailInput()).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(getConfirmPasswordInput()).toBeInTheDocument();
    expect(getSubmitButton()).toBeInTheDocument();
  });

  // 2. Required fields
  it("requires all registration fields", () => {
    renderRegister();

    expect(getNameInput()).toBeRequired();
    expect(getEmailInput()).toBeRequired();
    expect(getPasswordInput()).toBeRequired();
    expect(getConfirmPasswordInput()).toBeRequired();
  });

  // 3. Document title
  it("sets the correct document title", () => {
    renderRegister();

    expect(document.title).toBe("Create Account | Lenscraft Studio");
  });

  // 4. Password visibility
  it("toggles password visibility", async () => {
    const user = userEvent.setup();

    renderRegister();

    const passwordInput = getPasswordInput();

    expect(passwordInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", {
        name: "Show password",
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", {
        name: "Hide password",
      }),
    );

    expect(passwordInput).toHaveAttribute("type", "password");
  });

  // 5. Confirm password visibility
  it("toggles confirm password visibility", async () => {
    const user = userEvent.setup();

    renderRegister();

    const confirmInput = getConfirmPasswordInput();

    expect(confirmInput).toHaveAttribute("type", "password");

    await user.click(
      screen.getByRole("button", {
        name: "Show confirm password",
      }),
    );

    expect(confirmInput).toHaveAttribute("type", "text");

    await user.click(
      screen.getByRole("button", {
        name: "Hide confirm password",
      }),
    );

    expect(confirmInput).toHaveAttribute("type", "password");
  });

  // 6. Full name validation
  it("displays an error when full name is empty", async () => {
    renderRegister();

    await userEvent.type(getEmailInput(), "test@example.com");
    await userEvent.type(getPasswordInput(), "Password123");
    await userEvent.type(getConfirmPasswordInput(), "Password123");

    const form = getSubmitButton().closest("form");

    // Trigger submit directly to bypass native required validation.
    form.dispatchEvent(
      new Event("submit", {
        bubbles: true,
        cancelable: true,
      }),
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter your full name.",
    );

    expect(registerUser).not.toHaveBeenCalled();
  });

  // 7. Password mismatch
  it("displays an error when passwords do not match", async () => {
    const user = userEvent.setup();

    renderRegister();

    await user.type(getNameInput(), "Test User");
    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "Password123");
    await user.type(getConfirmPasswordInput(), "Different123");

    expect(screen.getByText("Passwords do not match")).toBeInTheDocument();

    await user.click(getSubmitButton());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Passwords do not match.",
    );

    expect(registerUser).not.toHaveBeenCalled();
  });

  // 8. Password strength validation
  it("rejects a password that does not meet requirements", async () => {
    const user = userEvent.setup();

    renderRegister();

    await user.type(getNameInput(), "Test User");
    await user.type(getEmailInput(), "test@example.com");
    await user.type(getPasswordInput(), "weak");
    await user.type(getConfirmPasswordInput(), "weak");

    await user.click(getSubmitButton());

    expect(screen.getByRole("alert")).toHaveTextContent(
      "Use at least 8 characters, one uppercase letter and one number.",
    );

    expect(registerUser).not.toHaveBeenCalled();
  });

  // 9. Successful registration
  it("registers successfully and redirects to email verification", async () => {
    const user = userEvent.setup();

    registerUser.mockResolvedValue({
      message: "Registration successful",
    });

    sessionStorage.setItem("lenscraft_otp_expires_at", "old-expiry");
    sessionStorage.setItem("lenscraft_otp_timer_email", "old@example.com");
    sessionStorage.setItem("lenscraft_resend_available_at", "old-resend");

    renderRegister();

    await fillValidForm(user);
    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123",
        full_name: "Test User",
      });
    });

    expect(await screen.findByText("Verify Email Page")).toBeInTheDocument();

    expect(sessionStorage.getItem("lenscraft_verify_email")).toBe(
      "test@example.com",
    );

    expect(sessionStorage.getItem("lenscraft_otp_expires_at")).toBeNull();
    expect(sessionStorage.getItem("lenscraft_otp_timer_email")).toBeNull();
    expect(sessionStorage.getItem("lenscraft_resend_available_at")).toBeNull();
  });

  // 10. Email normalization
  it("trims and converts email to lowercase", async () => {
    const user = userEvent.setup();

    registerUser.mockResolvedValue({});

    renderRegister();

    await user.type(getNameInput(), "Test User");
    await user.type(getEmailInput(), "TEST@EXAMPLE.COM");
    await user.type(getPasswordInput(), "Password123");
    await user.type(getConfirmPasswordInput(), "Password123");

    await user.click(getSubmitButton());

    await waitFor(() => {
      expect(registerUser).toHaveBeenCalledWith({
        email: "test@example.com",
        password: "Password123",
        full_name: "Test User",
      });
    });
  });

  // 11. Backend error
  it("displays backend registration errors", async () => {
    const user = userEvent.setup();

    registerUser.mockRejectedValue({
      response: {
        data: {
          detail: "Email already exists.",
        },
      },
    });

    renderRegister();

    await fillValidForm(user);
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Email already exists.",
    );

    expect(screen.queryByText("Verify Email Page")).not.toBeInTheDocument();
  });

  // 12. Network error
  it("displays a network error message", async () => {
    const user = userEvent.setup();

    registerUser.mockRejectedValue(new Error("Network Error"));

    renderRegister();

    await fillValidForm(user);
    await user.click(getSubmitButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Cannot connect to the server.",
    );
  });
});
