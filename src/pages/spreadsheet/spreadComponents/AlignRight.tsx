import { AlignRightIcon } from "lucide-react";
import { alignCellTextRight } from "../spreadContext";

export function AlignRightButton() {
  return (
    <button
        title="Align Right"
      onClick={alignCellTextRight}
      style={{ cursor: "pointer", background: "none", border: "none" }}
    >
      <AlignRightIcon />
    </button>
  );
}
