import type { ServiceOrder } from "../types/api";

export function orderTechnicianNames(order: ServiceOrder): string {
  const fromAssignees = order.assignees?.map((a) => a.user.name) ?? [];
  if (fromAssignees.length > 0) return fromAssignees.join(", ");
  return order.assignedTo?.name ?? "";
}
