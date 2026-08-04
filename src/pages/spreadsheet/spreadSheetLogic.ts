/**
 * spreadSheetLogic.ts
 * ----------------------------------------------------------------
 * Single source of truth for the spreadsheet: model, formulas, selection,
 * formatting, auto-fill, clipboard and drag-move.
 *
 *   - `SpreadsheetModel` keeps raw content + computed value + formatting per
 *     cell, tracks formula dependencies and recalculates live.
 *   - Excel formulas (relative / absolute / mixed refs, SUM ranges, ...) are
 *     evaluated with `hot-formula-parser`, with our own recursion so chained
 *     formulas (A1 = "=B1+1") resolve transitively.
 *   - Pure helpers (A1 notation, series inference, fill, shift) are exported
 *     so they stay reusable and unit-testable without a DOM.
 */
import { Parser } from "hot-formula-parser";
import { spreadSheetStore } from "@/context/store";
import type { ChangeEvent, FocusEvent, KeyboardEvent } from "react";

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

// ===========================================================================
// A1-notation helpers
// ===========================================================================

/** 0 -> "A", 25 -> "Z", 26 -> "AA". */
export function getColumnName(index: number): string {
  let columnName = "";
  let num = index;
  while (num >= 0) {
    columnName = ALPHABET[num % 26] + columnName;
    num = Math.floor(num / 26) - 1;
  }
  return columnName;
}

/** "A" -> 0, "Z" -> 25, "AA" -> 26. */
export function colNameToIndex(name: string): number {
  let index = 0;
  for (let i = 0; i < name.length; i++) {
    index = index * 26 + (name.charCodeAt(i) - 64);
  }
  return index - 1;
}

export const getCellId = (col: number, row: number) =>
  `${getColumnName(col)}${row + 1}`;

/** Parses "A1" -> { col: 0, row: 0 }. Returns null for invalid ids. */
export function parseCellId(id: string): CellCoord | null {
  const match = /^([A-Za-z]+)([0-9]+)$/.exec(id.trim());
  if (!match) return null;
  return {
    col: colNameToIndex(match[1].toUpperCase()),
    row: Number(match[2]) - 1,
  };
}

/** A 0-based cell coordinate: row 0 = row 1, col 0 = column A. */
export interface CellCoord {
  row: number;
  col: number;
}

/** Abstraction over the cell data source (used by fill/evaluation). */
export interface Grid {
  getValue(row: number, col: number): string;
  setValue(row: number, col: number, value: string): void;
}

/**
 * Builds a spreadsheet range label from two cell coordinates.
 * A single cell renders as "A1"; a multi-cell selection renders as "A1:B2"
 * (always normalized to the top-left and bottom-right corners).
 */
export function getCellRange(
  startCol: number,
  startRow: number,
  endCol: number,
  endRow: number,
): string {
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  if (minRow === maxRow && minCol === maxCol) {
    return getCellId(minCol, minRow);
  }
  return `${getCellId(minCol, minRow)}:${getCellId(maxCol, maxRow)}`;
}

/**
 * Returns the range label for the current selection: from the anchor cell
 * (where the selection started) to the current cell. Falls back to the current
 * cell alone when no anchor has been set yet.
 */
export function getCurrentSelectionRange(
  currentRow: number,
  currentColumn: number,
): string {
  const initialCol = Cells.initialSelectionColumn;
  const initialRow = Cells.initialSelectionRow;

  if (initialCol === undefined || initialRow === undefined) {
    return getCellId(currentColumn, currentRow);
  }

  return getCellRange(initialCol, initialRow, currentColumn, currentRow);
}

// ===========================================================================
// Auto-fill series (pattern) detection
// ===========================================================================

