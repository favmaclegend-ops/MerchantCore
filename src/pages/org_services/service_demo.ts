import { createStore } from "elk-components";
import {
  api,
  type OrgServiceResponse,
  type ServiceOrderResponse,
} from "@/lib/api";
import { refreshOrgDashboardCache } from "@/lib/dashboardCache";

// ── Service Catalog ────────────────────────────────────────────────

export type ServiceStatus = "active" | "inactive" | "completed" | "cancelled";

export interface OrgService {
  name: string;
  organization_id: string;
  description: string;
  category: string;
  pricing_type: "flat" | "hourly" | "variable";
  price: number;
  service_id: string;
  service_img: string;
  isActive: boolean;
  status: ServiceStatus;
  is_pinned: boolean;
  rate: number;
  completed_at: string | null;
  isCompleted: boolean;
  created_at: string;
}

function mapService(res: OrgServiceResponse): OrgService {
  let status: ServiceStatus;
  if (res.isCompleted) {
    status = "completed";
  } else {
    const s = res.status?.toLowerCase() ?? "";
    if (s === "active") status = "active";
    else if (s === "cancelled") status = "cancelled";
    else status = "inactive";
  }

  return {
    name: res.name,
    organization_id: res.organization_id,
    description: res.description ?? "",
    category: res.category,
    pricing_type: res.pricing_type,
    price: res.price,
    service_id: res.service_id,
    service_img: res.service_img ?? "",
    isActive: status === "active",
    status,
    is_pinned: Boolean(res.is_pinned),
    rate: res.rate ?? 0,
    completed_at: res.completed_at,
    isCompleted: res.isCompleted,
    created_at: res.created_at,
  };
}

export const serviceStore = createStore<{
  services: OrgService[];
  loading: boolean;
  error: string | null;
}>({
  services: [],
  loading: false,
  error: null,
});

export async function fetchOrgServices() {
  serviceStore.setState({ loading: true, error: null });
  try {
    const data = await api.service.orgGetServices();
    const services = Array.isArray(data) ? data.map(mapService) : [];
    serviceStore.setState({ services, loading: false });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load services";
    serviceStore.setState({ loading: false, error: msg });
  }
}

export async function createOrgService(
  input: Omit<import("@/lib/api").ServiceSchema, "rate"> & { rate?: number },
) {
  const payload = {
    name: input.name,
    category: input.category ?? null,
    pricing_type: input.pricing_type,
    price: input.price,
    description: input.description,
    service_img: input.service_img,
    status: input.status,
    rate: input.rate ?? 0,
  };
  const res = await api.service.orgCreateService(payload);
  await fetchOrgServices();
  return res;
}

export async function deleteOrgService(serviceId: string) {
  const res = await api.service.orgDeleteService(serviceId);
  await fetchOrgServices();
  return res;
}

export async function toggleServicePin(serviceId: string, isPinned: boolean) {
  const res = await api.service.orgToggleServicePin(serviceId, isPinned);
  await fetchOrgServices();
  return res;
}

// ── Service Orders (Log) ───────────────────────────────────────────

export type OrderStatus = "active" | "completed" | "cancelled";

export interface ServiceOrder {
  order_id: string;
  service_id: string;
  service_name: string;
  customer_id: string;
  customer_name: string;
  price: number;
  pricing_type: string;
  category: string;
  status: OrderStatus;
  completed_at: string | null;
  created_at: string;
}

function mapOrder(res: ServiceOrderResponse): ServiceOrder {
  return {
    order_id: res.order_id,
    service_id: res.service_id,
    service_name: res.service_name,
    customer_id: res.customer_id ?? "",
    customer_name: res.customer_name,
    price: res.price,
    pricing_type: res.pricing_type,
    category: res.category ?? "",
    status: res.status as OrderStatus,
    completed_at: res.completed_at,
    created_at: res.created_at,
  };
}

export const serviceOrderStore = createStore<{
  orders: ServiceOrder[];
  loading: boolean;
  error: string | null;
}>({
  orders: [],
  loading: false,
  error: null,
});

export async function fetchServiceOrders() {
  serviceOrderStore.setState({ loading: true, error: null });
  try {
    const data = await api.service.orgGetServiceOrders();
    const orders = Array.isArray(data) ? data.map(mapOrder) : [];
    serviceOrderStore.setState({ orders, loading: false });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Failed to load orders";
    serviceOrderStore.setState({ loading: false, error: msg });
  }
}

export async function renderOrgService(
  service: OrgService,
  customerName: string,
  customerId?: string,
) {
  const res = await api.service.orgCreateServiceOrder({
    service_id: service.service_id,
    service_name: service.name,
    customer_id: customerId ?? null,
    customer_name: customerName,
    price: service.price,
    pricing_type: service.pricing_type,
    category: service.category,
  });
  await fetchServiceOrders();
  return res;
}

export async function completeServiceOrder(orderId: string) {
  const res = await api.service.orgUpdateServiceOrder(orderId, {
    status: "completed",
    completed_at: new Date().toISOString(),
  });
  await fetchServiceOrders();
  await refreshOrgDashboardCache();
  return res;
}

export async function cancelServiceOrder(orderId: string) {
  const res = await api.service.orgUpdateServiceOrder(orderId, {
    status: "cancelled",
  });
  await fetchServiceOrders();
  return res;
}

export async function deleteServiceOrder(orderId: string) {
  const res = await api.service.orgDeleteServiceOrder(orderId);
  await fetchServiceOrders();
  return res;
}

// ── Init ───────────────────────────────────────────────────────────

fetchOrgServices();
fetchServiceOrders();

// ── Helpers ────────────────────────────────────────────────────────

export function extractFirstLetter(
  word: string,
  multiple?: boolean,
  multipleLength?: number,
) {
  if (multiple) {
    const combine = word
      .split(" ", multipleLength)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase();
    return combine;
  }
  return word[0].toUpperCase();
}

export function formatRelativeTime(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}
