import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Loader2,
  ScanLine,
  ShieldAlert,
} from "lucide-react";
import { api } from "@/lib/api";
import { getOrgSession } from "@/data/organisations";

const base = () =>
  window.location.pathname.startsWith("/market") ? "/market" : "/home/market";

type ScanState = "idle" | "working" | "success" | "error" | "no-org";

export function MarketScanPage() {
  const [params] = useSearchParams();
  const urlCode = params.get("code") ?? "";
  const [code, setCode] = useState(urlCode);
  const [state, setState] = useState<ScanState>("idle");
  const [message, setMessage] = useState("");
  const [detail, setDetail] = useState("");

  const isOrg = !!getOrgSession()?.token;

  const complete = async (token: string) => {
    if (!token.trim()) {
      setState("error");
      setMessage("Missing code");
      setDetail("Enter the order code or scan a QR code to continue.");
      return;
    }
    setState("working");
    try {
      await api.market.scanCompleteOrder(token.trim());
      setState("success");
      setMessage("Order completed");
      setDetail("The market order has been marked as completed and revenue was recorded. The buyer will be updated in real time.");
    } catch (e) {
      setState("error");
      setMessage("Could not complete order");
      setDetail(e instanceof Error ? e.message : "Please try again.");
    }
  };

  useEffect(() => {
    if (!urlCode) {
      if (!isOrg) {
        setState("no-org");
        setMessage("Org login required");
        setDetail("This page is for the shop (organisation) to validate and complete a purchase. Log in with an organisation account first.");
      } else {
        setState("idle");
        setMessage("");
        setDetail("Scan or paste the client's order code below to validate and complete the purchase.");
      }
      return;
    }
    if (!isOrg) {
      setState("no-org");
      setMessage("Org login required");
      setDetail("This purchase can only be validated from an organisation (shop) account. Log in as the shop, then scan the client's code again.");
      return;
    }
    complete(urlCode);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlCode]);

  const handleManual = () => complete(code);

  return (
    <div style={{ padding: "1.5rem", maxWidth: "520px", margin: "0 auto", width: "100%" }}>
      <a
        href={`${base()}/orders`}
        style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "var(--text-secondary)", textDecoration: "none", marginBottom: "1rem" }}
      >
        <ArrowLeft style={{ width: 14, height: 14 }} /> Back to orders
      </a>

      <div style={{ border: "1px solid var(--border-default)", borderRadius: "12px", background: "var(--bg-surface)", padding: "24px", textAlign: "center" }}>
        {state === "working" ? (
          <>
            <Loader2 style={{ width: 32, height: 32, color: "var(--text-info)", margin: "0 auto", animation: "spin 1s linear infinite" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              Validating purchase…
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
        ) : state === "no-org" ? (
          <>
            <ShieldAlert style={{ width: 32, height: 32, color: "var(--text-danger)", margin: "0 auto" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              {message}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 auto", maxWidth: "340px" }}>
              {detail}
            </p>
          </>
        ) : state === "error" ? (
          <>
            <XCircle style={{ width: 32, height: 32, color: "var(--text-danger)", margin: "0 auto" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              {message}
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: 0 }}>{detail}</p>
          </>
        ) : (
          <>
            <ScanLine style={{ width: 32, height: 32, color: "var(--text-info)", margin: "0 auto" }} />
            <h3 style={{ fontSize: "15px", fontWeight: 600, color: "var(--text-primary)", margin: "16px 0 4px 0" }}>
              Validate purchase
            </h3>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", margin: "0 0 16px 0", maxWidth: "340px", marginInline: "auto" }}>
              Scan the client's QR code with an external scanner, or paste the code manually below.
            </p>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Paste order code…"
              style={{
                width: "100%", padding: "10px 12px", fontSize: "13px", color: "var(--text-primary)",
                background: "var(--bg-secondary)", border: "1px solid var(--border-default)",
                borderRadius: "8px", outline: "none", boxSizing: "border-box", marginBottom: "12px",
              }}
            />
            <button
              onClick={handleManual}
              style={{
                width: "100%", padding: "11px 0", fontSize: "13px", fontWeight: 700, color: "var(--bg-surface)",
                background: "var(--bg-nav-active)", borderRadius: "10px", border: "none", cursor: "pointer",
              }}
            >
              Complete purchase
            </button>
          </>
        )}
      </div>
    </div>
  );
}
