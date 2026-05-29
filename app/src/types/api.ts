export type UserRole = "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN";

export type ServiceOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELED";

export type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  active?: boolean;
};

export type LoginResponse = {
  token: string;
  user: User;
};

export type Customer = {
  id: string;
  fullName: string;
  cpf: string;
  phone: string;
};

export type Address = {
  id: string;
  label?: string | null;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
};

export type Product = {
  id: string;
  name: string;
  sku?: string | null;
  unit: string;
  active: boolean;
};

export type ServiceOrderItem = {
  id: string;
  productId?: string | null;
  description?: string | null;
  quantity?: string | null;
  product?: Product | null;
};

export type CustomerRating = {
  id: string;
  serviceOrderId: string;
  technicianId: string;
  rating: number;
  comment?: string | null;
  createdAt: string;
  serviceOrder?: {
    id: string;
    code: string;
    title: string;
    status?: ServiceOrderStatus;
    customer?: { fullName: string };
  };
};

export type RateableOrder = {
  id: string;
  code: string;
  title: string;
  status: ServiceOrderStatus;
  customer?: { fullName: string; phone?: string };
};

export type ServiceOrder = {
  id: string;
  code: string;
  status: ServiceOrderStatus;
  priority: string;
  title: string;
  description?: string | null;
  customer?: Customer;
  address?: Address | null;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  assignees?: Array<{
    userId: string;
    user: Pick<User, "id" | "name" | "email">;
  }>;
  customerRating?: {
    id: string;
    rating: number;
    comment?: string | null;
    createdAt: string;
  } | null;
  items?: ServiceOrderItem[];
  stockMovements?: unknown[];
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
};

export type StockBalance = {
  productId: string;
  balance: number;
  breakdown: {
    in: number;
    out: number;
    adj: number;
    ret: number;
    defect: number;
  };
};

export type ApiError = {
  error: string;
  message?: string;
  issues?: unknown[];
};
