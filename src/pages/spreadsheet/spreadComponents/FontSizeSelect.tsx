import { type ChangeEvent } from "react";
import { handleCellFontSize } from "../spreadSheetLogic";

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32];

export function FontSizeSelect() {
  const handleFontSize = (e: ChangeEvent<HTMLSelectElement>) => {
    handleCellFontSize(Number(e.currentTarget.value));
  };

  return (
    <select
      title="Font size"
      defaultValue="14"
      onChange={handleFontSize}
      className="spread-tool-select"
    >
      {FONT_SIZES.map((size) => (
        <option key={size} value={size}>
          {size}
        </option>
      ))}
    </select>
  );
}
