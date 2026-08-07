import { act } from "react";
import { createElement } from "react";
import { createRoot, type Root } from "react-dom/client";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import IntersectionObserverStub from "@/lib/intersectionObserverStub";

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

async function renderStub(onChange: (entry: { isIntersecting: boolean }) => void) {
  await act(async () => {
    root = createRoot(container);
    root.render(
      createElement(IntersectionObserverStub, { onChange }, createElement("div", null)),
    );
  });
}

describe("intersectionObserverStub", () => {
  it("fires onChange when a real IntersectionObserver reports the element", async () => {
    const onChange = vi.fn();
    class FakeObserver {
      callback: IntersectionObserverCallback;
      constructor(cb: IntersectionObserverCallback) {
        this.callback = cb;
      }
      observe(target: Element) {
        queueMicrotask(() =>
          this.callback(
            [
              {
                isIntersecting: true,
                intersectionRatio: 1,
                target,
              } as unknown as IntersectionObserverEntry,
            ],
            this as unknown as IntersectionObserver,
          ),
        );
      }
      unobserve() {}
      disconnect() {}
    }
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      FakeObserver;

    await renderStub(onChange);

    await act(async () => {});
    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].isIntersecting).toBe(true);
  });

  it("fires onChange immediately when IntersectionObserver is unavailable", async () => {
    const onChange = vi.fn();
    const original = globalThis.IntersectionObserver;
    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      undefined;

    await renderStub(onChange);
    await act(async () => {});

    expect(onChange).toHaveBeenCalled();
    expect(onChange.mock.calls[0][0].isIntersecting).toBe(true);

    (globalThis as unknown as { IntersectionObserver: unknown }).IntersectionObserver =
      original;
  });
});
