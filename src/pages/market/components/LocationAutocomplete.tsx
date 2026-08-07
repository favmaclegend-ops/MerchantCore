import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent,
} from "react";
import { createPortal } from "react-dom";
import { Loader2, MapPin } from "lucide-react";
import {
  debounce,
  suggestAddresses,
  suggestCities,
  type PlaceSuggestion,
} from "../geocode";

export interface LocationSelection {
  label: string;
  lat: number;
  lng: number;
}

const labelStyle: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: ".3rem",
  fontSize: ".78rem",
  fontWeight: 600,
  color: "var(--text-muted)",
  textTransform: "uppercase",
  letterSpacing: ".04em",
};

const fieldStyle: CSSProperties = {
  width: "100%",
  padding: ".6rem .75rem",
  borderRadius: ".6rem",
  border: "1px solid var(--border-input)",
  background: "var(--bg-surface)",
  color: "var(--text-primary)",
  fontSize: ".9rem",
  outline: "none",
};

const PANEL_GAP = 6;
const PANEL_MAX_HEIGHT = 192;
const ITEM_HEIGHT = 52;

export function LocationAutocomplete({
  label,
  placeholder,
  value,
  onChange,
  onSelectionChange,
  cityMode = false,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  onSelectionChange: (selection: LocationSelection | null) => void;
  cityMode?: boolean;
}) {
  const minChars = cityMode ? 2 : 3;
  const [suggestions, setSuggestions] = useState<PlaceSuggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(0);
  const [resolved, setResolved] = useState<LocationSelection | null>(null);
  const [panelPos, setPanelPos] = useState<{
    top: number;
    left: number;
    width: number;
    openUp: boolean;
  } | null>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLUListElement | null>(null);
  const seqRef = useRef(0);
  const suppressRef = useRef(false);
  const searchRef = useRef<(q: string) => void>(() => {});

  const updateRect = useCallback((count: number) => {
    const el = inputRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const estHeight = Math.min(PANEL_MAX_HEIGHT, count * ITEM_HEIGHT + 10);
    const fitsBelow = r.bottom + PANEL_GAP + estHeight <= window.innerHeight;
    const fitsAbove = r.top - PANEL_GAP - estHeight >= 0;
    const openUp = !fitsBelow && fitsAbove;
    setPanelPos({
      top: openUp ? r.top - PANEL_GAP : r.bottom + PANEL_GAP,
      left: r.left,
      width: r.width,
      openUp,
    });
  }, []);

  useEffect(() => {
    searchRef.current = debounce((q: string) => {
      const seq = ++seqRef.current;
      const trimmed = q.trim();
      if (trimmed.length < minChars) {
        setSuggestions([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      const run = cityMode ? suggestCities : suggestAddresses;
      run(trimmed)
        .then((results) => {
          if (seq !== seqRef.current) return;
          setSuggestions(results);
          setActive(0);
          setOpen(results.length > 0);
          updateRect(results.length);
        })
        .catch(() => {
          if (seq !== seqRef.current) return;
          setSuggestions([]);
          setOpen(false);
        })
        .finally(() => {
          if (seq === seqRef.current) setLoading(false);
        });
    }, 300);
  }, [minChars, cityMode, updateRect]);

  useEffect(() => {
    if (suppressRef.current) return;
    if (value.trim()) searchRef.current(value);
  }, [value, searchRef, minChars, cityMode]);

  useEffect(() => {
    if (!open) return;
    const onScroll = () => updateRect(suggestions.length);
    const onResize = () => updateRect(suggestions.length);
    document.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onResize);
    };
  }, [open, updateRect, suggestions.length]);

  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (boxRef.current?.contains(target) || panelRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const pick = (s: PlaceSuggestion) => {
    suppressRef.current = true;
    const selection: LocationSelection = {
      label: s.label,
      lat: s.lat,
      lng: s.lng,
    };
    onChange(s.label);
    setResolved(selection);
    setOpen(false);
    onSelectionChange(selection);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    suppressRef.current = false;
    if (!next.trim()) {
      seqRef.current++;
      setSuggestions([]);
      setOpen(false);
      setLoading(false);
    }
    setResolved(null);
    onSelectionChange(null);
    onChange(next);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      if (open && suggestions[active]) {
        e.preventDefault();
        pick(suggestions[active]);
      }
    } else if (e.key === "Escape") {
      suppressRef.current = true;
      setOpen(false);
    }
  };

  const showStatus = loading || resolved !== null;

  return (
    <div ref={boxRef} style={{ position: "relative" }}>
      <label style={labelStyle}>
        {label}
        <div style={{ position: "relative" }}>
          <input
            ref={inputRef}
            placeholder={placeholder}
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            style={{
              ...fieldStyle,
              paddingRight: showStatus ? "2.25rem" : ".75rem",
            }}
          />
          {loading && (
            <Loader2
              size={16}
              className="spin"
              color="var(--text-muted)"
              style={{ position: "absolute", right: ".6rem", top: "50%", transform: "translateY(-50%)" }}
            />
          )}
          {!loading && resolved !== null && (
            <MapPin
              size={16}
              color="var(--text-success)"
              style={{ position: "absolute", right: ".6rem", top: "50%", transform: "translateY(-50%)" }}
            />
          )}
        </div>
      </label>

      {open &&
        suggestions.length > 0 &&
        panelPos &&
        createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            style={{
              position: "fixed",
              top: panelPos.top,
              left: panelPos.left,
              width: panelPos.width,
              zIndex: 1100,
              margin: 0,
              padding: ".3rem",
              listStyle: "none",
              maxHeight: `${PANEL_MAX_HEIGHT}px`,
              overflowY: "auto",
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: ".6rem",
              boxShadow: "var(--shadow-menu)",
              transform: panelPos.openUp ? "translateY(-100%)" : "none",
            }}
          >
            {suggestions.map((s, i) => {
              const [primary, ...rest] = s.label.split(", ");
              const secondary = rest.join(", ");
              return (
                <li
                  key={s.place_id}
                  role="option"
                  aria-selected={i === active}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    pick(s);
                  }}
                  onMouseEnter={() => setActive(i)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".5rem",
                    padding: ".45rem .5rem",
                    borderRadius: ".45rem",
                    cursor: "pointer",
                    background: i === active ? "var(--bg-secondary)" : "transparent",
                  }}
                >
                  <MapPin size={14} color="var(--text-info)" style={{ flexShrink: 0 }} />
                  <div style={{ minWidth: 0 }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: ".85rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      {primary}
                    </span>
                    {secondary && (
                      <span
                        style={{
                          display: "block",
                          fontSize: ".72rem",
                          color: "var(--text-muted)",
                          whiteSpace: "nowrap",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {secondary}
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>,
          document.body,
        )}
    </div>
  );
}
