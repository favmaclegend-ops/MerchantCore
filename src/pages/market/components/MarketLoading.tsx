export function MarketLoading() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: ".5rem",
        width: "100%",
        height: "100%",
        minHeight: "10rem",
        padding: "2rem",
        color: "var(--text-muted)",
      }}
    >
      <span
        style={{
          width: "1.2rem",
          height: "1.2rem",
          borderRadius: "50%",
          border: "3px solid var(--border-default)",
          borderTopColor: "var(--text-info)",
          animation: "spin 1s linear infinite",
        }}
      />
      <span>Loading market data...</span>
    </div>
  );
}
