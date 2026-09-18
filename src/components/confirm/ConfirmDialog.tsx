import { Loader2, Trash2 } from "lucide-react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) return null;
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "1rem",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--bg-surface)",
          borderRadius: "1rem",
          padding: "1.25rem",
          width: "100%",
          maxWidth: 360,
          display: "flex",
          flexDirection: "column",
          gap: ".75rem",
        }}
      >
        <span style={{ fontWeight: 700, fontSize: ".95rem", color: "var(--text-primary)" }}>
          {title}
        </span>
        {message && (
          <span style={{ fontSize: ".82rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
            {message}
          </span>
        )}
        <div style={{ display: "flex", gap: ".5rem", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            disabled={busy}
            style={{
              padding: ".4rem .9rem",
              borderRadius: ".5rem",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              fontSize: ".8rem",
              cursor: busy ? "not-allowed" : "pointer",
            }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={busy}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".3rem",
              padding: ".4rem .9rem",
              borderRadius: ".5rem",
              border: "none",
              background: "var(--text-danger, #dc2626)",
              color: "#fff",
              fontSize: ".8rem",
              fontWeight: 600,
              cursor: busy ? "not-allowed" : "pointer",
              opacity: busy ? 0.5 : 1,
            }}
          >
            {busy ? <Loader2 size={13} className="spin" /> : <Trash2 size={13} />}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
