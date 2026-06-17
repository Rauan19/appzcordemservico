import { z } from "zod";

export const ContractTemplateIdParamsSchema = z.object({
  id: z.string().min(1),
});

export const CreateContractTemplateSchema = z.object({
  name: z.string().min(1, "Nome obrigatório"),
  content: z.string().min(1, "Conteúdo obrigatório"),
  active: z.boolean().optional(),
});

export const UpdateContractTemplateSchema = z.object({
  name: z.string().min(1).optional(),
  content: z.string().min(1).optional(),
  active: z.boolean().optional(),
});
