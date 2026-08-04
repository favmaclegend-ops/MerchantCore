import { spreadSheetStore } from "@/context/store";
import type { ChangeEvent, DragEvent, FocusEvent, KeyboardEvent } from "react";

export const TOTAL_ROWS = 100;
export const TOTAL_COLUMNS = 52;

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export const COLUMN_NAMES: string[] = Array.from(
  { length: TOTAL_COLUMNS },
  (_, i) => getColumnName(i),
);

export const ROW_NUMBERS: number[] = Array.from(
  { length: TOTAL_ROWS },
  (_, i) => i + 1,
);

export function getColumnName(index: number): string {
  let columnName = "";
  let num = index;
  while (num >= 0) {
    columnName = ALPHABET[num % 26] + columnName;
    num = Math.floor(num / 26) - 1;
  }
  return columnName;
}

export const getCellId = (col: number, row: number) =>
  `${COLUMN_NAMES[col]}${row + 1}`;

export class Cells {
  static currentCell: HTMLInputElement | null = null;
  static selectedElements: HTMLInputElement[] = [];
  static oldSlectedElements: HTMLInputElement[] = [];
  static oldSlectedElementsStyleBackground: string[] = [];
  static oldSlectedElementsStyleBorder: string[] = [];
  static oldSlectedBorderElements: HTMLInputElement[] = [];
  static isSelectionActive: boolean = false;

  static initialSelectionColumn: number;
  static initialSelectionRow: number;

  static setCurrentCell = (e: FocusEvent<HTMLInputElement>) => {
    Cells.currentCell = e.currentTarget;
  };

  static getCurrentCell = () => Cells.currentCell;
  static setSelection = (selection: HTMLInputElement[]) => {
    Cells.selectedElements = selection;
  };
  static getSelection = () => Cells.selectedElements;
}

// =====================================================
//  FOCUS / VALUE SYNC (never triggers a grid re-render)
// =====================================================
export const handleSpreadCellFocus = (
  e: FocusEvent<HTMLInputElement>,
  row: number,
  col: number,
) => {
  Cells.setCurrentCell(e);
  Cells.setSelection([e as unknown as HTMLInputElement]);

  spreadSheetStore.setState({
    currentRow: row,
    currentColumn: col,
    formularValue: e.currentTarget.value,
  });
};

export const handleSpreadSheetValueChange = (
  e: ChangeEvent<HTMLInputElement>,
) => {
  spreadSheetStore.setState({ formularValue: e.currentTarget.value });
};

export const focusCell = (row: number, col: number) => {
  const targetRow = Math.min(Math.max(row, 0), TOTAL_ROWS - 1);
  const targetCol = Math.min(Math.max(col, 0), TOTAL_COLUMNS - 1);
  const input = document.getElementById(
    getCellId(targetCol, targetRow),
  ) as HTMLInputElement | null;
  input?.focus();
  if (input) {
    Cells.currentCell = input;
    spreadSheetStore.setState({
      currentRow: targetRow,
      currentColumn: targetCol,
      formularValue: input.value,
    });
  }
};

export const handleCellDragEnd = (e: DragEvent<HTMLInputElement>) => {
  const target = e.currentTarget;
  const currentCell = Cells.getCurrentCell();
  if (!currentCell || !target) return;
  currentCell.value = target.value;
  target.value = "";
  spreadSheetStore.setState({ formularValue: currentCell.value });
};

