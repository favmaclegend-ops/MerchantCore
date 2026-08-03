import { handleCellBold } from "../spreadContext";

export function BoldButton() {
  return (
    <button
      className="bolder-formater"
      style={{
        cursor: "pointer",
        borderRadius: ".2rem",
        padding: ".2rem .4rem",
        userSelect: "none",
        border: "none",
      }}
      onClick={() => handleCellBold()}
    >
      B
    </button>
  );
}
