import { Underline } from "lucide-react";
import { handleCellUnderline } from "../spreadSheetLogic";

export function UnderlineButton() {
  return (
    <button
      title="Underline (Ctrl+U)"
      onClick={handleCellUnderline}
      className="spread-tool-btn"
    >
      <Underline size={16} />
    </button>
  );
}
