/**
 * useWorkbooks.ts
 * ----------------------------------------------------------------
 * React hook that owns the list of saved workbooks shown on the
 * workspace home page. It loads the index once on mount and exposes
 * create / delete / rename helpers, plus `touchWorkbook` for keeping
 * the list fresh as the editor autosaves without re-reading storage.
 */

import { useCallback, useEffect, useState } from "react";
import {
  workbookStorage,
  type WorkbookMeta,
} from "./workbookStorage";
import { createEmptyWorkbook } from "./sheetFormat";

export interface UseWorkbooks {
  /** Metadata for every saved workbook (newest first). */
  workbooks: WorkbookMeta[];
  /** True until the initial list has finished loading from storage. */
  loading: boolean;
  /** Reloads the whole list from storage. */
  refresh: () => Promise<void>;
  /** Creates a workbook (blank sheet), refreshes the list, returns its id. */
  createWorkbook: (name: string) => Promise<string>;
  /** Deletes a workbook and its stored data, then refreshes the list. */
  deleteWorkbook: (id: string) => Promise<void>;
  /**
   * Applies a metadata patch (name / sheetCount / updatedAt) for a
   * single workbook in memory. Cheap — used by the editor on each save.
   */
  touchWorkbook: (id: string, patch: Partial<WorkbookMeta>) => void;
}

export function useWorkbooks(): UseWorkbooks {
  const [workbooks, setWorkbooks] = useState<WorkbookMeta[]>([]);
  const [loading, setLoading] = useState(true);

  // Initial load: run once when the hook mounts.
  useEffect(() => {
    let cancelled = false;
    workbookStorage
      .list()
      .then((list) => {
        if (cancelled) return;
        setWorkbooks(list);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setWorkbooks(await workbookStorage.list());
  }, []);

  const createWorkbook = useCallback(async (name: string) => {
    const record = await workbookStorage.create(name, createEmptyWorkbook());
    // Refresh so the new card appears in the list.
    setWorkbooks(await workbookStorage.list());
    return record.id;
  }, []);

  const deleteWorkbook = useCallback(
    async (id: string) => {
      await workbookStorage.remove(id);
      await refresh();
    },
    [refresh],
  );

  const touchWorkbook = useCallback((id: string, patch: Partial<WorkbookMeta>) => {
    setWorkbooks((prev) =>
      prev.map((w) => (w.id === id ? { ...w, ...patch } : w)),
    );
  }, []);

  return { workbooks, loading, refresh, createWorkbook, deleteWorkbook, touchWorkbook };
}
