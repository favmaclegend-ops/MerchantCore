import { useRef, useState, type ChangeEvent } from "react";
import {
  ArrowLeft,
  BadgeCheck,
  CalendarDays,
  Camera,
  Check,
  Link2,
  MessageCircle,
  Share2,
  Star,
  Store,
  Upload,
  UserRound,
  X,
} from "lucide-react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreShop } from "./demoMarketStore";
import { useMarketData } from "./useMarketData";
import { valueFormater } from "./market";
import { isShopVerified, getShopPopularity } from "./verification";
import {
  updateShopProfileBackground,
  updateShopProfileImage,
} from "./marketUpload";
import { syncUserMarketData } from "./marketApi";
import { useShopOwner } from "./useShopOwner";
import { ShopPageReabon } from "./components/ShopPageReabon";
import { OverView } from "./components/OverView";
import { Products } from "./components/Products";
import { MarketLoading } from "./components/MarketLoading";
import { startThread, notifyChatChanged, useChatStore } from "./chat/chatStore";
import { formatDate } from "../supply/styles";
import { BottomSheet } from "@/components/BottomSheet";

export function ShopPage() {
  const params = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const bp = useBreakpoint();
  const { loading } = useMarketData();
  const { shops, products } = useStore(marketStore);
  const { isOwner } = useShopOwner();
  useChatStore({ poll: false }); // registers the buyer chat session, but no live polling here
  const [editing, setEditing] = useState<"profile" | "background" | null>(null);
  const [viewing, setViewing] = useState<string | null>(null);
  const [shareOpen, setShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const chatLoadingRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [atTop, setAtTop] = useState(true);
  const [chatError, setChatError] = useState("");

  const shopUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/market/${params.id ?? ""}`
      : "";

  const handleScroll = () => {
    const el = scrollRef.current;
    if (el) setAtTop(el.scrollTop <= 0);
  };

  const shop = shops[params.id ?? ""];
  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <MarketLoading />
      </div>
    );
  }
  if (!shop) {
    return <div>Shop not Found</div>;
  }

  const verified = isShopVerified(shop, products);
  const canEdit = isOwner(shop);
  const bgSrc = shop.shopProfileImagebg?.trim() || shop.shopProfileImage || "";

  return (
    <>
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        style={{
          display: "flex",
          width: "100%",
          height: "100%",
          paddingInline: bp.sm ? "0" : ".5rem",
          paddingBlockStart: bp.sm ? "0" : ".5rem",
          paddingBlockEnd: '5rem',
          flexDirection: "column",
          maxWidth: "900px",
          gap: "1rem",
          overflowY: "auto",
          overflowX: "hidden",
          overscrollBehaviorY: atTop ? "none" : "auto",
          WebkitOverflowScrolling: "touch",
        }}
      >
        {bp.sm ? (
          /* ============ MOBILE: clean professional shop header ============ */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              position: "relative",
            }}
          >
            {/* Hero cover image */}
            <div
              style={{
                width: "100%",
                height: "15rem",
                minHeight: "6rem",
                background: "#050505",
                position: "relative",
                overflow: "hidden",
              }}
              onClick={() => setViewing(bgSrc)}
            >
              <img
                src={bgSrc}
                alt=""
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "100%",
                  height: "100%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "linear-gradient(to bottom, rgba(2,6,23,.28) 0%, rgba(2,6,23,.12) 45%, rgba(2,6,23,.55) 72%, rgba(2,6,23,.95) 100%)",
                  pointerEvents: "none",
                }}
              />

              {/* Back button */}
              <div
                style={{
                  position: "absolute",
                  top: "calc(var(--safe-top) + .5rem)",
                  left: "calc(var(--safe-left) + .6rem)",
                  zIndex: 20,
                }}
              >
                <button
                  className="click"
                  onClick={() =>
                    navigate(
                      location.pathname.startsWith("/market")
                        ? "/market"
                        : "/home/market",
                    )
                  }
                  aria-label="Back to market"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "rgba(255,255,255,.2)",
                    border: "1px solid rgba(255,255,255,.35)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 4px 14px rgba(0,0,0,.25)",
                  }}
                >
                  <ArrowLeft size={20} color="#fff" />
                </button>
              </div>

              {/* Choose/edit background */}
              {canEdit && (
                <button
                  className="click"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing("background");
                  }}
                  aria-label="Edit shop background image"
                  title="Edit background image"
                  style={{
                    position: "absolute",
                    top: "calc(var(--safe-top) + .5rem)",
                    right: "calc(var(--safe-right) + .6rem)",
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "rgba(255,255,255,.2)",
                    border: "1px solid rgba(255,255,255,.35)",
                    backdropFilter: "blur(12px)",
                    WebkitBackdropFilter: "blur(12px)",
                    boxShadow: "0 4px 14px rgba(0,0,0,.25)",
                  }}
                >
                  <Camera size={18} color="#fff" />
                </button>
              )}
            </div>

            {/* Identity card overlapping the hero */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".9rem",
                marginTop: "-2.75rem",
                padding: "0 1rem",
                position: "relative",
                zIndex: 5,
                minWidth: "0",
                background: 'linear-gradient(to bottom, transparent, var(--bg-surface) 40%)'
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "5.5rem",
                  height: "5.5rem",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "1.1rem",
                    background: "var(--bg-tertiary)",
                    overflow: "hidden",
                    border: "3px solid var(--bg-surface)",
                    boxShadow: "0 10px 24px rgba(2,6,23,.28)",
                    cursor: "pointer",
                  }}
                  onClick={() => setViewing(shop.shopProfileImage ?? "")}
                >
                  <img
                    src={shop.shopProfileImage}
                    alt={shop.shop_name}
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                      width: "100%",
                      height: "100%",
                    }}
                  />
                </div>
                {canEdit && (
                  <button
                    className="click"
                    onClick={() => setEditing("profile")}
                    aria-label="Edit shop profile image"
                    title="Edit shop image"
                    style={{
                      position: "absolute",
                      bottom: "-.25rem",
                      right: "-.25rem",
                      zIndex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "1.7rem",
                      height: "1.7rem",
                      borderRadius: "50%",
                      cursor: "pointer",
                      background: "rgba(2,6,23,.75)",
                      border: "2px solid var(--bg-surface)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Camera size={14} color="#fff" />
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  minWidth: "0",
                  gap: ".25rem",
                }}
              >
                <h1
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".35rem",
                    fontWeight: 800,
                    fontSize: "1.25rem",
                    lineHeight: 1.2,
                    margin: 0,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    maxWidth: "100%",
                  }}
                >
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
                    {shop.shop_name}
                  </span>
                  {verified && (
                    <BadgeCheck
                      size={20}
                      color="var(--text-info)"
                      aria-label="Verified business"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </h1>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: ".35rem",
                    fontSize: ".8rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <Star size={13} fill="gold" color="gold" />
                  <strong style={{ color: "var(--text-secondary)" }}>
                    {valueFormater(String(getShopPopularity(shop, products)))}
                  </strong>
                  <span
                    style={{
                      width: 3,
                      height: 3,
                      borderRadius: "50%",
                      background: "var(--text-placeholder)",
                    }}
                  />
                  <Store size={13} />
                  {verified ? "Verified" : "Active shop"}
                </span>
              </div>
            </div>

            {/* Actions row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".6rem",
                margin: "1.25rem 1rem 0",
              }}
            >
              <button
                className="click"
                onClick={async () => {
                  if (chatLoadingRef.current) return;
                  setChatError("");
                  chatLoadingRef.current = true;
                  try {
                    const thread = await startThread({
                      shopId: shop.shop_id,
                      shopName: shop.shop_name || "Shop",
                      shopImage: shop.shopProfileImage,
                      ownerKey: shop.ownerKey || "",
                    });
                    notifyChatChanged();
                    const basePath = location.pathname.startsWith("/market")
                      ? "/market"
                      : "/home/market";
                    navigate(`${basePath}/chat/${thread.threadId}`);
                  } catch (e) {
                    console.error("Failed to start chat:", e);
                    setChatError(
                      e instanceof Error
                        ? e.message
                        : "Could not start chat. Please sign in as a customer to message this shop.",
                    );
                  } finally {
                    chatLoadingRef.current = false;
                  }
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".4rem",
                  flex: 1,
                  padding: ".7rem 1rem",
                  borderRadius: ".9rem",
                  cursor: "pointer",
                  background: "var(--bg-nav-active)",
                  border: "none",
                  boxShadow: "0 4px 12px rgba(0,0,0,.14)",
                  color: "var(--bg-surface)",
                  fontSize: ".9rem",
                  fontWeight: 600,
                }}
              >
                <MessageCircle size={18} color="var(--bg-surface)" />
                Message
              </button>
              <button
                className="click"
                onClick={() => {
                  setShareOpen(true);
                  setCopied(false);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".4rem",
                  padding: ".7rem 1rem",
                  borderRadius: ".9rem",
                  cursor: "pointer",
                  background: "var(--bg-secondary)",
                  border: "1px solid var(--border-default)",
                  color: "var(--text-primary)",
                  fontSize: ".9rem",
                  fontWeight: 600,
                }}
              >
                <Share2 size={18} />
                Share
              </button>
            </div>

            {chatError && (
              <p
                style={{
                  margin: "8px 1rem 0",
                  fontSize: ".78rem",
                  color: "var(--text-danger)",
                  maxWidth: 260,
                  lineHeight: 1.4,
                }}
              >
                {chatError}
              </p>
            )}
          </div>
        ) : (
          /* ============ DESKTOP header ============ */
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              position: "relative",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: "1rem",
                left: "1rem",
                zIndex: "20",
              }}
            >
              <button
                className="click"
                onClick={() =>
                  navigate(
                    location.pathname.startsWith("/market")
                      ? "/market"
                      : "/home/market",
                  )
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: ".65rem",
                  borderRadius: "50%",
                  cursor: "pointer",
                  background: "rgba(2,6,23,.55)",
                  border: "none",
                  backdropFilter: "blur(4px)",
                  boxShadow: "0 4px 12px rgba(0,0,0,.25)",
                }}
              >
                <ArrowLeft size={22} color="var(--bg-surface)" />
              </button>
            </div>

            <div
              style={{
                width: "100%",
                maxWidth: "1500px",
                borderRadius: "1rem 1rem 0rem 0rem",
                height: "12rem",
                background: "#050505",
                position: "absolute",
                overflow: "hidden",
                cursor: "pointer",
              }}
              onClick={() => setViewing(bgSrc)}
            >
              <img
                src={bgSrc}
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "100%",
                  height: "100%",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  inset: "0",
                  background:
                    "linear-gradient(to bottom, rgba(2,6,23,.06) 0%, rgba(2,6,23,.18) 30%, var(--bg-surface) 78%)",
                  pointerEvents: "none",
                }}
              />
              {canEdit && (
                <button
                  className="click"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing("background");
                  }}
                  aria-label="Edit shop background image"
                  title="Edit background image"
                  style={{
                    position: "absolute",
                    top: "1rem",
                    right: "1rem",
                    zIndex: 20,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: "2.25rem",
                    height: "2.25rem",
                    borderRadius: "50%",
                    cursor: "pointer",
                    background: "rgba(2,6,23,.65)",
                    border: "3px solid var(--bg-surface)",
                    backdropFilter: "blur(4px)",
                    boxShadow: "0 4px 12px rgba(0,0,0,.25)",
                  }}
                >
                  <Camera size={18} color="var(--bg-surface)" />
                </button>
              )}
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "1rem",
                zIndex: "11",
                marginTop: "8rem",
                padding: "0 1.25rem",
                paddingBlockEnd: "1rem",
                minWidth: "0",
                width: "100%",
              }}
            >
              <div
                style={{
                  position: "relative",
                  width: "100%",
                  maxWidth: "8rem",
                  minWidth: "4rem",
                  aspectRatio: "1/1",
                  flex: "0 1 auto",
                }}
              >
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    borderRadius: "50%",
                    background: "var(--bg-tertiary)",
                    overflow: "hidden",
                    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.33)",
                    cursor: "pointer",
                    border: "4px solid var(--bg-surface)",
                  }}
                >
                  <img
                    src={shop.shopProfileImage}
                    style={{
                      objectFit: "cover",
                      objectPosition: "center",
                      width: "100%",
                      height: "100%",
                    }}
                    onClick={() => setViewing(shop.shopProfileImage ?? "")}
                  />
                </div>
                {canEdit && (
                  <button
                    className="click"
                    onClick={() => setEditing("profile")}
                    aria-label="Edit shop profile image"
                    title="Edit shop image"
                    style={{
                      position: "absolute",
                      bottom: 0,
                      right: 0,
                      zIndex: 2,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      width: "2rem",
                      height: "2rem",
                      borderRadius: "50%",
                      cursor: "pointer",
                      background: "rgba(2,6,23,.65)",
                      border: "3px solid var(--bg-surface)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <Camera size={16} color="var(--bg-surface)" />
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  minWidth: "0",
                  overflow: "hidden",
                }}
              >
                <h1
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".4rem",
                    fontWeight: "bolder",
                    fontSize: "1.5rem",
                    lineHeight: 1.2,
                    margin: 0,
                    textWrap: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                    width: "100%",
                  }}
                >
                  {shop.shop_name}
                  {verified && (
                    <BadgeCheck
                      size={22}
                      color="var(--text-info)"
                      aria-label="Verified business"
                      style={{ flexShrink: 0 }}
                    />
                  )}
                </h1>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".3rem",
                    marginTop: ".25rem",
                  }}
                >
                  <Star color="gold" size={16} />
                  <strong
                    style={{
                      margin: 0,
                      fontSize: ".95rem",
                      color: "var(--text-muted)",
                      textWrap: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    {valueFormater(String(getShopPopularity(shop, products)))}
                  </strong>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".4rem",
                  marginInlineStart: "auto",
                  flexShrink: "0",
                }}
              >
                <button
                  className="click"
                  onClick={() => {
                    setShareOpen(true);
                    setCopied(false);
                  }}
                  style={{
                    display: "flex",
                    padding: ".7rem",
                    alignItems: "center",
                    cursor: "pointer",
                    borderRadius: "50%",
                    background: "var(--bg-secondary)",
                    border: "1px solid var(--border-default)",
                  }}
                >
                  <Share2 size={20} color="var(--text-primary)" />
                </button>
                <button
                  className="click"
                  onClick={async () => {
                    if (chatLoadingRef.current) return;
                    setChatError("");
                    chatLoadingRef.current = true;
                    try {
                      const thread = await startThread({
                        shopId: shop.shop_id,
                        shopName: shop.shop_name || "Shop",
                        shopImage: shop.shopProfileImage,
                        ownerKey: shop.ownerKey || "",
                      });
                      notifyChatChanged();
                      const basePath = location.pathname.startsWith("/market")
                        ? "/market"
                        : "/home/market";
                      navigate(`${basePath}/chat/${thread.threadId}`);
                    } catch (e) {
                      console.error("Failed to start chat:", e);
                      setChatError(
                        e instanceof Error
                          ? e.message
                          : "Could not start chat. Please sign in as a customer to message this shop.",
                      );
                    } finally {
                      chatLoadingRef.current = false;
                    }
                  }}
                  style={{
                    display: "flex",
                    padding: "1rem",
                    alignItems: "center",
                    cursor: "pointer",
                    gap: ".5rem",
                    borderRadius: "1rem",
                    background: "var(--bg-nav-active)",
                    border: "none",
                    boxShadow: "0 4px 12px rgba(0,0,0,.2)",
                  }}
                >
                  <MessageCircle size={24} color="var(--bg-surface)" />
                  <span style={{ color: "var(--bg-surface)" }}>Message</span>
                </button>
                {chatError && (
                  <p
                    style={{
                      margin: "8px 0 0 0",
                      fontSize: ".78rem",
                      color: "var(--text-danger)",
                      maxWidth: 260,
                      lineHeight: 1.4,
                    }}
                  >
                    {chatError}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {bp.sm && location.hash !== "#products" && <section
          style={{
            background: "var(--bg-surface)",
            overflow: "hidden",
            height: 'auto',
            flex: '0 0 auto',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',

          }}
        >
          
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "1.1rem",
              padding: "1.25rem 1.25rem 1.5rem",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".75rem",
              }}
            >
              
              <div style={{ minWidth: "0", zIndex: "1" }}>
                <h2
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".4rem",
                    fontSize: "1.25rem",
                    fontWeight: "bolder",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  About {shop.shop_name}
                  {verified && (
                    <BadgeCheck
                      size={20}
                      color="var(--text-info)"
                      aria-label="Verified business"
                    />
                  )}
                </h2>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".3rem",
                    fontSize: ".85rem",
                    color: verified ? "var(--text-info)" : "var(--text-muted)",
                  }}
                >
                  <Store size={14} />
                  {verified ? "Verified business" : "Active shop"}
                </span>
              </div>
              {bp.sm && <Link
              key={"#product"}
              to={{ pathname: location.pathname, hash: "#products" }}
              style={{
                color: 'var(--bg-surface)',
                padding: bp.sm ? ".5rem .75rem" : "1rem",
                borderRadius: "1rem",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                background: 'var(--bg-nav-active)',
                marginInlineStart: 'auto',
                
              }}
            >
              Products
            </Link>}

            </div>
            <p
              style={{
                color: "var(--text-secondary)",
                lineHeight: 1.6,
                fontSize: ".95rem",
                margin: 0,
              }}
            >
              {shop.description ?? "No description yet."}
            </p>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: bp.sm ? "repeat(2, minmax(0, 1fr))" : "1fr 1fr",
                gap: ".9rem",
                paddingTop: ".85rem",
                borderTop: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: bp.sm ? "column" : "row",
                  alignItems: bp.sm ? "flex-start" : "center",
                  gap: bp.sm ? ".5rem" : ".75rem",
                  padding: bp.sm ? "1rem" : ".9rem 1rem",
                  borderRadius: ".85rem",
                  background: "var(--bg-secondary)",
                }}
              >
                <UserRound size={18} color="var(--text-muted)" />
                <div style={{ minWidth: "0", width: "100%" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: ".7rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                    }}
                  >
                    Owner
                  </span>
                  <strong
                    style={{
                      fontSize: bp.sm ? ".92rem" : ".9rem",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    {shop.owner}
                  </strong>
                </div>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: bp.sm ? "column" : "row",
                  alignItems: bp.sm ? "flex-start" : "center",
                  gap: bp.sm ? ".5rem" : ".75rem",
                  padding: bp.sm ? "1rem" : ".9rem 1rem",
                  borderRadius: ".85rem",
                  background: "var(--bg-secondary)",
                }}
              >
                <CalendarDays size={18} color="var(--text-muted)" />
                <div style={{ minWidth: "0", width: "100%" }}>
                  <span
                    style={{
                      display: "block",
                      fontSize: ".7rem",
                      color: "var(--text-muted)",
                      textTransform: "uppercase",
                      letterSpacing: ".04em",
                    }}
                  >
                    Opened
                  </span>
                  <strong
                    style={{
                      fontSize: bp.sm ? ".92rem" : ".9rem",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                      display: "block",
                    }}
                  >
                    {formatDate(shop.createdAt as string)}
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </section>}

       {!bp.sm && <ShopPageReabon />}

        {location.hash === "#products" ? <Products /> : <OverView />}
      </div>

      {editing && (
        <EditShopImageModal
          shop={shop}
          target={editing}
          onClose={() => setEditing(null)}
        />
      )}

      {viewing && (
        <ImageViewer src={viewing} onClose={() => setViewing(null)} />
      )}

      <BottomSheet open={shareOpen} onClose={() => setShareOpen(false)}>
        <div style={{ padding: ".5rem 0 1.25rem" }}>
          <h3
            style={{
              margin: 0,
              padding: "0 1.25rem .75rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}
          >
            Share to
          </h3>
          <div
            style={{
              display: "flex",
              gap: ".25rem",
              overflowX: "auto",
              overflowY: "hidden",
              padding: ".25rem 1rem",
              scrollSnapType: "x mandatory",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {[
              {
                label: "WhatsApp",
                bg: "#25D366",
                color: "#fff",
                action: () =>
                  window.open(
                    `https://wa.me/?text=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core:\n${shopUrl}`)}`,
                    "_blank",
                  ),
              },
              {
                label: "X",
                bg: "#000",
                color: "#fff",
                action: () =>
                  window.open(
                    `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core:\n${shopUrl}`)}`,
                    "_blank",
                  ),
              },
              {
                label: "Facebook",
                bg: "#1877F2",
                color: "#fff",
                action: () =>
                  window.open(
                    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shopUrl)}`,
                    "_blank",
                  ),
              },
              {
                label: "Telegram",
                bg: "#0088cc",
                color: "#fff",
                action: () =>
                  window.open(
                    `https://t.me/share/url?url=${encodeURIComponent(shopUrl)}&text=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core`)}`,
                    "_blank",
                  ),
              },
              {
                label: "Messages",
                bg: "#34C759",
                color: "#fff",
                action: () =>
                  window.open(
                    `sms:?body=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core:\n${shopUrl}`)}`,
                    "_blank",
                  ),
              },
              {
                label: "Email",
                bg: "#007AFF",
                color: "#fff",
                action: () =>
                  window.open(
                    `mailto:?subject=${encodeURIComponent(shop.shop_name)}&body=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core:\n${shopUrl}`)}`,
                    "_blank",
                  ),
              },
            ].map((item) => (
              <button
                key={item.label}
                className="click"
                onClick={() => {
                  item.action();
                  setShareOpen(false);
                }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: ".4rem",
                  minWidth: "4rem",
                  padding: ".5rem .25rem",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  scrollSnapAlign: "start",
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: "3.25rem",
                    height: "3.25rem",
                    borderRadius: ".85rem",
                    background: item.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 2px 8px rgba(0,0,0,.12)",
                  }}
                >
                  {item.label === "WhatsApp" && (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={item.color}>
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                    </svg>
                  )}
                  {item.label === "X" && (
                    <svg viewBox="0 0 24 24" width="20" height="20" fill={item.color}>
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  )}
                  {item.label === "Facebook" && (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={item.color}>
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  )}
                  {item.label === "Telegram" && (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={item.color}>
                      <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.492-1.302.48-.428-.013-1.252-.242-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
                    </svg>
                  )}
                  {item.label === "Messages" && (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={item.color}>
                      <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2z"/>
                    </svg>
                  )}
                  {item.label === "Email" && (
                    <svg viewBox="0 0 24 24" width="22" height="22" fill={item.color}>
                      <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                    </svg>
                  )}
                </div>
                <span
                  style={{
                    fontSize: ".65rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.label}
                </span>
              </button>
            ))}
          </div>
          <div
            style={{
              height: "1px",
              background: "var(--border-default)",
              margin: ".5rem 1.25rem",
            }}
          />
          <button
            className="click"
            onClick={() => {
              navigator.clipboard.writeText(shopUrl).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".75rem",
              width: "calc(100% - 2.5rem)",
              margin: "0 1.25rem",
              padding: ".75rem 1rem",
              borderRadius: ".75rem",
              border: "1px solid var(--border-default)",
              background: "var(--bg-secondary)",
              cursor: "pointer",
              fontSize: ".9rem",
              color: "var(--text-primary)",
            }}
          >
            {copied ? (
              <Check size={18} color="var(--text-success, #22c55e)" />
            ) : (
              <Link2 size={18} color="var(--text-muted)" />
            )}
            {copied ? "Copied!" : "Copy link"}
          </button>
        </div>
      </BottomSheet>
    </>
  );
}

function EditShopImageModal({
  shop,
  target,
  onClose,
}: {
  shop: MarketStoreShop;
  target: "profile" | "background";
  onClose: () => void;
}) {
  const bp = useBreakpoint();
  const { ownerKey } = useShopOwner();
  const current =
    target === "background" ? shop.shopProfileImagebg : shop.shopProfileImage;
  const [url, setUrl] = useState(current ?? "");
  const [error, setError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string" && reader.result) {
        setUrl(reader.result);
        setError("");
      }
    };
    reader.onerror = () => setError("Could not read the selected file.");
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const save = async () => {
    if (!url.trim()) {
      setError("Please provide an image URL or select a file.");
      return;
    }
    if (target === "background") {
      await updateShopProfileBackground(ownerKey, url.trim());
    } else {
      await updateShopProfileImage(ownerKey, url.trim());
    }
    syncUserMarketData();
    onClose();
  };

  const previewSrc = url.trim() || current || "";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        background: "rgba(2,6,23,.6)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: bp.sm ? ".5rem" : "1.5rem",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          display: "flex",
          flexDirection: "column",
          width: "100%",
          maxWidth: "440px",
          maxHeight: "90vh",
          background: "var(--bg-surface)",
          border: "1px solid var(--border-default)",
          borderRadius: "1.25rem",
          overflow: "hidden",
          boxShadow: "var(--shadow-menu)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: ".5rem",
            padding: "1rem 1.25rem",
            borderBottom: "1px solid var(--border-default)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: ".5rem" }}>
            <Camera size={18} color="var(--text-info)" />
            <h2
              style={{
                margin: 0,
                fontSize: "1.05rem",
                fontWeight: "bolder",
                color: "var(--text-primary)",
              }}
            >
              {target === "background"
                ? "Edit background image"
                : "Edit profile image"}
            </h2>
          </div>
          <button
            className="click"
            onClick={onClose}
            aria-label="Close"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: ".4rem",
              borderRadius: "50%",
              cursor: "pointer",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            <X size={16} />
          </button>
        </div>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            overflowY: "auto",
            padding: "1.25rem",
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
          }}
        >
          <div
            style={{
              width: "100%",
              aspectRatio: "16/10",
              borderRadius: "1rem",
              overflow: "hidden",
              background: "var(--bg-secondary)",
              border: "1px solid var(--border-default)",
            }}
          >
            {previewSrc ? (
              <img
                src={previewSrc}
                alt={
                  target === "background"
                    ? "Shop background preview"
                    : "Shop profile preview"
                }
                style={{
                  objectFit: "cover",
                  objectPosition: "center",
                  width: "100%",
                  height: "100%",
                }}
                onError={(e) => {
                  const img = e.currentTarget;
                  const fallback = current?.trim();
                  if (fallback && img.src !== fallback) {
                    img.src = fallback;
                  }
                }}
              />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "var(--text-muted)",
                  fontSize: ".85rem",
                }}
              >
                No image set
              </div>
            )}
          </div>

          <label
            style={{
              display: "flex",
              flexDirection: "column",
              gap: ".3rem",
              fontSize: ".78rem",
              fontWeight: 600,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: ".04em",
            }}
          >
            Image URL
            <input
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                setError("");
              }}
              placeholder="https://example.com/shop.jpg"
              style={{
                width: "100%",
                padding: ".6rem .75rem",
                borderRadius: ".6rem",
                border: "1px solid var(--border-input)",
                background: "var(--bg-surface)",
                color: "var(--text-primary)",
                fontSize: ".9rem",
                outline: "none",
              }}
            />
          </label>

          <div style={{ display: "flex", alignItems: "center", gap: ".75rem" }}>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              style={{ display: "none" }}
            />
            <button
              className="click"
              onClick={() => fileRef.current?.click()}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".4rem",
                padding: ".55rem .9rem",
                borderRadius: ".6rem",
                cursor: "pointer",
                background: "var(--bg-secondary)",
                border: "1px solid var(--border-default)",
                color: "var(--text-info)",
                fontSize: ".85rem",
                fontWeight: 600,
              }}
            >
              <Upload size={16} />
              Upload from device
            </button>
            <span style={{ fontSize: ".8rem", color: "var(--text-muted)" }}>
              or paste an image URL
            </span>
          </div>

          {error && (
            <p
              style={{
                margin: 0,
                fontSize: ".8rem",
                color: "var(--text-danger)",
              }}
            >
              {error}
            </p>
          )}

          <button
            className="click"
            onClick={save}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: ".5rem",
              width: "100%",
              padding: ".85rem",
              borderRadius: "1rem",
              cursor: "pointer",
              background: "var(--bg-nav-active)",
              border: "none",
            }}
          >
            <Check size={18} color="var(--bg-surface)" />
            <span style={{ color: "var(--bg-surface)", fontWeight: 600 }}>
              Save image
            </span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ImageViewer({ src, onClose }: { src: string; onClose: () => void }) {
  const bp = useBreakpoint();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1100,
        background: "rgba(2,6,23,.85)",
        backdropFilter: "blur(4px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: bp.sm ? ".5rem" : "2rem",
      }}
      onClick={onClose}
    >
      <button
        className="click"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "absolute",
          top: bp.sm ? ".75rem" : "1.25rem",
          right: bp.sm ? ".75rem" : "1.25rem",
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: ".5rem",
          borderRadius: "50%",
          cursor: "pointer",
          background: "rgba(2,6,23,.6)",
          border: "1px solid rgba(255,255,255,.25)",
        }}
      >
        <X size={18} color="var(--bg-surface)" />
      </button>
      {src && (
        <img
          src={src}
          alt="Shop image"
          onClick={(e) => e.stopPropagation()}
          style={{
            maxWidth: "100%",
            maxHeight: "100%",
            objectFit: "contain",
            borderRadius: ".75rem",
            boxShadow: "0 16px 48px rgba(0,0,0,.5)",
          }}
        />
      )}
    </div>
  );
}
