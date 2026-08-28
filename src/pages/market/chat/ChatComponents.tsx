import { useEffect, useState, type ReactNode } from "react";
import {
  Check,
  CheckCheck,
  Search,
  MessagesSquare,
  X,
  ShoppingBag,
  Timer,
  BadgePercent,
  CircleAlert,
} from "lucide-react";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import type { ChatMessage } from "./chatStore";
import {
  formatRelativeTime,
  initials,
  isDiscountExpired,
  formatDiscountCountdown,
  discountItemName,
} from "./chatFormat";
import { generalStore, type DiscountOrderTarget } from "../store/generalStore";
import { valueFormater } from "../market";

// ---------------------------------------------------------------------------
// Reusable UI pieces
// ---------------------------------------------------------------------------

export function ShopAvatar({
  name,
  image,
  size = 44,
}: {
  name: string;
  image?: string;
  size?: number;
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: "hidden",
        flexShrink: 0,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, var(--bg-nav-active), var(--bg-nav-active, #2563eb))",
        color: "var(--bg-surface)",
        fontWeight: 700,
        fontSize: Math.max(12, size * 0.32),
      }}
    >
      {image ? (
        <img
          src={image}
          alt={name}
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />
      ) : (
        initials(name)
      )}
    </div>
  );
}

export function MessageBubble({ message }: { message: ChatMessage }) {
  const mine = message.from === "me";
  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: "min(78%, 420px)",
          display: "flex",
          flexDirection: "column",
          alignItems: mine ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            maxWidth: "min(100%, 420px)",
            minWidth: "100px",
            padding: "9px 13px",
            borderRadius: mine ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
            background: mine ? "var(--bg-nav-active)" : "var(--bg-secondary)",
            color: mine ? "var(--text-message)" : "var(--text-primary)",
            fontSize: "13.5px",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            boxShadow: "0 1px 2px rgba(0,0,0,.06)",
          }}
        >
          {message.text}
          <span
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              marginTop: 4,
              fontSize: 10,
              opacity: 0.72,
              justifyContent: "flex-end",
            }}
          >
            <span>{formatRelativeTime(message.sentAt)}</span>
            {mine && <MessageStatusIcon status={message.status} />}
          </span>
        </div>
      </div>
    </div>
  );
}

