import { spreadSheetStore } from "@/context/store";
import { PaintBucket } from "lucide-react";
import { BoldButton } from "./spreadComponents/BoldButton";
import type { ChangeEvent } from "react";
import { ColorFormatButton } from "./spreadComponents/ColorFormatButton";

interface SSR {
  value: string;
}
export function SpreadSheetReabon({ value }: SSR) {
  const handleCellValueChange = (e: ChangeEvent) => {
    const formLuarInput = e?.currentTarget as HTMLInputElement;
    spreadSheetStore.setState({ formularValue: formLuarInput.value });
  };

  return (
    <>
      <div
        style={{
          width: "100%",
          display: "flex",
          flexDirection: "column",
          padding: "1rem .5rem",
          borderBottom: '1px solid grey'
        }}
      >
        {/**Formatter ==================================================== */}
        <div style={{ display: "flex", width: "100%", gap: "1rem" }}>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ".5rem",
              minWidth: "5rem",
            }}
          >
            {/** Bold Button =============================== */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <BoldButton />
              <ColorFormatButton />

              <div
                className="bolder-formater"
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  padding: ".2rem .4rem",
                  userSelect: "none",
                  borderRadius: ".4rem",
                }}
              >
                <PaintBucket size={20} calcMode={3} />
                <div
                  style={{
                    width: "1rem",
                    height: ".2rem",
                    background: "black",
                  }}
                ></div>
              </div>
            </div>
            <span
              style={{
                color: "grey",
                alignSelf: "center",
                fontWeight: "900",
                fontSize: ".9rem",
              }}
            >
              Format
            </span>
          </div>
        </div>

        <div
          style={{ display: "flex", flexDirection: "column", width: "100%" }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <span>Formular: </span>
            <input
              style={{
                display: "flex",
                alignItems: "center",
                background: "#4e4e4e34",
                color: "var(--default-spreadsheet-txt)",
                outline: "none",
                width: "50%",
                height: "2rem",
                padding: ".6rem",
                border: "var(--border-input)",
                borderRadius: ".2rem",
              }}
              value={value || ""}
              onChange={(e) => e.currentTarget && handleCellValueChange(e)}
            />
          </div>
        </div>
      </div>
    </>
  );
}
