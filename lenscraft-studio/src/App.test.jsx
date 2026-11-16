import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "./App";

describe("Lenscraft Application", () => {
  it("renders the application without crashing", () => {
    render(<App />);

    expect(document.body).toBeInTheDocument();
  });
});