// =====================================================
//  KEYBOARD NAVIGATION + SHORTCUTS
// =====================================================
export const handleSpreadSheetKeyDown = (
  e: KeyboardEvent<HTMLInputElement>,
) => {
  const target = e.currentTarget;

  if (e.ctrlKey && !e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case "b":
        e.preventDefault();
        handleCellBold();
        return;
      case "i":
        e.preventDefault();
        handleCellItalic();
        return;
      case "u":
        e.preventDefault();
        handleCellUnderline();
        return;
      case "5":
        e.preventDefault();
        handleCellStrikethrough();
        return;
      case "l":
        e.preventDefault();
        alignCellTextLeft();
        return;
      case "r":
        e.preventDefault();
        alignCellTextRight();
        return;
      case "e":
        e.preventDefault();
        centerCellText();
        return;
    }
  }

  const { currentRow, currentColumn } = spreadSheetStore.getState();
  const row = currentRow;
  const col = currentColumn;

  switch (e.key) {
    case "Enter": {
      e.preventDefault();
      if (target.value.trim().startsWith("=")) {
        commitFormula(target);
        return;
      }
      if (row + 1 < TOTAL_ROWS) {
        const nextRow = row + 1;
        for (let c = 0; c < TOTAL_COLUMNS; c++) {
          const cell = document.getElementById(
            getCellId(c, nextRow),
          ) as HTMLInputElement | null;
          if (cell && cell.value === "") {
            focusCell(nextRow, c);
            return;
          }
        }
        focusCell(nextRow, 0);
      }
      return;
    }
    case "ArrowDown":
      e.preventDefault();
      focusCell(row + 1, col);
      return;
    case "ArrowUp":
      e.preventDefault();
      focusCell(row - 1, col);
      return;
    case "Escape":
      e.preventDefault();
      target.blur();
      return;
  }
};

// =====================================================
//  FORMATTING HELPERS (operate on the focused cell DOM)
// =====================================================
export const handleCellBold = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.fontWeight =
    currentCell.style.fontWeight === "bold" ? "normal" : "bold";
  currentCell.focus();
};

export const handleCellItalic = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.fontStyle =
    currentCell.style.fontStyle === "italic" ? "normal" : "italic";
  currentCell.focus();
};

export const handleCellUnderline = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  const hasUnderline =
    currentCell.style.textDecorationLine.includes("underline");
  const hasStrike =
    currentCell.style.textDecorationLine.includes("line-through");
  const parts: string[] = [];
  if (hasStrike) parts.push("line-through");
  if (!hasUnderline) parts.push("underline");
  currentCell.style.textDecorationLine = parts.join(" ") || "none";
  currentCell.focus();
};

export const handleCellStrikethrough = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  const hasStrike =
    currentCell.style.textDecorationLine.includes("line-through");
  const hasUnderline =
    currentCell.style.textDecorationLine.includes("underline");
  const parts: string[] = [];
  if (hasUnderline) parts.push("underline");
  if (!hasStrike) parts.push("line-through");
  currentCell.style.textDecorationLine = parts.join(" ") || "none";
  currentCell.focus();
};

export const handleCellTextColor = (color: string) => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.color = color;
  currentCell.focus();
};

export const handleCellBackgroundColor = (bg: string) => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.background = bg;
  currentCell.focus();
};

export const alignCellTextLeft = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.textAlign = "left";
  currentCell.focus();
};

export const alignCellTextRight = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.textAlign = "right";
  currentCell.focus();
};

export const centerCellText = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.textAlign = "center";
  currentCell.focus();
};

export const handleCellFontSize = (size: number) => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.fontSize = `${size}px`;
  currentCell.focus();
};

export const handleClearFormatting = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  currentCell.style.fontWeight = "";
  currentCell.style.fontStyle = "";
  currentCell.style.textDecorationLine = "";
  currentCell.style.fontSize = "";
  currentCell.style.textAlign = "";
  currentCell.style.color = "";
  currentCell.style.background = "var(--default-spreadsheet-bg)";
  currentCell.focus();
};

// =====================================================
//  BASIC FORMULA EVALUATOR (=A1+B2*3 ...)
// =====================================================
const NUMBER_RE = /[0-9]+(?:\.[0-9]+)?/;
const CELL_REF_RE = /[A-Za-z]+[0-9]+/;

interface ParserState {
  src: string;
  pos: number;
}

function skipWhitespace(p: ParserState) {
  while (p.pos < p.src.length && /\s/.test(p.src[p.pos])) p.pos += 1;
}

function colNameToIndex(name: string): number {
  let index = 0;
  for (let i = 0; i < name.length; i++) {
    index = index * 26 + (name.charCodeAt(i) - 64);
  }
  return index - 1;
}

