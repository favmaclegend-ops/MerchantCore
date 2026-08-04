import { useRef, type ChangeEvent } from "react";
import { handleCellTextColor } from "../spreadSheetLogic";
import { ArrowDownSquare } from "lucide-react";

export function ColorFormatButton() {
  const colorPickerRef = useRef<HTMLInputElement>(null);

  const handleColorClick = () => {
    const colorPicker = colorPickerRef?.current;
    colorPicker?.click();
  };

  const handleColorChange = (e: ChangeEvent) => {
    const targetColor = e?.currentTarget as HTMLInputElement;
    handleCellTextColor(targetColor?.value);
  };

  const handleClickColorChange = () => {
    const targetColor = colorPickerRef?.current;
    if (targetColor) handleCellTextColor(targetColor.value);
  };
  return (
    <div
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
                <button
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    border: "none",
                  }}
                  onClick={() => handleClickColorChange()}
                >
                  <span>A</span>
                  <input
                    ref={colorPickerRef}
                    type="color"
                    style={{
                      height: ".3rem",
                      width: "1.2rem",
                      pointerEvents: "none",
                    }}
                    onChange={(e) => handleColorChange(e)}
                  />
                </button>

                <ArrowDownSquare
                  size={15}
                  style={{ margin: 0 }}
                  onClick={() => handleColorClick()}
                />
              </div>
  );
}
