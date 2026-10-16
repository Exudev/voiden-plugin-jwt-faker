// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react";
import { JwtFakerTab } from "../components/JwtFakerTab";

describe("JwtFakerTab Component Theme & Rendering", () => {
  it("renders correctly as a tab without modal backdrop and uses Voiden theme tokens", () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const root = createRoot(container);

    act(() => {
      root.render(React.createElement(JwtFakerTab));
    });

    // Verify it is not a blocking modal dialog with fixed backdrop
    const modalBackdrop = container.querySelector(".fixed.inset-0");
    expect(modalBackdrop).toBeNull();

    // Verify it uses Voiden theme tokens
    const rootEl = container.firstElementChild as HTMLElement;
    expect(rootEl).not.toBeNull();
    expect(rootEl.className).toContain("bg-bg");
    expect(rootEl.className).toContain("text-text");

    // Verify header uses bg-panel and border-border
    const header = container.querySelector(".bg-panel");
    expect(header).not.toBeNull();

    // Verify accent sparkles icon
    const sparkle = container.querySelector(".text-accent");
    expect(sparkle).not.toBeNull();

    // Verify tabs are present
    expect(container.textContent).toContain("Generator");
    expect(container.textContent).toContain("Decoder");
    expect(container.textContent).toContain("Templates");

    act(() => {
      root.unmount();
    });
    container.remove();
  });
});
