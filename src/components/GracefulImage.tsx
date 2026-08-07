import {
  useCallback,
  useState,
  type ComponentType,
  type CSSProperties,
  type ReactNode,
} from "react";
import * as ProgressiveImageModule from "react-progressive-graceful-image";

interface ProgressiveImageComponentProps {
  src: string;
  placeholder: string;
  noLazyLoad?: boolean;
  onError?: (errorEvent: Event) => void;
  children: (src: string, loading?: boolean) => ReactNode;
}

const ProgressiveImage: ComponentType<ProgressiveImageComponentProps> = (() => {
  const mod = ProgressiveImageModule as unknown as {
    default?: unknown;
    __esModule?: boolean;
  };
  if (typeof mod.default === "function") {
    return mod.default as unknown as ComponentType<ProgressiveImageComponentProps>;
  }
  const nested =
    mod.default && typeof mod.default === "object"
      ? (mod.default as { default?: unknown }).default
      : undefined;
  if (typeof nested === "function") {
    return nested as unknown as ComponentType<ProgressiveImageComponentProps>;
  }
  throw new Error(
    "Could not resolve the react-progressive-graceful-image component export.",
  );
})();

export const GRACEFUL_FALLBACK_SRC = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
    <rect x="2.75" y="4" width="18.5" height="16" rx="2.75" stroke="#94a3b8" stroke-width="1.25"/>
    <circle cx="9" cy="9.5" r="1.6" fill="#94a3b8"/>
    <path d="M4.5 17.2 9.3 12.6l2.6 2.6 2.3 -2.2 5.6 4.9" stroke="#94a3b8" stroke-width="1.25" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
)}`;

const PLACEHOLDER_BACKGROUND = "var(--bg-tertiary)";

function ProgressiveCircle({ size = 22 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="spin"
    >
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeOpacity="0.15"
        strokeWidth="2.5"
      />
      <circle
        cx="12"
        cy="12"
        r="9.5"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeDasharray="35 60"
      />
    </svg>
  );
}

export interface GracefulImageProps {
  src?: string;
  alt?: string;
  /** Styles applied to the rendered <img>. */
  style?: CSSProperties;
  /** Styles applied to the wrapper that sizes the image. */
  wrapperStyle?: CSSProperties;
  /** Custom loading content; defaults to a built-in spinner. */
  placeholder?: ReactNode;
  /** Decode immediately instead of waiting for the element to scroll into view. */
  eager?: boolean;
}

export function GracefulImage({
  src,
  alt = "",
  style,
  wrapperStyle,
  placeholder,
  eager = false,
}: GracefulImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const trimmed = src?.trim();
  const resolved = trimmed || GRACEFUL_FALLBACK_SRC;
  const target = trimmed === failedSrc ? GRACEFUL_FALLBACK_SRC : resolved;

  const handleError = useCallback(() => {
    setFailedSrc(trimmed || null);
  }, [trimmed]);

  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        overflow: "hidden",
        ...wrapperStyle,
      }}
    >
      <ProgressiveImage
        src={target}
        placeholder=""
        noLazyLoad={eager}
        onError={handleError}
      >
        {(imgSrc, loading) =>
          loading ? (
            <div
              role="status"
              aria-live="polite"
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--text-muted)",
                background: PLACEHOLDER_BACKGROUND,
              }}
            >
              {placeholder ?? <ProgressiveCircle />}
            </div>
          ) : (
            <img
              src={imgSrc}
              alt={alt}
              draggable={false}
              onError={handleError}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
                background: PLACEHOLDER_BACKGROUND,
                ...style,
              }}
            />
          )
        }
      </ProgressiveImage>
    </div>
  );
}
