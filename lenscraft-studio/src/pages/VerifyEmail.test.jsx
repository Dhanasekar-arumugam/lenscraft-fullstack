import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  render,
  screen,
  waitFor,
  fireEvent,
  cleanup,
} from "@testing-library/react";

import userEvent from "@testing-library/user-event";

import { MemoryRouter, Routes, Route, useLocation } from "react-router-dom";

import VerifyEmail from "./VerifyEmail";

import { verifyEmail, resendOtp } from "../api/authService";

vi.mock("../api/authService", () => ({
  verifyEmail: vi.fn(),
  resendOtp: vi.fn(),
}));

// ============================================================
// TEST CONFIGURATION
// ============================================================

const TEST_EMAIL = "test@example.com";
const TEST_OTP = "123456";

// ============================================================
// LOGIN PAGE — USED TO CHECK REDIRECT STATE
// ============================================================

const LoginPage = () => {
  const location = useLocation();

  return (
    <div>
      <h1>Login Page</h1>
      <p data-testid="login-email">{location.state?.email}</p>
      <p data-testid="login-verified">{String(location.state?.verified)}</p>
    </div>
  );
};

// ============================================================
// REUSABLE RENDER FUNCTION
// ============================================================

const renderVerifyEmail = ({
  email = TEST_EMAIL,
  useSessionEmail = false,
} = {}) => {
  if (useSessionEmail && email) {
    sessionStorage.setItem("lenscraft_verify_email", email);
  }

  return render(
    <MemoryRouter
      initialEntries={[
        {
          pathname: "/verify-email",
          state: useSessionEmail ? null : { email },
        },
      ]}
    >
      <Routes>
        <Route path="/verify-email" element={<VerifyEmail />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/register" element={<h1>Register Page</h1>} />
      </Routes>
    </MemoryRouter>,
  );
};

// ============================================================
// REUSABLE SELECTORS
// ============================================================

const getOtpInputs = () =>
  Array.from({ length: 6 }, (_, index) =>
    screen.getByRole("textbox", {
      name: `OTP digit ${index + 1}`,
    }),
  );

const getVerifyButton = () =>
  screen.getByRole("button", {
    name: /verify otp/i,
  });

const getResendButton = () =>
  screen.getByRole("button", {
    name: /resend otp/i,
  });

// ============================================================
// REUSABLE OTP HELPER
// ============================================================

const enterOtp = (otp = TEST_OTP) => {
  fireEvent.change(getOtpInputs()[0], {
    target: {
      value: otp,
    },
  });
};

// ============================================================
// TEST SUITE
// ============================================================

describe("Verify Email Page", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
  });

  afterEach(() => {
    cleanup();
  });

  // ----------------------------------------------------------
  // 1. Render page
  // ----------------------------------------------------------

  it("renders the verification page correctly", () => {
    renderVerifyEmail();

    expect(
      screen.getByRole("heading", {
        name: /verify your otp/i,
      }),
    ).toBeInTheDocument();

    expect(screen.getByText("SECURE OTP VERIFICATION")).toBeInTheDocument();

    expect(screen.getByText(/enter the 6-digit otp/i)).toBeInTheDocument();

    expect(getOtpInputs()).toHaveLength(6);

    expect(getVerifyButton()).toBeInTheDocument();

    expect(getResendButton()).toBeInTheDocument();
  });

  // ----------------------------------------------------------
  // 2. OTP inputs configuration
  // ----------------------------------------------------------

  it("renders six numeric OTP input fields", () => {
    renderVerifyEmail();

    const inputs = getOtpInputs();

    inputs.forEach((input) => {
      expect(input).toHaveAttribute("type", "text");
      expect(input).toHaveAttribute("inputmode", "numeric");
      expect(input).toHaveAttribute("pattern", "[0-9]*");
    });
  });

  // ----------------------------------------------------------
  // 3. Email from route state
  // ----------------------------------------------------------

  it("saves the registration email from route state", async () => {
    renderVerifyEmail({
      email: " TEST@EXAMPLE.COM ",
    });

    await waitFor(() => {
      expect(sessionStorage.getItem("lenscraft_verify_email")).toBe(
        "test@example.com",
      );
    });
  });

  // ----------------------------------------------------------
  // 4. Email from session storage
  // ----------------------------------------------------------

  it("loads the registration email from session storage", async () => {
    renderVerifyEmail({
      email: TEST_EMAIL,
      useSessionEmail: true,
    });

    await waitFor(() => {
      expect(sessionStorage.getItem("lenscraft_verify_email")).toBe(TEST_EMAIL);
    });

    expect(
      screen.getByRole("heading", {
        name: /verify your otp/i,
      }),
    ).toBeInTheDocument();
  });

  // ----------------------------------------------------------
  // 5. Automatically focuses first OTP input
  // ----------------------------------------------------------

  it("focuses the first OTP input when the page loads", () => {
    renderVerifyEmail();

    expect(getOtpInputs()[0]).toHaveFocus();
  });

  // ----------------------------------------------------------
  // 6. OTP input and automatic focus
  // ----------------------------------------------------------

  it("moves focus to the next input after entering a digit", async () => {
    const user = userEvent.setup();

    renderVerifyEmail();

    const inputs = getOtpInputs();

    await user.type(inputs[0], "1");

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveFocus();
  });

  // ----------------------------------------------------------
  // 7. Paste complete OTP
  // ----------------------------------------------------------

  it("allows users to paste a complete OTP", () => {
    renderVerifyEmail();

    const inputs = getOtpInputs();

    fireEvent.paste(inputs[0], {
      clipboardData: {
        getData: () => "123456",
      },
    });

    expect(inputs[0]).toHaveValue("1");
    expect(inputs[1]).toHaveValue("2");
    expect(inputs[2]).toHaveValue("3");
    expect(inputs[3]).toHaveValue("4");
    expect(inputs[4]).toHaveValue("5");
    expect(inputs[5]).toHaveValue("6");
  });

  // ----------------------------------------------------------
  // 8. Backspace handling
  // ----------------------------------------------------------

  it("clears the previous OTP input using backspace", () => {
    renderVerifyEmail();

    enterOtp();

    const inputs = getOtpInputs();

    inputs[2].focus();

    fireEvent.keyDown(inputs[2], {
      key: "Backspace",
    });

    expect(inputs[2]).toHaveValue("");
    expect(inputs[2]).toHaveFocus();
  });

  // ----------------------------------------------------------
  // 9. Incomplete OTP validation
  // ----------------------------------------------------------

  it("displays an error when OTP is incomplete", async () => {
    const user = userEvent.setup();

    renderVerifyEmail();

    await user.click(getVerifyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Please enter the complete 6-digit OTP.",
    );

    expect(verifyEmail).not.toHaveBeenCalled();
  });

  // ----------------------------------------------------------
  // 10. Successful OTP verification
  // ----------------------------------------------------------

  it("verifies OTP successfully and redirects to login", async () => {
    verifyEmail.mockResolvedValue({
      verified: true,
      message: "Email verified successfully.",
    });

    sessionStorage.setItem("lenscraft_verify_email", TEST_EMAIL);
    sessionStorage.setItem("lenscraft_otp_expires_at", "123456789");
    sessionStorage.setItem("lenscraft_otp_timer_email", TEST_EMAIL);
    sessionStorage.setItem("lenscraft_resend_available_at", "123456789");

    renderVerifyEmail();

    enterOtp();

    await userEvent.click(getVerifyButton());

    await waitFor(() => {
      expect(verifyEmail).toHaveBeenCalledWith(TEST_EMAIL, TEST_OTP);
    });

    expect(
      await screen.findByRole("heading", {
        name: /otp verified/i,
      }),
    ).toBeInTheDocument();

    expect(
      screen.getByText("Email verified successfully."),
    ).toBeInTheDocument();

    // Session data should be cleared.
    expect(sessionStorage.getItem("lenscraft_verify_email")).toBeNull();

    expect(sessionStorage.getItem("lenscraft_otp_expires_at")).toBeNull();

    expect(sessionStorage.getItem("lenscraft_otp_timer_email")).toBeNull();

    expect(sessionStorage.getItem("lenscraft_resend_available_at")).toBeNull();

    // Wait for the component's 1800ms redirect.
    await waitFor(
      () => {
        expect(
          screen.getByRole("heading", {
            name: "Login Page",
          }),
        ).toBeInTheDocument();
      },
      {
        timeout: 3500,
      },
    );

    expect(screen.getByTestId("login-email")).toHaveTextContent(TEST_EMAIL);

    expect(screen.getByTestId("login-verified")).toHaveTextContent("true");
  }, 6000);

  // ----------------------------------------------------------
  // 11. Incorrect OTP
  // ----------------------------------------------------------

  it("displays an error when OTP verification is rejected", async () => {
    verifyEmail.mockResolvedValue({
      verified: false,
      message: "Invalid OTP.",
    });

    renderVerifyEmail();

    enterOtp();

    await userEvent.click(getVerifyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent("Invalid OTP.");

    expect(
      screen.queryByRole("heading", {
        name: /otp verified/i,
      }),
    ).not.toBeInTheDocument();
  });

  // ----------------------------------------------------------
  // 12. Backend verification error
  // ----------------------------------------------------------

  it("displays backend verification errors", async () => {
    verifyEmail.mockRejectedValue({
      response: {
        data: {
          detail: "OTP has expired.",
        },
      },
    });

    renderVerifyEmail();

    enterOtp();

    await userEvent.click(getVerifyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "OTP has expired.",
    );
  });

  // ----------------------------------------------------------
  // 13. Network error
  // ----------------------------------------------------------

  it("displays a network error when verification fails", async () => {
    verifyEmail.mockRejectedValue(new Error("Network connection failed"));

    renderVerifyEmail();

    enterOtp();

    await userEvent.click(getVerifyButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Network connection failed",
    );
  });

  // ----------------------------------------------------------
  // 14. Resend OTP successfully
  // ----------------------------------------------------------

  it("resends OTP successfully and resets the input fields", async () => {
    const user = userEvent.setup();

    resendOtp.mockResolvedValue({
      message: "A new OTP has been sent.",
    });

    renderVerifyEmail();

    enterOtp();

    expect(getOtpInputs()[0]).toHaveValue("1");

    await user.click(getResendButton());

    expect(resendOtp).toHaveBeenCalledWith(TEST_EMAIL);

    expect(await screen.findByRole("status")).toHaveTextContent(
      "A new OTP has been sent.",
    );

    getOtpInputs().forEach((input) => {
      expect(input).toHaveValue("");
    });

    expect(sessionStorage.getItem("lenscraft_otp_timer_email")).toBe(
      TEST_EMAIL,
    );

    expect(
      Number(sessionStorage.getItem("lenscraft_otp_expires_at")),
    ).toBeGreaterThan(Date.now());
  });

  // ----------------------------------------------------------
  // 15. Resend OTP backend error
  // ----------------------------------------------------------

  it("displays an error when resend OTP fails", async () => {
    const user = userEvent.setup();

    resendOtp.mockRejectedValue({
      response: {
        data: {
          detail: "Unable to resend OTP.",
        },
      },
    });

    renderVerifyEmail();

    await user.click(getResendButton());

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Unable to resend OTP.",
    );

    expect(resendOtp).toHaveBeenCalledWith(TEST_EMAIL);
  });
});
