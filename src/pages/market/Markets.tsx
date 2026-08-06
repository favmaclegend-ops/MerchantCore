import { useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import { Bilboards } from "./components/Bilboards";
import { useState, type ChangeEvent } from "react";
import { useBreakpoint } from "@/hooks/useBreakpoint";

type formatValue = string;

const valueFormater = (value: formatValue, fixed: number = 2) => {
  const parseValue = parseFloat(value);
  if (!parseValue) return "NAN";
  if (parseValue >= 1000000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}T`;
  if (parseValue >= 1000000000)
    return `${(parseValue / 1000000000).toFixed(fixed)}B`;
  if (parseValue >= 1000000) return `${(parseValue / 1000000).toFixed(fixed)}M`;
  if (parseValue >= 1000) return `${(parseValue / 1000).toFixed(fixed)}K`;
  else return `${parseValue.toFixed(fixed)}`;
};

export function Markets() {
  useStore(marketStore);
  const products = marketStore.getState().products;
  const categories = marketStore.getState().catergories;
  const [activeCat, setActiveCat] = useState(0);
  const bp = useBreakpoint();

  const [filterProduct, setFilterProduct] = useState(products);

  const handleActiveCat = (idx: number) => {
    setActiveCat(idx);
    setFilterProduct(
      categories[idx] == "All"
        ? products
        : products.filter((p) => p.category == categories[idx]),
    );
  };

  const handleSearch = (e: ChangeEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    const query = target?.value;

    if (query == "") {
      setFilterProduct(
        categories[activeCat] == "All"
          ? products
          : products.filter((p) => p.category == categories[activeCat]),
      );
      return;
    }
    setFilterProduct(
      products.filter(
        (p) =>
          p?.product_name.toLowerCase().includes(query?.toLowerCase()) ||
          p?.category.toLowerCase().includes(query?.toLowerCase()) || p.keywords.includes(query.toLocaleLowerCase()),
      ),
    );
  };
  return (
    <>
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          flexDirection: "column",
          alignItems: "center",
          padding: "1rem",
          gap: "1rem",
          overflowY: 'auto'
        }}
      >
        <Bilboards />
        {/* {Product Section}>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>> */}
        <div style={{ display: "flex", width: "100%" }}>
          <input
            placeholder="Search Products..."
            style={{
              width: "100%",
              border: "1px solid var(--border-default)",
              background: "var(--bg-surface)",
              padding: ".5rem",
              borderRadius: "1rem",
            }}
            onChange={handleSearch}
          />
        </div>
        <div
          style={{
            display: "flex",
            gap: "1rem",
            alignItems: "center",
            width: "100%",
            overflowX: "auto",
            flex: '0 0 auto'
          }}
        >
          {categories.map((cat, idx) => (
            <button
              key={idx}
              style={{
                padding: ".5rem 1rem",
                borderRadius: "3rem",
                border: "1px solid var(--border-default)",
                flex: "0 0 auto",
                cursor: "pointer",
                background: activeCat == idx ? "var(--bg-nav-active)" : "",
                color:
                  activeCat == idx
                    ? "var(--bg-surface)"
                    : "var(--text-primary)",
                transition: "background .4s ease",
              }}
              onClick={() => handleActiveCat(idx)}
            >
              {cat}
            </button>
          ))}
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns:  bp.xxsm ? '1fr' : bp.sm ? '1fr 1fr':`repeat(auto-fit, minmax(190px, ${filterProduct.length <= 3 ? "300px" : ".5fr"})`,
            width: "100%",
            gap: "1rem",

          }}
        >
          {filterProduct.map((product) => (
            <div
              key={product.product_id}
              style={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                width: "100%",
                height: "clamp(.5svh, auto)",
                padding: "1rem",
                background: "var(--bg-nav)",
                border: "var(--border-default)",
                borderRadius: "1rem",
                gap: ".5rem",
              

              }}
            >
              <div
                style={{
                  width: "100%",
                  borderRadius: ".5rem",
                  background: "#7878786b",
                  height: "8rem",
                  cursor: "pointer",
                }}
              >
                {/* {<img style={{objectFit: 'cover', borderRadius: '.5rem'}}/>} */}
              </div>

              <div>
                <div>
                  <h2>{product.product_name}</h2>
                </div>
                <div
                  style={{ display: "flex", alignItems: "center", gap: "1rem" }}
                >
                  <strong>NLE{valueFormater(product.product_price)}</strong>
                  <strong style={{ color: "gold", marginInlineStart: "auto" }}>
                    {valueFormater(product.product_rating)}
                  </strong>
                </div>
              </div>
              <div>
                <button
                  style={{
                    width: "100%",
                    padding: ".4rem",
                    borderRadius: ".5rem",
                    background: "var(--bg-nav-active)",
                    cursor: "pointer",
                  }}
                  className="click"
                >
                  <span style={{ color: "var(--bg-surface)" }}>
                    Add to Cart
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
