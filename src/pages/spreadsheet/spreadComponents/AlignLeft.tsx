import { AlignLeftIcon } from "lucide-react";
import { alignCellTextLeft } from "../spreadContext";

export function AlignLeft() {
  return (
    <button title="Align Left" onClick={alignCellTextLeft} style={{cursor: 'pointer', background: 'none', border: 'none'}}>
      <AlignLeftIcon />
    </button>
  );
}
