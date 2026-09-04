import { store } from "@/context/store";
import {
  getOrgSession,
  type OrgMember,
  type OrgRegisterInput,
  type OrgSession,
} from "@/data/organisations";
import type {
  CheckoutInput,
  FinanceState,
  Invoice,
  InvoiceInput,
  InvoiceStatus,
  OrgAttendanceRecord,
  OrgAttendanceSummary,
  OrgBenefit,
  OrgBenefitInput,
  OrgCreditEntry,
  OrgCreditInput,
  OrgCustomer,
  OrgCustomerInput,
  OrgEmployee,
  OrgEmployeeInput,
  OrgHrmState,
  OrgNotificationSettings,
  OrgNotificationsState,
  OrgNotification,
  OrgPayrollRun,
  OrgPayrollStatus,
  OrgPerformanceReview,
  OrgPoStatus,
  OrgPosTransaction,
  OrgProduct,
  OrgProductInput,
  OrgPurchaseOrder,
  OrgPurchaseOrderInput,
  OrgReviewInput,
  OrgShipment,
  OrgShipmentInput,
  OrgShipmentStatus,
  OrgSupplier,
  OrgSupplierInput,
  OrgSupplyState,
  OrgTimeEntry,
  OrgTimeInput,
  LedgerEntry,
  QrScanRequest,
  TaxItem,
} from "@/lib/orgTypes";

const API_BASE =
  import.meta.env.VITE_API_BASE || "http://localhost:8000/api/v1";
console.log(API_BASE); // debugging

