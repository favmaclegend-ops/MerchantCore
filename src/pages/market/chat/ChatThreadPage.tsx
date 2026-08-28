import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Info, Plus, Send, Trash2 } from "lucide-react";
import {
  deleteMessage,
  deleteThread,
  getThread,
  markThreadRead,
  sendMessage,
  useChatStore,
} from "./chatStore";
import {
  DiscountMessageBubble,
  EmptyState,
  MessageActionPanel,
  MessageBubble,
  ShopAvatar,
} from "./ChatComponents";
import { formatFullTime } from "./chatFormat";
import { generalStore } from "../store/generalStore";
import NegotiationPanel from "./actions/NegotiationPanel";
import { useStore } from "elk-components";
import DiscountPanel from "./actions/DiscountPanel";
import DiscountOrderPanel from "./actions/DiscountOrderPanel";

const base = () =>
  window.location.pathname.startsWith("/market") ? "/market" : "/home/market";

export function ChatThreadPage() {
  const { shopId = "" } = useParams();
  const navigate = useNavigate();
  const { unread, loading } = useChatStore();
  const [text, setText] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const [menuTarget, setMenuTarget] = useState<{ id: string; rect: DOMRect } | null>(null);
  const [panelRect, setPanelRect] = useState<DOMRect | null>(null);
  useStore(generalStore);

  const thread = getThread(shopId);

  const activeMessage = menuTarget
    ? thread?.messages.find((m) => m.id === menuTarget.id) ?? null
    : null;

  const openMenu = (id: string, rect: DOMRect) => {
    setMenuTarget({ id, rect });
    setPanelRect(listRef.current?.getBoundingClientRect() ?? null);
  };

  useEffect(() => {
    if (!menuTarget) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuTarget(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuTarget]);

  useEffect(() => {
    if (!menuTarget) return;
    const updateRect = () => {
      if (listRef.current) setPanelRect(listRef.current.getBoundingClientRect());
    };
    window.addEventListener("resize", updateRect);
    return () => window.removeEventListener("resize", updateRect);
  }, [menuTarget]);

  // Mark read + scroll when opening or when messages change.
  useEffect(() => {
    if (!shopId) return;
    if (getThread(shopId) && getThread(shopId)!.unread > 0) {
      void markThreadRead(shopId);
    }
  }, [shopId, unread]);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [thread?.messages.length]);

  const back = () => navigate(`${base()}/chat`);

  const goShop = () => {
    if (thread?.shopId) navigate(`${base()}/${thread.shopId}`);
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || !shopId) return;
    generalStore.setState({ messageType: "normal" });
    void sendMessage({
      shopId: shopId,
      text: value,
      discountImage: "",
      discountLink: "",
      product_id: undefined,
      oldPrice: undefined,
      newPrice: undefined,
      type: "normal",
    }).catch(() => {});
    setText("");
  };

  const handleDelete = () => {
    if (!window.confirm("Delete this conversation?")) return;
    void deleteThread(shopId);
    back();
  };

  if (!thread || !shopId) {
    return (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--bg-page)",
        }}
      >
        <div
          style={{
            padding: "16px 18px",
            borderBottom: "1px solid var(--border-default)",
            background: "var(--bg-surface)",
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <button
            onClick={back}
            style={{
              padding: 8,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              display: "flex",
            }}
          >
            <ArrowLeft size={20} color="var(--text-secondary)" />
          </button>
          <span
            style={{
              fontWeight: 600,
              fontSize: 15,
              color: "var(--text-primary)",
            }}
          >
            Chat
          </span>
        </div>
        <EmptyState
          title={loading ? "Loading conversation…" : "Conversation not found"}
          subtitle={
            loading
              ? "Opening your secure chat…"
              : "This thread may have expired. Start a new chat from a shop page."
          }
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        background: "var(--bg-page)",
        overflowX: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <button
          onClick={back}
          style={{
            padding: 8,
            border: "none",
            background: "transparent",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <ArrowLeft size={20} color="var(--text-secondary)" />
        </button>
        <ShopAvatar name={thread.shopName} image={thread.shopImage} size={34} />
        <button
          onClick={goShop}
          title="Open store"
          style={{
            flex: 1,
            minWidth: 0,
            border: "none",
            background: "transparent",
            padding: 0,
            textAlign: "left",
            cursor: "pointer",
            display: "block",
          }}
        >
          <div
            style={{
              fontWeight: 700,
              fontSize: 14.5,
              color: "var(--text-primary)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {thread.shopName}
          </div>
          <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
            {thread.updatedAt
              ? formatFullTime(thread.updatedAt)
              : "Market chat"}
          </div>
        </button>
        <button
          title="Delete conversation"
          onClick={handleDelete}
          style={{
            padding: 8,
            border: "none",
            background: "transparent",
            color: "var(--text-muted)",
            cursor: "pointer",
            display: "flex",
          }}
        >
          <Trash2 size={17} />
        </button>
      </div>

      {/* 4-day expiry notice */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "8px 16px",
          background: "var(--bg-secondary)",
          borderBottom: "1px solid var(--border-default)",
          fontSize: 11.5,
          color: "var(--text-muted)",
          textAlign: "center",
        }}
      >
        <Info size={13} />
        Messages are automatically deleted after 4 days.
      </div>

      {/* Messages */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: menuTarget ? "hidden" : "auto",
          padding: "16px",
          position: "relative",
        }}
        onScroll={() => setMenuTarget(null)}
      >
        {menuTarget && activeMessage && panelRect && (
          <>
            <div
              onClick={() => setMenuTarget(null)}
              style={{
                position: "fixed",
                left: panelRect.left,
                top: panelRect.top,
                width: panelRect.width,
                height: panelRect.height,
                zIndex: 10,
                background: "rgba(2, 6, 23, 0.24)",
                backdropFilter: "blur(10px)",
                WebkitBackdropFilter: "blur(10px)",
              }}
            />
            <MessageActionPanel
              mine={activeMessage.from === "me"}
              rect={menuTarget.rect}
              onClose={() => setMenuTarget(null)}
              onDeleteForMe={() => {
                void deleteMessage(thread.threadId, activeMessage.id, "me");
              }}
              onDeleteForEveryone={() => {
                void deleteMessage(thread.threadId, activeMessage.id, "everyone");
              }}
            />
          </>
        )}
        {thread.messages.map((m) =>
          m.type === "discount" ? (
            <DiscountMessageBubble
              key={m.id}
              message={m}
              shopId={thread.shopId}
              shopName={thread.shopName}
              active={menuTarget?.id === m.id}
              onOpenMenu={(rect) => openMenu(m.id, rect)}
            />
          ) : (
            <MessageBubble
              key={m.id}
              message={m}
              active={menuTarget?.id === m.id}
              onOpenMenu={(rect) => openMenu(m.id, rect)}
            />
          ),
        )}
      </div>

      {generalStore.getState().isNegotiationPanel && <NegotiationPanel />}
      {generalStore.getState().isDiscountPanel && <DiscountPanel />}
      {generalStore.getState().discountOrder && <DiscountOrderPanel />}

      {/* Composer */}
      <form
        onSubmit={handleSend}
        style={{
          padding: "10px 14px",
          borderTop: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
          display: "flex",
          alignItems: "center",
          gap: 10,

        }}
      >
        <button
          type="button"
          onClick={() => {
            generalStore.setState({ isNegotiationPanel: true });
          }}
          style={{
            display: "flex",
            alignItems: "center",
            padding: ".2rem",
            border: "none",
            background: "none",
            cursor: "pointer",
          }}
        >
          <Plus />
        </button>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend(e);
            }
          }}
          placeholder={`Message ${thread.shopName}…`}
          rows={1}
          style={{
            flex: 1,
            padding: "10px 12px",
            fontSize: 16,
            color: "var(--text-primary)",
            background: "var(--bg-secondary)",
            border: "1px solid var(--border-default)",
            borderRadius: 12,
            outline: "none",
            resize: "none",
            fontFamily: "inherit",
            maxHeight: 96,
          }}
        />
        <button
          type="submit"
          title="Send"
          disabled={!text.trim()}
          style={{
            padding: 10,
            border: "none",
            borderRadius: 999,
            background: text.trim()
              ? "var(--bg-nav-active)"
              : "var(--bg-secondary)",
            color: text.trim() ? "var(--bg-surface)" : "var(--text-muted)",
            cursor: text.trim() ? "pointer" : "default",
            display: "flex",
            flexShrink: 0,
          }}
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
