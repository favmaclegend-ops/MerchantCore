import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useBreakpoint } from "@/hooks/useBreakpoint";
import { marketStore } from "../demoMarketStore";
import { valueFormater } from "../market";
import { geocodeAddress, type GeoCoords } from "../geocode";
import { GracefulImage } from "@/components/GracefulImage";
import {
  BadgeCheck,
  CalendarDays,
  Clock,
  MapPin,
  Package,
  ShieldCheck,
  Store,
  UserRound,
} from "lucide-react";

const shopMarker = L.divIcon({
  className: "",
  html: `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="34" height="44"
      style="filter: drop-shadow(0 4px 6px rgba(0,0,0,.35))">
      <path fill="#4f46e5" d="M12 0C7.58 0 4 3.58 4 8c0 5.25 8 16 8 16s8-10.75 8-16c0-4.42-3.58-8-8-8z"/>
      <circle cx="12" cy="8" r="4" fill="#ffffff"/>
    </svg>`,
  iconSize: [34, 44],
  iconAnchor: [17, 44],
  popupAnchor: [0, -40],
});

const formatDate = (date?: string) => {
  if (!date) return "N/A";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return date;
  return d.toLocaleDateString(undefined, { month: "long", year: "numeric" });
};

export function OverView() {
  const params = useParams();
  const bp = useBreakpoint();
  const { shops, products } = marketStore.getSnapshot();
  const shop = shops[params.id!];

  const location = shop?.location;
  const hasCoords =
    !!location &&
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    (location.lat !== 0 || location.lng !== 0);

  const [resolvedCoords, setResolvedCoords] = useState<GeoCoords | null>(null);
  const [geoFailed, setGeoFailed] = useState(false);

  useEffect(() => {
    if (hasCoords || !location) return;
    let cancelled = false;
    const query = [location.address, location.city].filter(Boolean).join(", ");
    geocodeAddress(query).then((coords) => {
      if (cancelled) return;
      if (coords) setResolvedCoords(coords);
      else setGeoFailed(true);
    });
    return () => {
      cancelled = true;
    };
  }, [location, hasCoords]);

  if (!shop) return null;

  const mapCoords =
    hasCoords && location ? { lat: location.lat, lng: location.lng } : resolvedCoords;

  const productCount = products.filter((p) => p.shop_name === shop.shop_name).length;
  const stats = [
    { label: "Rating", value: valueFormater(shop.rating ?? "0"), icon: BadgeCheck },
    { label: "Products", value: `${productCount}`, icon: Package },
    { label: "Member since", value: formatDate(shop.createdAt), icon: CalendarDays },
    { label: "Verified", value: "Business", icon: ShieldCheck },
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem", width: "100%" }}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: `repeat(${bp.md ? 4 : 2}, 1fr)`,
          gap: "1rem",
        }}
      >
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              style={{
                display: "flex",
                alignItems: "center",
                gap: ".75rem",
                padding: "1rem",
                background: "var(--bg-surface)",
                border: "1px solid var(--border-default)",
                borderRadius: "1rem",
                boxShadow: "var(--shadow-card)",
                minWidth: "0",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  width: "2.5rem",
                  height: "2.5rem",
                  flexShrink: 0,
                  borderRadius: ".75rem",
                  background: "var(--bg-secondary)",
                  color: "var(--text-info)",
                }}
              >
                <Icon size={20} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", minWidth: "0" }}>
                <span
                  style={{
                    fontSize: ".75rem",
                    fontWeight: 500,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: ".04em",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {stat.label}
                </span>
                <strong
                  style={{
                    fontSize: "1.05rem",
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    overflow: "hidden",
                  }}
                >
                  {stat.value}
                </strong>
              </div>
            </div>
          );
        })}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: bp.md ? "minmax(0, 1fr) minmax(0, 380px)" : "1fr",
          gap: "1rem",
          alignItems: "start",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            minWidth: "0",
          }}
        >
          <section
            style={{
              background: "var(--bg-surface)",
              border: "1px solid var(--border-default)",
              borderRadius: "1rem",
              overflow: "hidden",
              boxShadow: "var(--shadow-card)",
            }}
          >
            <div
              style={{
                height: "6rem",
                backgroundImage: `url('${shop.shopProfileImage}')`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                position: "relative",
              }}
            >
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "linear-gradient(to bottom, rgba(2,6,23,.1), var(--bg-surface))",
                }}
              />
            </div>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "1rem",
                padding: "1rem 1.25rem 1.25rem",
                marginTop: "-2.5rem",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: ".75rem",
                }}
              >
                <div
                  style={{
                    width: "4rem",
                    height: "4rem",
                    borderRadius: "1rem",
                    overflow: "hidden",
                    background: "var(--bg-tertiary)",
                    border: "3px solid var(--bg-surface)",
                    boxShadow: "var(--shadow-card)",
                    flexShrink: 0,
                    zIndex: '1' 
                  }}
                >
                  <GracefulImage
                    src={shop.shopProfileImage}
                    alt={shop.shop_name}
                  />
                </div>
                <div style={{ minWidth: "0", zIndex: '1' }}>
                  <h2
                    style={{
                      fontSize: "1.25rem",
                      fontWeight: "bolder",
                      color: "var(--text-primary)",
                      whiteSpace: "nowrap",
                      textOverflow: "ellipsis",
                      overflow: "hidden",
                    }}
                  >
                    About {shop.shop_name}
                  </h2>
                  <span
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: ".3rem",
                      fontSize: ".85rem",
                      color: "var(--text-success)",
                    }}
                  >
                    <Store size={14} /> Active shop
                  </span>
                </div>
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
                  gridTemplateColumns: bp.sm ? "1fr" : "1fr 1fr",
                  gap: ".75rem",
                  paddingTop: ".5rem",
                  borderTop: "1px solid var(--border-default)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".6rem",
                    padding: ".75rem",
                    borderRadius: ".75rem",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <UserRound size={18} color="var(--text-muted)" />
                  <div style={{ minWidth: "0" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: ".7rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Owner
                    </span>
                    <strong
                      style={{
                        fontSize: ".9rem",
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
                    alignItems: "center",
                    gap: ".6rem",
                    padding: ".75rem",
                    borderRadius: ".75rem",
                    background: "var(--bg-secondary)",
                  }}
                >
                  <CalendarDays size={18} color="var(--text-muted)" />
                  <div style={{ minWidth: "0" }}>
                    <span
                      style={{
                        display: "block",
                        fontSize: ".7rem",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                      }}
                    >
                      Opened
                    </span>
                    <strong
                      style={{
                        fontSize: ".9rem",
                        color: "var(--text-primary)",
                        whiteSpace: "nowrap",
                        textOverflow: "ellipsis",
                        overflow: "hidden",
                        display: "block",
                      }}
                    >
                      {formatDate(shop.createdAt)}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <section
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "1rem",
            overflow: "hidden",
            boxShadow: "var(--shadow-card)",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: ".6rem",
              padding: "1rem 1.25rem",
              borderBottom: "1px solid var(--border-default)",
            }}
          >
            <MapPin size={18} color="var(--text-info)" />
            <h3 style={{ fontSize: "1rem", fontWeight: "bold", color: "var(--text-primary)" }}>
              Shop location
            </h3>
          </div>

          {location ? (
            <>
              <div style={{ height: "14rem", position: "relative", zIndex: 0 }}>
                {mapCoords ? (
                  <MapContainer
                    center={[mapCoords.lat, mapCoords.lng]}
                    zoom={15}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <Marker position={[mapCoords.lat, mapCoords.lng]} icon={shopMarker}>
                      <Popup>
                        <strong>{shop.shop_name}</strong>
                        <br />
                        {location.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                ) : (
                  <div
                    style={{
                      height: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: ".4rem",
                      background: "var(--bg-secondary)",
                      color: "var(--text-muted)",
                      fontSize: ".85rem",
                    }}
                  >
                    {geoFailed
                      ? "No map pin for this address yet."
                      : "Resolving location…"}
                  </div>
                )}
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: ".25rem",
                  padding: "1rem 1.25rem",
                }}
              >
                <strong
                  style={{ fontSize: ".95rem", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: ".4rem" }}
                >
                  <MapPin size={15} color="var(--text-info)" /> {location.address}
                </strong>
                <span
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: ".4rem",
                    fontSize: ".85rem",
                    color: "var(--text-muted)",
                  }}
                >
                  <Clock size={14} /> {location.city}
                </span>
              </div>
            </>
          ) : (
            <p style={{ padding: "2rem", color: "var(--text-muted)", fontSize: ".9rem" }}>
              No location provided for this shop yet.
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
