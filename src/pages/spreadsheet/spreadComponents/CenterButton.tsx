import { AlignCenter,  } from "lucide-react";
import { centerCellText } from "../spreadContext";

export function CenterButton() {
  return (
    <button
    title="Center"
      onClick={centerCellText}
      style={{ cursor: "pointer", background: "none", border: "none" }}
    >
      <AlignCenter />
    </button>
  );
}
