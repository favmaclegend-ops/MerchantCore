import { Strikethrough } from "lucide-react";
import { handleCellStrikethrough } from "../spreadContext";

export function StrikethroughButton() {
  return (
    <button
      title="Strikethrough (Ctrl+5)"
      onClick={handleCellStrikethrough}
      className="spread-tool-btn"
    >
      <Strikethrough size={16} />
    </button>
  );
}
