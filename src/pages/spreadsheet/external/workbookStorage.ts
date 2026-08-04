/**
 * workbookStorage.ts
 * ----------------------------------------------------------------
 * Promise-based persistence layer for spreadsheets.
 *
 * The UI never touches localStorage directly. Everything goes through
 * the `WorkbookStorage` interface whose methods all return Promises,
 * so a server-backed implementation (fetch calls to a REST / GraphQL
 * API) can be dropped in later without changing any component code —
 * just replace the exported `workbookStorage` instance.
 *
 * The localStorage implementation keeps two kinds of data:
 *   - an index of workbook metadata (key `mc_workbooks`) used to render
 *     the workspace grid quickly without loading every cell,
 *   - one record per workbook (key `mc_sheet:<id>`) holding the actual
 *     sheet data in the compact "celldata" format (see sheetFormat.ts).
 */

import type { Sheet } from "@fortune-sheet/core";

/** Small, listable summary of a workbook (rendered as a workspace card). */
export interface WorkbookMeta {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sheetCount: number;
}

/** A full workbook: metadata plus the sheet data (external celldata format). */
export interface WorkbookRecord {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  sheets: Sheet[];
}

/**
 * Storage contract used by the spreadsheet UI.
 *
 * Every method is async. Swapping localStorage for a server later only
 * means implementing this interface differently — callers stay the same.
 */
export interface WorkbookStorage {
  /** Returns metadata for every saved workbook, newest first. */
  list(): Promise<WorkbookMeta[]>;
  /** Loads one workbook by id, or null when it does not exist. */
  get(id: string): Promise<WorkbookRecord | null>;
  /** Creates a new workbook (empty sheets) and returns the saved record. */
  create(name: string, sheets: Sheet[]): Promise<WorkbookRecord>;
  /** Persists a whole workbook: metadata (index) + sheet data. */
  save(record: WorkbookRecord): Promise<void>;
  /** Deletes a workbook and its stored sheet data. */
  remove(id: string): Promise<void>;
}

/** localStorage keys used by the local implementation. */
const INDEX_KEY = "mc_workbooks";
const SHEET_PREFIX = "mc_sheet:";

/** Generates a collision-resistant, URL-friendly id. */
export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

/** Reads + parses a JSON value from localStorage with a safe fallback. */
function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    // Corrupt JSON or a blocked storage API: return the fallback.
    return fallback;
  }
}

/** Writes a value to localStorage, ignoring quota / private-mode errors. */
function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Storage may be full or disabled; the app keeps working in memory.
  }
}

/**
 * localStorage-backed implementation.
 *
 * Wraps the synchronous localStorage API in Promises so the rest of the
 * app can treat persistence as asynchronous and later swap in a backend.
 */
class LocalWorkbookStorage implements WorkbookStorage {
  async list(): Promise<WorkbookMeta[]> {
    // Return a copy so callers cannot mutate the stored array in place.
    return [...readJson<WorkbookMeta[]>(INDEX_KEY, [])];
  }

  async get(id: string): Promise<WorkbookRecord | null> {
    const meta = (await this.list()).find((w) => w.id === id);
    if (!meta) return null;
    const sheets = readJson<Sheet[]>(SHEET_PREFIX + id, []);
    return { ...meta, sheets };
  }

  async create(name: string, sheets: Sheet[]): Promise<WorkbookRecord> {
    const now = Date.now();
    const record: WorkbookRecord = {
      id: generateId(),
      name,
      createdAt: now,
      updatedAt: now,
      sheets,
    };
    const index = await this.list();
    writeJson(INDEX_KEY, [
      {
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        sheetCount: record.sheets.length,
      },
      ...index,
    ]);
    writeJson(SHEET_PREFIX + record.id, record.sheets);
    return record;
  }

  async save(record: WorkbookRecord): Promise<void> {
    const index = await this.list();
    const existing = index.find((w) => w.id === record.id);

    // Preserve the original creation time; bump updatedAt to now.
    const meta: WorkbookMeta = {
      id: record.id,
      name: record.name,
      createdAt: existing?.createdAt ?? record.createdAt,
      updatedAt: Date.now(),
      sheetCount: record.sheets.length,
    };

    writeJson(
      INDEX_KEY,
      existing ? index.map((w) => (w.id === record.id ? meta : w)) : [meta, ...index],
    );
    writeJson(SHEET_PREFIX + record.id, record.sheets);
  }

  async remove(id: string): Promise<void> {
    const index = await this.list();
    writeJson(INDEX_KEY, index.filter((w) => w.id !== id));
    localStorage.removeItem(SHEET_PREFIX + id);
  }
}

/** Single shared instance used across the spreadsheet UI. */
export const workbookStorage: WorkbookStorage = new LocalWorkbookStorage();