const NUMBER_RE = /^[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?$/;

function isNumeric(value: string): boolean {
  return NUMBER_RE.test(value.trim());
}

const TRAILING_NUMBER_RE = /^(.*?)([-+]?\d+(?:\.\d+)?)$/;

function parseTrailingNumber(
  value: string,
): { prefix: string; number: number } | null {
  const match = TRAILING_NUMBER_RE.exec(value);
  if (!match) return null;
  return { prefix: match[1], number: Number(match[2]) };
}

/**
 * A "series" is a function that produces the value to fill given:
 *   - `relativeIndex`: the position inside the source block (0..blockSize-1)
 *   - `blockOffset`:   how many whole blocks away from the source block
 *   - `blockSize`:     the size of the source block along the fill axis
 */
export type FillSeries = (
  relativeIndex: number,
  blockOffset: number,
  blockSize: number,
) => string;

function isUniformStep(steps: number[]): boolean {
  return steps.length > 0 && steps.every((s) => s === steps[0]);
}

/**
 * Detects the fill pattern for a sequence of source values, e.g.:
 *   ["5","5"]            -> constant 5
 *   ["1","2"]            -> arithmetic step +1  (next: 3, 4, ...)
 *   ["Item 1","Item 2"]  -> text + trailing number (next: Item 3)
 *   ["2024-01-01", ...]  -> dates (next day/month...)
 * Returns null when no pattern is found (the caller repeats the block).
 */
export function inferSeries(values: string[]): FillSeries | null {
  if (values.length === 0) return null;

  const first = values[0];

  // 1. Constant value
  if (values.every((v) => v === first)) {
    return () => first;
  }

  // 2. Plain numbers with a constant difference
  if (values.every(isNumeric)) {
    const nums = values.map((v) => Number(v));
    const steps = nums.slice(1).map((n, i) => n - nums[i]);
    if (isUniformStep(steps)) {
      const step = steps[0];
      return (rel, block, size) => String(nums[rel] + block * size * step);
    }
    return null;
  }

  // 3. Text with a trailing number and constant difference
  const parts = values.map(parseTrailingNumber);
  if (parts.every((p) => p !== null)) {
    const parsed = parts as { prefix: string; number: number }[];
    const prefix = parsed[0].prefix;
    if (parsed.every((p) => p.prefix === prefix)) {
      const steps = parsed.slice(1).map((p, i) => p.number - parsed[i].number);
      if (isUniformStep(steps)) {
        const step = steps[0];
        return (rel, block, size) =>
          `${prefix}${parsed[rel].number + block * size * step}`;
      }
    }
    return null;
  }

  // 4. Dates with a constant difference
  const times = values.map((v) => new Date(v).getTime());
  if (times.every((t) => Number.isFinite(t))) {
    const steps = times.slice(1).map((t, i) => t - times[i]);
    if (isUniformStep(steps)) {
      const step = steps[0];
      return (rel, block, size) =>
        new Date(times[rel] + block * size * step).toLocaleDateString("en-CA");
    }
    return null;
  }

  return null;
}

// ===========================================================================
// Relative reference shifting (used when a formula is auto-filled / pasted)
// ===========================================================================

const CELL_REF_RE = /(\$?)([A-Za-z]+)(\$?)([0-9]+)/g;

/**
 * Moves every relative reference in a formula by (rowDelta, colDelta) when it
 * is copied from its source cell to a target cell, matching Excel.
 * Absolute references ($A$1, $A1, A$1) stay fixed.
 *
 * Note: a rare edge case like the function name LOG10(..) is also treated as
 * a reference (LOG + 10); it does not affect typical spreadsheets.
 */
export function shiftFormula(
  formula: string,
  rowDelta: number,
  colDelta: number,
): string {
  if (!formula.startsWith("=")) return formula;

  return formula.replace(
    CELL_REF_RE,
    (
      _full,
      absCol: string,
      colLetters: string,
      absRow: string,
      rowNum: string,
    ) => {
      const col = colNameToIndex(colLetters);
      const row = Number(rowNum) - 1;
      const newCol = absCol ? col : col + colDelta;
      const newRow = absRow ? row : row + rowDelta;
      return (
        (absCol ? "$" : "") +
        getColumnName(Math.max(newCol, 0)) +
        (absRow ? "$" : "") +
        String(Math.max(newRow, 0) + 1)
      );
    },
  );
}

// ===========================================================================
// Core auto-fill
// ===========================================================================

function fillOneCell(
  axisAnchor: number,
  coordinate: number,
  blockSize: number,
  other: number,
  axis: "row" | "col",
  blockValues: string[],
  series: FillSeries | null,
  grid: Grid,
): void {
  // Position of `coordinate` inside its source block (handles negative
  // coordinates for "fill upward/leftward" too).
  const rel = (((coordinate - axisAnchor) % blockSize) + blockSize) % blockSize;
  const srcCoordinate = axisAnchor + rel;
  const blockOffset = (coordinate - srcCoordinate) / blockSize;
  const srcValue = blockValues[rel];

  let value: string;
  if (srcValue.startsWith("=")) {
    // Formulas are never pattern-extended; their references are shifted.
    const delta = coordinate - srcCoordinate;
    value =
      axis === "row"
        ? shiftFormula(srcValue, delta, 0)
        : shiftFormula(srcValue, 0, delta);
  } else if (series) {
    value = series(rel, blockOffset, blockSize);
  } else {
    // No pattern: repeat the source value (block copy).
    value = srcValue;
  }

  if (axis === "row") grid.setValue(coordinate, other, value);
  else grid.setValue(other, coordinate, value);
}

/**
 * Fills the cells between the current selection (`anchor`..`source`) and the
 * `target` corner using Excel-style auto-fill:
 *   - numbers / dates / text+numbers become sequences,
 *   - formulas have their relative references shifted,
 *   - everything else is copied (block repeated).
 *
 * Supports filling down/up, right/left, and 2D (both directions at once).
 */
export function fillRange(
  anchor: CellCoord,
  source: CellCoord,
  target: CellCoord,
  grid: Grid,
): void {
  const aRow = Math.min(anchor.row, source.row);
  const aCol = Math.min(anchor.col, source.col);
  const sRow = Math.max(anchor.row, source.row);
  const sCol = Math.max(anchor.col, source.col);

  const rows = sRow - aRow + 1;
  const cols = sCol - aCol + 1;

  const rowStart = Math.min(target.row, aRow);
  const rowEnd = Math.max(target.row, sRow);
  const colStart = Math.min(target.col, aCol);
  const colEnd = Math.max(target.col, sCol);

  // 1. Vertical fill (down/up): extend each source column.
  for (let c = aCol; c <= sCol; c++) {
    const columnValues: string[] = [];
    for (let r = aRow; r <= sRow; r++) columnValues.push(grid.getValue(r, c));
    const series = inferSeries(columnValues);
    for (let r = rowStart; r <= rowEnd; r++) {
      if (r >= aRow && r <= sRow) continue; // source cells already have data
      fillOneCell(aRow, r, rows, c, "row", columnValues, series, grid);
    }
  }

  // 2. Horizontal fill (left/right): extend each row. Rows already filled in
  //    step 1 are used as the seed so 2D fills stay consistent.
  for (let r = rowStart; r <= rowEnd; r++) {
    const rowValues: string[] = [];
    for (let c = aCol; c <= sCol; c++) rowValues.push(grid.getValue(r, c));
    const series = inferSeries(rowValues);
    for (let c = colStart; c <= colEnd; c++) {
      if (c >= aCol && c <= sCol) continue;
      fillOneCell(aCol, c, cols, r, "col", rowValues, series, grid);
    }
  }
}

// ===========================================================================
// DOM integration helpers
// ===========================================================================

export function createDomGrid(): Grid {
  return {
    getValue: (row, col) =>
      (document.getElementById(getCellId(col, row)) as HTMLInputElement | null)
        ?.value ?? "",
    setValue: (row, col, value) => {
      const el = document.getElementById(
        getCellId(col, row),
      ) as HTMLInputElement | null;
      if (el) el.value = value;
    },
  };
}

/** Convenience wrapper that auto-fills directly into the rendered grid. */
export function autoFillCells(
  anchor: CellCoord,
  source: CellCoord,
  target: CellCoord,
): void {
  fillRange(anchor, source, target, createDomGrid());
}

// ===========================================================================
// Excel formula evaluation (DOM-backed, kept for tests / one-off use)
// ===========================================================================

function toNumberOrText(raw: string): number | string {
  const trimmed = raw.trim();
  if (trimmed === "") return 0;
  const num = Number(trimmed);
  return Number.isFinite(num) ? num : trimmed;
}

/**
 * Evaluates an Excel-style formula ("=SUM(A1:B2)", "=1+2*3", ...), reading
 * referenced cell values from `grid` (defaults to the spreadsheet DOM).
 * Returns the formatted result string, or null when the input is not a
 * formula or cannot be evaluated.
 */
export function evaluateExcelFormula(
  formula: string,
  grid?: Grid,
): string | null {
  if (!formula.startsWith("=")) return null;
  const body = formula.slice(1).trim();
  if (body === "") return "";

  const g = grid ?? createDomGrid();
  const parser = new Parser();

  parser.on("callCellValue", (cell, done) => {
    done(toNumberOrText(g.getValue(cell.row.index, cell.column.index)));
  });
  parser.on("callRangeValue", (start, end, done) => {
    const matrix: (number | string)[][] = [];
    for (let r = start.row.index; r <= end.row.index; r++) {
      const line: (number | string)[] = [];
      for (let c = start.column.index; c <= end.column.index; c++) {
        line.push(toNumberOrText(g.getValue(r, c)));
      }
      matrix.push(line);
    }
    done(matrix);
  });

  const parsed = parser.parse(body);
  if (parsed.error) return null;
  if (parsed.result === null || parsed.result === undefined) return null;
  if (typeof parsed.result === "number") {
    const rounded = Math.round(parsed.result * 1e10) / 1e10;
    return String(rounded);
  }
  return String(parsed.result);
}

// ===========================================================================
// Selection state
// ===========================================================================

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

  /** The input currently being edited (its value differs from the model). */
  static dirtyCell: HTMLInputElement | null = null;

  static setCurrentCell = (e: FocusEvent<HTMLInputElement>) => {
    Cells.currentCell = e.currentTarget;
  };

  static getCurrentCell = () => Cells.currentCell;
  static setSelection = (selection: HTMLInputElement[]) => {
    Cells.selectedElements = selection;
  };
  static getSelection = () => Cells.selectedElements;
}

