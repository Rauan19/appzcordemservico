import { apiRequest } from "@/src/lib/api";
import type {
  CustomerRating,
  LoginResponse,
  Product,
  RateableOrder,
  ServiceOrder,
  ServiceOrderStatus,
  StockBalance,
  User,
} from "@/src/types/api";

export const api = {
  login(email: string, password: string) {
    return apiRequest<LoginResponse>("/auth/login", {
      method: "POST",
      body: { email, password },
      auth: false,
    });
  },

  me() {
    return apiRequest<User>("/auth/me");
  },

  myOrders(status?: ServiceOrderStatus) {
    const params = new URLSearchParams({ assignedTo: "me" });
    if (status) params.set("status", status);
    return apiRequest<ServiceOrder[]>(`/service-orders?${params}`);
  },

  getOrder(id: string) {
    return apiRequest<ServiceOrder>(`/service-orders/${id}`);
  },

  updateOrderStatus(id: string, status: ServiceOrderStatus) {
    return apiRequest<ServiceOrder>(`/service-orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  addOrderItem(orderId: string, data: { productId: string; quantity: number; reason?: string }) {
    return apiRequest(`/service-orders/${orderId}/items`, {
      method: "POST",
      body: data,
    });
  },

  addOrderItemsBatch(
    orderId: string,
    data: {
      items: Array<{ productId: string; quantity: number; description?: string }>;
      reason?: string;
    },
  ) {
    return apiRequest<{ items: unknown[] }>(`/service-orders/${orderId}/items/batch`, {
      method: "POST",
      body: data,
    });
  },

  registerDefect(
    orderId: string,
    data: { productId: string; quantity: number; reason: string; note?: string },
  ) {
    return apiRequest(`/service-orders/${orderId}/defects`, {
      method: "POST",
      body: data,
    });
  },

  listProducts() {
    return apiRequest<Product[]>("/products");
  },

  stockBalance() {
    return apiRequest<StockBalance[]>("/stock/balance");
  },

  myCustomerRatings() {
    return apiRequest<CustomerRating[]>("/customer-ratings/my");
  },

  rateableOrdersForRating() {
    return apiRequest<RateableOrder[]>("/customer-ratings/rateable-orders");
  },

  createCustomerRating(data: {
    serviceOrderId: string;
    rating: number;
    comment?: string;
  }) {
    return apiRequest<CustomerRating>("/customer-ratings", {
      method: "POST",
      body: data,
    });
  },
};