function parseExpression(src: string, seen: Set<string>): number | null {
  const p: ParserState = { src, pos: 0 };
  const value = parseAddSub(p, seen);
  if (value === null) return null;
  skipWhitespace(p);
  return p.pos === p.src.length ? value : null;
}

function parseAddSub(p: ParserState, seen: Set<string>): number | null {
  let value = parseMulDiv(p, seen);
  if (value === null) return null;
  for (;;) {
    skipWhitespace(p);
    const ch = p.src[p.pos];
    if (ch === "+" || ch === "-") {
      p.pos += 1;
      const rhs = parseMulDiv(p, seen);
      if (rhs === null) return null;
      value = ch === "+" ? value + rhs : value - rhs;
    } else {
      break;
    }
  }
  return value;
}

function parseMulDiv(p: ParserState, seen: Set<string>): number | null {
  let value = parseFactor(p, seen);
  if (value === null) return null;
  for (;;) {
    skipWhitespace(p);
    const ch = p.src[p.pos];
    if (ch === "*" || ch === "/") {
      p.pos += 1;
      const rhs = parseFactor(p, seen);
      if (rhs === null) return null;
      value = ch === "*" ? value * rhs : value / rhs;
    } else {
      break;
    }
  }
  return value;
}

function parseFactor(p: ParserState, seen: Set<string>): number | null {
  skipWhitespace(p);
  if (p.pos >= p.src.length) return null;
  const ch = p.src[p.pos];
  if (ch === "(") {
    p.pos += 1;
    const value = parseAddSub(p, seen);
    skipWhitespace(p);
    if (value === null || p.pos >= p.src.length || p.src[p.pos] !== ")") {
      return null;
    }
    p.pos += 1;
    return value;
  }
  if (ch === "-") {
    p.pos += 1;
    const value = parseFactor(p, seen);
    return value === null ? null : -value;
  }
  if (ch === "+") {
    p.pos += 1;
    return parseFactor(p, seen);
  }
  const number = tryParseNumber(p);
  if (number !== null) return number;
  return tryParseCellRef(p, seen);
}

function tryParseNumber(p: ParserState): number | null {
  const rest = p.src.slice(p.pos);
  const match = NUMBER_RE.exec(rest);
  if (match && match.index === 0) {
    p.pos += match[0].length;
    return Number(match[0]);
  }
  return null;
}

function tryParseCellRef(p: ParserState, seen: Set<string>): number | null {
  const rest = p.src.slice(p.pos);
  const match = CELL_REF_RE.exec(rest);
  if (!match || match.index !== 0) return null;
  p.pos += match[0].length;
  const id = match[0].toUpperCase();
  const colIndex = colNameToIndex(id.replace(/[0-9]/g, ""));
  const rowNumber = Number(id.replace(/[^0-9]/g, ""));
  if (colIndex < 0 || colIndex >= TOTAL_COLUMNS) return null;
  if (rowNumber < 1 || rowNumber > TOTAL_ROWS) return null;
  const input = document.getElementById(id) as HTMLInputElement | null;
  if (!input) return null;
  const raw = input.value.trim();
  if (raw === "") return 0;
  if (raw.startsWith("=")) {
    if (seen.has(id)) return null;
    seen.add(id);
    const value = parseExpression(raw.slice(1), seen);
    seen.delete(id);
    return value;
  }
  const numeric = Number(raw);
  return Number.isFinite(numeric) ? numeric : null;
}

export function evaluateFormula(expression: string): string | null {
  if (!expression.startsWith("=")) return null;
  const body = expression.slice(1).trim();
  if (body === "") return "";
  const value = parseExpression(body, new Set<string>());
  if (value === null) return null;
  const rounded = Math.round(value * 1e10) / 1e10;
  return String(rounded);
}

const commitFormula = (input: HTMLInputElement) => {
  const result = evaluateFormula(input.value);
  if (result !== null) {
    input.value = result;
    spreadSheetStore.setState({ formularValue: result });
  }
};

