import { useStore } from "elk-components";
import { type ChangeEvent } from "react";
import { spreadSheetStore } from "@/context/store";
import { BoldButton } from "./spreadComponents/BoldButton";
import { ColorFormatButton } from "./spreadComponents/ColorFormatButton";
import { BackgroundBucket } from "./spreadComponents/BackgroundBucket";
import { AlignLeft } from "./spreadComponents/AlignLeft";
import { CenterButton } from "./spreadComponents/CenterButton";
import { AlignRightButton } from "./spreadComponents/AlignRight";
import { ItalicButton } from "./spreadComponents/ItalicButton";
import { UnderlineButton } from "./spreadComponents/UnderlineButton";
import { StrikethroughButton } from "./spreadComponents/StrikethroughButton";
import { FontSizeSelect } from "./spreadComponents/FontSizeSelect";
import { ClearFormatButton } from "./spreadComponents/ClearFormatButton";

export function SpreadSheetReabon() {
  const { formularValue } = useStore(spreadSheetStore);

  const handleCellValueChange = (e: ChangeEvent) => {
    const formLuarInput = e.currentTarget as HTMLInputElement;
    spreadSheetStore.setState({ formularValue: formLuarInput.value });
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        flexDirection: "column",
        padding: "1rem .5rem",
        borderBottom: "1px solid grey",
        gap: "1rem",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          flexWrap: "wrap",
        }}
      >
        {/** Formatter ==================================================== */}
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
          <BoldButton />
          <ItalicButton />
          <UnderlineButton />
          <StrikethroughButton />
          <FontSizeSelect />
          <span
            style={{
              color: "grey",
              fontWeight: "900",
              fontSize: ".9rem",
              marginInlineStart: ".5rem",
            }}
          >
            Format
          </span>
        </div>

        {/** Colors ==================================================== */}
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
          <ColorFormatButton />
          <BackgroundBucket />
        </div>

        {/** Alignment ==================================================== */}
        <div style={{ display: "flex", alignItems: "center", gap: ".4rem" }}>
          <AlignLeft />
          <CenterButton />
          <AlignRightButton />
          <span
            style={{
              color: "grey",
              fontWeight: "900",
              fontSize: ".9rem",
              marginInlineStart: ".5rem",
            }}
          >
            Alignment
          </span>
        </div>

        <ClearFormatButton />
      </div>

      <div style={{ display: "flex", flexDirection: "column", width: "100%" }}>
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
            value={formularValue || ""}
            onChange={(e) => e.currentTarget && handleCellValueChange(e)}
          />
        </div>
      </div>
    </div>
  );
}
