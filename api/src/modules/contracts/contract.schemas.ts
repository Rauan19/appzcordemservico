import { z } from "zod";

export const ContractIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const ContractTokenParamsSchema = z.object({
  token: z.string().min(1),
});

export const ContractDocumentTypeParamSchema = z.object({
  type: z.enum(["ID_FRONT", "ID_BACK", "SELFIE_WITH_ID"]),
});

export const ListContractsQuerySchema = z.object({
  status: z
    .enum([
      "DRAFT",
      "SENT",
      "OPENED",
      "DOCS_SUBMITTED",
      "SIGNED",
      "APPROVED",
      "REJECTED",
      "EXPIRED",
      "CANCELED",
    ])
    .optional(),
  customerId: z.string().optional(),
  q: z.string().optional(),
});

export const CreateContractSchema = z.object({
  customerId: z.string().min(1),
  templateId: z.string().min(1),
  title: z.string().min(1).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  serviceOrderId: z.string().optional(),
  expiresInDays: z.number().int().positive().max(90).optional(),
});

export const UpdateContractSchema = z.object({
  title: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  variables: z.record(z.string(), z.string()).optional(),
  expiresInDays: z.number().int().positive().max(90).optional(),
});

export const RejectContractSchema = z.object({
  reviewNote: z.string().min(1, "Informe o motivo da rejeição"),
});

export const SignContractSchema = z.object({
  signerName: z.string().min(1),
  signerCpf: z.string().min(11),
  acceptedTerms: z.literal(true),
  signatureBase64: z.string().min(1),
  latitude: z.number().optional(),
  longitude: z.number().optional(),
});

export const PublicDocumentTypeSchema = z.enum([
  "ID_FRONT",
  "ID_BACK",
  "SELFIE_WITH_ID",
]);
