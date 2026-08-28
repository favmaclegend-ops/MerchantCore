import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowLeft, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { api } from "@/lib/api";

const base = () =>
  window.location.pathname.startsWith("/market") ? "/market" : "/home/market";

export function MarketScanPage() {
  const [params] = useSearchParams();
  const code = params.get("code") ?? "";
  const [state, setState] = useState<"idle" | "working" | "success" | "error">(
    code ? "working" : "error",
  );
  const [message, setMessage] = useState(() =>
    code ? "" : "No code found in the URL",
  );
  const [detail, setDetail] = useState(() =>
    code ? "" : "Open this from a market order QR code.",
  );

  useEffect(() => {
    if (!code) return;
    let cancelled = false;
    api.market
      .scanCompleteOrder(code)
      .then(() => {
        if (cancelled) return;
        setState("success");
        setMessage("Order completed");
        setDetail("The market order has been marked as completed and revenue was recorded.");
      })
      .catch((e) => {
        if (cancelled) return;
        setState("error");
        setMessage("Could not complete order");
        setDetail(e instanceof Error ? e.message : "Please try again.");
      });
    return () => {
      cancelled = true;
    };
  }, [code]);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "520px", margin: "0 auto", width: "100%" }}>
      <a
        href={`${base()}/orders`}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "1rem" }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to orders
      </a>

      <div style={{ border: "1px solid var(--border-default)", borderRadius: "12px", background: "var(--bg-surface)", padding: "24px", textAlign: "center" }}>
        {state === "idle" || state === "working" ? (
          <>
            <Loader2 style={{ width: 32, height: 32, color: "var(--text-info)", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              Completing order…
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>
              Verifying the code and recording revenue.
            </p>
          </>
        ) : state === "success" ? (
          <>
            <CheckCircle2 style={{ width: 32, height: 32, color: "var(--text-success)", margin: "0 auto" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              {message}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{detail}</p>
          </>
        ) : (
          <>
            <XCircle style={{ width: 32, height: 32, color: "var(--text-danger)", margin: "0 auto" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              {message}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{detail}</p>
          </>
        )}
      </div>
    </div>
  );
}
