import { Eraser } from "lucide-react";
import { handleClearFormatting } from "../spreadContext";

export function ClearFormatButton() {
  return (
    <button
      title="Clear formatting"
      onClick={handleClearFormatting}
      className="spread-tool-btn"
    >
      <Eraser size={16} />
    </button>
  );
}