// ===========================================================================
// Per-cell formatting
// ===========================================================================

/** Formatting tracked by the model. Undefined = use the sheet default. */
export interface CellStyle {
  fontWeight?: string;
  fontStyle?: string;
  textDecorationLine?: string;
  fontSize?: string;
  textAlign?: string;
  color?: string;
  background?: string;
}

const DEFAULT_BG = "var(--default-spreadsheet-bg)";
const DEFAULT_TXT = "var(--default-spreadsheet-txt)";
const HIGHLIGHT_BG = "#7575754e";

/** Applies a CellStyle to a rendered input, keeping selection highlight intact. */
function applyStyleToDom(el: HTMLInputElement, style: CellStyle): void {
  const elementIndex = Cells.oldSlectedElements.indexOf(el);

  el.style.fontWeight = style.fontWeight ?? "";
  el.style.fontStyle = style.fontStyle ?? "";
  el.style.textDecorationLine = style.textDecorationLine ?? "";
  el.style.fontSize = style.fontSize ?? "";
  el.style.textAlign = style.textAlign ?? "";
  el.style.color = style.color ?? DEFAULT_TXT;
  el.style.background = style.background ?? DEFAULT_BG;
  el.style.background = style.background ?? DEFAULT_BG;

  Cells.oldSlectedElementsStyleBackground[elementIndex] = el.style.background;
}

function readDomStyle(el: HTMLInputElement | null): CellStyle {
  const style: CellStyle = {};
  if (!el) return style;
  if (el.style.fontWeight) style.fontWeight = el.style.fontWeight;
  if (el.style.fontStyle) style.fontStyle = el.style.fontStyle;
  if (el.style.textDecorationLine)
    style.textDecorationLine = el.style.textDecorationLine;
  if (el.style.fontSize) style.fontSize = el.style.fontSize;
  if (el.style.textAlign) style.textAlign = el.style.textAlign;
  if (el.style.color && el.style.color !== DEFAULT_TXT)
    style.color = el.style.color;
  if (el.style.background && el.style.background !== DEFAULT_BG) {
    style.background = el.style.background;
  }
  return style;
}

// ===========================================================================
// Spreadsheet model (raw + value + style + formula dependencies)
// ===========================================================================

export interface CellData {
  raw: string;
  value: string;
  style: CellStyle;
  deps: Set<string>;
}

