import { Italic } from "lucide-react";
import { handleCellItalic } from "../spreadSheetLogic";

export function ItalicButton() {
  return (
    <button
      title="Italic (Ctrl+I)"
      onClick={handleCellItalic}
      className="spread-tool-btn"
    >
      <Italic size={16} />
    </button>
  );
}
