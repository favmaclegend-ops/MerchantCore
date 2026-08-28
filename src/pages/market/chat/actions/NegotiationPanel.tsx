import { useBreakpoint } from "@/hooks/useBreakpoint";
import { generalStore } from "../../store/generalStore";
import { Coins } from "lucide-react";

export default function NegotiationPanel() {
  const bp = useBreakpoint();
  return (
    <>
      <div
        onClick={(e) => e.currentTarget == e.target && generalStore.setState({ isNegotiationPanel: false })}
        style={{
          display: "flex",
          inset: 0,
          width: "100%",
          height: "100%",
          position: "fixed",
          flexDirection: "column",
          zIndex: "111",
          background: "#040d1c2c",
          backdropFilter: "blur(10px)",
          alignItems: "center",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            height: "60%",
            maxWidth: "600px",
            position: "absolute",
            background: "var(--bg-surface",
            border: "1px solid var(--border-default)",
            borderRadius: "1rem",
            bottom: !bp.sm ? 100 : 0,
            padding: "1rem",
            gap: '1rem',
          }}
        >
          <span>Negotiate</span>
          <div style={{ display: "flex", alignItems: "center", width: '100%' }}>
            <button onClick={() => generalStore.setState({isNegotiationPanel: false, isDiscountPanel: true})} style={{display: 'flex', padding: '1rem', borderRadius: '1rem', flexDirection: 'column', alignItems: 'center', gap: '1rem', border: '1px solid var(--border-input)'}}>
              <Coins color="red"/>
              <span style={{fontSize: 'clamp(10px, 12px, 14px)'}}>New Discount</span>
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
