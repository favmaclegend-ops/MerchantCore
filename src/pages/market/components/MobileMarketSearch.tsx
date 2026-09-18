import { X, Search } from "lucide-react";

interface MobileMarketSearchProps {
  value: string;
  onChange: (value: string) => void;
  onClose: () => void;
}

/**
 * Pinned, full-width search bar shown on the mobile market once the user
 * scrolls. Lives in the sticky header row and can be dismissed with the X to
 * return to the normal market layout (clearing any active search).
 */
export function MobileMarketSearch({ value, onChange, onClose }: MobileMarketSearchProps) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: "0.5rem",
        width: "100%",
        
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          gap: "0.5rem",
          padding: "0.35rem 0.75rem",
          borderRadius: "1rem",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          
        }}
      >
        <Search style={{ width: "16px", height: "16px", color: "var(--text-placeholder)", flexShrink: 0 }} />
        <input
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Search products, shops, categories…"
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "16px",
            color: "var(--text-primary)",
          }}
        />
      </div>
      <button
        onClick={onClose}
        aria-label="Cancel search"
        title="Cancel search"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "34px",
          height: "34px",
          borderRadius: "50%",
          background: "var(--bg-nav-active)",
          color: "var(--bg-surface)",
          border: "none",
          cursor: "pointer",
          flexShrink: 0,
        }}
      >
        <X style={{ width: "18px", height: "18px" }} />
      </button>
    </div>
  );
}