export class SpreadsheetModel {
  private cells = new Map<string, CellData>();
  /** read-cell -> formula cells that read it directly */
  private reverseDeps = new Map<string, Set<string>>();

  /** Clears every tracked cell (used to reset the sheet). */
  reset(): void {
    this.cells.clear();
    this.reverseDeps.clear();
  }

  getRaw(row: number, col: number): string {
    const id = getCellId(col, row);
    const data = this.cells.get(id);
    if (data) return data.raw;
    return (
      (document.getElementById(id) as HTMLInputElement | null)?.value ?? ""
    );
  }

  getRawFromId(id: string): string {
    const coord = parseCellId(id);
    if (!coord) return "";
    return this.getRaw(coord.row, coord.col);
  }

  getValue(row: number, col: number): string {
    const id = getCellId(col, row);
    const data = this.cells.get(id);
    if (data) return data.value;
    return (
      (document.getElementById(id) as HTMLInputElement | null)?.value ?? ""
    );
  }

  getValueFromId(id: string): string {
    const coord = parseCellId(id);
    if (!coord) return "";
    return this.getValue(coord.row, coord.col);
  }

  /** CellData for a cell, created lazily from the current DOM if needed. */
  requireData(id: string): CellData {
    let data = this.cells.get(id);
    if (data) return data;
    const el = document.getElementById(id) as HTMLInputElement | null;
    const raw = el?.value ?? "";
    data = { raw, value: raw, style: readDomStyle(el), deps: new Set() };
    this.cells.set(id, data);
    if (raw.startsWith("=")) this.recalcCell(id);
    return data;
  }

  dataAt(row: number, col: number): CellData {
    return this.requireData(getCellId(col, row));
  }

  /** Sets the raw content of a cell, recalculating it and its dependents. */
  setCellValueAt(row: number, col: number, raw: string): void {
    const id = getCellId(col, row);
    const data = this.requireData(id);
    data.raw = raw;
    if (raw.startsWith("=")) {
      this.recalcCell(id);
    } else {
      data.value = raw;
      this.clearReverseEdges(id, data);
    }
    this.syncDom(id);
    this.recalcDependents(id);
  }

  setCellValueFromId(id: string, raw: string): void {
    const coord = parseCellId(id);
    if (!coord) return;
    this.setCellValueAt(coord.row, coord.col, raw);
  }

  /** Empties a cell (value + formatting). */
  clearCellAt(row: number, col: number): void {
    const id = getCellId(col, row);
    const data = this.cells.get(id);
    if (!data) return;
    data.raw = "";
    data.value = "";
    data.style = {};
    this.clearReverseEdges(id, data);
    this.syncDom(id);
    this.recalcDependents(id);
  }

  /** Replaces the formatting of a cell. */
  setStyleAt(row: number, col: number, style: CellStyle): void {
    const id = getCellId(col, row);
    this.requireData(id).style = { ...style };
    this.syncDom(id);
  }

  setStyleId(id: string, style: CellStyle): void {
    const coord = parseCellId(id);
    if (!coord) return;
    this.setStyleAt(coord.row, coord.col, style);
  }

  /** Merges a formatting patch into a cell. */
  updateStyleAt(row: number, col: number, patch: CellStyle): void {
    const id = getCellId(col, row);
    const data = this.requireData(id);
    data.style = { ...data.style, ...patch };

    this.syncDom(id);
  }

  updateStyleId(id: string, patch: CellStyle): void {
    const coord = parseCellId(id);
    if (!coord) return;

    this.updateStyleAt(coord.row, coord.col, patch);
  }

  // ----- evaluation --------------------------------------------------------

  /**
   * Recursively evaluates the formula stored in `id`, recording every cell it
   * reads into `deps`. Chained formulas (A1 = "=B1+1") are resolved by
   * recursing into the referenced formula cell. Returns null on error/circular.
   */
  private evaluateRecursive(
    id: string,
    seen: Set<string>,
    deps: Set<string>,
  ): string | null {
    const raw = this.getRawFromId(id);
    if (!raw.startsWith("=")) return raw;
    if (seen.has(id)) return null;
    seen.add(id);

    const parser = new Parser();
    const read = (row: number, col: number): number | string => {
      const refId = getCellId(col, row);
      if (refId !== id) deps.add(refId);
      const refRaw = this.getRaw(row, col);
      if (refRaw.startsWith("=")) {
        const value = this.evaluateRecursive(refId, seen, deps);
        return value === null ? 0 : toNumberOrText(value);
      }
      return toNumberOrText(refRaw);
    };

    parser.on("callCellValue", (cell, done) => {
      done(read(cell.row.index, cell.column.index));
    });
    parser.on("callRangeValue", (start, end, done) => {
      const matrix: (number | string)[][] = [];
      for (let r = start.row.index; r <= end.row.index; r++) {
        const line: (number | string)[] = [];
        for (let c = start.column.index; c <= end.column.index; c++) {
          line.push(read(r, c));
        }
        matrix.push(line);
      }
      done(matrix);
    });

    const parsed = parser.parse(raw.slice(1));
    seen.delete(id);
    if (parsed.error) return null;
    if (parsed.result === null || parsed.result === undefined) return null;
    if (typeof parsed.result === "number") {
      return String(Math.round(parsed.result * 1e10) / 1e10);
    }
    return String(parsed.result);
  }

  private clearReverseEdges(id: string, data: CellData): void {
    for (const dep of data.deps) {
      this.reverseDeps.get(dep)?.delete(id);
    }
    data.deps.clear();
  }

