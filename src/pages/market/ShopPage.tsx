import { useRef, useState, useEffect, type ChangeEvent } from "react";
import { ArrowLeft, BadgeCheck, Camera, Check, MessageCircle, Share2, Star, Upload, X } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom"
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { useStore } from "elk-components";
import { marketStore } from "./demoMarketStore";
import type { MarketStoreShop } from "./demoMarketStore";
import { useMarketData } from "./useMarketData";
import { valueFormater } from "./market";
import { isShopVerified, getShopPopularity } from "./verification";
import { updateShopProfileBackground, updateShopProfileImage } from "./marketUpload";
import { syncUserMarketData } from "./marketApi";
import { useShopOwner } from "./useShopOwner";
import { ShopPageReabon } from "./components/ShopPageReabon";
import { OverView } from "./components/OverView";
import { Products } from "./components/Products";
import { MarketLoading } from "./components/MarketLoading";
import { startThread, notifyChatChanged, useChatStore } from "./chat/chatStore";


export function ShopPage () {
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
    const [chatError, setChatError] = useState("");
    const shareRef = useRef<HTMLDivElement>(null);

    const shopUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/market/${params.id ?? ''}`
        : '';

    useEffect(() => {
        if (!shareOpen) return;
        const handler = (e: MouseEvent) => {
            if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
                setShareOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [shareOpen]);
    const shop = shops[params.id ?? ""]
    if (loading) {
        return (
            <div style={{display: 'flex', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center'}}>
                <MarketLoading />
            </div>
        )
    }
    if (!shop) {
        return (
            <div>
                Shop not Found
            </div>
        )
    }

    const verified = isShopVerified(shop, products);
    const canEdit = isOwner(shop);
    const bgSrc = shop.shopProfileImagebg?.trim() || shop.shopProfileImage || "";


    return (
        <>
            <div style={{display: 'flex', width: '100%', height: '100%', padding: bp.sm ? '.25rem' : '.5rem', flexDirection: 'column', maxWidth: '900px', gap: '1rem', overflowY: 'auto', overflowX: 'hidden'}}>
                <div style={{display: 'flex', flexDirection: 'column', width: '100%', position: 'relative'}}>
            
                    <div style={{position: 'absolute', top: bp.sm ? '.5rem' : '1rem', left: bp.sm ? '.5rem' : '1rem', zIndex: '20'}}>
                        <button
                            className="click"
                            onClick={() => navigate(location.pathname.startsWith('/market') ? '/market' : '/home/market')}
                            style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: bp.sm ? '.5rem' : '.65rem',
                                borderRadius: '50%',
                                cursor: 'pointer',
                                background: 'rgba(2,6,23,.55)',
                                border: 'none',
                                backdropFilter: 'blur(4px)',
                                boxShadow: '0 4px 12px rgba(0,0,0,.25)',
                            }}
                        >
                            <ArrowLeft size={bp.sm ? 18 : 22} color="var(--bg-surface)"/>
                        </button>
                    </div>

                    <div style={{width: '100%', maxWidth: '1500px', borderRadius: '1rem 1rem 0rem 0rem', height: bp.sm ? '8rem' : '12rem', background: '#050505', position: 'absolute', overflow: 'hidden', cursor: 'pointer'}} onClick={() => setViewing(bgSrc)}>
                        <img src={bgSrc} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}}/>
                        <div style={{position: 'absolute', inset: '0', background: 'linear-gradient(to bottom, rgba(2,6,23,.06) 0%, rgba(2,6,23,.18) 30%, var(--bg-surface) 78%)', pointerEvents: 'none'}}/>
                        {canEdit && (
                            <button
                                className="click"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setEditing('background');
                                }}
                                aria-label="Edit shop background image"
                                title="Edit background image"
                                style={{
                                    position: 'absolute',
                                    top: bp.sm ? '.5rem' : '1rem',
                                    right: bp.sm ? '.5rem' : '1rem',
                                    zIndex: 20,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: bp.sm ? '1.9rem' : '2.25rem',
                                    height: bp.sm ? '1.9rem' : '2.25rem',
                                    borderRadius: '50%',
                                    cursor: 'pointer',
                                    background: 'rgba(2,6,23,.65)',
                                    border: bp.sm ? '2px solid var(--bg-surface)' : '3px solid var(--bg-surface)',
                                    backdropFilter: 'blur(4px)',
                                    boxShadow: '0 4px 12px rgba(0,0,0,.25)',
                                }}
                            >
                                <Camera size={bp.sm ? 16 : 18} color="var(--bg-surface)"/>
                            </button>
                        )}
                    </div>

            
                    <div style={{display: 'flex', alignItems: 'center', gap: bp.sm ? '.75rem' : '1rem', zIndex: '11', minHeight: bp.sm ? '9rem' : '13rem', marginTop: bp.sm ? '2rem' : '3rem', padding: bp.sm ? '0 .25rem' : '0 1.25rem', paddingBlockEnd: bp.sm ? '.5rem' : '1rem', minWidth: '0', width: '100%'}}>

                        <div style={{ position: 'relative', width: bp.sm ? '4.5rem' : '100%', maxWidth: '8rem', minWidth: bp.sm ? '3.25rem' : '4rem', aspectRatio: '1/1', flex: '0 1 auto'}}>
                            <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'blue', overflow: 'hidden', boxShadow: '0 8px 24px rgba(0, 0, 0, 0.33)', cursor: 'pointer'}}>
                                <img src={shop.shopProfileImage} style={{objectFit: 'cover', objectPosition: 'center', width: '100%', height: '100%'}} onClick={() => setViewing(shop.shopProfileImage ?? "")}/>
                            </div>
                            {canEdit && (
                                <button
                                    className="click"
                                    onClick={() => setEditing('profile')}
                                    aria-label="Edit shop profile image"
                                    title="Edit shop image"
                                    style={{
                                        position: 'absolute',
                                        bottom: 0,
                                        right: 0,
                                        zIndex: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        width: bp.sm ? '1.6rem' : '2rem',
                                        height: bp.sm ? '1.6rem' : '2rem',
                                        borderRadius: '50%',
                                        cursor: 'pointer',
                                        background: 'rgba(2,6,23,.65)',
                                        border: bp.sm ? '2px solid var(--bg-surface)' : '3px solid var(--bg-surface)',
                                        backdropFilter: 'blur(4px)',
                                    }}
                                >
                                    <Camera size={bp.sm ? 14 : 16} color="var(--bg-surface)"/>
                                </button>
                            )}
                        </div>
                    
                        <div style={{display: 'flex', flexDirection: 'column', minWidth: '0', overflow: 'hidden'}}>
                            <h1 style={{display: 'flex', alignItems: 'center', gap: '.4rem', fontWeight: 'bolder', fontSize: bp.sm ? '1.1rem' : '1.5rem', lineHeight: 1.2, textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', width: '100%'}}>
                                {shop.shop_name}
                                {verified && <BadgeCheck size={bp.sm ? 18 : 22} color="var(--text-info)" aria-label="Verified business" style={{flexShrink: 0}}/>}
                            </h1>
                            <div style={{display: 'flex', alignItems: 'center', gap: '.3rem', marginTop: '.25rem'}}>
                                <Star color="gold" size={bp.sm ? 14 : 16}/>
                                <strong style={{margin: 0, fontSize: bp.sm ? '.85rem' : '.95rem', color: 'var(--text-muted)', textWrap: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden'}}>{valueFormater(String(getShopPopularity(shop, products)))}</strong>
                            </div>
                        </div>

                    
                        <div style={{display: 'flex', alignItems: 'center', gap: '.4rem', marginInlineStart: 'auto', flexShrink: '0'}}>
                            <div ref={shareRef} style={{ position: 'relative' }}>
                                <button
                                    className="click"
                                    onClick={() => { setShareOpen(!shareOpen); setCopied(false); }}
                                    style={{
                                        display: 'flex', padding: bp.sm ? '.6rem' : '.7rem',
                                        alignItems: 'center', cursor: 'pointer', borderRadius: '50%',
                                        background: 'var(--bg-secondary)', border: '1px solid var(--border-default)',
                                    }}
                                >
                                    <Share2 size={bp.sm ? 18 : 20} color="var(--text-primary)"/>
                                </button>
                                {shareOpen && (
                                    <div style={{
                                        position: 'absolute', top: '110%', right: 0, zIndex: 50,
                                        background: 'var(--bg-surface)', border: '1px solid var(--border-default)',
                                        borderRadius: '0.75rem', boxShadow: '0 8px 24px rgba(0,0,0,.2)',
                                        minWidth: '180px', overflow: 'hidden',
                                    }}>
                                        <button
                                            className="click"
                                            onClick={() => {
                                                window.open(`https://wa.me/?text=${encodeURIComponent(`Check out ${shop.shop_name} on Merchant Core:\n${shopUrl}`)}`, '_blank');
                                                setShareOpen(false);
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%',
                                                padding: '.7rem 1rem', border: 'none', background: 'transparent',
                                                cursor: 'pointer', fontSize: '.85rem', color: 'var(--text-primary)',
                                                textAlign: 'left',
                                            }}
                                        >
                                            <span style={{ fontSize: '1.1rem' }}>💬</span> Share on WhatsApp
                                        </button>
                                        <div style={{ height: '1px', background: 'var(--border-default)', margin: '0 .5rem' }}/>
                                        <button
                                            className="click"
                                            onClick={() => {
                                                navigator.clipboard.writeText(shopUrl).then(() => {
                                                    setCopied(true);
                                                    setTimeout(() => setCopied(false), 2000);
                                                });
                                            }}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '.6rem', width: '100%',
                                                padding: '.7rem 1rem', border: 'none', background: 'transparent',
                                                cursor: 'pointer', fontSize: '.85rem', color: 'var(--text-primary)',
                                                textAlign: 'left',
                                            }}
                                        >
                                            {copied ? <Check size={16} color="var(--text-success, #22c55e)"/> : <Share2 size={16}/>}
                                            {copied ? 'Copied!' : 'Copy shop link'}
                                        </button>
                                    </div>
                                )}
                            </div>
                            <button className="click" onClick={async () => {
                                if (chatLoadingRef.current) return;
                                setChatError("");
                                chatLoadingRef.current = true;
                                try {
                                    const thread = await startThread({
                                        shopId: shop.shop_id,
                                        shopName: shop.shop_name || 'Shop',
                                        shopImage: shop.shopProfileImage,
                                        ownerKey: shop.ownerKey || '',
                                    });
                                    notifyChatChanged();
                                    const basePath = location.pathname.startsWith('/market') ? '/market' : '/home/market';
                                    navigate(`${basePath}/chat/${thread.threadId}`);
                                } catch (e) {
                                    console.error("Failed to start chat:", e);
                                    setChatError(e instanceof Error ? e.message : 'Could not start chat. Please sign in as a customer to message this shop.');
                                } finally {
                                    chatLoadingRef.current = false;
                                }
                            }} style={{display: 'flex', padding: bp.sm ? '.6rem .8rem' : '1rem', alignItems: 'center', cursor: 'pointer', gap: '.5rem', borderRadius: '1rem', background: 'var(--bg-nav-active)', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,.2)'}}>
                                <MessageCircle size={bp.sm ? 18 : 24} color="var(--bg-surface)"/>
                                {!bp.sm && <span style={{color: 'var(--bg-surface)'}}>Message</span>}
                            </button>
                            {chatError && (
                                <p style={{ margin: '8px 0 0 0', fontSize: '.78rem', color: 'var(--text-danger)', maxWidth: 260, lineHeight: 1.4 }}>
                                    {chatError}
                                </p>
                            )}
                        </div>
                    
                    </div>
                </div>
                <ShopPageReabon />

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
                <ImageViewer
                    src={viewing}
                    onClose={() => setViewing(null)}
                />
            )}
    </>
    )
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
    const current = target === "background" ? shop.shopProfileImagebg : shop.shopProfileImage;
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
                            {target === "background" ? "Edit background image" : "Edit profile image"}
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
                                alt={target === "background" ? "Shop background preview" : "Shop profile preview"}
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

function ImageViewer({
    src,
    onClose,
}: {
    src: string;
    onClose: () => void;
}) {
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