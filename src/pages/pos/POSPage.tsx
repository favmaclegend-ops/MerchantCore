import { useEffect, useState, useContext, type ChangeEvent } from "react";
import {
  Minus,
  Plus,
  CreditCard,
  Smartphone,
  Wallet,
  History,
  CheckCircle,
  Store,
  Delete,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useKeyboardOpen } from "@/hooks/useKeyboardOpen";
import { api } from "@/lib/api";
import { refreshDashboardCache, refreshOrgDashboardCache } from "@/lib/dashboardCache";
import { Authcontext } from "@/context";
import Alert from "@/components/alert/alert";
import { CurrencyContext } from "@/context/currency_context";
import { useDebounceEffect, useInstance, useSetState } from "elk-components";
import { store } from "@/context/store";
import { UploadToShopModal } from "@/pages/market/components/UploadToShopModal";
import { GracefulImage } from "@/components/GracefulImage";
import { BottomSheet } from "@/components/BottomSheet";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

const LOW_STOCK_THRESHOLD = 20;

interface Product {
  id: string;
  name: string;
  sku: string;
  price: number;
  stock: number;
  category: string;
  status: "in-stock" | "low-stock" | "out-of-stock";
  image?: string;
}

interface Transaction {
  id: string;
  type: string;
  amount: number;
  customer_name?: string;
  created_at?: string;
  status: string;
}