  private recalcCell(id: string): void {
    const data = this.requireData(id);
    this.clearReverseEdges(id, data);
    const deps = new Set<string>();
    const value = this.evaluateRecursive(id, new Set(), deps);
    data.deps = deps;
    for (const dep of deps) {
      let readers = this.reverseDeps.get(dep);
      if (!readers) this.reverseDeps.set(dep, (readers = new Set()));
      readers.add(id);
    }
    data.value = value ?? data.raw;
  }

  /** Recalculates every formula cell that (transitively) reads `id`. */
  private recalcDependents(id: string): void {
    const queue = [id];
    const seen = new Set<string>();
    while (queue.length) {
      const current = queue.pop() as string;
      const dependents = this.reverseDeps.get(current);
      if (!dependents) continue;
      for (const formulaId of dependents) {
        if (seen.has(formulaId)) continue;
        seen.add(formulaId);
        this.recalcCell(formulaId);
        this.syncDom(formulaId);
        queue.push(formulaId);
      }
    }
  }

  private syncDom(id: string): void {
    const data = this.cells.get(id);
    if (!data) return;
    const el = document.getElementById(id) as HTMLInputElement | null;
    if (!el) return;

    el.value = data.value;

    applyStyleToDom(el, data.style);
  }
}

export const spreadsheetModel = new SpreadsheetModel();

// ===========================================================================
// FOCUS / VALUE SYNC (never triggers a grid re-render)
// ===========================================================================
export const handleSpreadCellFocus = (
  e: FocusEvent<HTMLInputElement>,
  row: number,
  col: number,
) => {
  Cells.setCurrentCell(e);
  Cells.setSelection([e as unknown as HTMLInputElement]);
  Cells.dirtyCell = null;

  const raw = spreadsheetModel.getRaw(row, col);
  e.currentTarget.value = raw;

  spreadSheetStore.setState({
    currentRow: row,
    currentColumn: col,
    formularValue: raw,
  });
};

export const handleSpreadSheetValueChange = (
  e: ChangeEvent<HTMLInputElement>,
) => {
  Cells.dirtyCell = e.currentTarget;
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
    const raw = spreadsheetModel.getRaw(targetRow, targetCol);
    input.value = raw;
    spreadSheetStore.setState({
      currentRow: targetRow,
      currentColumn: targetCol,
      formularValue: raw,
    });
  }
};

// ===========================================================================
// COMMITTING EDITS (blur / Enter / formula bar)
// ===========================================================================

const commitActiveCell = (input: HTMLInputElement) => {
  // Only commit when the user actually edited the cell. This prevents the
  // blur that follows Enter/arrow navigation from overwriting a freshly
  // computed formula result (shown in the input) over the raw formula.
  if (Cells.dirtyCell !== input) return;
  Cells.dirtyCell = null;
  spreadsheetModel.setCellValueFromId(input.id, input.value);
  spreadSheetStore.setState({
    formularValue: spreadsheetModel.getRawFromId(input.id),
  });
};

const cancelActiveCell = (input: HTMLInputElement) => {
  Cells.dirtyCell = null;
  input.value = spreadsheetModel.getValueFromId(input.id);
  spreadSheetStore.setState({
    formularValue: spreadsheetModel.getRawFromId(input.id),
  });
};

export const handleSpreadCellBlur = (e: FocusEvent<HTMLInputElement>) => {
  commitActiveCell(e.currentTarget);
};

/** Commits the formula bar value into the focused cell. */
export const commitFormulaBarValue = (value: string) => {
  const input = Cells.getCurrentCell();
  if (!input) return;
  spreadsheetModel.setCellValueFromId(input.id, value);
  const raw = spreadsheetModel.getRawFromId(input.id);
  spreadSheetStore.setState({ formularValue: raw });
};

