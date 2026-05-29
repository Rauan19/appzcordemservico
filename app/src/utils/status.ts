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

export const priorityLabels: Record<string, string> = {
  LOW: "Baixa",
  NORMAL: "Normal",
  HIGH: "Alta",
  URGENT: "Urgente",
};
