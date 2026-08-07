import { useEffect, useRef } from "react";
import type { ReactNode } from "react";

interface ObserverEntry {
  isIntersecting: boolean;
  intersectionRatio: number;
  target: Element;
}

interface ObserverProps {
  children?: ReactNode;
  onChange?: (entry: ObserverEntry, unobserve: () => void) => void;
  rootMargin?: string;
  threshold?: number | number[];
  disabled?: boolean;
}

export default function IntersectionObserverStub({
  children,
  onChange,
  rootMargin,
  threshold,
  disabled,
}: ObserverProps) {
  const nodeRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    const node = nodeRef.current;
    if (!node || disabled) return;

    if (typeof IntersectionObserver === "undefined") {
      onChangeRef.current?.(
        { isIntersecting: true, intersectionRatio: 1, target: node },
        () => {},
      );
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            onChangeRef.current?.(entry, () => observer.unobserve(entry.target));
          }
        }
      },
      { root: null, rootMargin, threshold: threshold ?? [0] },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [disabled, rootMargin, threshold]);

  return (
    <div ref={nodeRef} style={{ width: "100%", height: "100%" }}>
      {children}
    </div>
  );
}
