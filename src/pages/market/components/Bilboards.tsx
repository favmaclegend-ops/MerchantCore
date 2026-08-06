import { useEffect, useState } from "react";
import { marketStore } from "../demoMarketStore";
import { SquareArrowOutUpRightIcon } from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
//import { useMountEffect } from "elk-components";

export const Bilboards = () => {
  const top4RatingShop = marketStore.getState().top4tRatingShops;
  const advert = marketStore.getState().advert;
  const [currentDisplayAdvert, setCurrentDisplayAdvert] = useState(0);
  const [opacity, setOpacity] = useState(1);
  const bp = useBreakpoint();

  useEffect(() => {
    const id = setTimeout(() => {
      if (currentDisplayAdvert >= advert.length - 1) {
        setCurrentDisplayAdvert(0);
      } else {
        setCurrentDisplayAdvert((prev) => prev + 1);
      }
    }, 4000);

    //setOpacity(1);
    return () => {
      setOpacity(1);
      clearTimeout(id);
    };
  }, [currentDisplayAdvert, opacity, advert.length]);

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
          width: bp.xsm ? "50%" : '100%',

          height: "20rem",
          borderRadius: "1rem",
          background: "grey",
          opacity: opacity,

          backgroundSize: "cover",
          position: "relative",
          backgroundOrigin: "50% 50%",
          transition: "background .5s ease, opacity .5s ease",
          overflow: 'hidden'
        }}
      >
        <img src={advert[currentDisplayAdvert]?.advertUrl} style={{objectFit: 'cover', width: '100%',}} draggable={false}/>
        <div
          style={{
            color: "grey",
            position: "absolute",
            bottom: "0",
            padding: "1rem",
            display: "flex",
            flexDirection: "column",
            width: '100%'
          }}
        >
          <div style={{display: 'flex', alignItems: 'center', width: '100%'}}>
            <span>{advert[currentDisplayAdvert]?.id}</span>
            <SquareArrowOutUpRightIcon color="white" style={{marginInlineStart: 'auto', cursor: 'pointer'}}/>
          </div>
        </div>
      </div>

      {/* {Top 4 highest shop rating }>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>*/}
      {
         bp.xsm &&
        <div
        style={{
          display: "grid",
          flex: "1",
          borderRadius: "1rem",
          gridTemplateColumns: "1fr 1fr",
        }}
      >
        {top4RatingShop.map((shop) => (
          <div
            key={shop.product_id}
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
            }}
          >
            <div
              className="click"
              style={{
                width: "100%",
                borderRadius: ".5rem",
                background: "#7878786b",
                backgroundImage: `url('${marketStore.getState().shops[shop.shop_id].shopProfileImage}')`,
                height: "8rem",
                overflow: "hidden",
                position: "relative",
                backgroundSize: "cover",
              }}
            >
              {/* {<img style={{objectFit: 'cover', borderRadius: '.5rem'}}/>} */}
              <div
                style={{
                  cursor: "pointer",
                  display: "flex",
                  flexDirection: "column",
                  position: "absolute",
                  bottom: "0",
                  width: "100%",
                  padding: ".4rem 1rem",
                  background:
                    "linear-gradient(to bottom, transparent, #17171790)",
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
          </div>
        ))}
      </div>}
    </div>
  );
};
