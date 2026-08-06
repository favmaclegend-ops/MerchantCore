import { Link, useLocation } from "react-router-dom";


export function ShopPageReabon() {
  const location = useLocation();
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
          gap: "1rem",
          overflowX: "auto",
          justifyContent: "space-around",
          alignItems: "center",
          padding: "2rem",
          paddingBlockEnd: '.5rem',
          borderBottom: '1px solid var(--border-default)'
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
                color: isActive  ? 'var(--bg-surface)' : "var(--text-primary)",
                padding: "1rem",
                borderRadius: ".5rem",
                fontWeight: "bold",
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
