import { lazy, useState, type ChangeEvent } from "react";
import "./spread.css";
import { useStore } from "elk-components";
import { spreadSheetStore } from "@/context/store";
import { getCurrenCell } from "./spreadContext";

const SpreadSheetReabon = lazy(() =>
  import("@/pages/spreadsheet/SpreadSheetReabon").then((m) => ({
    default: m.SpreadSheetReabon,
  })),
);

const totalColumns = 52;
const totalRows = 100;

const alphabet = [
  "A",
  "B",
  "C",
  "D",
  "E",
  "F",
  "G",
  "H",
  "I",
  "J",
  "K",
  "L",
  "M",
  "N",
  "O",
  "P",
  "Q",
  "R",
  "S",
  "T",
  "U",
  "V",
  "W",
  "X",
  "Y",
  "Z",
];
const generatedColumns = [];
const generatedRows = [];

function getColumnName(index) {
  let columnName = "";
  let num = index;
  while (num >= 0) {
    columnName = alphabet[num % 26] + columnName;
    num = Math.floor(num / 26) - 1;
  }
  return columnName;
}

function generateSpreadsheetGrid() {
  for (let c = 0; c < totalColumns; c++) {
    generatedColumns.push(getColumnName(c));
  }
  for (let r = 1; r <= totalRows; r++) {
    generatedRows.push(r);
  }
}

generateSpreadsheetGrid();

// =====================================================
//  NEXT ROW
// ====================================================
const handleNextRow = (e: KeyboardEvent) => {
  e?.stopPropagation?.();
  const target = e.currentTarget as HTMLInputElement;
  if (e.key == "Enter") {
    if (target.value.startsWith("=")) return;

    target.blur();
    const parent = target.parentElement.parentElement;

    const nextLineInput = parent?.nextElementSibling?.children[1]
      ?.children[0] as HTMLInputElement;

    nextLineInput.focus();
  }
};




// NOT YET OPTIMISE
export function SpreadSheetPage() {
  useStore(spreadSheetStore);
  const [currentCellRow, setCurrentCellRow] = useState(0);
  const [currentCellColumn, setCurrentCellColumn] = useState(0);
  const [cellValue, setCellValue] = useState("");

  const handleCellValue = (e: ChangeEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    setCellValue(target?.value);
  };

  return (
    <>
      <SpreadSheetReabon value={cellValue} />
      <div style={{ overflowX: "auto", height: "100%", overflowY: "auto" }}>
        <table

          style={{
            width: "100%",
            borderTop: '1px solid red',
            minWidth: "680px",
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
              <th style={{ width: "10rem" }}>
                <div
                  style={{ width: "4rem", padding: ".5rem 1rem" }}
                >{`${generatedColumns[currentCellColumn]}${generatedRows[currentCellRow]}`}</div>
              </th>
              {generatedColumns.map((colName, key) => (
                <th style={{  }} key={key}>
                  {colName}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {generatedRows.map((rowNum, row) => (
              <tr key={rowNum}>
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

                {generatedColumns.map((colName, col) => (
                  <td key={colName + "_" + rowNum}>
                    <input
                      id={`${colName}${rowNum}`}
                      className="spread-cell"
                      style={{
                        background: "var(--default-spreadsheet-bg)",
                        color: "var(--default-spreadsheet-txt)",
                        width: "10rem",
                        padding: ".5rem",
                        border: "1px solid #5b5b5b39",
                        outline: "none",
                      }}

                      onFocus={(e) => {
                        setCurrentCellRow(row);
                        setCurrentCellColumn(col);
                        handleCellValue(e.currentTarget && e);
                        getCurrenCell(e as unknown as FocusEvent)
                      }}



                      onChange={(e) => e.currentTarget && handleCellValue(e)}
                      onKeyDown={(e) =>
                        handleNextRow(e as unknown as KeyboardEvent)
                      }
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
