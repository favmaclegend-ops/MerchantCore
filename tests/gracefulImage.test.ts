import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { GracefulImage } from "@/components/GracefulImage";

let container: HTMLDivElement;
let root: Root | undefined;

beforeEach(() => {
  container = document.createElement("div");
  document.body.appendChild(container);
});

afterEach(() => {
  act(() => root?.unmount());
  container.remove();
});

async function renderImage(props: { src?: string; alt?: string }) {
  await act(async () => {
    root = createRoot(container);
    root.render(createElement(GracefulImage, { ...props, eager: true }));
  });
}

describe("GracefulImage", () => {
  it("renders an <img> with the given src and alt", async () => {
    await renderImage({ src: "https://example.com/good.png", alt: "Good" });

    const img = container.querySelector("img");
    expect(img).toBeTruthy();
    expect(img?.getAttribute("src")).toBe("https://example.com/good.png");
    expect(img?.getAttribute("alt")).toBe("Good");
  });

  it("falls back to the global SVG placeholder when the src errors", async () => {
    await renderImage({ src: "https://example.com/broken.png", alt: "Broken" });

    const img = container.querySelector("img");
    expect(img).toBeTruthy();

    await act(async () => {
      img?.dispatchEvent(new Event("error"));
    });

    const fallbackImg = container.querySelector("img");
    expect(
      fallbackImg?.getAttribute("src")?.startsWith("data:image/svg+xml"),
    ).toBe(true);
  });
});
