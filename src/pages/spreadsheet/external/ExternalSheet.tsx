import { useRef, useState } from "react";
import { Workbook, type WorkbookInstance } from "@fortune-sheet/react";
import type { Sheet } from "@fortune-sheet/core";
import "@fortune-sheet/react/dist/index.css";
import {
  FortuneExcelHelper,
  importToolBarItem,
  exportToolBarItem,
  transformFortuneToExcel,
} from "@corbe30/fortune-excel";
import { Save, FileSpreadsheet, Upload } from "lucide-react";
import type { IFileType } from "@corbe30/fortune-excel/dist/common/ICommon";

const initialData: Sheet[] = [
  {
    name: "Core Ledger",
    celldata: [
      { r: 0, c: 0, v: { v: 1500, m: "1500" } },
      { r: 0, c: 1, v: { v: 450, m: "450" } },
      { r: 0, c: 2, v: { v: "=SUM(A1:B1)", m: "=SUM(A1:B1)" } },
    ],
  },
];

export function ExternalSheet() {
  const sheetRef = useRef<WorkbookInstance>(null);
  const [key, setKey] = useState(0);
  const [sheets, setSheets] = useState<Sheet[]>(initialData);
  const [workbookName, setWorkbookName] = useState("Untitled Workbook");
  const [saving, setSaving] = useState(false);

  const handleSaveAs = async () => {
    if (!sheetRef.current || saving) return;
    setSaving(true);
    try {
      await transformFortuneToExcel(sheetRef, "xlsx" as IFileType, true);
    } finally {
      setSaving(false);
    }
  };

  const handleImportFile = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.csv";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const { transformExcelToFortune } = await import("@corbe30/fortune-excel");
      await transformExcelToFortune(file, setSheets, setKey, sheetRef);
      if (!workbookName || workbookName === "Untitled Workbook") {
        setWorkbookName(file.name.replace(/\.(xlsx|csv)$/, ""));
      }
    };
    input.click();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", width: "100%", height: "100%" }}>
      {/* Workspace Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-default, #e5e7eb)",
          background: "var(--bg-surface, #fff)",
          flexShrink: 0,
        }}
      >
        {/* Left: workbook name */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
          <FileSpreadsheet size={20} style={{ color: "var(--text-muted, #6b7280)", flexShrink: 0 }} />
          <input
            value={workbookName}
            onChange={(e) => setWorkbookName(e.target.value)}
            spellCheck={false}
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
              width: "280px",
            }}
            onFocus={(e) => e.currentTarget.style.background = "var(--bg-page, #f9fafb)"}
            onBlur={(e) => e.currentTarget.style.background = "transparent"}
          />
        </div>

        {/* Right: action buttons */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <button
            onClick={handleImportFile}
            title="Import .xlsx or .csv"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-default, #d1d5db)",
              background: "var(--bg-surface, #fff)",
              color: "var(--text-secondary, #374151)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Upload size={15} />
            Import
          </button>

          <button
            onClick={() => exportToolBarItem().onClick({})}
            title="Export to Excel"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "6px 14px",
              borderRadius: "8px",
              border: "1px solid var(--border-default, #d1d5db)",
              background: "var(--bg-surface, #fff)",
              color: "var(--text-secondary, #374151)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            <Save size={15} />
            Export
          </button>

          <button
            onClick={handleSaveAs}
            disabled={saving}
            title="Save as .xlsx"
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
            {saving ? "Saving..." : "Save as .xlsx"}
          </button>
        </div>
      </div>

      {/* FortuneSheet Workbook */}
      <div style={{ flex: 1, minHeight: 0 }}>
        <FortuneExcelHelper
          setKey={setKey}
          setSheets={setSheets}
          sheetRef={sheetRef}
          config={{ import: { xlsx: true, csv: true }, export: { xlsx: true, csv: true } }}
        />
        <Workbook
          key={key}
          data={sheets}
          ref={sheetRef}
          onChange={setSheets}
          customToolbarItems={[importToolBarItem(), exportToolBarItem()]}
        />
      </div>
    </div>
  );
}
