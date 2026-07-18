import type { Address, Customer } from "@prisma/client";

type TemplateVars = Record<string, string>;

export function formatAddress(address?: Address | null) {
  if (!address) return "";
  const parts = [
    address.street,
    address.number ? `nº ${address.number}` : null,
    address.district,
    address.city,
    address.state,
    address.zipCode,
  ].filter(Boolean);
  return parts.join(", ");
}

export function buildCustomerVariables(
  customer: Customer & { addresses?: Address[] },
  extra: Record<string, string> = {},
): TemplateVars {
  const primary = customer.addresses?.[0];
  const now = new Date();
  const dateStr = now.toLocaleDateString("pt-BR");

  return {
    nome: customer.fullName,
    cpf: customer.cpf,
    telefone: customer.phone,
    whatsapp: customer.phone,
    email: customer.email ?? "",
    endereco: formatAddress(primary),
    rua: primary?.street ?? "",
    numero: primary?.number ?? "",
    bairro: primary?.district ?? "",
    cidade: primary?.city ?? "",
    estado: primary?.state ?? "",
    cep: primary?.zipCode ?? "",
    data: dateStr,
    ...extra,
  };
}

export function renderContractContent(template: string, variables: TemplateVars) {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => variables[key] ?? `{{${key}}}`);
}

export async function nextContractCode() {
  const year = new Date().getFullYear();
  const prefix = `CTR-${year}-`;
  const { prisma } = await import("../../db.js");
  const last = await prisma.contract.findFirst({
    where: { code: { startsWith: prefix } },
    orderBy: { code: "desc" },
    select: { code: true },
  });

  let seq = 1;
  if (last?.code) {
    const part = last.code.slice(prefix.length);
    const n = Number.parseInt(part, 10);
    if (!Number.isNaN(n)) seq = n + 1;
  }

  return `${prefix}${String(seq).padStart(4, "0")}`;
}
