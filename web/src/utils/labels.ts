import type { ServiceOrderStatus } from "../types/api";

export const statusLabels: Record<ServiceOrderStatus, string> = {
  OPEN: "Aberta",
  ASSIGNED: "Atribuída",
  IN_PROGRESS: "Em execução",
  DONE: "Finalizada",
  CANCELED: "Cancelada",
};

export const statusColors: Record<ServiceOrderStatus, string> = {
  OPEN: "#2b8cff",
  ASSIGNED: "#d97706",
  IN_PROGRESS: "#0b2d6b",
  DONE: "#059669",
  CANCELED: "#dc2626",
};

export const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const priorityColors: Record<string, string> = {
  LOW: "#64748b",
  NORMAL: "#2563eb",
  HIGH: "#d97706",
  URGENT: "#dc2626",
};

export const priorityOptions = [
  { value: "LOW", label: "Baixa" },
  { value: "NORMAL", label: "Normal" },
  { value: "HIGH", label: "Alta" },
  { value: "URGENT", label: "Urgente" },
] as const;

export const roleLabels: Record<string, string> = {
  ADMIN: "Administrador",
  MANAGER: "Gerente",
  STOCK: "Estoque",
  TECHNICIAN: "Técnico",
};
