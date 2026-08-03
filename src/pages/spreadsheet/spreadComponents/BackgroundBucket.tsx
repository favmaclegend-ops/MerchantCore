import { useRef, type ChangeEvent } from "react";
import { handleCellBackgroundColor } from "../spreadContext";
import { ArrowDownSquare, PaintBucket } from "lucide-react";

export function BackgroundBucket() {
  const backgroundPickerRef = useRef<HTMLInputElement>(null);

  const handleBucketClick = () => {
    const tg = backgroundPickerRef.current;
    if (tg) handleCellBackgroundColor(tg.value);
  };

  const handleBackground = (e: ChangeEvent) => {
    const backgroundBucket = e?.currentTarget as HTMLInputElement;
    handleCellBackgroundColor(backgroundBucket.value);
  };

  const handleBgColorSelect = () => {
    backgroundPickerRef.current?.click();
  }
  return (
    <div
        title="Backgrouund Paint"
      className="bolder-formater"
      style={{
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        padding: ".2rem .4rem",
        userSelect: "none",
        borderRadius: ".4rem",
        
      }}
    >
      <button onClick={() => handleBucketClick()} style={{display: 'flex', cursor: 'pointer', flexDirection: 'column', alignItems: 'center', gap: '.1rem', border: 'none', background: 'none'}}>
        <PaintBucket size={20} calcMode={3} />
        <input
          ref={backgroundPickerRef}
          type="color"
          style={{
            height: ".3rem",
            width: "1.2rem",
            pointerEvents: "none",
          }}
          onChange={(e) => handleBackground(e)}
        />
      </button>

      <ArrowDownSquare size={15} onClick={() => handleBgColorSelect()}/>
    </div>
  );
}
