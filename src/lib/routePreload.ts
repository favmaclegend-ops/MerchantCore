const preloadMap: Record<string, () => Promise<unknown>> = {
  "/home/dashboard": () => import("@/pages/dashboard/DashboardPage"),
  "/home/inventory": () => import("@/pages/inventory/InventoryPage"),
  "/home/pos": () => import("@/pages/pos/POSPage"),
  "/home/credit": () => import("@/pages/credit/CreditLedgerPage"),
  "/home/customers": () => import("@/pages/customers/CustomersPage"),
  "/home/settings": () => import("@/pages/settings/SettingsPage"),
  "/home/calculator": () => import("@/pages/calculator/CalculatorPage"),
  "/home/finance": () => import("@/pages/finance/FinancePage"),
  "/home/hrm": () => import("@/pages/hrm/HRMPage"),
  "/home/supply": () => import("@/pages/supply/SupplyChainPage"),
  "/home/attendance": () => import("@/pages/attendance/AttendancePage"),
  "/home/notifications": () => import("@/pages/notifications/NotificationsPage"),
  "/home/spreadsheet": () => import("@/pages/spreadsheet/external/ExternalSheet"),
  "/home/users": () => import("@/pages/users/UsersPage"),
  "/home/market": () => import("@/pages/market/MarketPage"),
  "/market": () => import("@/pages/market/MarketPage"),
};

const preloaded = new Set<string>();

export function preloadRoute(path: string): void {
  const base = path.replace(/\/+$/, "") || "/";
  if (preloaded.has(base)) return;
  const loader = preloadMap[base];
  if (loader) {
    preloaded.add(base);
    loader().catch(() => {});
  }
}