// ===========================================================================
//  KEYBOARD NAVIGATION + SHORTCUTS
// ===========================================================================
export const handleSpreadSheetKeyDown = (
  e: KeyboardEvent<HTMLInputElement>,
) => {
  const target = e.currentTarget;

  if (e.ctrlKey || e.metaKey) {
    const key = e.key.toLowerCase();
    if (!e.shiftKey) {
      if (key === "c") {
        e.preventDefault();
        copySelection(false);
        return;
      }
      if (key === "x") {
        e.preventDefault();
        cutSelection(false);
        return;
      }
      if (key === "v") {
        e.preventDefault();
        pasteSelection();
        return;
      }
      switch (key) {
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
    } else if (key === "c") {
      e.preventDefault();
      copySelection(true);
      return;
    } else if (key === "x") {
      e.preventDefault();
      cutSelection(true);
      return;
    }
  }

  const { currentRow, currentColumn } = spreadSheetStore.getState();

  switch (e.key) {
    case "Enter": {
      e.preventDefault();
      commitActiveCell(target);
      if (currentRow + 1 < TOTAL_ROWS) {
        const nextRow = currentRow + 1;
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
      commitActiveCell(target);
      focusCell(currentRow + 1, currentColumn);
      return;
    case "ArrowUp":
      e.preventDefault();
      commitActiveCell(target);
      focusCell(currentRow - 1, currentColumn);
      return;
    case "Escape":
      e.preventDefault();
      cancelActiveCell(target);
      target.blur();
      return;
  }
};

export function handleMultiSelectionActivation(e: KeyboardEvent) {
  if (e.shiftKey && e.key !== "Tab") {
    Cells.isSelectionActive = true;
  }
}

export const deactivateMultiSelection = () => {
  Cells.isSelectionActive = false;
};

/** Activates selection mode anchored at the given cell (used by the fill handle). */
export const startSelectionDrag = (anchorRow: number, anchorCol: number) => {
  Cells.isSelectionActive = true;
  Cells.initialSelectionRow = anchorRow;
  Cells.initialSelectionColumn = anchorCol;
};

/**
 * Multi input selection
 * Enable users to select multiple cell
 */
export const handleMultiSelection = () => {
  const spreadStore = spreadSheetStore.getState();
  let seletedCell: HTMLInputElement[] = [];

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

    // Restore the previous selection before drawing the new one, so the
    // previous highlight (and its original borders) is fully reset.
    resetCellSelet();

    // Store the original border of each border cell exactly once. Corner cells
    // are touched by multiple sides, so a Map (keyed by element) avoids pushing
    // the same cell more than once with a polluted ("" empty) snapshot.
    const originalBorders = new Map<HTMLInputElement, string>();

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
        if (!el) continue;

        // flip: check for backward selection
        const isTop = initRow > finalRow ? i === finalRow : i === initRow;
        const isBottom = initRow > finalRow ? i === initRow : i === finalRow;
        const isLeft =
          initCol > finalColumn ? j === finalColumn : j === initCol;
        const isRight =
          initCol > finalColumn ? j === initCol : j === finalColumn;

        if (isTop || isBottom || isLeft || isRight) {
          if (!originalBorders.has(el)) {
            originalBorders.set(el, el.style.border);
          }
        }

        if (isTop) el.style.borderTop = "2px solid green";
        if (isBottom) el.style.borderBottom = "2px solid green";
        if (isLeft) el.style.borderLeft = "2px solid green";
        if (isRight) el.style.borderRight = "2px solid green";

        seletedCell.push(el);
      }
    }

    Cells.selectedElements = seletedCell;

    // Persist the current selection (border cells + backgrounds) so the next
    // resetCellSelet() call can restore it.
    Cells.oldSlectedBorderElements = Array.from(originalBorders.keys());
    Cells.oldSlectedElementsStyleBorder = Array.from(originalBorders.values());

    Cells.oldSlectedElements = seletedCell;
    Cells.oldSlectedElementsStyleBackground = seletedCell.map(
      (element) => element.style.background,
    );
    seletedCell.forEach((element) => {
      element.style.background = HIGHLIGHT_BG;
    });
  }
};

// reset selection
function resetCellSelet() {
  Cells.oldSlectedElements.forEach((el, key) => {
    if (Cells.oldSlectedElementsStyleBackground[key] !== undefined) {
      el.style.background = Cells.oldSlectedElementsStyleBackground[key];
    }
  });

  Cells.oldSlectedBorderElements.forEach((el, key) => {
    if (Cells.oldSlectedElementsStyleBorder[key] !== undefined) {
      el.style.border = Cells.oldSlectedElementsStyleBorder[key];
    }
  });

  Cells.oldSlectedElements = [];
  Cells.oldSlectedElementsStyleBackground = [];
  Cells.oldSlectedElementsStyleBorder = [];
  Cells.oldSlectedBorderElements = [];
}

// ===========================================================================
//  FORMATTING HELPERS (operate on the focused cell)
// ===========================================================================

const _bold = (elem: HTMLInputElement) => {
  const data = spreadsheetModel.requireData(elem.id);
  spreadsheetModel.updateStyleId(elem.id, {
    fontWeight: data.style.fontWeight === "bold" ? "" : "bold",
  });
};

export const handleCellBold = () => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      _bold(cell);
    }
  });

  if (selectedCells.length == 1) {
    _bold(currentCell);
  }
};

// Handle Italic
export const handleCellItalic = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  const data = spreadsheetModel.requireData(currentCell.id);
  spreadsheetModel.updateStyleId(currentCell.id, {
    fontStyle: data.style.fontStyle === "italic" ? "" : "italic",
  });
  currentCell.focus();
};

export const handleCellUnderline = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  const data = spreadsheetModel.requireData(currentCell.id);
  const hasUnderline = (data.style.textDecorationLine ?? "").includes(
    "underline",
  );
  const hasStrike = (data.style.textDecorationLine ?? "").includes(
    "line-through",
  );
  const parts: string[] = [];
  if (hasStrike) parts.push("line-through");
  if (!hasUnderline) parts.push("underline");
  spreadsheetModel.updateStyleId(currentCell.id, {
    textDecorationLine: parts.join(" ") || "none",
  });
  currentCell.focus();
};

export const handleCellStrikethrough = () => {
  const currentCell = Cells.getCurrentCell();
  if (!currentCell) return;
  const data = spreadsheetModel.requireData(currentCell.id);
  const hasStrike = (data.style.textDecorationLine ?? "").includes(
    "line-through",
  );
  const hasUnderline = (data.style.textDecorationLine ?? "").includes(
    "underline",
  );
  const parts: string[] = [];
  if (hasUnderline) parts.push("underline");
  if (!hasStrike) parts.push("line-through");
  spreadsheetModel.updateStyleId(currentCell.id, {
    textDecorationLine: parts.join(" ") || "none",
  });
  currentCell.focus();
};

export const handleCellTextColor = (color: string) => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { color });
    }
  });

  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { color });
  }
};

// Background Selection
export const handleCellBackgroundColor = (bg: string) => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { background: bg });
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { background: bg });
  }
};

export const alignCellTextLeft = () => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { textAlign: "left" });
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { textAlign: "left" });
  }
};

export const alignCellTextRight = () => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { textAlign: "right" });
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { textAlign: "right" });
  }
};

