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
        {current && (
          <BillboardVideo key={current.id} ad={current} onEnded={next} />
        )}
      </div>

      {top4RatingShop.length > 0 && bp.xsm && (
        <div
          style={{
            display: "grid",
            flex: "1",
            borderRadius: "1rem",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
          }}
        >
          {top4RatingShop.map((shop) => (
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
          ))}
        </div>
      )}
    </div>
  );
};