export function DiscountMessageBubble({
  message,
  shopId,
  shopName,
}: {
  message: ChatMessage;
  shopId?: string;
  shopName?: string;
}) {
  const mine = message.from === "me";
  const [now, setNow] = useState(() => Date.now());
  const expired = isDiscountExpired(message.sentAt, now);

  useEffect(() => {
    if (expired) return;
    const t = setInterval(() => setNow(Date.now()), 30000);
    return () => clearInterval(t);
  }, [expired]);

  const oldNum = parseFloat(message.oldPrice ?? "");
  const newNum = parseFloat(message.newPrice ?? "");
  const hasDiscount =
    Number.isFinite(oldNum) && Number.isFinite(newNum) && newNum >= 0;
  const percent =
    hasDiscount && oldNum > 0
      ? Math.max(0, Math.round((1 - newNum / oldNum) * 100))
      : null;

  const openOrder = () => {
    if (!shopId) return;
    const target: DiscountOrderTarget = {
      discountLink: message.discountLink ?? "",
      discountImage: message.discountImage ?? "",
      product_id: message.product_id ?? "",
      oldPrice: message.oldPrice ?? "",
      newPrice: message.newPrice ?? "",
      sentAt: message.sentAt,
      shopId,
      shopName: shopName ?? "",
      itemName: discountItemName(message.text),
    };
    generalStore.setState({ discountOrder: target });
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: mine ? "flex-end" : "flex-start",
        marginBottom: 14,
      }}
    >
      <div
        style={{
          maxWidth: "min(92%, 360px)",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: mine ? "flex-end" : "flex-start",
        }}
      >
        <div
          style={{
            width: "100%",
            overflow: "hidden",
            borderRadius: mine ? "18px 18px 5px 18px" : "18px 18px 18px 5px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            boxShadow: "0 4px 18px rgba(0,0,0,.08)",
          }}
        >
          {/* Hero image */}
          <div style={{ position: "relative", width: "100%", aspectRatio: "16/9", background: "var(--bg-secondary)" }}>
            {message.discountImage ? (
              <img
                src={message.discountImage}
                alt={discountItemName(message.text)}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            ) : (
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: 13,
                }}
              >
                <ShoppingBag size={34} />
              </div>
            )}

            {/* Discount badge */}
            {(percent !== null || newNum > 0) && !expired && (
              <div
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  background: "rgba(220,38,38,.92)",
                  color: "#fff",
                  padding: "4px 9px",
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <BadgePercent size={13} />
                {percent !== null ? `${percent}% OFF` : "SALE"}
              </div>
            )}

            {expired && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "rgba(2,6,23,.55)",
                  color: "#fff",
                  fontSize: 14,
                  fontWeight: 700,
                  letterSpacing: .5,
                }}
              >
                Offer Expired
              </div>
            )}
          </div>

          {/* Body */}
          <div style={{ padding: "12px 14px 10px" }}>
            <p
              style={{
                margin: "0 0 10px",
                fontSize: 14,
                fontWeight: 650,
                color: "var(--text-primary)",
                lineHeight: 1.35,
                wordBreak: "break-word",
              }}
            >
              {discountItemName(message.text)}
            </p>

            {/* Prices */}
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 10 }}>
              {hasDiscount && oldNum !== newNum && (
                <span
                  style={{
                    fontSize: 13,
                    color: "var(--text-muted)",
                    textDecoration: "line-through",
                  }}
                >
                  {valueFormater(oldNum.toFixed(2))}
                </span>
              )}
              <span style={{ fontSize: 19, fontWeight: 800, color: "var(--success, #16a34a)" }}>
                {valueFormater(newNum.toFixed(2))}
              </span>
            </div>

            {/* Countdown */}
            {!expired && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  fontSize: 11.5,
                  color: percent !== null && percent >= 20 ? "#dc2626" : "var(--text-muted)",
                  fontWeight: 600,
                  padding: "5px 8px",
                  borderRadius: 8,
                  background: "rgba(220,38,38,.07)",
                  marginBottom: 10,
                }}
              >
                <Timer size={13} />
                {isDiscountExpired(message.sentAt, now)
                  ? "This offer has expired"
                  : `Offer ends in ${formatDiscountCountdown(message.sentAt, now)}`}
              </div>
            )}

            {/* CTA / status */}
            {!mine ? (
              <button
                type="button"
                onClick={openOrder}
                disabled={expired}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 7,
                  padding: "11px 12px",
                  border: "none",
                  borderRadius: 12,
                  background: expired ? "var(--bg-secondary)" : "var(--bg-nav-active)",
                  color: expired ? "var(--text-muted)" : "var(--bg-surface)",
                  cursor: expired ? "default" : "pointer",
                  fontSize: 13.5,
                  fontWeight: 700,
                  transition: "opacity .15s ease",
                }}
              >
                <ShoppingBag size={16} />
                {expired ? "Offer Expired" : "Order This Item"}
              </button>
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 6,
                  padding: "9px 12px",
                  borderRadius: 12,
                  background: "var(--bg-secondary)",
                  color: "var(--text-muted)",
                  fontSize: 12.5,
                }}
              >
                <CircleAlert size={14} />
                Offer sent to buyer
              </div>
            )}

            {/* Meta */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                marginTop: 8,
                fontSize: 10.5,
                opacity: 0.7,
                justifyContent: "flex-end",
              }}
            >
              <span>{formatRelativeTime(message.sentAt)}</span>
              {mine && <MessageStatusIcon status={message.status} />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MessageStatusIcon({
  status,
}: {
  status: ChatMessage["status"];
}) {
  if (status === "sending") {
    return (
      <>
        <style>
          {"@keyframes chatspin { to { transform: rotate(360deg); } }"}
        </style>
        <span
          aria-label="Sending"
          style={{
            width: 12,
            height: 12,
            borderRadius: "50%",
            border: "1.5px solid currentColor",
            borderTopColor: "transparent",
            display: "inline-block",
            animation: "chatspin 0.8s linear infinite",
          }}
        />
      </>
    );
  }
  return status === "delivered" ? (
    <CheckCheck size={13} aria-label="Delivered" style={{ display: "block" }} />
  ) : (
    <Check size={13} aria-label="Sent" style={{ display: "block" }} />
  );
}

export function ThreadListItem({
  thread,
  active,
  onClick,
}: {
  thread: {
    title: string;
    shopImage?: string;
    isOwner: boolean;
    messages: ChatMessage[];
    unread: number;
    updatedAt: string;
  };
  active?: boolean;
  onClick: () => void;
}) {
  const bp = useBreakpoint();
  const last = thread.messages[thread.messages.length - 1];
  const preview = last
    ? `${last.from === "me" ? `You${last.status === "sending" ? " (sending)" : ""}: ` : last.senderName ? `${last.senderName}: ` : ""}${last.text}`
    : "No messages yet";

  const compact = bp.sm;
  const avatarSize = compact ? 40 : 49;
  const nameSize = compact ? 15 : 16;
  const previewSize = compact ? 12.5 : 13.5;
  const timeSize = compact ? 10.5 : 11.5;
  const hGap = compact ? 10 : 12;
  const hPad = compact ? "10px 12px" : "12px 14px";

  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        minWidth: 0,
        display: "flex",
        alignItems: "center",
        gap: hGap,
        padding: hPad,
        border: "none",
        background: active ? "var(--bg-nav-active)" : "transparent",
        cursor: "pointer",
        textAlign: "left",
        overflow: "hidden",
        boxSizing: "border-box",
        transition: "background .12s ease",
      }}
    >
      <ShopAvatar
        name={thread.title}
        image={thread.isOwner ? undefined : thread.shopImage}
        size={avatarSize}
      />

      <div style={{ flex: "1 1 0", minWidth: 0, overflow: "hidden" }}>
        {/* Row 1: name (left) + timestamp (right) */}
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: 8,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: nameSize,
              fontWeight: 600,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {thread.title}
          </span>
          {thread.updatedAt && (
            <span
              style={{
                fontSize: timeSize,
                color: thread.unread
                  ? "var(--bg-nav-active)"
                  : "var(--text-muted)",
                fontWeight: thread.unread ? 600 : 400,
                whiteSpace: "nowrap",
                flexShrink: 0,
              }}
            >
              {formatRelativeTime(thread.updatedAt)}
            </span>
          )}
        </div>

        {/* Row 2: preview (left, ellipsis) + unread badge (right) */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 8,
            marginTop: 2,
            minWidth: 0,
          }}
        >
          <span
            style={{
              fontSize: previewSize,
              color: thread.unread
                ? "var(--text-primary)"
                : "var(--text-muted)",
              fontWeight: thread.unread ? 500 : 400,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              minWidth: 0,
            }}
          >
            {preview}
          </span>
          {thread.unread > 0 && (
            <span
              style={{
                minWidth: 18,
                height: 18,
                padding: "0 6px",
                boxSizing: "border-box",
                borderRadius: 999,
                background: "#25d366",
                color: "#fff",
                fontSize: 10.5,
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search chats…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  const showClear = value.length > 0;
  return (
    <div style={{ position: "relative", width: "100%" }}>
      <Search
        size={16}
        color="var(--text-muted)"
        style={{
          position: "absolute",
          left: 12,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          height: 38,
          padding: "0 34px 0 36px",
          fontSize: 16,
          color: "var(--text-primary)",
          background: showClear
            ? "var(--bg-secondary)"
            : "rgba(118,118,128,0.12)",
          border: "none",
          borderRadius: 12,
          outline: "none",
          boxSizing: "border-box",
          transition: "background .15s ease",
        }}
      />
      {showClear && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          style={{
            position: "absolute",
            right: 8,
            top: "50%",
            transform: "translateY(-50%)",
            width: 20,
            height: 20,
            padding: 0,
            border: "none",
            borderRadius: "50%",
            background: "rgba(0,0,0,0.35)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={12} strokeWidth={3} />
        </button>
      )}
    </div>
  );
}

export function EmptyState({
  icon = <MessagesSquare size={34} />,
  title,
  subtitle,
  children,
}: {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  children?: ReactNode;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "48px 20px",
        color: "var(--text-muted)",
      }}
    >
      <div style={{ marginBottom: 14, opacity: 0.85 }}>{icon}</div>
      <p
        style={{
          margin: 0,
          fontSize: 15,
          fontWeight: 600,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </p>
      {subtitle && (
        <p
          style={{
            margin: "6px 0 0 0",
            fontSize: 13,
            maxWidth: 340,
            lineHeight: 1.5,
          }}
        >
          {subtitle}
        </p>
      )}
      {children && <div style={{ marginTop: 16 }}>{children}</div>}
    </div>
  );
}
