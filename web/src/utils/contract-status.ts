import type { ContractStatus } from "../types/api";

export const CONTRACT_STATUS_LABELS: Record<ContractStatus, string> = {
  DRAFT: "Rascunho",
  SENT: "Enviado",
  OPENED: "Aberto pelo cliente",
  DOCS_SUBMITTED: "Documentos enviados",
  SIGNED: "Assinado",
  APPROVED: "Aprovado",
  REJECTED: "Rejeitado",
  EXPIRED: "Expirado",
  CANCELED: "Cancelado",
};

export const DOCUMENT_TYPE_LABELS = {
  ID_FRONT: "Frente do RG/CNH",
  ID_BACK: "Verso do RG/CNH",
  SELFIE_WITH_ID: "Selfie segurando o documento",
} as const;

export function contractStatusClass(status: ContractStatus) {
  if (status === "APPROVED") return "badge badge-success";
  if (status === "SIGNED" || status === "DOCS_SUBMITTED") return "badge badge-info";
  if (status === "REJECTED" || status === "CANCELED" || status === "EXPIRED") {
    return "badge badge-danger";
  }
  if (status === "SENT" || status === "OPENED") return "badge badge-warning";
  return "badge";
}
