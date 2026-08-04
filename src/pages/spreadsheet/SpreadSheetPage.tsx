import { memo } from "react";
import "./spread.css";
import { useStore } from "elk-components";
import { spreadSheetStore } from "@/context/store";
import { SpreadSheetReabon } from "./SpreadSheetReabon";
import {
  COLUMN_NAMES,
  ROW_NUMBERS,
  deactivateMultiSelection,
  getCellId,
  getColumnName,
  handleCellDragEnd,
  handleMultiSelection,
  handleMultiSelectionActivation,
  handleSpreadCellFocus,
  handleSpreadSheetKeyDown,
  handleSpreadSheetValueChange,
} from "./spreadContext";

function CellPositionBadge() {
  const { currentRow, currentColumn } = useStore(spreadSheetStore);
  return (
    <span>{`${getColumnName(currentColumn)}${ROW_NUMBERS[currentRow]}`}</span>
  );
}

const SpreadSheetTable = memo(function SpreadSheetTable() {
  return (
    <div style={{ overflowX: "auto", height: "100%", overflowY: "auto" }}>
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
                    draggable
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
                    onChange={handleSpreadSheetValueChange}
                    onKeyDown={(e) => {handleSpreadSheetKeyDown(e); handleMultiSelectionActivation(e)}}
                    onKeyUp={() => deactivateMultiSelection()}
                    onDragEnd={handleCellDragEnd}

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
    </>
  );
}
