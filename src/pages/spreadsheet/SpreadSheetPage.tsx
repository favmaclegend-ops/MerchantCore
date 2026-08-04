import { memo } from "react";
import "./spread.css";
import { useStore } from "elk-components";
import { spreadSheetStore } from "@/context/store";
import { SpreadSheetReabon } from "./SpreadSheetReabon";
import { FillHandle } from "./FillHandle";
import {
  COLUMN_NAMES,
  ROW_NUMBERS,
  Cells,
  deactivateMultiSelection,
  getCellId,
  getCurrentSelectionRange,
  handleMultiSelection,
  handleMultiSelectionActivation,
  handleSpreadCellBlur,
  handleSpreadCellFocus,
  handleSpreadSheetKeyDown,
  handleSpreadSheetValueChange,
  startBlockDrag,
  stopBlockDrag,
} from "./spreadSheetLogic";
import { useEffect } from "react";

function CellPositionBadge() {
  const { currentRow, currentColumn } = useStore(spreadSheetStore);
  return (
    <span>{getCurrentSelectionRange(currentRow, currentColumn)}</span>
  );
}

const SpreadSheetTable = memo(function SpreadSheetTable() {
  useEffect(() => stopBlockDrag, []);
  return (
    <div
      id="spreadsheet-scroll-container"
      style={{ overflowX: "auto", height: "100%", overflowY: "auto" }}
    >
      <table
        style={{
          width: "100%",
          
        }}
      >
        <thead>
          <tr
            style={{
              position: "sticky",
              top: 0,
              background: "var(--bg-page)",
              zIndex: "11",
            }}
          >
            <th
              style={{
                width: "10rem",
                position: "sticky",
                left: "0",
                zIndex: "11",
              }}
            >
              <div style={{ width: "4rem", padding: ".5rem 1rem" }}>
                <CellPositionBadge />
              </div>
            </th>
            {COLUMN_NAMES.map((colName, key) => (
              <th style={{}} key={key}>
                <div style={{ scrollMarginInlineEnd: "4rem" }}>{colName}</div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody style={{scrollMarginLeft: '1rem'}}>
          {ROW_NUMBERS.map((rowNum, row) => (
            <tr key={rowNum} id={String(rowNum)}>
              <td
                style={{
                  fontWeight: "bold",
                  position: "sticky",
                  left: "0",
                  textAlign: "center",
                  background: "var(--bg-page)",
                }}
              >
                {rowNum}
              </td>

              {COLUMN_NAMES.map((colName, col) => (
                <td key={colName + "_" + rowNum}>
                  <input
                    id={getCellId(col, row)}
                    className="spread-cell"
                    style={{
                      background: "var(--default-spreadsheet-bg)",
                      color: "var(--default-spreadsheet-txt)",
                      width: "10rem",
                      padding: ".5rem",
                      border: "1px solid #5b5b5b39",
                      outline: "none",
                    }}
                    onFocus={(e) =>{ handleSpreadCellFocus(e, row, col); handleMultiSelection()}}
                    onBlur={handleSpreadCellBlur}
                    onChange={handleSpreadSheetValueChange}
                    onKeyDown={(e) => {handleSpreadSheetKeyDown(e); handleMultiSelectionActivation(e)}}
                    onKeyUp={() => deactivateMultiSelection()}
                    onMouseDown={(e) => {
                      const el = e.currentTarget;
                      if (
                        Cells.selectedElements.length > 1 &&
                        Cells.selectedElements.includes(el)
                      ) {
                        e.preventDefault();
                        startBlockDrag(el, e.ctrlKey || e.metaKey ? "copy" : "move");
                      }
                    }}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
});

export function SpreadSheetPage() {
  return (
    <>
      <SpreadSheetReabon />
      <SpreadSheetTable />
      <FillHandle />
    </>
  );
}