function stockStatus(stock: number): Product["status"] {
  if (stock <= 0) return "out-of-stock";
  if (stock <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

function normalizeProducts(products: Product[]): Product[] {
  return products.map((p) => ({ ...p, status: stockStatus(p.stock) }));
}

export function POSPage() {
  const bp = useBreakpoint();
  const keyboardOpen = useKeyboardOpen();

  const { format } = useContext(CurrencyContext);
  const { orgUser } = useContext(Authcontext);
  const posApi = orgUser ? api.org : api;
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState("All Items");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [showLog, setShowLog] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [isCart, setCartView] = useState<boolean>(false);
  const [showUpload, setShowUpload] = useState(false);

  const [searchedItems, setSearchedItems] = useState(products);

  const filteredProducts =
    category === "All Items"
      ? searchedItems
      : searchedItems.filter((p) => p.category === category);

  useEffect(() => {
    posApi
      .getProducts()
      .then((p) => {
        setProducts(normalizeProducts(p));
        setSearchedItems(p);
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false));
  }, [posApi]);

  const loadProducts = () =>
    posApi
      .getProducts()
      .then((p) => setProducts(normalizeProducts(p)))
      .catch(() => {});

  const categories = [
    "All Items",
    ...new Set(products.map((p) => p.category).filter(Boolean)),
  ];

  const handleSearch = (e: ChangeEvent) => {
    const target = e.currentTarget as HTMLInputElement;
    if (target.value === "") {
      setSearchedItems(products);
    }
    setSearchedItems(
      products.filter((p) =>
        p.name.toLowerCase().includes(target.value.toLowerCase()),
      ),
    );
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const tax = subtotal * 0.05;
  const total = subtotal + tax;

  // create an instance for users global access
  const { setData } = useInstance("POS");
  const c = useSetState(store);

  useDebounceEffect(
    () => {
      if (store.getState().staticData.length == 0) {
        store.setState({ staticData: products });
      }

      c({ cnt: 1 });
      setData("setProducts", setProducts);
      setData("products", products);

      return () => c({ cnt: 0 });
    },
    300,
    [products],
  );

  const updateQuantity = (id: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => {
          if (item.id === id) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : item;
          }
          return item;
        })
        .filter((item) => item.quantity > 0),
    );
  };

  const addToCart = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((item) => item.id === id);
      if (existing)
        return prev.map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + 1 } : item,
        );
      const product = products.find((p) => p.id === id);
      if (!product) return prev;
      return [
        ...prev,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
          image: product.image,
        },
      ];
    });
  };

  const handleCheckout = async () => {
    if (cart.length === 0 || checkingOut) return;
    setCheckingOut(true);
    try {
      await posApi.checkout({
        items: cart,
        total,
        payment_method: paymentMethod,
      });
      setCart([]);
      setSuccessMsg(`Sale of ${format(total)} completed!`);
      refreshDashboardCache();
      refreshOrgDashboardCache();
      loadProducts();
      setTimeout(() => setSuccessMsg(""), 3000);
    } catch (e) {
      console.error("Checkout failed", e);
    } finally {
      setCheckingOut(false);
    }
  };

  const openLog = async () => {
    setShowLog(true);
    posApi
      .getTransactions()
      .then((t) => setTransactions(t))
      .catch(() => {});
  };

  const paymentButtons = [
    { label: "Cash", icon: Wallet },
    { label: "Card", icon: CreditCard },
    { label: "Mobile", icon: Smartphone },
  ];

  const removeCartItem = (id: string) => {
    setCart((prev) => prev.filter((x) => x.id !== id));
  };

  const [isAlert, setAlert] = useState<{
    isAlert: boolean;
    message: string;
    type: string;
  }>({ isAlert: false, message: "", type: "" });

  useEffect(() => {
    const id = setTimeout(() => {
      setAlert({ isAlert: false, message: "", type: "" });
    }, 1000);

    return () => clearTimeout(id);
  }, [isAlert]);

  if (loadingProducts)
    return (
      <div
        style={{
          padding: "40px",
          textAlign: "center",
          color: "var(--text-placeholder)",
        }}
      >
        Loading...
      </div>
    );

  const cartContent = (
                <div
                  style={{
                    background: "var(--bg-surface)",
                    borderRadius: "8px",
                    border: "1px solid var(--border-default)",
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid var(--bg-tertiary)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      Cart ({cart.length})
                    </span>
                    {!bp.xl && (
                      <button
                        onClick={() => setCartView(false)}
                        style={{
                          fontSize: "11px",
                          fontWeight: 500,
                          color: "var(--text-secondary)",
                          background: "var(--bg-secondary)",
                          border: "1px solid var(--border-default)",
                          borderRadius: "4px",
                          padding: "4px 10px",
                          cursor: "pointer",
                        }}
                      >
                        Close
                      </button>
                    )}
                  </div>
    
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: "12px",
                      maxHeight: bp.lg ? "240px" : "200px",
                    }}
                  >
                    {cart.length === 0 ? (
                      <p
                        style={{
                          fontSize: "12px",
                          color: "var(--text-placeholder)",
                          textAlign: "center",
                          padding: "24px 0",
                          margin: 0,
                        }}
                      >
                        Empty
                      </p>
                    ) : (
                      cart.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            marginBottom: "8px",
                          }}
                        >
                          <div
                            style={{
                              width: "28px",
                              height: "28px",
                              background: "var(--bg-tertiary)",
                              borderRadius: "4px",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              flexShrink: 0,
                              overflow: "hidden",
                            }}
                          >
                            <GracefulImage src={item.image} alt={item.name} />
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p
                              style={{
                                fontSize: "10px",
                                fontWeight: 500,
                                color: "var(--text-primary)",
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                margin: 0,
                              }}
                            >
                              {item.name}
                            </p>
                            <p
                              style={{
                                fontSize: "10px",
                                color: "var(--text-muted)",
                                margin: 0,
                              }}
                            >
                              {format(item.price)} × {item.quantity}
                            </p>
                          </div>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "2px",
                            }}
                          >
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              style={{
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "4px",
                                background: "var(--bg-tertiary)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Minus style={{ width: "12px", height: "12px" }} />
                            </button>
                            <span
                              style={{
                                fontSize: "10px",
                                fontWeight: 600,
                                width: "16px",
                                textAlign: "center",
                              }}
                            >
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              style={{
                                width: "20px",
                                height: "20px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                borderRadius: "4px",
                                background: "var(--bg-tertiary)",
                                border: "none",
                                cursor: "pointer",
                              }}
                            >
                              <Plus style={{ width: "12px", height: "12px" }} />
                            </button>
                          </div>
                          <p
                            style={{
                              fontSize: "12px",
                              fontWeight: 700,
                              color: "var(--text-primary)",
                              margin: 0,
                              minWidth: "48px",
                              textAlign: "right",
                            }}
                          >
                            {format(item.price * item.quantity)}
                          </p>
                          <button
                            style={{
                              padding: ".4rem",
                              borderRadius: "1rem",
                              cursor: "pointer",
                              border: "none",
                            }}
                            onClick={() => removeCartItem(item.id)}
                          >
                            <Delete color="red" size={20}/>
                           
                          </button>
                        </div>
                      ))
                    )}
                  </div>
    
                  <div
                    style={{
                      padding: "12px",
                      borderTop: "1px solid var(--bg-tertiary)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>Subtotal</span>
                      <span style={{ color: "var(--text-primary)" }}>
                        {format(subtotal)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "10px",
                        marginBottom: "4px",
                      }}
                    >
                      <span style={{ color: "var(--text-muted)" }}>Tax (5%)</span>
                      <span style={{ color: "var(--text-primary)" }}>
                        {format(tax)}
                      </span>
                    </div>
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        fontSize: "12px",
                        fontWeight: 700,
                        paddingTop: "6px",
                        borderTop: "1px solid var(--bg-tertiary)",
                      }}
                    >
                      <span>Total</span>
                      <span>{format(total)}</span>
                    </div>
                  </div>
    
                  <div
                    style={{
                      padding: "12px",
                      display: "grid",
                      gridTemplateColumns: "repeat(4, 1fr)",
                      gap: "6px",
                    }}
                  >
                    {paymentButtons.map((pb) => {
                      const Icon = pb.icon;
                      const isActive = paymentMethod === pb.label;
                      return (
                        <button
                          key={pb.label}
                          onClick={() => setPaymentMethod(pb.label)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            padding: "6px 0",
                            fontSize: "10px",
                            fontWeight: 500,
                            background: isActive
                              ? "var(--bg-nav-active)"
                              : "var(--bg-secondary)",
                            color: isActive
                              ? "var(--text-primary)"
                              : "var(--text-secondary)",
                            border: isActive
                              ? "none"
                              : "1px solid var(--border-default)",
                            borderRadius: "4px",
                            cursor: "pointer",
                          }}
                        >
                          <Icon style={{ width: "12px", height: "12px" }} />{" "}
                          {pb.label}
                        </button>
                      );
                    })}
                    <button
                      onClick={openLog}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px",
                        padding: "6px 0",
                        fontSize: "10px",
                        fontWeight: 500,
                        background: "var(--bg-secondary)",
                        border: "1px solid var(--border-default)",
                        borderRadius: "4px",
                        cursor: "pointer",
                        color: "var(--text-secondary)",
                      }}
                    >
                      <History style={{ width: "12px", height: "12px" }} /> Log
                    </button>
                  </div>
    
                  <div style={{ padding: "0 12px 12px" }}>
                    <button
                      onClick={handleCheckout}
                      disabled={cart.length === 0 || checkingOut}
                      style={{
                        width: "100%",
                        padding: "8px 0",
                        fontSize: "12px",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        background:
                          cart.length === 0
                            ? "var(--text-placeholder)"
                            : "var(--bg-nav-active)",
                        borderRadius: "4px",
                        border: "none",
                        cursor: cart.length === 0 ? "not-allowed" : "pointer",
                        opacity: checkingOut ? 0.6 : 1,
                      }}
                    >
                      {checkingOut ? "Processing..." : `Checkout ${format(total)}`}
                    </button>
                  </div>
                </div>
  );
  return (
    <>
      <div
        style={{
          width: "100%",
          display: "grid",
          gridTemplateColumns: bp.xl ? "1fr 400px" : "1fr",
          gridTemplateRows: "1fr",
          padding: "12px",
          flex: "1",
          height: "100%",
        }}
      >
        {(bp.xl || !isCart) && (
          <div
            style={{
              width: "100%",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
              padding: "12px",
              overflowY: "auto",
              height: "100%",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h1
                style={{
                  fontSize: "18px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                POS Terminal
              </h1>
              <button
                onClick={() => setShowUpload(true)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".35rem",
                  padding: ".4rem .9rem",
                  borderRadius: "4rem",
                  border: "1px solid var(--border-default)",
                  cursor: "pointer",
                  background: "var(--bg-nav-active)",
                  color: "var(--bg-surface)",
                  fontSize: "12px",
                  fontWeight: 600,
                  whiteSpace: "nowrap",
                }}
                title="Upload items to your market shop"
              >
                <Store style={{ width: "14px", height: "14px" }} />
                Upload to shop
              </button>

              {successMsg && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "var(--text-success)",
                    background: "var(--bg-success)",
                    padding: "6px 12px",
                    borderRadius: "8px",
                  }}
                >
                  <CheckCircle style={{ width: "14px", height: "14px" }} />
                  {successMsg}
                </div>
              )}
            </div>

            <input
              placeholder="Search POS..."
              style={{
                width: "100%",
                background: "var(--bg-surface)",
                borderRadius: ".4rem",
                border: " 1px solid var(--border-default)",
                padding: ".4rem",
                fontSize: '16px',
              }}
              onChange={handleSearch}
            />

            {successMsg && (
              <div
                style={{
                  padding: "10px 14px",
                  background: "var(--bg-success)",
                  border: "1px solid var(--border-success)",
                  borderRadius: "8px",
                  fontSize: "12px",
                  color: "var(--text-success)",
                  fontWeight: 500,
                }}
              >
                {successMsg}
              </div>
            )}

            <div
              style={{
                width: "100%",
                display: "flex",
                gap: "6px",
                overflowX: "auto",
                paddingBottom: "4px",
                scrollbarWidth: "thin",
                flexShrink: "0",
              }}
            >
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => {
                    setCategory(cat);
                    setCartView(false);
                  }}
                  style={{
                    padding: "6px 12px",
                    fontSize: "12px",
                    fontWeight: 500,
                    borderRadius: "16px",
                    flex: "0 0 auto",
                    whiteSpace: "nowrap",
                    flexShrink: 0,
                    border:
                      category === cat
                        ? "none"
                        : "1px solid var(--border-default)",
                    color:
                      (!isCart || bp.xl) && category === cat
                        ? "var(--text-secondary-b)"
                        : "var(--text-secondary)",
                    background:
                      (!isCart || bp.xl) && category === cat
                        ? "var(--bg-nav-active)"
                        : "var(--bg-surface)",
                    cursor: "pointer",
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/**The container that holds the cart and the products===================================================== */}
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                flex: "1",
                gap: bp.xl ? "16px" : "12px",
              }}
            >
              {/**The container that holds the product items in a grid format */}
              {(!isCart || bp.xl) && (
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: bp.xl
                      ? "repeat(4, 1fr)"
                      : "repeat(2, 1fr)",
                    gap: "12px",
                    gridAutoRows: "max-content",
                    width: "100%",
                  }}
                >
                  {/**The filter product ======================================================== */}
                  {filteredProducts.map((product) => (
                    <div
                      key={product.id}
                      style={{
                        padding: ".5rem",
                        background: "var(--bg-surface)",
                        borderRadius: "8px",
                        border: "1px solid var(--border-default)",
                        overflow: "hidden",
                        height: "auto",
                        contentVisibility: "auto",
                        containIntrinsicSize: "190px",
                      }}
                    >
                      <div
                        style={{
                          height: "96px",
                          background: "var(--bg-tertiary)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          position: "relative",
                          overflow: "hidden",
                        }}
                      >
                        <GracefulImage src={product.image} alt={product.name} />
                        <span
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            padding: "2px 6px",
                            fontSize: "10px",
                            fontWeight: 500,
                            borderRadius: "4px",
                            background:
                              product.status === "in-stock"
                                ? "var(--bg-success)"
                                : product.status === "low-stock"
                                  ? "var(--bg-warning)"
                                  : "var(--bg-danger)",
                            color:
                              product.status === "in-stock"
                                ? "var(--text-success)"
                                : product.status === "low-stock"
                                  ? "var(--text-warning)"
                                  : "var(--text-danger)",
                          }}
                        >
                          {product.status === "in-stock"
                            ? "In Stock"
                            : product.status === "low-stock"
                              ? "Low"
                              : "Out"}
                        </span>
                      </div>
                      <div style={{ padding: "10px" }}>
                        <p
                          style={{
                            fontSize: "12px",
                            fontWeight: 500,
                            color: "var(--text-primary)",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: 0,
                          }}
                        >
                          {product.name}
                        </p>
                        <p
                          style={{
                            fontSize: "14px",
                            fontWeight: 700,
                            color: "var(--text-primary)",
                            marginTop: "2px",
                            margin: "2px 0 0 0",
                          }}
                        >
                          {format(product.price)}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          addToCart(product.id);
                          setAlert({
                            isAlert: true,
                            message: `Product ${product.name} is Added to cart`,
                            type: "success",
                          });
                        }}
                        disabled={product.status === "out-of-stock"}
                        style={{
                          width: "100%",
                          padding: "8px 0",
                          fontSize: "12px",
                          fontWeight: 600,
                          color: "var(--text-on-dark)",
                          background: "var(--bg-nav-active)",
                          border: "none",
                          cursor:
                            product.status === "out-of-stock"
                              ? "not-allowed"
                              : "pointer",
                          opacity: product.status === "out-of-stock" ? 0.5 : 1,
                          borderRadius: ".5rem",
                        }}
                      >
                        Add
                      </button>
                    </div>
                  ))}

                  {filteredProducts.length === 0 && (
                    <div
                      style={{
                        gridColumn: "1 / -1",
                        padding: "40px",
                        textAlign: "center",
                        color: "var(--text-placeholder)",
                        fontSize: "12px",
                      }}
                    >
                      No products in this category
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/**CART=========================================================================================== */}
        {/* CART (desktop inline column) */}
        {bp.xl && <>{cartContent}</>}
        {/**CART ENDING=========================================================================================== */}

        {showLog && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              background: "rgba(0,0,0,0.4)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 9999,
              padding: "16px",
            }}
            onClick={() => setShowLog(false)}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "12px",
                padding: "24px",
                width: "100%",
                maxWidth: "500px",
                maxHeight: "80vh",
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3
                style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Recent Transactions
              </h3>
              {transactions.length === 0 && (
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-placeholder)",
                    textAlign: "center",
                  }}
                >
                  No transactions yet
                </p>
              )}
              {transactions.slice(0, 20).map((tx: Transaction) => (
                <div
                  key={tx.id}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 0",
                    borderBottom: "1px solid var(--bg-tertiary)",
                    fontSize: "12px",
                  }}
                >
                  <div>
                    <p
                      style={{
                        fontWeight: 500,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {tx.type} — {format(tx.amount)}
                    </p>
                    <p
                      style={{
                        fontSize: "10px",
                        color: "var(--text-muted)",
                        margin: "2px 0 0 0",
                      }}
                    >
                      {tx.customer_name || "POS Sale"} •{" "}
                      {tx.created_at
                        ? new Date(tx.created_at).toLocaleString()
                        : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      fontWeight: 600,
                      color:
                        tx.status === "completed"
                          ? "var(--text-success)"
                          : "var(--text-warning)",
                      textTransform: "uppercase",
                    }}
                  >
                    {tx.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showUpload && <UploadToShopModal onClose={() => setShowUpload(false)} />}

      {!bp.xl && (
        <BottomSheet
          open={isCart}
          onClose={() => setCartView(false)}
          zIndex={999}
          maxHeight="85vh"
          bottom="calc(6px + var(--safe-bottom))"
        >
          <div style={{ padding: "4px 12px 12px" }}>{cartContent}</div>
        </BottomSheet>
      )}

      {!bp.xl && !keyboardOpen && (
        <button
          onClick={() => setCartView(!isCart)}
          style={{
            position: "fixed",
            bottom: "calc(5.5rem + var(--safe-bottom))",
            right: "calc(1rem + var(--safe-right))",
            zIndex: 900,
            width: "56px",
            height: "56px",
            borderRadius: "18px",
            border: "none",
            background: isCart ? "var(--bg-surface)" : "var(--bg-nav-active)",
            color: isCart ? "var(--text-primary)" : "var(--bg-surface)",
            boxShadow: isCart
              ? "0 4px 20px rgba(0,0,0,0.15)"
              : "0 4px 20px rgba(15,23,42,0.3)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2px",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="8" cy="21" r="1"/>
            <circle cx="19" cy="21" r="1"/>
            <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/>
          </svg>
          {cart.length > 0 && (
            <span style={{
              position: "absolute",
              top: "-4px",
              right: "-4px",
              minWidth: "20px",
              height: "20px",
              padding: "0 5px",
              borderRadius: "999px",
              background: "#ef4444",
              color: "white",
              fontSize: "11px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              border: "2px solid var(--bg-page)",
            }}>
              {cart.length}
            </span>
          )}
        </button>
      )}

      {isAlert.isAlert && (
        <Alert message={isAlert.message} type={isAlert.type} />
      )}
    </>
  );
}
