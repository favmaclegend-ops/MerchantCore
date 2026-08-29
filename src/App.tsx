import { Routes, Route, useLocation } from "react-router-dom";
import DefaultPage from "./pages/authentication/default_page";
import VerifyEmailPage from "./pages/authentication/VerifyEmailPage";
import Home from "./pages/home/home";
import PublicMarketLayout from "./pages/market/PublicMarketLayout";
import { useEffect } from "react";

export default function App() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname.includes("/market/chat")) {
      document.body.style.background = "var(--bg-surface)";
    }
    
  });
  return (
    <>
      <Routes>
        <Route path="/" element={<DefaultPage />} />
        <Route
          path="/verify-email"
          element={
            <div
              style={{
                minHeight: "var(--app-min-height)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-page)",
                padding: "24px",
              }}
            >
              <VerifyEmailPage />
            </div>
          }
        />
        <Route path="/market/*" element={<PublicMarketLayout />} />
        <Route path="/home/*" element={<Home />} />
      </Routes>
    </>
  );
}