function getHeaders(): Record<string, string> {
  const token = localStorage.getItem("token") || getOrgSession()?.token;
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Token-free request used by organisation register / verify / login, which are public.
async function anonRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// Organisation requests authenticate with the member JWT stored in the org session —
// never with the personal account's localStorage token.
function requireOrgSession(): OrgSession {
  const session = getOrgSession();
  if (!session?.token) {
    store.setState({
      error: "Sorry Cannot Create Shop. No active Organization session",
      busy: false,
    });
    throw new Error("No active organization session");
  }
  return session;
}

function orgId(): string {
  return requireOrgSession().orgId;
}

async function orgRequest<T>(path: string, options?: RequestInit): Promise<T> {
  const session = requireOrgSession();

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.token}`,
      ...(options?.headers as Record<string, string>),
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail || "Request failed");
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ---- Organisation shape mappers (backend camelCase <-> frontend contracts) -----

function memberFromApi(m: Record<string, unknown>): OrgMember {
  return {
    id: String(m.id ?? ""),
    name: String(m.name ?? ""),
    email: String(m.email ?? ""),
    username: String(m.username ?? ""),
    password: "",
    phone: String(m.phone ?? ""),
    role: (m.role as OrgMember["role"]) ?? "staff",
    jobTitle: String(m.jobTitle ?? ""),
    userId: m.userId ? String(m.userId) : undefined,
    isActive: m.isActive !== false,
    dataBlocked: m.dataBlocked === true,
    disabled: m.disabled === true,
  };
}

function invoiceFromApi(inv: Record<string, unknown>): Invoice {
  return {
    id: String(inv.id ?? ""),
    number: String(inv.number ?? ""),
    customer: String(inv.customer ?? ""),
    customerId: inv.customerId ? String(inv.customerId) : undefined,
    customerEmail: inv.customerEmail ? String(inv.customerEmail) : undefined,
    issuedAt: String(inv.issuedAt ?? ""),
    dueAt: String(inv.dueAt ?? ""),
    amount: Number(inv.amount ?? 0),
    status: (inv.status as Invoice["status"]) ?? "draft",
    items: Array.isArray(inv.items) ? (inv.items as Invoice["items"]) : [],
  };
}

function taxFromApi(t: Record<string, unknown>): TaxItem {
  return {
    id: String(t.id ?? ""),
    name: String(t.name ?? ""),
    rate: Number(t.rate ?? 0),
    basis: Number(t.basis ?? 0),
    period: String(t.period ?? ""),
    dueAt: String(t.dueAt ?? ""),
    paid: Number(t.paid ?? 0),
    status: (t.status as TaxItem["status"]) ?? "upcoming",
  };
}

function customerFromApi(c: Record<string, unknown>): OrgCustomer {
  return {
    id: String(c.id ?? ""),
    name: String(c.name ?? ""),
    email: String(c.email ?? ""),
    phone: String(c.phone ?? ""),
    company: String(c.company ?? ""),
    total_spent: Number(c.totalSpent ?? 0),
    credit_limit: Number(c.creditLimit ?? 0),
    tier: (c.tier as OrgCustomer["tier"]) ?? "bronze",
    last_purchase: String(c.lastPurchase ?? ""),
    created_at: "",
  };
}

function creditFromApi(e: Record<string, unknown>): OrgCreditEntry {
  return {
    id: String(e.id ?? ""),
    customer_id: String(e.customerId ?? ""),
    customer_name: String(e.customerName ?? ""),
    customer_code: String(e.customerCode ?? ""),
    balance: Number(e.balance ?? 0),
    last_payment: String(e.lastPayment ?? ""),
    last_payment_amount: Number(e.lastPaymentAmount ?? 0),
    status: (e.status as OrgCreditEntry["status"]) ?? "active",
    overdue_days: Number(e.overdueDays ?? 0),
  };
}

function txFromApi(t: Record<string, unknown>): OrgPosTransaction {
  return {
    id: String(t.id ?? ""),
    type: String(t.type ?? "sale"),
    customer_name: t.customerName ? String(t.customerName) : undefined,
    amount: Number(t.amount ?? 0),
    status: String(t.status ?? "completed"),
    items: t.items ? String(t.items) : "",
    created_at: t.createdAt ? String(t.createdAt) : "",
  };
}

function benefitFromApi(b: Record<string, unknown>): OrgBenefit {
  return {
    id: String(b.id ?? ""),
    name: String(b.name ?? ""),
    type: (b.type as OrgBenefit["type"]) ?? "other",
    cost: Number(b.cost ?? 0),
    description: String(b.description ?? ""),
    enrollment: 0,
  };
}

function payrollFromApi(r: Record<string, unknown>): OrgPayrollRun {
  return {
    id: String(r.id ?? ""),
    period: String(r.period ?? ""),
    employee_id: String(r.employeeId ?? ""),
    employee_name: String(r.employeeName ?? ""),
    gross: Number(r.gross ?? 0),
    tax: Number(r.tax ?? 0),
    net: Number(r.net ?? 0),
    status: (r.status as OrgPayrollStatus) ?? "pending",
    processed_at: String(r.processedAt ?? ""),
  };
}

function timeFromApi(t: Record<string, unknown>): OrgTimeEntry {
  return {
    id: String(t.id ?? ""),
    employee_id: String(t.employeeId ?? ""),
    employee_name: String(t.employeeName ?? ""),
    date: String(t.date ?? ""),
    hours: Number(t.hours ?? 0),
    overtime_hours: Number(t.overtimeHours ?? 0),
  };
}

function attendanceFromApi(a: Record<string, unknown>): OrgAttendanceRecord {
  return {
    id: String(a.id ?? ""),
    employee_id: String(a.employeeId ?? ""),
    employee_name: String(a.employeeName ?? ""),
    date: String(a.date ?? ""),
    check_in: String(a.checkIn ?? ""),
    check_out: String(a.checkOut ?? ""),
    check_in_method:
      (a.checkInMethod as OrgAttendanceRecord["check_in_method"]) ?? "manual",
    check_out_method:
      (a.checkOutMethod as OrgAttendanceRecord["check_out_method"]) ?? "manual",
    status: (a.status as OrgAttendanceRecord["status"]) ?? "absent",
  };
}

function reviewFromApi(r: Record<string, unknown>): OrgPerformanceReview {
  return {
    id: String(r.id ?? ""),
    employee_id: String(r.employeeId ?? ""),
    employee_name: String(r.employeeName ?? ""),
    period: String(r.period ?? ""),
    score: Number(r.score ?? 0),
    rating: (r.rating as OrgPerformanceReview["rating"]) ?? "meets",
    notes: String(r.notes ?? ""),
    status: (r.status as OrgPerformanceReview["status"]) ?? "pending",
    reviewed_at: String(r.reviewedAt ?? ""),
  };
}

function supplierFromApi(s: Record<string, unknown>): OrgSupplier {
  return {
    id: String(s.id ?? ""),
    name: String(s.name ?? ""),
    contact_person: String(s.contactPerson ?? ""),
    email: String(s.email ?? ""),
    phone: String(s.phone ?? ""),
    address: String(s.address ?? ""),
    categories: Array.isArray(s.categories) ? (s.categories as string[]) : [],
    payment_terms: String(s.paymentTerms ?? ""),
    status: (s.status as OrgSupplier["status"]) ?? "active",
    created_at: "",
  };
}

function supplierToApi(s: Partial<OrgSupplierInput>): Record<string, unknown> {
  return {
    name: s.name,
    contactPerson: s.contact_person,
    email: s.email,
    phone: s.phone,
    address: s.address,
    categories: s.categories,
    paymentTerms: s.payment_terms,
    status: s.status,
  };
}

function poFromApi(o: Record<string, unknown>): OrgPurchaseOrder {
  return {
    id: String(o.id ?? ""),
    po_number: String(o.poNumber ?? ""),
    supplier_id: String(o.supplierId ?? ""),
    supplier_name: String(o.supplierName ?? ""),
    items: Array.isArray(o.items)
      ? (o.items as Array<Record<string, unknown>>).map((i) => ({
          product_id: String(i.productId ?? i.product_id ?? ""),
          product_name: String(i.productName ?? ""),
          qty: Number(i.quantity ?? i.qty ?? 0),
          unit_price: Number(i.unitPrice ?? i.unit_price ?? 0),
        }))
      : [],
    total: Number(o.total ?? 0),
    status: (o.status as OrgPoStatus) ?? "pending",
    ordered_at: String(o.orderedAt ?? ""),
    received_at: String(o.receivedAt ?? ""),
  };
}

function shipmentFromApi(s: Record<string, unknown>): OrgShipment {
  return {
    id: String(s.id ?? ""),
    tracking_number: String(s.trackingNumber ?? ""),
    po_id: String(s.poId ?? ""),
    po_number: String(s.poNumber ?? ""),
    supplier_name: String(s.supplierName ?? ""),
    market_order_id: String(s.marketOrderId ?? ""),
    customer_name: String(s.customerName ?? ""),
    carrier: String(s.carrier ?? ""),
    status: (s.status as OrgShipmentStatus) ?? "in-transit",
    eta: String(s.eta ?? ""),
    created_at: String(s.createdAt ?? ""),
    delivered_at: String(s.deliveredAt ?? ""),
  };
}

// Attendance summary is derived client-side: the backend serves the raw records,
// time entries and reviews, and the summary contract is assembled from them.
async function getAttendanceSummary(): Promise<OrgAttendanceSummary[]> {
  const base = `/organisations/${orgId()}`;
  const [attendance, employees, time, reviews] = await Promise.all([
    orgRequest<{ records: Array<Record<string, unknown>> }>(
      `${base}/attendance`,
    ),
    orgRequest<{ employees: Array<Record<string, unknown>> }>(
      `${base}/employees`,
    ),
    orgRequest<{ entries: Array<Record<string, unknown>> }>(
      `${base}/time-entries`,
    ),
    orgRequest<{ reviews: Array<Record<string, unknown>> }>(`${base}/reviews`),
  ]);
  const records = attendance.records.map(attendanceFromApi);
  const timeEntries = time.entries.map(timeFromApi);
  const reviewRows = reviews.reviews.map(reviewFromApi);
  return employees.employees.map((raw) => {
    const empRecords = records.filter((r) => r.employee_id === raw.id);
    const present = empRecords.filter((r) => r.status === "present").length;
    const empTime = timeEntries.filter((t) => t.employee_id === raw.id);
    const latestReview =
      reviewRows
        .filter((r) => r.employee_id === raw.id)
        .sort((a, b) => b.period.localeCompare(a.period))[0] ?? null;
    return {
      employee_id: String(raw.id ?? ""),
      employee_name: String(raw.name ?? ""),
      scheduled_days: empRecords.length,
      present_days: present,
      absent_days: Math.max(0, empRecords.length - present),
      attendance_rate: empRecords.length
        ? Math.round((present / empRecords.length) * 100)
        : 0,
      total_hours: empTime.reduce((sum, t) => sum + t.hours, 0),
      overtime_hours: empTime.reduce((sum, t) => sum + t.overtime_hours, 0),
      latest_review_score: latestReview?.score ?? null,
      latest_review_rating: latestReview?.rating ?? null,
    };
  });
}

export const api = {
  login: (email: string, password: string) =>
    request<{ access_token: string; token_type: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
  register: (data: {
    email: string;
    username: string;
    full_name: string;
    password: string;
  }) =>
    request<{ message: string }>("/auth/register", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  verifyEmail: (email: string, otp: string) =>
    request<{ message: string }>("/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    }),

  getProfile: () =>
    request<{
      id: string;
      email: string;
      username: string;
      full_name: string;
      is_active: boolean;
      is_verified: boolean;
    }>("/users/me"),

  getProducts: () => request<any[]>("/products"),
  getProduct: (id: string) => request<any>(`/products/${id}`),
  createProduct: (data: any) =>
    request<any>("/products", { method: "POST", body: JSON.stringify(data) }),
  updateProduct: (id: string, data: any) =>
    request<any>(`/products/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteProduct: (id: string) =>
    request<void>(`/products/${id}`, { method: "DELETE" }),

  getCustomers: () => request<any[]>("/customers"),
  getCustomer: (id: string) => request<any>(`/customers/${id}`),
  createCustomer: (data: any) =>
    request<any>("/customers", { method: "POST", body: JSON.stringify(data) }),
  updateCustomer: (id: string, data: any) =>
    request<any>(`/customers/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  deleteCustomer: (id: string) =>
    request<void>(`/customers/${id}`, { method: "DELETE" }),

  getTransactions: () => request<any[]>("/transactions"),

  getDashboardStats: () => request<any>("/dashboard/stats"),
  getRevenueTrend: () =>
    request<{ months: { month: string; revenue: number }[] }>(
      "/dashboard/revenue-trend",
    ),

  getCreditEntries: () => request<any[]>("/credit-entries"),
  createCreditEntry: (data: any) =>
    request<any>("/credit-entries", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateCreditEntry: (id: string, data: any) =>
    request<any>(`/credit-entries/${id}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),

  checkout: async (data: {
    items: any[];
    total: number;
    payment_method: string;
  }) => {
    const res = await request<any>("/pos/checkout", {
      method: "POST",
      body: JSON.stringify(data),
    });
    localStorage.removeItem("dashboard_cache");
    return res;
  },

  getNotifications: () => request<any[]>("/notifications"),
  getUnreadNotificationCount: () =>
    request<{ count: number }>("/notifications/unread-count"),
  markNotificationRead: (id: string) =>
    request<any>(`/notifications/${id}/read`, { method: "PATCH" }),
  markAllNotificationsRead: () =>
    request<any>("/notifications/read-all", { method: "PATCH" }),

  // Organisation (business workspace) — backed by the real org API. Every call
  // authenticates with the member JWT stored in the org session and is scoped to
  // that org server-side.
  org: {
    validateSession: async (): Promise<{ id: string; name: string }> => {
      return orgRequest<{ id: string; name: string }>("/organisations");
    },
    register: async (data: OrgRegisterInput) => {
      return anonRequest<{ message: string; org_id: string }>(
        "/auth/org/register",
        {
          method: "POST",
          body: JSON.stringify({
            name: data.orgName,
            business_email: data.businessEmail,
            superAdminEmail: data.superAdminEmail,
            username: data.superAdminUsername,
            full_name: data.superAdminName,
            password: data.password,
          }),
        },
      );
    },
    verifyEmail: (email: string, otp: string) =>
      anonRequest<{ message: string }>("/auth/org/verify-email", {
        method: "POST",
        body: JSON.stringify({ email, otp }),
      }),
    resendVerification: (email: string) =>
      anonRequest<{ message: string }>("/auth/org/resend-verification", {
        method: "POST",
        body: JSON.stringify({ email }),
      }),
    login: async (_orgName: string, email: string, password: string) => {
      const res = await anonRequest<{
        access_token: string;
        token_type: string;
        member_id: string;
        role: string;
        full_name: string;
        username: string;
        email: string;
        org_id: string;
        org_name: string;
      }>("/auth/org/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      return {
        org: { id: res.org_id, name: res.org_name },
        member: memberFromApi({
          id: res.member_id,
          name: res.full_name,
          username: res.username,
          email: res.email,
          role: res.role,
        }),
        token: res.access_token,
      };
    },

    getUsers: async () => {
      const res = await orgRequest<{ members: Array<Record<string, unknown>> }>(
        `/organisations/${orgId()}/members`,
      );
      return res.members.map(memberFromApi);
    },
    getAvailableUsers: async (search?: string) => {
      const q = search ? `?search=${encodeURIComponent(search)}` : "";
      const res = await orgRequest<{ users: Array<Record<string, unknown>> }>(
        `/organisations/${orgId()}/users/available${q}`,
      );
      return res.users.map((u) => ({
        id: u.id as string,
        name: (u.name ?? u.username ?? "") as string,
        email: u.email as string,
        username: u.username as string,
      }));
    },
    addUser: async (member: Omit<OrgMember, "id">) => {
      const res = await orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/members`,
        {
          method: "POST",
          body: JSON.stringify({
            email: member.email,
            role: member.role,
            jobTitle: member.jobTitle,
            password: member.password || undefined,
            userId: member.userId || undefined,
          }),
        },
      );
      return memberFromApi(res);
    },
    updateUser: async (memberId: string, patch: Partial<OrgMember>) => {
      const base = `/organisations/${orgId()}/members/${memberId}`;
      let last: Record<string, unknown> | null = null;
      if (patch.role) {
        last = await orgRequest<Record<string, unknown>>(`${base}/role`, {
          method: "PATCH",
          body: JSON.stringify({ role: patch.role }),
        });
      }
      if (
        patch.name !== undefined ||
        patch.email !== undefined ||
        patch.username !== undefined ||
        patch.phone !== undefined ||
        patch.jobTitle !== undefined ||
        patch.password !== undefined
      ) {
        last = await orgRequest<Record<string, unknown>>(base, {
          method: "PATCH",
          body: JSON.stringify({
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.email !== undefined ? { email: patch.email } : {}),
            ...(patch.username !== undefined
              ? { username: patch.username }
              : {}),
            ...(patch.phone !== undefined ? { phone: patch.phone } : {}),
            ...(patch.jobTitle !== undefined
              ? { jobTitle: patch.jobTitle }
              : {}),
            ...(patch.password ? { password: patch.password } : {}),
          }),
        });
      }
      if (
        patch.isActive !== undefined ||
        patch.dataBlocked !== undefined ||
        patch.disabled !== undefined
      ) {
        last = await orgRequest<Record<string, unknown>>(`${base}/status`, {
          method: "PATCH",
          body: JSON.stringify({
            ...(patch.isActive !== undefined
              ? { isActive: patch.isActive }
              : {}),
            ...(patch.dataBlocked !== undefined
              ? { dataBlocked: patch.dataBlocked }
              : {}),
            ...(patch.disabled !== undefined
              ? { disabled: patch.disabled }
              : {}),
          }),
        });
      }
      if (!last) throw new Error("Member not found");
      return memberFromApi(last);
    },
    deleteUser: async (memberId: string) => {
      await orgRequest<void>(`/organisations/${orgId()}/members/${memberId}`, {
        method: "DELETE",
      });
    },

    getDashboard: async () => {
      return orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/dashboard`,
      );
    },

    // Finance & Accounting.
    finance: {
      getState: async () => {
        const base = `/organisations/${orgId()}`;
        const [ledger, invoices, taxes, dashboard] = await Promise.all([
          orgRequest<{
            entries: LedgerEntry[];
            income?: number;
            expenses?: number;
            net?: number;
          }>(`${base}/ledger`),
          orgRequest<{
            invoices: Array<Record<string, unknown>>;
            paid?: number;
            outstanding?: number;
          }>(`${base}/invoices`),
          orgRequest<{ items: TaxItem[]; totalDue?: number }>(`${base}/tax`),
          orgRequest<{ stats: { totalRevenue?: number } }>(`${base}/dashboard`),
        ]);
        return {
          ledger: ledger.entries,
          invoices: invoices.invoices.map(invoiceFromApi),
          taxes: taxes.items,
          income: ledger.income,
          expenses: ledger.expenses,
          net: ledger.net,
          paid: invoices.paid,
          outstanding: invoices.outstanding,
          totalDue: taxes.totalDue,
          posRevenue: dashboard.stats.totalRevenue ?? 0,
        } as FinanceState;
      },
      createInvoice: async (input: InvoiceInput) => {
        const amount = input.items.reduce(
          (sum, item) => sum + item.qty * item.unitPrice,
          0,
        );
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/invoices`,
          {
            method: "POST",
            body: JSON.stringify({
              customer: input.customer,
              customerId: input.customerId,
              customerEmail: input.customerEmail,
              dueAt: input.dueAt,
              amount,
              status: "draft",
              items: input.items,
            }),
          },
        );
        return invoiceFromApi(res);
      },
      setInvoiceStatus: async (invoiceId: string, status: InvoiceStatus) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/invoices/${invoiceId}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
        return invoiceFromApi(res);
      },
      deleteInvoice: async (invoiceId: string) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/invoices/${invoiceId}`,
          {
            method: "DELETE",
          },
        );
        return res;
      },
      createTaxItem: async (input: {
        name: string;
        rate: number;
        basis: number;
        period?: string;
        dueAt?: string;
        paid?: number;
        status?: TaxItem["status"];
      }) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/tax`,
          {
            method: "POST",
            body: JSON.stringify({
              name: input.name,
              rate: input.rate,
              basis: input.basis,
              period: input.period ?? "",
              dueAt: input.dueAt ?? "",
              paid: input.paid ?? 0,
              status: input.status ?? "upcoming",
            }),
          },
        );
        return taxFromApi(res);
      },
      updateTaxItem: async (
        taxId: string,
        patch: Partial<{
          name: string;
          rate: number;
          basis: number;
          period: string;
          dueAt: string;
          paid: number;
          status: string;
        }>,
      ) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/tax/${taxId}`,
          {
            method: "PATCH",
            body: JSON.stringify(patch),
          },
        );
        return taxFromApi(res);
      },
      deleteTaxItem: async (taxId: string) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/tax/${taxId}`,
          {
            method: "DELETE",
          },
        );
        return res;
      },
    },

    // Commerce (Inventory / POS / Customers / Credit).
    getProducts: async () => {
      const res = await orgRequest<{ products: OrgProduct[] }>(
        `/organisations/${orgId()}/products`,
      );
      return res.products;
    },
    createProduct: async (data: OrgProductInput) => {
      const res = await orgRequest<OrgProduct>(
        `/organisations/${orgId()}/products`,
        {
          method: "POST",
          body: JSON.stringify(data),
        },
      );
      return res;
    },
    updateProduct: async (id: string, data: Partial<OrgProductInput>) => {
      const res = await orgRequest<OrgProduct>(
        `/organisations/${orgId()}/products/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      );
      return res;
    },
    deleteProduct: async (id: string) => {
      await orgRequest<void>(`/organisations/${orgId()}/products/${id}`, {
        method: "DELETE",
      });
    },

    getCustomers: async () => {
      const res = await orgRequest<{
        customers: Array<Record<string, unknown>>;
      }>(`/organisations/${orgId()}/customers`);
      return res.customers.map(customerFromApi);
    },
    createCustomer: async (data: OrgCustomerInput) => {
      const res = await orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/customers`,
        {
          method: "POST",
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            creditLimit: data.credit_limit,
          }),
        },
      );
      return customerFromApi(res);
    },
    updateCustomer: async (id: string, data: Partial<OrgCustomerInput>) => {
      const res = await orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/customers/${id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            company: data.company,
            creditLimit: data.credit_limit,
          }),
        },
      );
      return customerFromApi(res);
    },
    deleteCustomer: async (id: string) => {
      await orgRequest<void>(`/organisations/${orgId()}/customers/${id}`, {
        method: "DELETE",
      });
    },

    getCreditEntries: async () => {
      const res = await orgRequest<Array<Record<string, unknown>>>(
        `/organisations/${orgId()}/credit`,
      );
      return res.map(creditFromApi);
    },
    createCreditEntry: async (data: OrgCreditInput) => {
      // Credit lives on real customers: make sure one exists, then record the purchase.
      const customers = await orgRequest<{
        customers: Array<Record<string, unknown>>;
      }>(`/organisations/${orgId()}/customers`);
      let customerId = data.customer_id;
      if (!customers.customers.some((c) => c.id === data.customer_id)) {
        const created = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/customers`,
          {
            method: "POST",
            body: JSON.stringify({
              name: data.customer_name,
              email: "",
              creditLimit: 0,
            }),
          },
        );
        customerId = String(created.id);
      }
      const res = await orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/credit/${customerId}/purchase`,
        {
          method: "POST",
          body: JSON.stringify({
            amount: data.balance,
            code: data.customer_code,
          }),
        },
      );
      return creditFromApi(res);
    },
    updateCreditEntry: async (id: string, patch: Partial<OrgCreditEntry>) => {
      const entries = await orgRequest<Array<Record<string, unknown>>>(
        `/organisations/${orgId()}/credit`,
      );
      const current = entries.find((e) => e.id === id);
      const amount =
        patch.last_payment_amount && patch.last_payment_amount > 0
          ? patch.last_payment_amount
          : null;
      if (amount && current?.customerId) {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/credit/${current.customerId}/payment`,
          {
            method: "POST",
            body: JSON.stringify({ amount }),
          },
        );
        return creditFromApi(res);
      }
      // Status/balance are derived server-side; return the fresh entry so callers can re-render.
      return current
        ? creditFromApi(current)
        : ({ id, ...patch } as OrgCreditEntry);
    },

    getTransactions: async () => {
      const res = await orgRequest<{
        transactions: Array<Record<string, unknown>>;
      }>(`/organisations/${orgId()}/transactions`);
      return res.transactions.map(txFromApi);
    },
    checkout: async (data: CheckoutInput) => {
      const res = await orgRequest<Record<string, unknown>>(
        `/organisations/${orgId()}/pos/checkout`,
        {
          method: "POST",
          body: JSON.stringify({
            items: data.items.map((i) => ({
              productId: i.id,
              quantity: i.quantity,
            })),
            paymentMethod: data.payment_method || "cash",
          }),
        },
      );
      return txFromApi(res);
    },

    // HRM (Human Resources).
    hrm: {
      getState: async () => {
        const base = `/organisations/${orgId()}`;
        const [employees, benefits, payroll, timeEntries, attendance, reviews] =
          await Promise.all([
            orgRequest<{ employees: OrgEmployee[] }>(`${base}/employees`),
            orgRequest<Array<Record<string, unknown>>>(`${base}/benefits`),
            orgRequest<{ runs: Array<Record<string, unknown>> }>(
              `${base}/payroll`,
            ),
            orgRequest<{ entries: Array<Record<string, unknown>> }>(
              `${base}/time-entries`,
            ),
            orgRequest<{ records: Array<Record<string, unknown>> }>(
              `${base}/attendance`,
            ),
            orgRequest<{ reviews: Array<Record<string, unknown>> }>(
              `${base}/reviews`,
            ),
          ]);
        return {
          employees: employees.employees,
          benefits: benefits.map(benefitFromApi),
          payrollRuns: payroll.runs.map(payrollFromApi),
          timeEntries: timeEntries.entries.map(timeFromApi),
          attendance: attendance.records.map(attendanceFromApi),
          reviews: reviews.reviews.map(reviewFromApi),
        } as OrgHrmState;
      },
      getEmployees: async () => {
        const res = await orgRequest<{ employees: OrgEmployee[] }>(
          `/organisations/${orgId()}/employees`,
        );
        return res.employees;
      },
      createEmployee: async (data: OrgEmployeeInput) => {
        const res = await orgRequest<OrgEmployee>(
          `/organisations/${orgId()}/employees`,
          {
            method: "POST",
            body: JSON.stringify(data),
          },
        );
        return res;
      },
      updateEmployee: async (id: string, patch: Partial<OrgEmployeeInput>) => {
        const res = await orgRequest<OrgEmployee>(
          `/organisations/${orgId()}/employees/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(patch),
          },
        );
        return res;
      },
      retireEmployee: async (id: string) => {
        return api.org.hrm.updateEmployee(id, { status: "retired" });
      },
      terminateEmployee: async (id: string) => {
        return api.org.hrm.updateEmployee(id, { status: "terminated" });
      },
      getBenefits: async () => {
        const res = await orgRequest<Array<Record<string, unknown>>>(
          `/organisations/${orgId()}/benefits`,
        );
        return res.map(benefitFromApi);
      },
      createBenefit: async (data: OrgBenefitInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/benefits`,
          {
            method: "POST",
            body: JSON.stringify(data),
          },
        );
        return benefitFromApi(res);
      },
      updateBenefit: async (id: string, patch: Partial<OrgBenefitInput>) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/benefits/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(patch),
          },
        );
        return benefitFromApi(res);
      },
      deleteBenefit: async (id: string) => {
        await orgRequest<void>(`/organisations/${orgId()}/benefits/${id}`, {
          method: "DELETE",
        });
      },
      getPayrollRuns: async () => {
        const res = await orgRequest<{ runs: Array<Record<string, unknown>> }>(
          `/organisations/${orgId()}/payroll`,
        );
        return res.runs.map(payrollFromApi);
      },
      runPayroll: async (period: string) => {
        const res = await orgRequest<{
          runs: Array<Record<string, unknown>>;
          skipped?: string[];
        }>(`/organisations/${orgId()}/payroll/generate`, {
          method: "POST",
          body: JSON.stringify({ period }),
        });
        return {
          runs: res.runs.map(payrollFromApi),
          skipped: res.skipped ?? [],
        };
      },
      setPayrollStatus: async (id: string, status: OrgPayrollStatus) => {
        if (status === "paid") {
          const res = await orgRequest<Record<string, unknown>>(
            `/organisations/${orgId()}/payroll/${id}/paid`,
            { method: "POST" },
          );
          return payrollFromApi(res);
        }
        const res = await orgRequest<{ runs: Array<Record<string, unknown>> }>(
          `/organisations/${orgId()}/payroll`,
        );
        const run = res.runs.find((r) => r.id === id);
        return run ? payrollFromApi(run) : ({ id, status } as OrgPayrollRun);
      },
      getTimeEntries: async () => {
        const res = await orgRequest<{
          entries: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/time-entries`);
        return res.entries.map(timeFromApi);
      },
      logTime: async (data: OrgTimeInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/time-entries`,
          {
            method: "POST",
            body: JSON.stringify({
              employeeId: data.employee_id,
              date: data.date,
              hours: data.hours,
              overtimeHours: data.overtime_hours ?? 0,
            }),
          },
        );
        return timeFromApi(res);
      },
      getAttendance: async () => {
        const res = await orgRequest<{
          records: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/attendance`);
        return res.records.map(attendanceFromApi);
      },
      getSummary: async () => getAttendanceSummary(),
      getReviews: async () => {
        const res = await orgRequest<{
          reviews: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/reviews`);
        return res.reviews.map(reviewFromApi);
      },
      createReview: async (data: OrgReviewInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/reviews`,
          {
            method: "POST",
            body: JSON.stringify({
              employeeId: data.employee_id,
              period: data.period,
              score: data.score,
              notes: data.notes,
            }),
          },
        );
        return reviewFromApi(res);
      },
      updateReview: async (id: string) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/reviews/${id}/complete`,
          { method: "POST" },
        );
        return reviewFromApi(res);
      },
    },

    // Attendance / self check-in.
    attendance: {
      self: async () => {
        const session = requireOrgSession();
        const res = await orgRequest<{ employees: OrgEmployee[] }>(
          `/organisations/${session.orgId}/employees`,
        );
        const match = res.employees.find(
          (e) =>
            (e.email ?? "").toLowerCase() ===
            session.member.email.toLowerCase(),
        );
        return match ?? null;
      },
      getRecords: async () => {
        const res = await orgRequest<{
          records: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/attendance`);
        return res.records.map(attendanceFromApi);
      },
      getSummary: async () => getAttendanceSummary(),
      checkIn: async () => {
        const session = requireOrgSession();
        const res = await orgRequest<{ employees: OrgEmployee[] }>(
          `/organisations/${session.orgId}/employees`,
        );
        const match = res.employees.find(
          (e) =>
            (e.email ?? "").toLowerCase() ===
            session.member.email.toLowerCase(),
        );
        if (!match) {
          throw new Error(
            "No employee record found for your account. Ask an HRM manager to add you first.",
          );
        }
        const record = await orgRequest<Record<string, unknown>>(
          `/organisations/${session.orgId}/attendance/check-in`,
          {
            method: "POST",
            body: JSON.stringify({ employeeId: match.id, method: "qr" }),
          },
        );
        return attendanceFromApi(record);
      },
      requestQr: async (employeeId: string, action: "in" | "out") => {
        const res = await orgRequest<QrScanRequest>(
          `/organisations/${orgId()}/attendance/terminal/qr`,
          {
            method: "POST",
            body: JSON.stringify({ employeeId, action }),
          },
        );
        return res;
      },
      scan: async (token: string, action: "in" | "out") => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/attendance/scan`,
          {
            method: "POST",
            body: JSON.stringify({ token, action }),
          },
        );
        return attendanceFromApi(res);
      },
      markManual: async (
        employeeId: string,
        action: "check_in" | "check_out" | "absent",
      ) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/attendance/${employeeId}/mark`,
          {
            method: "POST",
            body: JSON.stringify({ action }),
          },
        );
        return attendanceFromApi(res);
      },
    },

    // Supply Chain & Logistics.
    supply: {
      getState: async () => {
        const base = `/organisations/${orgId()}`;
        const [suppliers, purchaseOrders, shipments] = await Promise.all([
          orgRequest<{ suppliers: Array<Record<string, unknown>> }>(
            `${base}/suppliers`,
          ),
          orgRequest<{ orders: Array<Record<string, unknown>> }>(
            `${base}/purchase-orders`,
          ),
          orgRequest<{ shipments: Array<Record<string, unknown>> }>(
            `${base}/shipments`,
          ),
        ]);
        return {
          suppliers: suppliers.suppliers.map(supplierFromApi),
          purchaseOrders: purchaseOrders.orders.map(poFromApi),
          shipments: shipments.shipments.map(shipmentFromApi),
        } as OrgSupplyState;
      },
      getSuppliers: async () => {
        const res = await orgRequest<{
          suppliers: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/suppliers`);
        return res.suppliers.map(supplierFromApi);
      },
      createSupplier: async (data: OrgSupplierInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/suppliers`,
          {
            method: "POST",
            body: JSON.stringify(supplierToApi(data)),
          },
        );
        return supplierFromApi(res);
      },
      updateSupplier: async (id: string, patch: Partial<OrgSupplierInput>) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/suppliers/${id}`,
          {
            method: "PATCH",
            body: JSON.stringify(supplierToApi(patch)),
          },
        );
        return supplierFromApi(res);
      },
      deleteSupplier: async (id: string) => {
        await orgRequest<void>(`/organisations/${orgId()}/suppliers/${id}`, {
          method: "DELETE",
        });
      },

      getPurchaseOrders: async () => {
        const res = await orgRequest<{
          orders: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/purchase-orders`);
        return res.orders.map(poFromApi);
      },
      createPurchaseOrder: async (data: OrgPurchaseOrderInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/purchase-orders`,
          {
            method: "POST",
            body: JSON.stringify({
              supplierId: data.supplier_id,
              items: data.items.map((i) => ({
                productId: i.product_id,
                quantity: i.qty,
              })),
            }),
          },
        );
        return poFromApi(res);
      },
      setPurchaseOrderStatus: async (id: string, status: OrgPoStatus) => {
        if (status === "received") {
          const res = await orgRequest<Record<string, unknown>>(
            `/organisations/${orgId()}/purchase-orders/${id}/receive`,
            { method: "POST" },
          );
          return poFromApi(res);
        }
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/purchase-orders/${id}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
        return poFromApi(res);
      },
      deletePurchaseOrder: async (id: string) => {
        await orgRequest<void>(
          `/organisations/${orgId()}/purchase-orders/${id}`,
          { method: "DELETE" },
        );
      },

      suggestRestockProducts: async () => {
        const products = await orgRequest<{ products: OrgProduct[] }>(
          `/organisations/${orgId()}/products`,
        );
        return products.products.filter(
          (p) => p.status === "low-stock" || p.status === "out-of-stock",
        );
      },
      autoGeneratePurchaseOrders: async () => {
        const base = `/organisations/${orgId()}`;
        const [productsRes, suppliersRes, ordersRes] = await Promise.all([
          orgRequest<{ products: OrgProduct[] }>(`${base}/products`),
          orgRequest<{ suppliers: Array<Record<string, unknown>> }>(
            `${base}/suppliers`,
          ),
          orgRequest<{ orders: Array<Record<string, unknown>> }>(
            `${base}/purchase-orders`,
          ),
        ]);
        const suppliers = suppliersRes.suppliers.map(supplierFromApi);
        const openProductIds = new Set<string>();
        for (const o of ordersRes.orders) {
          if (o.status !== "received" && o.status !== "cancelled") {
            for (const item of (Array.isArray(o.items) ? o.items : []) as Array<
              Record<string, unknown>
            >) {
              const pid = item.productId ?? item.product_id;
              if (pid) openProductIds.add(String(pid));
            }
          }
        }
        const toOrder = productsRes.products.filter(
          (p) =>
            (p.status === "low-stock" || p.status === "out-of-stock") &&
            !openProductIds.has(p.id),
        );
        if (toOrder.length === 0) return [];
        const bySupplier = new Map<string, OrgProduct[]>();
        for (const product of toOrder) {
          const supplier = suppliers.find(
            (s) =>
              s.status === "active" && s.categories.includes(product.category),
          );
          const key = supplier?.id ?? "none";
          const list = bySupplier.get(key) ?? [];
          list.push(product);
          bySupplier.set(key, list);
        }
        const created: OrgPurchaseOrder[] = [];
        for (const [supplierId, items] of bySupplier.entries()) {
          const res = await orgRequest<Record<string, unknown>>(
            `${base}/purchase-orders`,
            {
              method: "POST",
              body: JSON.stringify({
                supplierId:
                  supplierId === "none"
                    ? (suppliers[0]?.id ?? undefined)
                    : supplierId,
                items: items.map((p) => ({
                  productId: p.id,
                  quantity: Math.max(10, Math.ceil((100 - p.stock) / 2)),
                })),
              }),
            },
          );
          created.push(poFromApi(res));
        }
        return created;
      },

      getShipments: async () => {
        const res = await orgRequest<{
          shipments: Array<Record<string, unknown>>;
        }>(`/organisations/${orgId()}/shipments`);
        return res.shipments.map(shipmentFromApi);
      },
      createShipment: async (data: OrgShipmentInput) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/shipments`,
          {
            method: "POST",
            body: JSON.stringify({
              source: "market",
              marketOrderId: data.market_order_id,
              carrier: data.carrier,
              eta: data.eta,
            }),
          },
        );
        return shipmentFromApi(res);
      },
      setShipmentStatus: async (id: string, status: OrgShipmentStatus) => {
        const res = await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/shipments/${id}/status`,
          {
            method: "PATCH",
            body: JSON.stringify({ status }),
          },
        );
        return shipmentFromApi(res);
      },
      deleteShipment: async (id: string) => {
        await orgRequest<Record<string, unknown>>(
          `/organisations/${orgId()}/shipments/${id}`,
          {
            method: "DELETE",
          },
        );
      },
    },

    // Notifications & Alerts — the transparency feed.
    notifications: {
      getFeed: async () => {
        const base = `/organisations/${orgId()}`;
        const [feed, settings] = await Promise.all([
          orgRequest<{ notifications: OrgNotification[] }>(
            `${base}/notifications`,
          ),
          orgRequest<OrgNotificationSettings>(`${base}/notification-settings`),
        ]);
        return {
          notifications: feed.notifications,
          settings,
        } as OrgNotificationsState;
      },
      markRead: async (notificationId: string) => {
        await orgRequest<void>(
          `/organisations/${orgId()}/notifications/${notificationId}/read`,
          { method: "POST" },
        );
      },
      markAllRead: async () => {
        await orgRequest<void>(
          `/organisations/${orgId()}/notifications/read-all`,
          { method: "POST" },
        );
      },
      deleteNotification: async (notificationId: string) => {
        await orgRequest<void>(
          `/organisations/${orgId()}/notifications/${notificationId}`,
          { method: "DELETE" },
        );
      },
      clearAll: async () => {
        await orgRequest<void>(`/organisations/${orgId()}/notifications`, {
          method: "DELETE",
        });
      },
      setSettings: async (patch: Partial<OrgNotificationSettings>) => {
        const res = await orgRequest<{ allow_admin_delete: boolean }>(
          `/organisations/${orgId()}/notification-settings`,
          {
            method: "PATCH",
            body: JSON.stringify(patch),
          },
        );
        return { allow_admin_delete: !!res.allow_admin_delete };
      },
    },
  },

  // Market — cross-platform marketplace backed by the separate merchant_market DB.
  market: {
    // Public browsing (no auth)
    getShops: async (search?: string, page = 1, limit = 20) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (search) params.set("search", search);
      return anonRequest<{
        shops: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
      }>(`/market/shops?${params}`);
    },
    getShop: (shopId: string) =>
      anonRequest<Record<string, unknown>>(`/market/shops/${shopId}`),
    getProducts: async (
      category?: string,
      search?: string,
      page = 1,
      limit = 22,
    ) => {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (category) params.set("category", category);
      if (search) params.set("search", search);
      return anonRequest<{
        products: Array<Record<string, unknown>>;
        total: number;
        page: number;
        limit: number;
      }>(`/market/products?${params}`);
    },
    getProduct: (productId: string) =>
      anonRequest<Record<string, unknown>>(`/market/products/${productId}`),
    getAdverts: () =>
      anonRequest<Array<Record<string, unknown>>>("/market/advert"),
    getCategories: () =>
      anonRequest<Array<Record<string, unknown>>>("/market/categories"),
    getTopRated: (limit = 4) =>
      anonRequest<Array<Record<string, unknown>>>(
        `/market/top-rated?limit=${limit}`,
      ),

    // Authenticated shop management (owner only)
    createShop: (data: Record<string, unknown>) =>
      orgRequest<Record<string, unknown>>("/market/shops", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateShop: (shopId: string, data: Record<string, unknown>) =>
      orgRequest<Record<string, unknown>>(`/market/shops/${shopId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    createProduct: (shopId: string, data: Record<string, unknown>) =>
      orgRequest<Record<string, unknown>>(`/market/shops/${shopId}/products`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateProduct: (productId: string, data: Record<string, unknown>) =>
      orgRequest<Record<string, unknown>>(`/market/products/${productId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteProduct: (productId: string) =>
      orgRequest<void>(`/market/products/${productId}`, { method: "DELETE" }),

    // Buyer (personal user JWT) — place & list own orders
    placeOrders: (groups: Array<Record<string, unknown>>) =>
      request<{
        orders: Array<Record<string, unknown>>;
        alerts: Array<Record<string, unknown>>;
      }>("/market/orders", {
        method: "POST",
        body: JSON.stringify({ groups }),
      }),
    getMyOrders: (status?: string) => {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      return request<{ orders: Array<Record<string, unknown>>; total: number }>(
        `/market/orders${q}`,
      );
    },
    getMyOrderQrToken: (orderId: string) =>
      request<{ token: string; order_id: string }>(
        `/market/orders/${orderId}/qrcode`,
      ),
    deleteMyOrder: (orderId: string) =>
      request<Record<string, unknown>>(`/market/orders/${orderId}`, {
        method: "DELETE",
      }),

    // Org (member JWT) — supply chain orders tab
    getOrgMarketOrders: (status?: string) => {
      const q = status ? `?status=${encodeURIComponent(status)}` : "";
      return orgRequest<{
        orders: Array<Record<string, unknown>>;
        total: number;
      }>(`/market/orders/org${q}`);
    },
    getOrderQrToken: (orderId: string) =>
      orgRequest<{ token: string; order_id: string }>(
        `/market/orders/org/${orderId}/qrcode`,
      ),
    scanCompleteOrder: (token: string) =>
      orgRequest<Record<string, unknown>>("/market/orders/org/scan", {
        method: "POST",
        body: JSON.stringify({ token }),
      }),
    cancelMarketOrder: (orderId: string) =>
      orgRequest<Record<string, unknown>>(
        `/market/orders/org/${orderId}/cancel`,
        { method: "POST" },
      ),
    deleteOrgOrder: (orderId: string) =>
      orgRequest<Record<string, unknown>>(`/market/orders/org/${orderId}`, {
        method: "DELETE",
      }),
  },

  service: {
    orgCreateService: (service: ServiceSchema) =>
      orgRequest<{ message: string; service_id: number }>(
        "/auth/org/org_services",
        {
          method: "POST",
          body: JSON.stringify(service),
        },
      ),

    orgGetServices: () =>
      orgRequest<OrgServiceResponse[]>("/auth/org/get_org_services", {
        method: "GET",
      }),

    orgUpdateService: (serviceId: string, data: Record<string, unknown>) =>
      orgRequest<{ message: string; service_id: string }>(
        `/auth/org/org_services/${serviceId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),

    orgToggleServicePin: (serviceId: string, isPinned: boolean) =>
      orgRequest<{ message: string; service_id: string; is_pinned: boolean }>(
        `/auth/org/org_services/${serviceId}/pin`,
        {
          method: "PATCH",
          body: JSON.stringify({ is_pinned: isPinned }),
        },
      ),

    orgDeleteService: (serviceId: string) =>
      orgRequest<{ message: string; service_id: string }>(
        `/auth/org/org_services/${serviceId}`,
        {
          method: "DELETE",
        },
      ),

    // ── Service Orders ──

    orgCreateServiceOrder: (order: ServiceOrderSchema) =>
      orgRequest<{ message: string; order_id: string }>(
        "/auth/org/service_orders",
        {
          method: "POST",
          body: JSON.stringify(order),
        },
      ),

    orgGetServiceOrders: () =>
      orgRequest<ServiceOrderResponse[]>("/auth/org/service_orders", {
        method: "GET",
      }),

    orgUpdateServiceOrder: (orderId: string, data: Record<string, unknown>) =>
      orgRequest<{ message: string; order_id: string }>(
        `/auth/org/service_orders/${orderId}`,
        {
          method: "PATCH",
          body: JSON.stringify(data),
        },
      ),

    orgDeleteServiceOrder: (orderId: string) =>
      orgRequest<{ message: string; order_id: string }>(
        `/auth/org/service_orders/${orderId}`,
        {
          method: "DELETE",
        },
      ),
  },
};

export interface ServiceSchema {
  name: string;
  category: string | null;
  pricing_type: "flat" | "hourly" | "variable";
  price: number;
  description: string;
  service_img: string;
  status: string;
  rate: number;
}

export interface OrgServiceResponse {
  id: number;
  organization_id: string;
  service_id: string;
  name: string;
  category: string;
  pricing_type: "flat" | "hourly" | "variable";
  price: number;
  service_img: string | null;
  description: string | null;
  status: string | null;
  is_pinned: boolean;
  rate: number | null;
  completed_at: string | null;
  isCompleted: boolean;
  created_at: string;
}

export interface ServiceOrderSchema {
  service_id: string;
  service_name: string;
  customer_id: string | null;
  customer_name: string;
  price: number;
  pricing_type: string;
  category: string | null;
}

export interface ServiceOrderResponse {
  id: number;
  org_id: string;
  order_id: string;
  service_id: string;
  service_name: string;
  customer_id: string;
  customer_name: string;
  price: number;
  pricing_type: string;
  category: string;
  status: string;
  completed_at: string | null;
  created_at: string;
}
