import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import type { Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import {
  FortuneExcelHelper,
  importToolBarItem,
  exportToolBarItem,
} from "@corbe30/fortune-excel";
import {
  Save,
  FileSpreadsheet,
  Upload,
  ArrowLeft,
  Plus,
  Trash2,
  Check,
} from "lucide-react";
import "../spread.css";
import { workbookStorage, type WorkbookMeta } from "./workbookStorage";
import { createEmptyWorkbook, toExternalSheets } from "./sheetFormat";
import { useWorkbooks } from "./useWorkbooks";

/** Formats a millisecond timestamp as a short "time ago" label. */
function timeAgo(ts: number): string {
  const diff = Math.max(0, Date.now() - ts);
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days > 1 ? "s" : ""} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months} month${months > 1 ? "s" : ""} ago`;
  return `${Math.floor(months / 12)} yr ago`;
}

function WorkbookCard({
  workbook,
  onOpen,
  onDelete,
}: {
  workbook: WorkbookMeta;
  onOpen: () => void;
  onDelete: () => void;
}) {
  return (
    <div
      className="workbook-card"
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
    >
      <button
        className="workbook-card-delete spread-tool-btn"
        title={`Delete "${workbook.name}"`}
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 size={15} />
      </button>

      <div
        style={{
          width: "38px",
          height: "38px",
          borderRadius: "10px",
          background: "rgba(37, 99, 235, .12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <FileSpreadsheet size={20} style={{ color: "var(--bg-nav-active, #2563eb)" }} />
      </div>

      <div style={{ minWidth: 0, width: "100%" }}>
        <div
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--text-primary, #111827)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
            paddingRight: "24px",
          }}
        >
          {workbook.name}
        </div>
        <div style={{ fontSize: "12px", color: "var(--text-muted, #6b7280)", marginTop: "2px" }}>
          {timeAgo(workbook.updatedAt)} · {workbook.sheetCount} sheet
          {workbook.sheetCount === 1 ? "" : "s"}
        </div>
      </div>
    </div>
  );
}

function WorkbookEditor({
  workbookId,
  initialName,
  onTouched,
  onBack,
}: {
  workbookId: string;
  initialName: string;
  onTouched: (id: string, patch: Partial<WorkbookMeta>) => void;
  onBack: () => void;
}) {
  // Sheets fed to the `<Workbook>` `data` prop (external celldata form).
  const [sheets, setSheets] = useState<Sheet[]>(() => createEmptyWorkbook());
  const [workbookName, setWorkbookName] = useState(initialName);
  const [loading, setLoading] = useState(true);
  // Bump `key` to force a `<Workbook>` remount (its `data` prop is initial-only).
  const [key, setKey] = useState(0);
  // Save feedback state for the "Saving… / Saved" indicator.
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const sheetRef = useRef<WorkbookInstance>(null);
  // Mutable mirrors of state so stable callbacks can always read current values.
  const nameRef = useRef(initialName);
  // Populated once the workbook record loads (creation timestamp is preserved
  // across saves; fall back to the current time for brand-new workbooks).
  const createdAtRef = useRef<number>(0);
  // Latest sheet list seen from `onChange` (internal matrix form). This is the
  // source of truth for saves, so Ctrl+S always persists the newest edits.
  const latestInternalRef = useRef<Sheet[]>([]);
  // Timer handle for clearing the "Saved" flash a couple seconds after it shows.
  const savedFlashRef = useRef<number | null>(null);

  // Load the workbook record from storage when the editor mounts.
  // Depends only on workbookId: the editor is keyed by id in the parent, so a
  // different workbook fully remounts this component.
  useEffect(() => {
    let cancelled = false;
    workbookStorage
      .get(workbookId)
      .then((record) => {
        if (cancelled) return;
        const loaded = record?.sheets ?? createEmptyWorkbook();
        latestInternalRef.current = loaded;
        createdAtRef.current = record?.createdAt ?? Date.now();
        setSheets(loaded);
        if (record?.name) {
          nameRef.current = record.name;
          setWorkbookName(record.name);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [workbookId]);

  // Persist a full workbook (external celldata sheets) to storage and keep the
  // workspace list metadata in sync. Single write path shared by autosave,
  // rename, import and Ctrl+S.
  const persistExternal = useCallback(
    async (external: Sheet[]) => {
      await workbookStorage.save({
        id: workbookId,
        name: nameRef.current,
        createdAt: createdAtRef.current,
        updatedAt: Date.now(),
        sheets: external,
      });
      onTouched(workbookId, { sheetCount: external.length, updatedAt: Date.now() });
    },
    [workbookId, onTouched],
  );

  // Autosave: FortuneSheet's `data` prop is initial-only, so `onChange` is for
  // persistence only. We never feed its output back into state (that caused an
  // infinite render loop) and keep this callback identity stable with useCallback
  // for the same reason. `onChange` gives the INTERNAL matrix form → normalize.
  const handleSheetsChange = useCallback(
    (data: Sheet[]) => {
      latestInternalRef.current = data;
      void persistExternal(toExternalSheets(data));
    },
    [persistExternal],
  );

  // Imported files arrive in EXTERNAL celldata form: hand them to the `data`
  // prop and persist as-is. The Workbook remounts (setKey) and its `onChange`
  // repopulates latestInternalRef with the internal matrix afterwards.
  const handleSheetsLoad = useCallback(
    (data: Sheet[]) => {
      latestInternalRef.current = data;
      setSheets(data);
      void persistExternal(data);
    },
    [persistExternal],
  );

  // Rename: update the editable name field, reflect it in the workspace card,
  // and persist (using the latest known sheets).
  const updateWorkbookName = useCallback(
    (name: string) => {
      nameRef.current = name;
      setWorkbookName(name);
      onTouched(workbookId, { name, updatedAt: Date.now() });
      void persistExternal(toExternalSheets(latestInternalRef.current));
    },
    [workbookId, onTouched, persistExternal],
  );

  // Explicit save (Ctrl+S or the Save button): snapshot the latest internal
  // sheets, persist, then flash a "Saved" indicator so the user knows the data
  // is safely in storage.
  const handleSave = useCallback(async () => {
    setSaving(true);
    try {
      await persistExternal(toExternalSheets(latestInternalRef.current));
      setSavedAt(Date.now());
      if (savedFlashRef.current) window.clearTimeout(savedFlashRef.current);
      savedFlashRef.current = window.setTimeout(() => setSavedAt(null), 2000);
    } finally {
      setSaving(false);
    }
  }, [persistExternal]);

  // Ctrl/Cmd+S → save to storage (never the browser's "save page" dialog).
  // Registered in the CAPTURE phase on window so it runs before any handler
  // FortuneSheet, the browser, or the page might attach, then preventDefault
  // blocks the native save dialog and stopPropagation silences the rest.
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key.toLowerCase() !== "s") return;
      e.preventDefault();
      e.stopPropagation();
      void handleSave();
    };
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      window.removeEventListener("keydown", onKeyDown, true);
      if (savedFlashRef.current) window.clearTimeout(savedFlashRef.current);
    };
  }, [handleSave]);

  // Toolbar items carry stable icon/onClick references; memoizing avoids
  // re-cloning mergedSettings (and re-rendering the toolbar) on every edit.
  const customToolbarItems = useMemo(() => [importToolBarItem(), exportToolBarItem()], []);

  const handleImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const { transformExcelToFortune } = await import("@corbe30/fortune-excel");
      await transformExcelToFortune(file, handleSheetsLoad, setKey, sheetRef);
      if (workbookName === "Untitled Workbook") {
        updateWorkbookName(file.name.replace(/\.(xlsx|csv)$/i, ""));
      }
    };
    input.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Editor header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-default, #e5e7eb)",
          background: "var(--bg-surface, #fff)",
          flexShrink: 0,
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0, flex: 1 }}>
          <button
            onClick={onBack}
            title="Back to workbooks"
            className="spread-tool-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 12px",
              border: "1px solid var(--border-default, #d1d5db)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
              flexShrink: 0,
            }}
          >
            <ArrowLeft size={15} />
            Back
          </button>

          <FileSpreadsheet
            size={18}
            style={{ color: "var(--text-muted, #6b7280)", flexShrink: 0 }}
          />
          <input
            value={workbookName}
            onChange={(e) => updateWorkbookName(e.target.value)}
            spellCheck={false}
            title="Workbook name"
            style={{
              border: "none",
              outline: "none",
              background: "transparent",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary, #111827)",
              minWidth: 0,
              padding: "4px 8px",
              borderRadius: "6px",
              width: "100%",
              maxWidth: "300px",
            }}
            onFocus={(e) => (e.currentTarget.style.background = "var(--bg-page, #f9fafb)")}
            onBlur={(e) => (e.currentTarget.style.background = "transparent")}
          />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={handleImportFile}
            title="Import .xlsx or .csv"
            className="spread-tool-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              border: "1px solid var(--border-default, #d1d5db)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <Upload size={15} />
            Import
          </button>

          <button
            onClick={() => exportToolBarItem().onClick({})}
            title="Export to Excel"
            className="spread-tool-btn"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              border: "1px solid var(--border-default, #d1d5db)",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: 500,
            }}
          >
            <Save size={15} />
            Export
          </button>

          <button
            onClick={() => void handleSave()}
            disabled={saving}
            title="Save (Ctrl+S)"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "none",
              background: "var(--bg-nav-active, #2563eb)",
              color: "#fff",
              fontSize: "13px",
              fontWeight: 500,
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Save size={15} />
            Save
          </button>

          {saving && (
            <span style={{ fontSize: "12px", color: "var(--text-muted, #6b7280)" }}>
              Saving…
            </span>
          )}
          {!saving && savedAt && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                fontSize: "12px",
                color: "var(--text-success, #16a34a)",
              }}
            >
              <Check size={13} />
              Saved
            </span>
          )}
        </div>
      </div>

      {/* FortuneSheet workbook (only mounted once the saved data has loaded, so
          the initial `data` prop carries the stored celldata). */}
      <div style={{ flex: 1, minHeight: 0 }}>
        {loading ? (
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "14px",
              color: "var(--text-muted, #6b7280)",
            }}
          >
            Loading workbook…
          </div>
        ) : (
          <>
            <FortuneExcelHelper
              setKey={setKey}
              setSheets={handleSheetsLoad}
              sheetRef={sheetRef}
              config={{ import: { xlsx: true, csv: true }, export: { xlsx: true, csv: true } }}
            />
            <Workbook
              key={key}
              data={sheets}
              ref={sheetRef}
              row={100}
              onChange={handleSheetsChange}
              customToolbarItems={customToolbarItems}
            />
          </>
        )}
      </div>
    </div>
  );
}

export function ExternalSheet() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeId = searchParams.get("id");
  const { workbooks, loading, createWorkbook, deleteWorkbook, touchWorkbook } = useWorkbooks();

  const meta = workbooks.find((w) => w.id === activeId);

  // Redirect to the workspace when ?id= points at a nonexistent workbook.
  // Only runs after the list has finished loading to avoid a false redirect
  // while storage is still being read.
  useEffect(() => {
    if (loading) return;
    if (activeId && !meta) setSearchParams({}, { replace: true });
  }, [activeId, meta, loading, setSearchParams]);

  const handleNewWorkbook = async () => {
    const id = await createWorkbook("Untitled Workbook");
    setSearchParams({ id });
  };

  const handleDeleteWorkbook = async (id: string, name: string) => {
    if (!window.confirm(`Delete "${name}"? This cannot be undone.`)) return;
    await deleteWorkbook(id);
    if (activeId === id) setSearchParams({});
  };

  // Editor view (a workbook is open via ?id=). Rendered whenever an id is
  // present — the editor loads its own data, so it is safe even before the
  // workspace list finishes loading.
  if (activeId) {
    return (
      <WorkbookEditor
        key={activeId}
        workbookId={activeId}
        initialName={meta?.name ?? "Untitled Workbook"}
        onTouched={touchWorkbook}
        onBack={() => setSearchParams({})}
      />
    );
  }

  // Workspace view (no ?id=)
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        overflowY: "auto",
        background: "var(--bg-page, #f9fafb)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "12px",
          padding: "16px 24px",
          borderBottom: "1px solid var(--border-default, #e5e7eb)",
          background: "var(--bg-surface, #fff)",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <FileSpreadsheet size={22} style={{ color: "var(--bg-nav-active, #2563eb)" }} />
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: 700, color: "var(--text-primary, #111827)" }}>
              Workbooks
            </h2>
            <p style={{ margin: "2px 0 0", fontSize: "13px", color: "var(--text-muted, #6b7280)" }}>
              Your spreadsheet workspace
            </p>
          </div>
        </div>

        <button
          onClick={() => void handleNewWorkbook()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 16px",
            borderRadius: "8px",
            border: "none",
            background: "var(--bg-nav-active, #2563eb)",
            color: "#fff",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <Plus size={16} />
          New Workbook
        </button>
      </div>

      <div style={{ padding: "24px" }}>
        {loading ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 20px",
              color: "var(--text-muted, #6b7280)",
            }}
          >
            Loading workbooks…
          </div>
        ) : workbooks.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "64px 20px",
              color: "var(--text-muted, #6b7280)",
              border: "1px dashed var(--border-default, #d1d5db)",
              borderRadius: "12px",
              background: "var(--bg-surface, #fff)",
            }}
          >
            <FileSpreadsheet size={48} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "var(--text-primary, #111827)" }}>
              No workbooks yet
            </h3>
            <p style={{ margin: "6px 0 20px", fontSize: "14px" }}>
              Create your first workbook to start building spreadsheets.
            </p>
            <button
              onClick={() => void handleNewWorkbook()}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "8px 16px",
                borderRadius: "8px",
                border: "none",
                background: "var(--bg-nav-active, #2563eb)",
                color: "#fff",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              <Plus size={16} />
              New Workbook
            </button>
          </div>
        ) : (
          <div className="workbook-grid">
            {workbooks.map((wb) => (
              <WorkbookCard
                key={wb.id}
                workbook={wb}
                onOpen={() => setSearchParams({ id: wb.id })}
                onDelete={() => void handleDeleteWorkbook(wb.id, wb.name)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
