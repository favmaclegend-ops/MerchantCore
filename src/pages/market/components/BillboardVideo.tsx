import { useEffect } from "react";
import { SquareArrowOutUpRightIcon } from "lucide-react";
import type { MarketStoreAdvert } from "../demoMarketStore";
import { advertTargetUrl } from "../billboard";

interface BillboardVideoProps {
  ad: MarketStoreAdvert;
  onEnded: () => void;
  fallbackMs?: number;
}

export function BillboardVideo({ ad, onEnded, fallbackMs = 4000 }: BillboardVideoProps) {
  const targetUrl = advertTargetUrl(ad);
  const isVideo = Boolean(ad.videoUrl);

  useEffect(() => {
    if (isVideo) return;
    const id = setTimeout(onEnded, fallbackMs);
    return () => clearTimeout(id);
  }, [isVideo, onEnded, fallbackMs]);

  return (
    <a
      href={targetUrl}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`Advertisement${ad.title ? `: ${ad.title}` : ""}${
        targetUrl ? `. Opens ${targetUrl} in a new tab.` : ""
      }`}
      title={ad.title ?? "Advertisement"}
      style={{
        position: "relative",
        display: "block",
        width: "100%",
        height: "100%",
        borderRadius: "1rem",
        overflow: "hidden",
        background: "#050505",
        textDecoration: "none",
        cursor: targetUrl ? "pointer" : "default",
        boxShadow: "0 8px 24px rgba(0, 0, 0, 0.18)",
      }}
    >
      {isVideo ? (
        <video
          src={ad.videoUrl}
          poster={ad.advertUrl}
          autoPlay
          muted
          playsInline
          preload="auto"
          controls={false}
          disablePictureInPicture
          onEnded={onEnded}
          onError={onEnded}
          aria-hidden="true"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        <img
          src={ad.advertUrl}
          alt={ad.title ?? "Advertisement"}
          draggable={false}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      )}

      <span
        style={{
          position: "absolute",
          top: ".75rem",
          left: ".75rem",
          fontSize: ".7rem",
          fontWeight: 700,
          textTransform: "uppercase",
          letterSpacing: ".06em",
          padding: ".25rem .6rem",
          borderRadius: "3rem",
          background: "rgba(2, 6, 23, 0.55)",
          color: "var(--bg-surface)",
          backdropFilter: "blur(4px)",
        }}
      >
        Ad
      </span>

      <div
        style={{
          position: "absolute",
          inset: "auto 0 0 0",
          padding: "2rem 1rem .8rem",
          display: "flex",
          alignItems: "center",
          gap: ".5rem",
          background: "linear-gradient(to bottom, transparent, rgba(2, 6, 23, 0.65))",
        }}
      >
        <span
          style={{
            color: "var(--bg-surface)",
            fontSize: ".95rem",
            fontWeight: 600,
            whiteSpace: "nowrap",
            textOverflow: "ellipsis",
            overflow: "hidden",
            minWidth: "0",
          }}
        >
          {ad.title ?? ad.id}
        </span>
        <SquareArrowOutUpRightIcon
          size={18}
          color="var(--bg-surface)"
          style={{ marginInlineStart: "auto", flexShrink: 0 }}
        />
      </div>
    </a>
  );
}
