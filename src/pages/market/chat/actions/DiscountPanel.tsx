import {
  useContext,
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
} from "react";
import { generalStore } from "../../store/generalStore";
import { Authcontext } from "@/context";
import { api } from "@/lib/api";
import type { Product } from "@/pages/inventory/InventoryPage";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { getUploadedSourceIds } from "../../marketUpload";
import { useShopOwner } from "../../useShopOwner";
import { useParams } from "react-router-dom";
import { sendMessage } from "../chatStore";

const LOW_STOCK_THRESHOLD = 20;

function stockStatus(stock: number): Product["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

function normalizeProducts(products: Product[]): Product[] {
  return products.map((p) => ({ ...p, status: stockStatus(p.stock) }));
}

/** Generate a unique discount offer link used to authenticate the offer. */
function generateDiscountLink(): string {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  return `disc-${id}`;
}
export default function DiscountPanel() {
  const bp = useBreakpoint();
  const { ownerKey } = useShopOwner();
  const { orgUser } = useContext(Authcontext);
  const [pItems, setItems] = useState<Product[]>([]);
  const [selectedItem, setSelectedItem] = useState<Product | null>(null);
  const { threadId = "" } = useParams();
  const newPrice = useRef<HTMLInputElement>(null);
  const [uploadedSourceIds, setUploadedSourceIds] = useState<Set<string>>(
    new Set(),
  );
  const productsApi = orgUser ? api.org : api;

  useEffect(() => {
    let active = true;
    (async () => {
      const ids = await getUploadedSourceIds(ownerKey).catch(() => []);
      if (!active) return;
      const uploaded = new Set(ids);
      setUploadedSourceIds(uploaded);
      const p = await productsApi.getProducts().catch(() => [] as Product[]);
      if (!active) return;
      const items = normalizeProducts(p);
      setItems(items);
      setSelectedItem(items.find((x) => uploaded.has(x.id)) ?? items[0] ?? null);
    })();
    return () => {
      active = false;
    };
  }, [productsApi, ownerKey]);

  const handleSelectedItem = (e: ChangeEvent) => {
    const target = e.currentTarget as HTMLSelectElement;
    setSelectedItem(pItems.filter((x) => x.name === target?.value)[0] ?? null);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedItem || !threadId) return;
    const enteredPrice = newPrice?.current?.value;
    if (!enteredPrice || Number(enteredPrice) <= 0) return;

    const discountLink = generateDiscountLink();
    const discountImage = selectedItem.image ?? "";
    const product_id = selectedItem.id;
    const oldPrice = String(selectedItem.price ?? "");
    const discountPrice = enteredPrice;
    const text = `${selectedItem.name} at a discount price of ${enteredPrice}`;

    generalStore.setState({
      messageType: "discount",
      isDiscountPanel: false,
      discountLink,
      discountImage,
      product_id,
      oldPrice,
      newPrice: discountPrice,
    });

    void sendMessage({
      threadId: threadId,
      text,
      discountImage,
      discountLink,
      product_id,
      oldPrice,
      newPrice: discountPrice,
      type: "discount",
    }).catch(() => {});
  };

  return (
    <>
      <div
        onClick={(e) =>
          e.currentTarget == e.target &&
          generalStore.setState({ isDiscountPanel: false })
        }
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          inset: 0,
          height: "100%",
          position: "fixed",
          background: "#040d1c2c",
          backdropFilter: "blur(10px)",
        }}
      >
        <form
          onSubmit={(e) => handleSend(e)}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            background: "var(--bg-surface)",
            borderRadius: "1rem",
            position: "absolute",
            padding: "1rem",
            width: bp.sm ? "100%" : "90%",
            maxWidth: "400px",
            bottom: bp.sm ? 0 : undefined,
            height: bp.sm ? "35rem" : undefined,
          }}
        >
          <span>Discount</span>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              gap: ".4rem",
            }}
          >
            <label htmlFor="items" style={{ alignSelf: "flex-start" }}>
              Select Product
            </label>
            <select
              id="items"
              style={{
                display: "flex",
                fontSize: "16px",
                width: "100%",
                padding: "1rem",
                borderRadius: ".5rem",
                border: "1px solid #05313f76",
              }}
              onChange={handleSelectedItem}
            >
              {pItems.map((item) => {
                const isOnMarket = uploadedSourceIds.has(item.id);
                return isOnMarket && <option key={item.id}>{item.name}</option>;
              })}
            </select>
          </div>
          <div
            style={{
              width: "100%",
              height: "10rem",
              borderRadius: "1rem",
              overflow: "hidden",
            }}
          >
            <img
              src={selectedItem?.image}
              alt={selectedItem?.name}
              style={{ width: "100%", objectFit: "cover" }}
            />
          </div>
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              width: "100%",
              gap: ".4rem",
            }}
          >
            <label style={{ alignSelf: "flex-start" }}>Discount</label>
            <div
              style={{ display: "flex", alignItems: "center", gap: ".5rem" }}
            >
              <input
                style={{
                  display: "flex",
                  width: "100%",
                  padding: "1rem",
                  borderRadius: ".5rem",
                  fontSize: "16px",
                  border: "1px solid #05313f76",
                }}
                placeholder="old price"
                type="number"
                readOnly
                value={selectedItem?.price}
              />
              <input
                ref={newPrice}
                style={{
                  display: "flex",
                  width: "100%",
                  padding: "1rem",
                  borderRadius: ".5rem",
                  fontSize: "16px",
                  border: "1px solid #05313f76",
                }}
                placeholder="New Price"
                type="number"
              />
            </div>
          </div>

          <button
            type="submit"
            style={{
              display: "flex",
              alignItems: "center",
              background: "var(--bg-nav-active)",
              padding: "1rem",
              borderRadius: "1rem",
              justifyContent: "center",
            }}
          >
            <span style={{ color: "var(--bg-surface)" }}>Submit Discount</span>
          </button>
        </form>
      </div>
    </>
  );
}
