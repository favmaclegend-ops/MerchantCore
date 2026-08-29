import { useEffect, useRef, useState, type ReactNode } from "react";

const CLOSE_THRESHOLD = 120;

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  zIndex?: number;
  maxHeight?: string;
  /** Vertical padding offsets applied to the sheet (e.g. to clear a nav/FAB). */
  bottom?: string;
}

/**
 * A reusable bottom-sheet modal: slides up from the bottom, drag down to
 * dismiss (past a threshold it closes, otherwise it snaps back), and tapping
 * the backdrop closes it. Kept at a high z-index by default so it floats above
 * nav bars, FABs and other fixed chrome.
 */
export function BottomSheet({
  open,
  onClose,
  children,
  zIndex = 999,
  maxHeight = "85vh",
  bottom = "0px",
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef({ dragging: false, startY: 0, dy: 0 });
  const [closing, setClosing] = useState(false);

  useEffect(() => {
    if (open) {
      const sheet = sheetRef.current;
      if (sheet) {
        sheet.style.transition = "none";
        sheet.style.transform = "translateY(100%)";
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            sheet.style.transition =
              "transform 0.32s cubic-bezier(0.32, 0.72, 0, 1)";
            sheet.style.transform = "translateY(0)";
          });
        });
      }
    }
  }, [open]);

  const closeSheet = () => {
    setClosing(true);
    const sheet = sheetRef.current;
    if (sheet) {
      sheet.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
      sheet.style.transform = "translateY(100%)";
    }
    window.setTimeout(() => {
      setClosing(false);
      onClose();
    }, 300);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { dragging: true, startY: e.clientY, dy: 0 };
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* ignore capture errors */
    }
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = dragRef.current;
    const sheet = sheetRef.current;
    if (!s.dragging || !sheet) return;
    const dy = e.clientY - s.startY;
    if (dy > 0 && sheet.scrollTop <= 0) {
      s.dy = dy;
      sheet.style.transition = "none";
      sheet.style.transform = `translateY(${dy}px)`;
      e.preventDefault?.();
    }
  };

  const handlePointerUp = () => {
    const s = dragRef.current;
    const sheet = sheetRef.current;
    if (!s.dragging || !sheet) return;
    s.dragging = false;
    if (s.dy >= CLOSE_THRESHOLD) {
      closeSheet();
    } else {
      sheet.style.transition = "transform 0.3s cubic-bezier(0.32, 0.72, 0, 1)";
      sheet.style.transform = "translateY(0)";
    }
  };

  if (!open && !closing) return null;

  return (
    <>
      <div
        onClick={closeSheet}
        style={{
          position: "fixed",
          inset: 0,
          zIndex,
          background: "rgba(2,6,23,0.6)",
          backdropFilter: "blur(4px)",
          WebkitBackdropFilter: "blur(4px)",
          opacity: open ? 1 : 0,
          transition: "opacity 0.25s ease",
        }}
      />
      <div
        ref={sheetRef}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom,
          zIndex: zIndex + 1,
          maxHeight,
          margin: '10px',
          display: "flex",
          flexDirection: "column",
          overflowY: "auto",
          overscrollBehaviorY: "contain",
          background: "var(--bg-surface)",
          borderRadius: "10px",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.2)",
          willChange: "transform",
        }}
      >
        <div
          style={{
            width: "40px",
            height: "5px",
            borderRadius: "3px",
            background: "var(--border-default)",
            margin: "10px auto 2px",
            flexShrink: 0,
            cursor: "grab",
          }}
        />
        {children}
      </div>
    </>
  );
}
