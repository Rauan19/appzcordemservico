import { api } from "../lib/api";
import type {
  Customer,
  EvaluableOrder,
  EvaluationStats,
  LoginResponse,
  Product,
  PushOverview,
  SendPushResult,
  ServiceOrder,
  ServiceOrderEvaluation,
  ServiceOrderStatus,
  StockBalance,
  User,
} from "../types/api";

export type ListOrdersParams = {
  status?: ServiceOrderStatus;
  priority?: string;
  technicianId?: string;
  scheduled?: "today" | "scheduled" | "unscheduled" | "overdue";
  createdPeriod?: "day" | "month" | "year";
  q?: string;
  scheduledFrom?: string;
  scheduledTo?: string;
  withPppoe?: boolean;
};

export type OrderCreatedStats = {
  day: number;
  month: number;
  year: number;
  total: number;
};

export const adminApi = {
  login(email: string, password: string) {
    return api<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },

  me() {
    return api<User>("/auth/me");
  },

  createUser(data: {
    name: string;
    email: string;
    password: string;
    role: User["role"];
  }) {
    return api<User>("/auth/users", { method: "POST", body: data });
  },

  listUsers() {
    return api<User[]>("/users");
  },

  setUserActive(id: string, active: boolean) {
    return api<User>(`/users/${id}/active`, {
      method: "PATCH",
      body: { active },
    });
  },

  listTechnicians() {
    return api<User[]>("/users/technicians");
  },

  listCustomers() {
    return api<Customer[]>("/customers");
  },

  getCustomer(id: string) {
    return api<Customer>(`/customers/${id}`);
  },

  createCustomer(data: {
    fullName: string;
    cpf: string;
    phone: string;
    email?: string;
  }) {
    return api<Customer>("/customers", { method: "POST", body: data });
  },

  createAddress(
    customerId: string,
    data: Partial<Omit<import("../types/api").Address, "id" | "customerId">>,
  ) {
    return api(`/customers/${customerId}/addresses`, { method: "POST", body: data });
  },

  listProducts() {
    return api<Product[]>("/products");
  },

  createProduct(data: {
    name: string;
    series?: string;
    sku?: string;
    unit?: string;
    active?: boolean;
  }) {
    return api<Product>("/products", { method: "POST", body: data });
  },

  productIntake(
    data:
      | {
          action: "restock";
          productId: string;
          quantity: number;
          batchNote?: string;
          reason?: string;
        }
      | {
          action: "new";
          name: string;
          series?: string;
          sku?: string;
          unit?: string;
          quantity?: number;
          batchNote?: string;
          reason?: string;
        },
  ) {
    return api<{ action: string; product: Product; balance: number; quantity: number }>(
      "/products/intake",
      { method: "POST", body: data },
    );
  },

  updateProduct(
    id: string,
    data: {
      name?: string;
      series?: string | null;
      sku?: string | null;
      unit?: string;
      active?: boolean;
    },
  ) {
    return api<Product>(`/products/${id}`, { method: "PATCH", body: data });
  },

  deleteProduct(id: string) {
    return api<{ ok: boolean; deleted?: boolean; deactivated?: boolean }>(`/products/${id}`, {
      method: "DELETE",
    });
  },

  listOrders(params?: ListOrdersParams) {
    const q = new URLSearchParams();
    if (params?.status) q.set("status", params.status);
    if (params?.priority) q.set("priority", params.priority);
    if (params?.technicianId) q.set("technicianId", params.technicianId);
    if (params?.scheduled) q.set("scheduled", params.scheduled);
    if (params?.createdPeriod) q.set("createdPeriod", params.createdPeriod);
    if (params?.q) q.set("q", params.q);
    if (params?.scheduledFrom) q.set("scheduledFrom", params.scheduledFrom);
    if (params?.scheduledTo) q.set("scheduledTo", params.scheduledTo);
    if (params?.withPppoe) q.set("withPppoe", "true");
    const suffix = q.toString() ? `?${q}` : "";
    return api<ServiceOrder[]>(`/service-orders${suffix}`);
  },

  getOrderCreatedStats() {
    return api<OrderCreatedStats>("/service-orders/stats");
  },

  getOrder(id: string) {
    return api<ServiceOrder>(`/service-orders/${id}`);
  },

  createOrder(data: {
    customerId: string;
    addressId?: string;
    assignedToId?: string;
    assignedToIds?: string[];
    title: string;
    description?: string;
    priority?: string;
    scheduledAt?: string;
    customerPppoeUser?: string;
    customerPppoePassword?: string;
  }) {
    return api<ServiceOrder>("/service-orders", { method: "POST", body: data });
  },

  updateOrderStatus(id: string, status: ServiceOrderStatus) {
    return api<ServiceOrder>(`/service-orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  updateOrder(
    id: string,
    data: {
      customerId?: string;
      addressId?: string | null;
      assignedToIds?: string[];
      title?: string;
      description?: string | null;
      priority?: string;
      status?: ServiceOrderStatus;
      scheduledAt?: string | null;
      customerPppoeUser?: string | null;
      customerPppoePassword?: string | null;
      technicianReport?: string | null;
    },
  ) {
    return api<ServiceOrder>(`/service-orders/${id}`, { method: "PATCH", body: data });
  },

  deleteOrder(id: string) {
    return api<{ ok: boolean; deleted: boolean }>(`/service-orders/${id}`, {
      method: "DELETE",
    });
  },

  stockBalance() {
    return api<StockBalance[]>("/stock/balance");
  },

  listEvaluations(params?: { rating?: number; technicianId?: string }) {
    const q = new URLSearchParams();
    if (params?.rating) q.set("rating", String(params.rating));
    if (params?.technicianId) q.set("technicianId", params.technicianId);
    const suffix = q.toString() ? `?${q}` : "";
    return api<ServiceOrderEvaluation[]>(`/evaluations${suffix}`);
  },

  getEvaluationStats() {
    return api<EvaluationStats>("/evaluations/stats");
  },

  listEvaluableOrders() {
    return api<EvaluableOrder[]>("/evaluations/evaluable-orders");
  },

  createEvaluation(data: {
    serviceOrderId: string;
    technicianId?: string;
    rating: number;
    comment?: string;
  }) {
    return api<ServiceOrderEvaluation>("/evaluations", { method: "POST", body: data });
  },

  createStockMovement(data: {
    type: "IN" | "ADJUSTMENT" | "RETURN";
    productId: string;
    quantity: number;
    reason?: string;
    note?: string;
  }) {
    return api("/stock/movements", { method: "POST", body: data });
  },

  getPushOverview() {
    return api<PushOverview>("/push/admin/overview");
  },

  sendPush(data: {
    title: string;
    body: string;
    technicianIds?: string[];
    orderId?: string;
  }) {
    return api<SendPushResult>("/push/admin/send", {
      method: "POST",
      body: data,
    });
  },
};