export const centerCellText = () => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { textAlign: "center" });
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { textAlign: "center" });
  }
};

export const handleCellFontSize = (size: number) => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.updateStyleId(cell.id, { fontSize: `${size}px` });
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.updateStyleId(currentCell.id, { fontSize: `${size}px` });
  }
};

export const handleClearFormatting = () => {
  const currentCell = Cells.getCurrentCell();
  const selectedCells = Cells.getSelection();

  if (!currentCell || selectedCells.length == 0) return;

  selectedCells.forEach((cell) => {
    if (selectedCells.length > 1) {
      spreadsheetModel.setStyleId(cell.id, {});
    }
  });
  if (selectedCells.length == 1) {
    spreadsheetModel.setStyleId(currentCell.id, {});
  }

  currentCell.focus();
};

// ===========================================================================
// Internal clipboard (value-only or value + format)
// ===========================================================================

interface ClipboardCell {
  raw: string;
  value: string;
  style: CellStyle | null;
}

interface ClipboardBlock {
  cells: ClipboardCell[][];
  rows: number;
  cols: number;
  sourceRow: number;
  sourceCol: number;
}

let clipboard: ClipboardBlock | null = null;

function getSelectionRect(): {
  top: number;
  left: number;
  bottom: number;
  right: number;
} | null {
  const initRow = Cells.initialSelectionRow;
  const initCol = Cells.initialSelectionColumn;
  if (initRow === undefined || initCol === undefined) return null;
  const { currentRow, currentColumn } = spreadSheetStore.getState();
  return {
    top: Math.min(initRow, currentRow),
    bottom: Math.max(initRow, currentRow),
    left: Math.min(initCol, currentColumn),
    right: Math.max(initCol, currentColumn),
  };
}

/** Highlights a rectangular block as the current selection. */
export function selectBlock(
  top: number,
  left: number,
  bottom: number,
  right: number,
): void {
  spreadSheetStore.setState({ currentRow: bottom, currentColumn: right });
  Cells.initialSelectionRow = top;
  Cells.initialSelectionColumn = left;
  Cells.isSelectionActive = true;
  handleMultiSelection();
  Cells.isSelectionActive = false;

  const input = document.getElementById(
    getCellId(left, top),
  ) as HTMLInputElement | null;
  if (input) {
    Cells.currentCell = input;
    spreadSheetStore.setState({
      formularValue: spreadsheetModel.getRawFromId(input.id),
    });
  }
}

function getPasteAnchor(): CellCoord {
  const state = spreadSheetStore.getState();
  const initRow = Cells.initialSelectionRow;
  const initCol = Cells.initialSelectionColumn;
  return {
    row: initRow !== undefined ? initRow : state.currentRow,
    col: initCol !== undefined ? initCol : state.currentColumn,
  };
}

/** Copies the current selection into the internal clipboard. */
export function copySelection(withFormat: boolean): void {
  const rect = getSelectionRect();
  if (!rect) return;
  const cells: ClipboardCell[][] = [];
  for (let r = rect.top; r <= rect.bottom; r++) {
    const line: ClipboardCell[] = [];
    for (let c = rect.left; c <= rect.right; c++) {
      const data = spreadsheetModel.dataAt(r, c);
      line.push({
        raw: data.raw,
        value: data.value,
        style: withFormat ? { ...data.style } : null,
      });
    }
    cells.push(line);
  }
  clipboard = {
    cells,
    rows: rect.bottom - rect.top + 1,
    cols: rect.right - rect.left + 1,
    sourceRow: rect.top,
    sourceCol: rect.left,
  };
  spreadSheetStore.setState({ isPasteButtonDissable: false });
}

/** Copies the selection then clears the source cells. */
export function cutSelection(withFormat: boolean): void {
  copySelection(withFormat);
  const rect = getSelectionRect();
  if (!rect) return;
  for (let r = rect.top; r <= rect.bottom; r++) {
    for (let c = rect.left; c <= rect.right; c++) {
      spreadsheetModel.clearCellAt(r, c);
      spreadSheetStore.setState({ isPasteButtonDissable: false });
    }
  }
}

/** Pastes the internal clipboard at the current anchor. */
export function pasteSelection(): void {
  if (!clipboard) return;
  const anchor = getPasteAnchor();
  const { cells, rows, cols, sourceRow, sourceCol } = clipboard;
  for (let r = 0; r < rows; r++) {
    const destRow = anchor.row + r;
    if (destRow >= TOTAL_ROWS) continue;
    for (let c = 0; c < cols; c++) {
      const destCol = anchor.col + c;
      if (destCol >= TOTAL_COLUMNS) continue;
      const source = cells[r][c];
      if (source.style === null) {
        // value-only paste: write the computed value, keep destination format
        spreadsheetModel.setCellValueAt(destRow, destCol, source.value);
      } else {
        const raw = source.raw.startsWith("=")
          ? shiftFormula(source.raw, destRow - sourceRow, destCol - sourceCol)
          : source.raw;
        spreadsheetModel.setCellValueAt(destRow, destCol, raw);
        spreadsheetModel.setStyleAt(destRow, destCol, source.style);
      }
    }
  }
  selectBlock(
    anchor.row,
    anchor.col,
    Math.min(anchor.row + rows - 1, TOTAL_ROWS - 1),
    Math.min(anchor.col + cols - 1, TOTAL_COLUMNS - 1),
  );
}

// ===========================================================================
// Drag to move / copy the selected block
// ===========================================================================

