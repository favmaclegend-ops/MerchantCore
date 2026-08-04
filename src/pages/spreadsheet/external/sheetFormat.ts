/**
 * sheetFormat.ts
 * ----------------------------------------------------------------
 * Helpers for converting between the two shapes of sheet data that
 * FortuneSheet uses, and for building fresh/empty workbooks.
 *
 * WHY this is needed
 * ------------------
 * FortuneSheet keeps a "matrix" (row x col grid, indexable by `[r][c]`)
 * in memory, but reads and stores the compact "celldata" list — only
 * the cells that actually hold values, each tagged with its row/col.
 * The persistence layer must use celldata:
 *
 *   - `onChange` hands the UI the INTERNAL matrix form.
 *   - The `Workbook` `data` prop / a saved file use the EXTERNAL
 *     celldata form on load.
 *
 * Saving the matrix form straight into storage and feeding it back on
 * load therefore produced an empty grid — the initializer could not
 * understand it. This module is the single place that translation
 * happens so the two formats can never drift apart again.
 */

import { api, type Sheet } from "@fortune-sheet/core";

/** Default workbook dimensions (rows x columns) for new sheets. */
const DEFAULT_ROWS = 100;
const DEFAULT_COLS = 52;

/** Compact unique id (FortuneSheet core does not export its generator). */
function newSheetId(): string {
  return "sheet-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/**
 * Builds a fresh, blank sheet for a new workbook.
 * `celldata` is deliberately empty: the matrix gets allocated lazily by
 * FortuneSheet at init time.
 */
export function createEmptySheet(name = "Sheet1"): Sheet {
  return {
    id: newSheetId(),
    name,
    row: DEFAULT_ROWS,
    column: DEFAULT_COLS,
    celldata: [],
    status: 1,
    showGridLines: 1,
  };
}

/** A brand-new workbook containing a single blank sheet. */
export function createEmptyWorkbook(): Sheet[] {
  return [createEmptySheet()];
}

/**
 * Normalizes any sheet list into the EXTERNAL celldata form that storage
 * and the `data` prop both expect.
 *
 * - Sheets carrying a `data` matrix (the form `onChange` provides) are
 *   collapsed down to their compact celldata list.
 * - Sheets already in celldata form (freshly loaded from storage or
 *   imported) are passed through unchanged.
 */
export function toExternalSheets(sheets: Sheet[]): Sheet[] {
  return sheets.map((sheet) => {
    const { data, ...rest } = sheet;
    if (data) {
      // Internal matrix form → collapse the grid into a cell list.
      return { ...rest, celldata: api.dataToCelldata(data) };
    }
    // Already external (celldata) form → store as-is.
    return { ...rest, celldata: rest.celldata ?? [] };
  });
}