export function handleMultiSelectionActivation(e: KeyboardEvent) {
  if (e.shiftKey) {
    Cells.isSelectionActive = true;
  }
}

export const deactivateMultiSelection = () => {
  Cells.isSelectionActive = false;
};

/**
 * Multi input selection
 * Enable users to select multiple cell
 */
export const handleMultiSelection = () => {
  //const target = e.currentTarget as HTMLInputElement
  const spreadStore = spreadSheetStore.getState();
  let seletedCell = [];

  if (!Cells.isSelectionActive) {
    Cells.initialSelectionColumn = spreadStore.currentColumn;
    Cells.initialSelectionRow = spreadStore.currentRow;
    seletedCell = [];
    resetCellSelet();
  }

  if (Cells.isSelectionActive) {
    const initCol = Cells.initialSelectionColumn;
    const initRow = Cells.initialSelectionRow;
    const finalColumn = spreadStore.currentColumn;
    const finalRow = spreadStore.currentRow;

    for (
      let i = initRow;
      initRow > finalRow ? i >= finalRow : i <= finalRow;
      initRow > finalRow ? i-- : i++
    ) {
      for (
        let j = initCol;
        initCol > finalColumn ? j >= finalColumn : j <= finalColumn;
        initCol > finalColumn ? j-- : j++
      ) {
        const columnN = getColumnName(j);
        const id = `${columnN}${i + 1}`;
        const el = document.getElementById(id) as HTMLInputElement;

        // flip: check for backward selection

        if (
          // if initial row is greaterthan the final row
          initRow > finalRow
            ? // Then: we check if i is equals to the final row we set the borderTop of the cell in the finalrow which is the biginning.
              i == finalRow
            : // else: The inverse which is the forward selection
              i == initRow
        ) {
          Cells.oldSlectedElementsStyleBorder.push(el.style.border); // Store previouse border of that cell for reseting purpose
          Cells.oldSlectedBorderElements.push(el);
          el.style.borderTop = "2px solid green";
        }

        if (
          // Same Condition as previous but setting the border at the bottom
          initRow > finalRow
            ? // set the border at the bottom of the initRow which is the ending
              i == initRow
            : i == finalRow
        ) {
          Cells.oldSlectedElementsStyleBorder.push(el.style.border);
          Cells.oldSlectedBorderElements.push(el);
          el.style.borderBottom = "2px solid green";
        }

        // Same logic but for column
        if (initCol > finalColumn ? j == finalColumn : j == initCol) {
          Cells.oldSlectedElementsStyleBorder.push(el.style.border);
          Cells.oldSlectedBorderElements.push(el);
          el.style.borderLeft = "2px solid green";
        }
        if (initCol > finalColumn ? j == initCol : j == finalColumn) {
          Cells.oldSlectedElementsStyleBorder.push(el.style.border);
          Cells.oldSlectedBorderElements.push(el);
          console.log(el.style.borderRight)
          el.style.borderRight = "2px solid green";
        }
        seletedCell.push(el);
      }
    }

    Cells.selectedElements = seletedCell;
    resetCellSelet();

    Cells.selectedElements.forEach((element) => {
      Cells.oldSlectedElementsStyleBackground.push(element.style.background);
      element.style.background = "#7575754e";
      Cells.oldSlectedElements = Cells.selectedElements;
    });
  }
};

// reset selection
function resetCellSelet() {
  if (Cells.oldSlectedElements.length !== 0) {

    Cells.oldSlectedElements.forEach((el, key) => {
      el.style.background = Cells.oldSlectedElementsStyleBackground[key];
    });

    Cells.oldSlectedBorderElements.forEach((el, key) => {
      
      el.style.border = Cells?.oldSlectedElementsStyleBorder[key];
    });
    // el.style.border = Cells.oldSlectedElementsStyleBorder?.[key]
    Cells.oldSlectedElementsStyleBackground = [];
    Cells.oldSlectedElementsStyleBorder = [];
    Cells.oldSlectedBorderElements = []
  }
}
