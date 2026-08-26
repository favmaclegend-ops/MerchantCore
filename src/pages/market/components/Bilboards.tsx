import { Link } from "react-router-dom";
import { useStore } from "elk-components";
import { marketStore } from "../demoMarketStore";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { BILLBOARD_AD_COUNT, useBillboardAds, useBillboardPlayer } from "../billboard";
import { BillboardVideo } from "./BillboardVideo";

export const Bilboards = () => {
  const state = useStore(marketStore);
  const top4RatingShop = state.top4tRatingShops ?? [];
  const shops = state.shops;
  const advert = state.advert ?? [];
  const billboardAds = useBillboardAds(advert, BILLBOARD_AD_COUNT);
  const { current, next } = useBillboardPlayer(billboardAds);
  const bp = useBreakpoint();

  return (
    <div
      style={{
        display: "flex",
        padding: "1rem",
        width: "100%",
        gap: "1rem",
      }}
    >
      <div
        style={{
          alignSelf: "center",
          display: "flex",
          width: bp.xsm ? "50%" : "100%",
          height: "20rem",
          borderRadius: "1rem",
          overflow: "hidden",
          position: "relative",
        }}
      >
        {current ? (
          <BillboardVideo key={current.id} ad={current} onEnded={next} />
        ) : (
          <div
            style={{
              width: "100%",
              height: "100%",
              borderRadius: "1rem",
              background: "linear-gradient(135deg, var(--bg-nav) 0%, var(--bg-tertiary) 100%)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: ".75rem",
              border: "1px dashed var(--border-input)",
            }}
          >
            <span style={{ fontSize: "2rem", opacity: 0.4 }}>📢</span>
            <span style={{ color: "var(--text-muted)", fontSize: ".9rem", fontWeight: 500 }}>
              No ads available yet
            </span>
          </div>
        )}
      </div>

      {bp.xsm && (
        <div
          style={{
            display: "grid",
            flex: "1",
            borderRadius: "1rem",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          {top4RatingShop.length > 0 ? (
            top4RatingShop.map((shop) => (
              <Link
                key={shop.product_id}
                to={`/home/market/${shop.shop_id}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  width: "100%",
                  height: "clamp(.5svh, auto)",
                  padding: "1rem",
                  background: "var(--bg-nav)",
                  border: "var(--border-default)",
                  borderRadius: ".5rem",
                  gap: ".5rem",
                  position: "relative",
                  overflow: "hidden",
                  textDecoration: "none",
                }}
              >
                <div
                  className="click"
                  style={{
                    width: "100%",
                    borderRadius: ".5rem",
                    background: "#7878786b",
                    backgroundImage: `url('${shops[shop.shop_id]?.shopProfileImage}')`,
                    height: "8rem",
                    overflow: "hidden",
                    position: "relative",
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                  }}
                >
                  <div
                    style={{
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      position: "absolute",
                      bottom: "0",
                      width: "100%",
                      padding: ".4rem 1rem",
                      background: "linear-gradient(to bottom, transparent, #17171790)",
                    }}
                  >
                    <h1 style={{ fontWeight: "bolder", color: "white" }}>
                      {shop.shop_name}
                    </h1>
                    <strong style={{ color: "wheat" }}>{shop.rating}</strong>
                    <span style={{ color: "#b9b9b9", fontSize: ".9rem" }}>
                      {shop.owner}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            Array.from({ length: 4 }).map((_, i) => (
              <div
                key={`placeholder-${i}`}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "100%",
                  height: "clamp(.5svh, auto)",
                  padding: "1rem",
                  background: "var(--bg-nav)",
                  border: "1px dashed var(--border-input)",
                  borderRadius: ".5rem",
                  gap: ".5rem",
                }}
              >
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "50%",
                    background: "var(--bg-tertiary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.2rem",
                    color: "var(--text-muted)",
                  }}
                >
                  {i === 0 ? "No top rated" : ""}
                </div>
                <span
                  style={{
                    color: "var(--text-muted)",
                    fontSize: ".75rem",
                    textAlign: "center",
                  }}
                >
                  {i === 0 ? "No top rated shops yet" : ""}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};