interface BlockDragState {
  mode: "move" | "copy";
  top: number;
  left: number;
  rows: number;
  cols: number;
  startRow: number;
  startCol: number;
  targetRow: number;
  targetCol: number;
  moved: boolean;
  originInput: HTMLInputElement;
  preview: HTMLInputElement[];
}

let blockDrag: BlockDragState | null = null;

export function clearPreview(): void {
  if (!blockDrag) return;
  for (const el of blockDrag.preview) {
    el.style.outline = "none";
  }
  blockDrag.preview = [];
}

function drawPreview(): void {
  if (!blockDrag) return;
  for (let r = 0; r < blockDrag.rows; r++) {
    for (let c = 0; c < blockDrag.cols; c++) {
      const el = document.getElementById(
        getCellId(blockDrag.targetCol + c, blockDrag.targetRow + r),
      ) as HTMLInputElement | null;
      if (el) {
        el.style.outline = "2px dashed #2f9e44";
        blockDrag.preview.push(el);
      }
    }
  }
}

function onBlockDragMove(e: globalThis.MouseEvent): void {
  if (!blockDrag) return;
  const element = document.elementFromPoint(e.clientX, e.clientY);
  const input = element?.closest(".spread-cell") as HTMLInputElement | null;
  if (!input) return;
  const coord = parseCellId(input.id);
  if (!coord) return;
  const targetRow = Math.min(
    Math.max(coord.row, 0),
    TOTAL_ROWS - blockDrag.rows,
  );
  const targetCol = Math.min(
    Math.max(coord.col, 0),
    TOTAL_COLUMNS - blockDrag.cols,
  );
  if (targetRow === blockDrag.targetRow && targetCol === blockDrag.targetCol) {
    return;
  }
  clearPreview();
  blockDrag.targetRow = targetRow;
  blockDrag.targetCol = targetCol;
  blockDrag.moved = true;
  drawPreview();
}

function performBlockTransfer(drag: BlockDragState): void {
  const rowDelta = drag.targetRow - drag.startRow;
  const colDelta = drag.targetCol - drag.startCol;

  // Snapshot the whole source block first so overlapping copy/move stays intact.
  const snapshot: CellData[] = [];
  for (let r = 0; r < drag.rows; r++) {
    for (let c = 0; c < drag.cols; c++) {
      snapshot.push(spreadsheetModel.dataAt(drag.top + r, drag.left + c));
    }
  }

  for (let r = 0; r < drag.rows; r++) {
    for (let c = 0; c < drag.cols; c++) {
      const source = snapshot[r * drag.cols + c];
      const raw = source.raw.startsWith("=")
        ? shiftFormula(source.raw, rowDelta, colDelta)
        : source.raw;
      spreadsheetModel.setCellValueAt(
        drag.targetRow + r,
        drag.targetCol + c,
        raw,
      );
      spreadsheetModel.setStyleAt(drag.targetRow + r, drag.targetCol + c, {
        ...source.style,
      });
    }
  }

  if (drag.mode === "move") {
    for (let r = 0; r < drag.rows; r++) {
      for (let c = 0; c < drag.cols; c++) {
        spreadsheetModel.clearCellAt(drag.top + r, drag.left + c);
      }
    }
  }

  selectBlock(
    drag.targetRow,
    drag.targetCol,
    drag.targetRow + drag.rows - 1,
    drag.targetCol + drag.cols - 1,
  );
}

function onBlockDragEnd(): void {
  window.removeEventListener("mousemove", onBlockDragMove);
  window.removeEventListener("mouseup", onBlockDragEnd);
  document.body.style.cursor = "";

  const drag = blockDrag;
  blockDrag = null;
  if (!drag) return;
  clearPreview();

  const moved =
    drag.moved &&
    (drag.targetRow !== drag.startRow || drag.targetCol !== drag.startCol);
  if (moved) {
    performBlockTransfer(drag);
  } else {
    // plain click on a selected cell: collapse selection to it
    drag.originInput.focus();
    handleMultiSelection();
  }
}

/**
 * Starts a drag of the current selection block. Mousedown on any cell inside a
 * multi-selection should call this (mode = "move", or "copy" with Ctrl held).
 */
export function startBlockDrag(
  input: HTMLInputElement,
  mode: "move" | "copy",
): void {
  const rect = getSelectionRect();
  if (!rect) return;
  blockDrag = {
    mode,
    top: rect.top,
    left: rect.left,
    rows: rect.bottom - rect.top + 1,
    cols: rect.right - rect.left + 1,
    startRow: rect.top,
    startCol: rect.left,
    targetRow: rect.top,
    targetCol: rect.left,
    moved: false,
    originInput: input,
    preview: [],
  };
  document.body.style.cursor = "move";
  window.addEventListener("mousemove", onBlockDragMove);
  window.addEventListener("mouseup", onBlockDragEnd);
}

/** Aborts any in-flight block drag (called on unmount for safety). */
export function stopBlockDrag(): void {
  window.removeEventListener("mousemove", onBlockDragMove);
  window.removeEventListener("mouseup", onBlockDragEnd);
  document.body.style.cursor = "";
  if (blockDrag) {
    clearPreview();
    blockDrag = null;
  }
}

/** Auto-fills through the model so formulas are stored + recalculated. */
export function fillModelRange(
  anchor: CellCoord,
  source: CellCoord,
  target: CellCoord,
): void {
  const adapter: Grid = {
    getValue: (row, col) => spreadsheetModel.getRaw(row, col),
    setValue: (row, col, value) =>
      spreadsheetModel.setCellValueAt(row, col, value),
  };
  fillRange(anchor, source, target, adapter);
}
