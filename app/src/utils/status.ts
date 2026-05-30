import type { ServiceOrderStatus } from "@/src/types/api";
import { colors } from "@/src/constants/theme";

export const statusLabels: Record<ServiceOrderStatus, string> = {
  OPEN: "Aberta",
  ASSIGNED: "Atribuída",
  IN_PROGRESS: "Em execução",
  DONE: "Finalizada",
  CANCELED: "Cancelada",
};

export const statusColors: Record<ServiceOrderStatus, string> = {
  OPEN: colors.accent,
  ASSIGNED: colors.warning,
  IN_PROGRESS: colors.primary,
  DONE: colors.success,
  CANCELED: colors.danger,
};

/** Fundo suave do card da OS conforme o status. */
export const statusBackgroundColors: Record<ServiceOrderStatus, string> = {
  OPEN: "#EFF6FF",
  ASSIGNED: "#FFF7ED",
  IN_PROGRESS: "#E8F2FF",
  DONE: "#ECFDF5",
  CANCELED: "#FEF2F2",
};

export const statusBorderColors: Record<ServiceOrderStatus, string> = {
  OPEN: "#BFDBFE",
  ASSIGNED: "#FCD34D",
  IN_PROGRESS: "#C7D9F5",
  DONE: "#A7F3D0",
  CANCELED: "#FECACA",
};

export const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};

export const priorityColors: Record<string, string> = {
  LOW: "#64748B",
  NORMAL: "#2563EB",
  HIGH: "#D97706",
  URGENT: "#DC2626",
};

export const statusIcons: Record<
  ServiceOrderStatus,
  "ellipse-outline" | "person-outline" | "play-circle-outline" | "checkmark-circle-outline" | "close-circle-outline"
> = {
  OPEN: "ellipse-outline",
  ASSIGNED: "person-outline",
  IN_PROGRESS: "play-circle-outline",
  DONE: "checkmark-circle-outline",
  CANCELED: "close-circle-outline",
};
