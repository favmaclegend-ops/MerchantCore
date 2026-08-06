import { Link, useLocation } from "react-router-dom";
import { useBreakpoint } from "@/hooks/useBreakpoint";


export function ShopPageReabon() {
  const location = useLocation();
  const bp = useBreakpoint();
  const links = [
    { hash: "#", name: "Overview" },
    { hash: "#products", name: "Products" },
  ];

  return (
    <>
      <nav
        style={{
          display: "flex",
          width: "100%",
          gap: bp.sm ? ".5rem" : "1rem",
          overflowX: "auto",
          justifyContent: "space-around",
          alignItems: "center",
          padding: bp.sm ? "1rem" : "2rem",
          paddingBlockEnd: bp.sm ? ".25rem" : '.5rem',
          borderBottom: '1px solid var(--border-default)',
          flex: '0 0 auto',
          
        }}
      >
        {links.map((link) => {
          const isActive = link.hash === "#"
            ? location.hash === "" || location.hash === "#"
            : location.hash === link.hash;
          return (
            <Link
              key={link.hash}
              to={{ pathname: location.pathname, hash: link.hash }}
              style={{
                color: isActive ? 'var(--bg-surface)' : "var(--text-primary)",
                padding: bp.sm ? ".5rem .75rem" : "1rem",
                borderRadius: "1rem",
                fontWeight: "bold",
                whiteSpace: "nowrap",
                background: isActive ? 'var(--bg-nav-active)' : 'transparent'
                
              }}
            >
              {link.name}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
