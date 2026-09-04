import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useStore } from "elk-components";
import {
  Plus,
  CircleDot,
  Tag,
  DollarSign,
  CheckCircle2,
  Clock,
  XCircle,
  Trash2,
  Layers,
  User,
  X,
  TrendingUp,
  Pin,
  PinOff,
  ArrowRight,
} from "lucide-react";
import {
  extractFirstLetter,
  serviceStore,
  serviceOrderStore,
  formatRelativeTime,
  fetchOrgServices,
  fetchServiceOrders,
  renderOrgService,
  completeServiceOrder,
  cancelServiceOrder,
  deleteOrgService,
  deleteServiceOrder,
  toggleServicePin,
} from "./service_demo";
import {
  useContext,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { CurrencyContext } from "@/context";
import { Authcontext } from "@/context";
import { isOrgAdmin } from "@/lib/orgAccess";
import { api } from "@/lib/api";

import { valueFormater } from "../market/market";
import OrgServiceDisplayModal from "./orgServiceDisplayModal";
import OrgServiceForm from "./orgServiceForm";
import DLineChart from "@/components/layout/chart";

type TabId = "overview" | "all" | "active" | "inactive" | "completed";

const TABS: { id: TabId; label: string }[] = [
  { id: "overview", label: "Overview" },
  { id: "all", label: "All Services" },
  { id: "active", label: "Active" },
  { id: "inactive", label: "Inactive" },
  { id: "completed", label: "Completed" },
];

interface Customer {
  id: string;
  name: string;
  email: string;
}

export function OrgServices() {
  const bp = useBreakpoint();
  const sStore = useStore(serviceStore);
  const oStore = useStore(serviceOrderStore);
  const services = sStore.services;
  const orders = oStore.orders;
  const loading = sStore.loading || oStore.loading;
  const { currency } = useContext(CurrencyContext);
  const { orgUser } = useContext(Authcontext);
  const isAdmin = isOrgAdmin(orgUser);

  const [active, setActive] = useState<TabId>("overview");
  const [isServiceForm, setServiceForm] = useState(false);
  const [search, setSearch] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(
    null,
  );

  const [renderModal, setRenderModal] = useState(false);
  const [renderService, setRenderService] = useState<
    (typeof services)[0] | null
  >(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<string>("");
  const [customBuyer, setCustomBuyer] = useState("");
  const buyerInputRef = useRef<HTMLInputElement>(null);

  const [swipedId, setSwipedId] = useState<string | null>(null);
  const swipeStartX = useRef<number | null>(null);
  const swipeDx = useRef(0);

  useEffect(() => {
    fetchOrgServices();
    fetchServiceOrders();
  }, []);

  useEffect(() => {
    if (renderModal) {
      api.org
        .getCustomers()
        .then((list: unknown) => {
          const mapped = (list as Array<Record<string, unknown>>).map((c) => ({
            id: String(c.id ?? ""),
            name: String(c.name ?? ""),
            email: String(c.email ?? ""),
          }));
          setCustomers(mapped);
        })
        .catch(() => setCustomers([]));
    }
  }, [renderModal]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const matches = (s: (typeof services)[0]) =>
      !q ||
      s.name.toLowerCase().includes(q) ||
      s.category.toLowerCase().includes(q) ||
      s.description.toLowerCase().includes(q);

    if (active === "active" || active === "completed") return [];
    if (active === "inactive") {
      return services.filter((s) => s.status !== "active").filter(matches);
    }
    if (active === "all") {
      return services.slice().filter(matches);
    }
    // overview: pinned first, then most recent, capped at 6.
    return services
      .slice()
      .sort((a, b) => {
        if (a.is_pinned !== b.is_pinned) return a.is_pinned ? -1 : 1;
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
      .slice(0, 6);
  }, [services, active, search]);

  const activeOrders = useMemo(() => {
    const q = search.toLowerCase();
    return orders
      .filter((o) => o.status === "active")
      .filter(
        (o) =>
          !q ||
          o.service_name.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q),
      );
  }, [orders, search]);

  const logEntries = useMemo(() => {
    if (active !== "completed") return [];
    const q = search.toLowerCase();
    return orders
      .filter(
        (o) =>
          !q ||
          o.service_name.toLowerCase().includes(q) ||
          o.customer_name.toLowerCase().includes(q),
      )
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
  }, [orders, active, search]);

  const openServiceModal = useCallback((id: string) => {
    setSelectedServiceId(id);
    setModalOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setSelectedServiceId(null);
  }, []);

  const openRenderModal = useCallback((service: (typeof services)[0]) => {
    setRenderService(service);
    setSelectedCustomer("");
    setCustomBuyer("");
    setRenderModal(true);
  }, []);

  const closeRenderModal = useCallback(() => {
    setRenderModal(false);
    setRenderService(null);
  }, []);

  const submitRender = useCallback(async () => {
    if (!renderService) return;
    const buyerName = selectedCustomer
      ? (customers.find((c) => c.id === selectedCustomer)?.name ?? "Client")
      : customBuyer.trim() || "Walk-in Client";
    const buyerId = selectedCustomer || undefined;
    await renderOrgService(renderService, buyerName, buyerId);
    closeRenderModal();
  }, [
    renderService,
    selectedCustomer,
    customBuyer,
    customers,
    closeRenderModal,
  ]);

  const handleComplete = useCallback(async (orderId: string) => {
    await completeServiceOrder(orderId);
  }, []);

  const handleCancel = useCallback(async (orderId: string) => {
    await cancelServiceOrder(orderId);
  }, []);

  const handleDeleteService = useCallback(async (id: string) => {
    await deleteOrgService(id);
  }, []);

  const handleTogglePin = useCallback(async (id: string, pinned: boolean) => {
    await toggleServicePin(id, !pinned);
  }, []);

  const handleDeleteOrder = useCallback(async (id: string) => {
    await deleteServiceOrder(id);
  }, []);

  // Swipe-to-reveal: opening one row closes the others.
  const onSwipeStart = useCallback(
    (e: import("react").PointerEvent<HTMLDivElement>) => {
      if (!bp.sm) return;
      swipeStartX.current = e.clientX;
      swipeDx.current = 0;
    },
    [bp.sm],
  );

  const onSwipeMove = useCallback(
    (e: import("react").PointerEvent<HTMLDivElement>) => {
      if (!bp.sm || swipeStartX.current == null) return;
      swipeDx.current = e.clientX - swipeStartX.current;
    },
    [bp.sm],
  );

  const onSwipeEnd = useCallback(
    (orderId: string) => {
      if (!bp.sm) return;
      const dx = swipeDx.current;
      swipeStartX.current = null;
      swipeDx.current = 0;
      if (Math.abs(dx) < 40) return;
      setSwipedId(dx < 0 ? orderId : null);
    },
    [bp.sm],
  );

  const counts = useMemo(
    () => ({
      overview: Math.min(services.length, 6),
      all: services.length,
      active: orders.filter((o) => o.status === "active").length,
      inactive: services.filter((s) => s.status !== "active").length,
      completed: orders.length,
    }),
    [services, orders],
  );

  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "completed");
    const revenue = completed.reduce((sum, o) => sum + Number(o.price || 0), 0);
    const total = orders.length;
    const cancelled = orders.filter((o) => o.status === "cancelled").length;
    const completionRate = total
      ? Math.round((completed.length / total) * 100)
      : 0;
    const avgTicket = completed.length
      ? Math.round((revenue / completed.length) * 100) / 100
      : 0;
    return {
      revenue,
      total,
      completed: completed.length,
      cancelled,
      completionRate,
      avgTicket,
    };
  }, [orders]);

  const serviceRevenueTrend = useMemo(() => {
    const buckets: Record<string, number> = {};
    orders
      .filter((o) => o.status === "completed" && o.completed_at)
      .forEach((o) => {
        const day = String(o.completed_at || "").slice(0, 10);
        if (day) buckets[day] = (buckets[day] || 0) + Number(o.price || 0);
      });
    const days = Object.keys(buckets).sort();
    return {
      dates: days,
      series: days.map((d) => buckets[d]),
    };
  }, [orders]);

  const tabBar = (
    <div
      style={{
        width: "100%",
        display: "flex",
        gap: "4px",
        padding: "6px",
        borderRadius: "12px",
        background: "transparent",
        overflowX: "auto",
      }}
    >
      {TABS.map((t) => (
        <button
          key={t.id}
          onClick={() => setActive(t.id)}
          className="click"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "9px 14px",
            fontSize: "13px",
            fontWeight: 600,
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            whiteSpace: "nowrap",
            color:
              active === t.id ? "var(--bg-surface)" : "var(--text-secondary)",
            background:
              active === t.id ? "var(--bg-nav-active)" : "transparent",
            transition: "background 0.15s, color 0.15s",
          }}
        >
          {t.label}
          <span
            style={{
              fontSize: "11px",
              fontWeight: 700,
              padding: "1px 6px",
              borderRadius: "2rem",
              background:
                active === t.id
                  ? "rgba(255,255,255,0.2)"
                  : "var(--bg-input, rgba(0,0,0,0.05))",
              color:
                active === t.id ? "var(--bg-surface)" : "var(--text-secondary)",
            }}
          >
            {counts[t.id]}
          </span>
        </button>
      ))}
    </div>
  );

  const renderCard = (service: (typeof services)[0], idx: number) => (
    <div
      key={idx}
      onClick={() => openServiceModal(service.service_id)}
      className="click"
      style={{
        display: "flex",
        flexDirection: "column",
        width: "100%",
        maxWidth: bp.sm ? "340px" : undefined,
        borderRadius: "1rem",
        border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
        background: "var(--bg-surface)",
        overflow: "hidden",
        cursor: "pointer",
        transition: "transform 0.2s, box-shadow 0.2s",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-3px)";
        e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.1)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)";
      }}
    >
      <div
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "clamp(6rem, 15vw, 8.5rem)",
          background:
            "linear-gradient(135deg, var(--bg-nav-active), color-mix(in srgb, var(--bg-nav-active) 70%, #000))",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08) 0%, transparent 60%)",
          }}
        />
        <span
          style={{
            position: "relative",
            color: "var(--bg-surface)",
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            letterSpacing: "0.08em",
            textShadow: "0 2px 8px rgba(0,0,0,0.15)",
          }}
        >
          {extractFirstLetter(service.name, true, 2)}
        </span>

        {service.is_pinned && (
          <span
            style={{
              position: "absolute",
              top: "0.55rem",
              left: "0.55rem",
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.2rem 0.5rem",
              borderRadius: "2rem",
              fontSize: "clamp(0.5rem, 1.1vw, 0.6rem)",
              fontWeight: 700,
              letterSpacing: "0.03em",
              textTransform: "uppercase",
              background: "rgba(245, 158, 11, 0.2)",
              color: "#fbbf24",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              backdropFilter: "blur(8px)",
            }}
          >
            <Pin size={8} />
            Pinned
          </span>
        )}

        <span
          style={{
            position: "absolute",
            top: "0.55rem",
            right: "0.55rem",
            display: "inline-flex",
            alignItems: "center",
            gap: "0.25rem",
            padding: "0.2rem 0.5rem",
            borderRadius: "2rem",
            fontSize: "clamp(0.5rem, 1.1vw, 0.6rem)",
            fontWeight: 600,
            letterSpacing: "0.03em",
            textTransform: "uppercase",
            background: "rgba(34, 197, 94, 0.2)",
            color: "#4ade80",
            border: "1px solid rgba(34, 197, 94, 0.3)",
            backdropFilter: "blur(8px)",
          }}
        >
          <CircleDot size={8} />
          Available
        </span>
      </div>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          padding: "clamp(0.75rem, 2vw, 1rem)",
          gap: "0.6rem",
          flex: "1 1 auto",
        }}
      >
        <h3
          style={{
            fontWeight: 700,
            fontSize: "clamp(0.9rem, 2.2vw, 1.05rem)",
            color: "var(--text-primary)",
            margin: 0,
            lineHeight: 1.2,
          }}
        >
          {service.name}
        </h3>

        <p
          className="ellipsis_text"
          style={{
            color: "var(--text-secondary, GrayText)",
            margin: 0,
            lineHeight: 1.45,
            fontSize: "clamp(0.72rem, 1.6vw, 0.8rem)",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {service.description}
        </p>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            flexWrap: "wrap",
            marginTop: "auto",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.25rem",
              padding: "0.2rem 0.55rem",
              borderRadius: "2rem",
              fontSize: "clamp(0.55rem, 1.1vw, 0.62rem)",
              fontWeight: 500,
              background: "var(--bg-input, rgba(0,0,0,0.04))",
              border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
              color: "var(--text-secondary, #666)",
              textTransform: "capitalize",
            }}
          >
            <Tag size={9} />
            {service.pricing_type}
          </span>
          {service.category && (
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                padding: "0.2rem 0.55rem",
                borderRadius: "2rem",
                fontSize: "clamp(0.55rem, 1.1vw, 0.62rem)",
                fontWeight: 500,
                background: "var(--bg-input, rgba(0,0,0,0.04))",
                border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
                color: "var(--text-secondary, #666)",
                textTransform: "capitalize",
              }}
            >
              {service.category}
            </span>
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingBlockStart: "0.5rem",
            borderTop: "1px solid var(--border-input, rgba(0,0,0,0.06))",
          }}
        >
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontWeight: 800,
              fontSize: "clamp(0.8rem, 2vw, 1rem)",
              color: "#059669",
            }}
          >
            <DollarSign size={14} />
            {currency + valueFormater(service.price as unknown as string)}
          </span>

          <div style={{ display: "flex", gap: "0.35rem" }}>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(service.service_id, service.is_pinned);
              }}
              className="click"
              title={
                service.is_pinned ? "Unpin from overview" : "Pin to overview"
              }
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: service.is_pinned
                  ? "rgba(245, 158, 11, 0.15)"
                  : "var(--bg-input, rgba(0,0,0,0.04))",
                color: service.is_pinned
                  ? "#f59e0b"
                  : "var(--text-secondary, #888)",
                borderRadius: "2rem",
                padding: "0.4rem",
                border: "none",
                cursor: "pointer",
              }}
            >
              {service.is_pinned ? <PinOff size={14} /> : <Pin size={14} />}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                openRenderModal(service);
              }}
              className="click"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                background: "var(--bg-nav-active)",
                color: "var(--bg-surface)",
                borderRadius: "2rem",
                padding: "0.4rem 0.8rem",
                border: "none",
                cursor: "pointer",
                fontWeight: 600,
                fontSize: "clamp(0.55rem, 1.2vw, 0.68rem)",
                letterSpacing: "0.02em",
              }}
            >
              Render
            </button>
            {isAdmin && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteService(service.service_id);
                }}
                className="click"
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(239, 68, 68, 0.1)",
                  color: "#ef4444",
                  borderRadius: "2rem",
                  padding: "0.4rem",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );

  const renderLogEntry = (order: (typeof logEntries)[0], idx: number) => {
    const isLogActive = order.status === "active";
    const isLogCompleted = order.status === "completed";
    const isLogCancelled = order.status === "cancelled";
    const isMobile = bp.sm;
    const revealed = swipedId === order.order_id;

    // Width of the swipe-to-reveal action panel on mobile.
    const revealWidth = isMobile ? (isLogActive ? 128 : 48) : 0;

    const actionButtons = (
      <>
        {isLogActive && (
          <button
            onClick={() => handleComplete(order.order_id)}
            className="click"
            title="Complete"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? 38 : 32,
              height: isMobile ? 38 : 32,
              borderRadius: "50%",
              background: "rgba(34, 197, 94, 0.14)",
              border: "none",
              cursor: "pointer",
              color: "#22c55e",
              flexShrink: 0,
            }}
          >
            <CheckCircle2 size={isMobile ? 18 : 16} />
          </button>
        )}
        {isLogActive && (
          <button
            onClick={() => handleCancel(order.order_id)}
            className="click"
            title="Cancel"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? 38 : 32,
              height: isMobile ? 38 : 32,
              borderRadius: "50%",
              background: "rgba(239, 68, 68, 0.14)",
              border: "none",
              cursor: "pointer",
              color: "#ef4444",
              flexShrink: 0,
            }}
          >
            <XCircle size={isMobile ? 18 : 16} />
          </button>
        )}
        {isAdmin && (
          <button
            onClick={() => handleDeleteOrder(order.order_id)}
            className="click"
            title="Delete"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: isMobile ? 38 : 32,
              height: isMobile ? 38 : 32,
              borderRadius: "50%",
              background: "rgba(156, 163, 125, 0.14)",
              border: "none",
              cursor: "pointer",
              color: "#9ca3af",
              flexShrink: 0,
            }}
          >
            <Trash2 size={isMobile ? 18 : 14} />
          </button>
        )}
      </>
    );

    return (
      <div
        key={idx}
        style={{
          position: "relative",
          overflow: "hidden",
          borderRadius: "0.85rem",
          border: "1px solid var(--border-input, rgba(0,0,0,0.06))",
          touchAction: isMobile ? "pan-y" : "auto",
        }}
      >
        {/* Revealed action layer (mobile swipe) */}
        {isMobile && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "flex-end",
              gap: "0.4rem",
              paddingRight: "0.6rem",
              background:
                "linear-gradient(90deg, rgba(239,68,68,0.04), rgba(239,68,68,0.30))",
              borderRadius: "0.85rem",
            }}
          >
            {actionButtons}
          </div>
        )}

        {/* Sliding content */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "clamp(0.75rem, 2vw, 1rem)",
            padding: "clamp(0.75rem, 2vw, 1rem)",
            background: "var(--bg-surface)",
            transform: isMobile ? `translateX(${revealed ? -revealWidth : 0}px)` : "none",
            transition: "transform 0.2s ease",
            willChange: "transform",
            userSelect: "none",
            WebkitUserSelect: "none",
          }}
          onPointerDown={onSwipeStart}
          onPointerMove={onSwipeMove}
          onPointerUp={() => onSwipeEnd(order.order_id)}
          onPointerCancel={() => onSwipeEnd(order.order_id)}
          onClick={() => {
            if (isMobile && revealed) {
              setSwipedId(null);
            }
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 36,
              height: 36,
              borderRadius: "50%",
              flex: "0 0 auto",
              background: isLogCompleted
                ? "rgba(34, 197, 94, 0.1)"
                : isLogCancelled
                  ? "rgba(239, 68, 68, 0.1)"
                  : "rgba(59, 130, 246, 0.1)",
            }}
          >
            {isLogCompleted ? (
              <CheckCircle2 size={18} color="#22c55e" />
            ) : isLogCancelled ? (
              <XCircle size={18} color="#ef4444" />
            ) : (
              <Clock size={18} color="#3b82f6" />
            )}
          </div>

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "0.25rem",
              flex: "1 1 0",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                flexWrap: "wrap",
              }}
            >
              <span
                style={{
                  fontWeight: 700,
                  fontSize: "clamp(0.82rem, 2vw, 0.95rem)",
                  color: "var(--text-primary)",
                }}
              >
                {order.service_name}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.15rem",
                  padding: "0.15rem 0.45rem",
                  borderRadius: "2rem",
                  fontSize: "clamp(0.5rem, 1vw, 0.58rem)",
                  fontWeight: 600,
                  background: isLogCompleted
                    ? "rgba(34, 197, 94, 0.1)"
                    : isLogCancelled
                      ? "rgba(239, 68, 68, 0.1)"
                      : "rgba(59, 130, 246, 0.1)",
                  color: isLogCompleted
                    ? "#22c55e"
                    : isLogCancelled
                      ? "#ef4444"
                      : "#3b82f6",
                  textTransform: "uppercase",
                }}
              >
                {isLogCompleted
                  ? "Completed"
                  : isLogCancelled
                    ? "Cancelled"
                    : "Active"}
              </span>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
                flexWrap: "wrap",
                fontSize: "clamp(0.65rem, 1.3vw, 0.75rem)",
                color: "var(--text-secondary, #888)",
              }}
            >
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <User size={11} />
                {order.customer_name}
              </span>
              <span
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.25rem",
                }}
              >
                <Tag size={11} />
                {order.pricing_type}
              </span>
              <span>{formatRelativeTime(order.created_at)}</span>
              {order.completed_at && (
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.25rem",
                  }}
                >
                  <CheckCircle2 size={11} />
                  {formatRelativeTime(order.completed_at)}
                </span>
              )}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              flex: "0 0 auto",
            }}
          >
            <span
              style={{
                fontWeight: 800,
                fontSize: "clamp(0.8rem, 2vw, 0.95rem)",
                color: "#059669",
                whiteSpace: "nowrap",
              }}
            >
              {currency + valueFormater(order.price as unknown as string)}
            </span>

            {!isMobile && (
              <div style={{ display: "flex", gap: "0.3rem" }}>{actionButtons}</div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          width: "100%",
          height: "100%",
          padding: "1rem",
          paddingBottom: "9rem",
     
          gap: "1rem",
          overflowY: "auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            width: "100%",
            gap: ".5rem",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "1rem",
              minWidth: 0,
            }}
          >
           {!bp.sm && <h1 style={{ flexShrink: 0 }}>Services</h1>}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                overflowX: "auto",
                minWidth: 0,
                flex: "1 1 auto",
              }}
            >
              {tabBar}
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                marginInlineStart: "auto",
                flexShrink: 0,
              }}
            >
              <button
                onClick={() => setServiceForm(true)}
                className="click"
                style={{
                  display: isAdmin ? "flex" : "none",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: ".3rem",
                  borderRadius: ".5rem",
                  background: "var(--bg-nav-active)",
                  padding: ".5rem 1rem",
                  cursor: "pointer",
                }}
              >
                <Plus color="var(--bg-surface)" />
                {!bp.sm && (
                  <span style={{ color: "var(--bg-surface)" }}>
                    Add new Service
                  </span>
                )}
              </button>
            </div>
          </div>

          <input
            className="focus_elevation"
            placeholder="Search for service"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              display: "flex",
              border: "1px solid var(--border-input)",
              background: "var(--bg-input)",
              padding: ".5rem",
              borderRadius: "1rem",
              outline: "none",
              width: "100%",
            }}
          />
        </div>

        {/* Service stats cards — mirrors the general dashboard stat-card style */}
        {!loading && active === "overview" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: bp.xxsm
                ? "1fr"
                : bp.sm
                  ? "repeat(2, 1fr)"
                  : "repeat(4, 1fr)",
              gap: "12px",
              width: "100%",
            }}
          >
            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "14px",
                border: "1px solid var(--border-default)",
                padding: "16px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Service Revenue
                </span>
                <DollarSign
                  size={12}
                  style={{ color: "#059669", flexShrink: 0 }}
                />
              </div>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currency + valueFormater(stats.revenue as unknown as string)}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "3px",
                  marginTop: "4px",
                  minWidth: 0,
                }}
              >
                <CheckCircle2 size={12} color="#22c55e" />
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "#22c55e",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {stats.completed} completed · {stats.avgTicket} avg
                </span>
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "14px",
                border: "1px solid var(--border-default)",
                padding: "16px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "6px",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  }}
                >
                  Orders
                </span>
                <Layers size={12} style={{ color: "#3b82f6", flexShrink: 0 }} />
              </div>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {stats.total}
              </p>
              <div
                style={{
                  marginTop: "4px",
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                <span style={{ color: "#3b82f6" }}>{stats.completed}</span> done
                <span style={{ color: "var(--text-placeholder)" }}> · </span>
                <span style={{ color: "#ef4444" }}>{stats.cancelled}</span>{" "}
                cancelled
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "14px",
                border: "1px solid var(--border-default)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Completion Rate
                </span>
                <TrendingUp
                  size={12}
                  style={{ color: "#8b5cf6", flexShrink: 0 }}
                />
              </div>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {stats.completionRate}%
              </p>
              <div
                style={{
                  height: "6px",
                  borderRadius: "2rem",
                  background: "var(--bg-tertiary)",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: `${stats.completionRate}%`,
                    borderRadius: "2rem",
                    background: "linear-gradient(90deg, #8b5cf6, #22c55e)",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                background: "var(--bg-surface)",
                borderRadius: "14px",
                border: "1px solid var(--border-default)",
                padding: "16px",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                boxShadow: "var(--shadow-card)",
                minWidth: 0,
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span
                  style={{
                    fontSize: "10px",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                  }}
                >
                  Catalog
                </span>
                <Tag size={12} style={{ color: "#f59e0b", flexShrink: 0 }} />
              </div>
              <p
                style={{
                  fontSize: "20px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {services.length}
              </p>
              <p
                style={{
                  fontSize: "10px",
                  color: "var(--text-muted)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {services.filter((s) => s.status === "inactive").length}{" "}
                inactive
              </p>
            </div>
          </div>
        )}

        {/* Service revenue trend chart */}
        {!loading &&
          active === "overview" &&
          serviceRevenueTrend.dates.length > 0 && (
            <div
              style={{
                width: "100%",
                padding: "16px",
                background: "var(--bg-surface)",
                borderRadius: "14px",
                boxShadow: "var(--shadow-card)",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                minWidth: 0,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  minWidth: 0,
                }}
              >
                <h3
                  style={{
                    fontWeight: 700,
                    fontSize: "16px",
                    margin: 0,
                    flexShrink: 0,
                  }}
                >
                  Service Revenue Trend
                </h3>
                <span
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {serviceRevenueTrend.dates.length} days with completed orders
                </span>
              </div>
              {serviceRevenueTrend.series.length > 0 ? (
                <DLineChart
                  datas={serviceRevenueTrend.series}
                  labels={serviceRevenueTrend.dates}
                  mobileHeight={bp.sm ? "min(200px, 32vh)" : "min(260px, 40vh)"}
                />
              ) : (
                <div
                  style={{
                    height: "80px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "var(--text-placeholder)",
                    fontSize: "12px",
                  }}
                >
                  Complete an order to see revenue trend
                </div>
              )}
            </div>
          )}

        {loading && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "3rem",
              color: "var(--text-secondary)",
              fontSize: "0.9rem",
            }}
          >
            Loading services...
          </div>
        )}

        {/* Overview / All / Inactive — Card Grid */}
        {!loading && active !== "completed" && active !== "active" && (
          <>
            {active === "overview" && services.length > 6 && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  gap: "1rem",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "0.75rem",
                    color: "var(--text-secondary, #888)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  Showing {Math.min(services.length, 6)} of {services.length}{" "}
                  services
                </p>
                <button
                  onClick={() => setActive("all")}
                  className="click"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.15rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                    color: "var(--bg-nav-active)",
                    flexShrink: 0,
                  }}
                >
                  View All <ArrowRight size={13} />
                </button>
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: bp.sm
                  ? "1fr"
                  : "repeat(auto-fit, minmax(200px, 280px))",
                justifyItems: bp.sm ? "center" : "stretch",
                width: "100%",
                gap: "1rem",
              }}
            >
              {filtered.map((service, idx) => renderCard(service, idx))}
              {filtered.length === 0 && (
                <div
                  style={{
                    gridColumn: "1 / -1",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "3rem",
                    color: "var(--text-secondary)",
                    fontSize: "0.9rem",
                    gap: "0.5rem",
                  }}
                >
                  <Layers size={32} style={{ opacity: 0.3 }} />
                  No services found
                </div>
              )}
            </div>
          </>
        )}

        {/* Active — Active Orders */}
        {!loading && active === "active" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "0.5rem",
            }}
          >
            {activeOrders.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3rem",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  gap: "0.5rem",
                }}
              >
                <Clock size={32} style={{ opacity: 0.3 }} />
                No active orders
              </div>
            )}
            {activeOrders.map((order, idx) => renderLogEntry(order, idx))}
          </div>
        )}

        {/* Completed — Full Log */}
        {!loading && active === "completed" && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              width: "100%",
              gap: "0.5rem",
            }}
          >
            {logEntries.length === 0 && (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: "3rem",
                  color: "var(--text-secondary)",
                  fontSize: "0.9rem",
                  gap: "0.5rem",
                }}
              >
                <Clock size={32} style={{ opacity: 0.3 }} />
                No service orders yet
              </div>
            )}
            {logEntries.map((order, idx) => renderLogEntry(order, idx))}
          </div>
        )}

        {/* Render Modal (Buyer Selection) */}
        {renderModal && renderService && (
          <div
            onClick={closeRenderModal}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 112,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.45)",
              backdropFilter: "blur(12px)",
              padding: "1rem",
              animation: "modalFadeIn 0.2s ease-out",
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "flex",
                flexDirection: "column",
                width: "100%",
                maxWidth: 440,
                borderRadius: "1.25rem",
                background: "var(--bg-surface)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.25)",
                overflow: "hidden",
                animation: "modalSlideUp 0.25s ease-out",
              }}
            >
              {/* Header */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1.25rem clamp(1.25rem, 4vw, 1.75rem)",
                  borderBottom:
                    "1px solid var(--border-input, rgba(0,0,0,0.06))",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontWeight: 700,
                      fontSize: "1.1rem",
                      color: "var(--text-primary)",
                      margin: 0,
                    }}
                  >
                    Render Service
                  </h2>
                  <p
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--text-secondary, #888)",
                      margin: 0,
                      marginTop: "0.2rem",
                    }}
                  >
                    {renderService.name} —{" "}
                    {currency +
                      valueFormater(renderService.price as unknown as string)}
                  </p>
                </div>
                <button
                  onClick={closeRenderModal}
                  className="click"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: "50%",
                    background: "var(--bg-input, rgba(0,0,0,0.04))",
                    border: "1px solid var(--border-input, rgba(0,0,0,0.08))",
                    cursor: "pointer",
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "1rem",
                  padding: "clamp(1.25rem, 4vw, 1.75rem)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.4rem",
                  }}
                >
                  <label
                    style={{
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                    }}
                  >
                    Select Buyer
                  </label>
                  <select
                    value={selectedCustomer}
                    onChange={(e) => {
                      setSelectedCustomer(e.target.value);
                      if (e.target.value) setCustomBuyer("");
                    }}
                    style={{
                      border: "1px solid var(--border-input)",
                      background: "var(--bg-input)",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "0.6rem",
                      outline: "none",
                      fontSize: "0.88rem",
                      color: "var(--text-primary)",
                      width: "100%",
                    }}
                  >
                    <option value="">Walk-in / Custom buyer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.email})
                      </option>
                    ))}
                  </select>
                </div>

                {!selectedCustomer && (
                  <div
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                    }}
                  >
                    <label
                      style={{
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      Buyer Name
                    </label>
                    <input
                      ref={buyerInputRef}
                      value={customBuyer}
                      onChange={(e) => setCustomBuyer(e.target.value)}
                      placeholder="Enter buyer name..."
                      style={{
                        border: "1px solid var(--border-input)",
                        background: "var(--bg-input)",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "0.6rem",
                        outline: "none",
                        fontSize: "0.88rem",
                        color: "var(--text-primary)",
                        width: "100%",
                      }}
                    />
                  </div>
                )}
              </div>

              {/* Footer */}
              <div
                style={{
                  padding: "0 clamp(1.25rem, 4vw, 1.75rem)",
                  paddingBottom: "clamp(1.25rem, 4vw, 1.75rem)",
                }}
              >
                <button
                  onClick={submitRender}
                  className="click"
                  style={{
                    display: "flex",
                    width: "100%",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.5rem",
                    background:
                      "linear-gradient(135deg, var(--bg-nav-active), color-mix(in srgb, var(--bg-nav-active) 80%, #000))",
                    color: "var(--bg-surface)",
                    borderRadius: "0.85rem",
                    padding: "0.75rem",
                    border: "none",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "0.95rem",
                    boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
                  }}
                >
                  Confirm Render
                </button>
              </div>
            </div>

            <style>{`
              @keyframes modalFadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
              }
              @keyframes modalSlideUp {
                from { opacity: 0; transform: translateY(28px) scale(0.96); }
                to { opacity: 1; transform: translateY(0) scale(1); }
              }
            `}</style>
          </div>
        )}

        <OrgServiceDisplayModal
          serviceId={selectedServiceId}
          isOpen={modalOpen}
          onClose={closeModal}
          onRender={(id) => {
            const svc = services.find((s) => s.service_id === id);
            if (svc) openRenderModal(svc);
          }}
        />

        {isServiceForm && (
          <OrgServiceForm onClose={() => setServiceForm(false)} />
        )}
      </div>
    </>
  );
}
