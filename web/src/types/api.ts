export type UserRole = "ADMIN" | "MANAGER" | "STOCK" | "TECHNICIAN";

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
  email?: string | null;
  addresses?: Address[];
};

export type Address = {
  id: string;
  customerId: string;
  label?: string | null;
  street?: string | null;
  number?: string | null;
  district?: string | null;
  city?: string | null;
  state?: string | null;
  zipCode?: string | null;
};

export type Product = {
  id: string;
  name: string;
  series?: string | null;
  sku?: string | null;
  unit: string;
  active: boolean;
};

export type ServiceOrderStatus =
  | "OPEN"
  | "ASSIGNED"
  | "IN_PROGRESS"
  | "DONE"
  | "CANCELED";

export type ServiceOrderAssignee = {
  userId: string;
  user: Pick<User, "id" | "name" | "email" | "role">;
};

export type ServiceOrder = {
  id: string;
  code: string;
  status: ServiceOrderStatus;
  priority: string;
  title: string;
  description?: string | null;
  technicianReport?: string | null;
  customerPppoeUser?: string | null;
  customerPppoePassword?: string | null;
  customerWifiName?: string | null;
  customerWifiPassword?: string | null;
  customerId: string;
  addressId?: string | null;
  assignedToId?: string | null;
  customer?: Customer;
  address?: Address | null;
  assignedTo?: Pick<User, "id" | "name" | "email"> | null;
  assignees?: ServiceOrderAssignee[];
  scheduledAt?: string | null;
  startedAt?: string | null;
  finishedAt?: string | null;
  createdAt?: string;
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

export type ServiceOrderEvaluation = {
  id: string;
  serviceOrderId: string;
  technicianId?: string | null;
  rating: number;
  comment?: string | null;
  createdAt: string;
  serviceOrder?: {
    id: string;
    code: string;
    title: string;
    customer?: { fullName: string };
  };
  technician?: Pick<User, "id" | "name" | "email"> | null;
  createdBy?: Pick<User, "id" | "name"> | null;
};

export type EvaluationStats = {
  total: number;
  averageRating: number;
  byTechnician: Array<{
    technicianId: string;
    technicianName: string;
    averageRating: number;
    count: number;
  }>;
};

export type EvaluableOrder = {
  id: string;
  code: string;
  title: string;
  finishedAt?: string | null;
  customer?: { fullName: string };
  assignedTo?: { id: string; name: string } | null;
  assignees?: Array<{ user: { id: string; name: string } }>;
};

export type ApiError = {
  error?: string;
  message?: string;
};

export type PushDevice = {
  id: string;
  tokenPreview: string;
  platform: string;
  createdAt: string;
  updatedAt: string;
  user: Pick<User, "id" | "name" | "email" | "role" | "active">;
};

export type PushOverview = {
  firebaseConfigured: boolean;
  stats: {
    totalDevices: number;
    connectedTechnicians: number;
    byPlatform: Record<string, number>;
  };
  devices: PushDevice[];
};

export type SendPushResult = {
  targetedDevices: number;
  sent: number;
  failed: number;
  invalidTokensRemoved: number;
};

export type ContractStatus =
  | "DRAFT"
  | "SENT"
  | "OPENED"
  | "DOCS_SUBMITTED"
  | "SIGNED"
  | "APPROVED"
  | "REJECTED"
  | "EXPIRED"
  | "CANCELED";

export type ContractDocumentType = "ID_FRONT" | "ID_BACK" | "SELFIE_WITH_ID";

export type ContractTemplate = {
  id: string;
  name: string;
  content: string;
  version: number;
  active: boolean;
  createdAt?: string;
  createdBy?: Pick<User, "id" | "name"> | null;
  _count?: { contracts: number };
};

export type ContractDocument = {
  id: string;
  contractId: string;
  type: ContractDocumentType;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type ContractSignature = {
  id: string;
  contractId: string;
  signerName: string;
  signerCpf: string;
  ipAddress?: string | null;
  userAgent?: string | null;
  latitude?: string | null;
  longitude?: string | null;
  signedAt: string;
};

export type Contract = {
  id: string;
  code: string;
  customerId: string;
  templateId: string;
  title: string;
  content: string;
  status: ContractStatus;
  variables?: Record<string, string> | null;
  accessToken: string;
  expiresAt?: string | null;
  sentAt?: string | null;
  openedAt?: string | null;
  signedAt?: string | null;
  approvedAt?: string | null;
  reviewNote?: string | null;
  signingUrl?: string;
  customer?: Customer;
  template?: Pick<ContractTemplate, "id" | "name" | "version">;
  documents?: ContractDocument[];
  signature?: ContractSignature | null;
  serviceOrder?: { id: string; code: string; title: string } | null;
  createdBy?: Pick<User, "id" | "name"> | null;
  reviewedBy?: Pick<User, "id" | "name"> | null;
  createdAt?: string;
};

export type PublicContract = {
  id: string;
  code: string;
  title: string;
  content: string;
  status: ContractStatus;
  variables?: Record<string, string> | null;
  expiresAt?: string | null;
  customerName: string;
  documents: Array<{ type: ContractDocumentType; uploaded: boolean }>;
  signed: boolean;
  signature?: {
    signerName: string;
    signerCpf: string;
    signedAt: string;
    ipAddress?: string | null;
  } | null;
};
