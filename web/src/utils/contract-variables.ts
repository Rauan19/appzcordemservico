export type ContractVariable = {
  key: string;
  label: string;
  hint?: string;
  group: "cliente" | "contrato" | "provedor";
};

export const CONTRACT_VARIABLES: ContractVariable[] = [
  { key: "nome", label: "Nome do cliente", group: "cliente" },
  { key: "cpf", label: "CPF", group: "cliente" },
  { key: "telefone", label: "Telefone", group: "cliente" },
  { key: "email", label: "E-mail", group: "cliente" },
  { key: "endereco", label: "Endereço", group: "cliente" },
  { key: "data", label: "Data", hint: "Data da criação", group: "cliente" },
  { key: "plano", label: "Plano", group: "contrato" },
  { key: "valor", label: "Valor (R$)", group: "contrato" },
  { key: "velocidade", label: "Velocidade", group: "contrato" },
  { key: "fidelidade", label: "Fidelidade", group: "contrato" },
  { key: "instalacao", label: "Taxa instalação", group: "contrato" },
  { key: "vencimento", label: "Dia vencimento", group: "contrato" },
  { key: "equipamento", label: "Equipamento", group: "contrato" },
  { key: "empresa", label: "Nome empresa", group: "provedor" },
  { key: "cnpj", label: "CNPJ", group: "provedor" },
  { key: "representante_nome", label: "Representante da empresa", group: "provedor" },
  { key: "representante_cpf", label: "CPF do representante", group: "provedor" },
];

export const CONTRACT_VARIABLE_GROUPS: Record<ContractVariable["group"], string> = {
  cliente: "Dados do cliente (automático)",
  contrato: "Dados do contrato (ao gerar)",
  provedor: "Provedor (preencher no texto ou ao gerar)",
};

export function variableToken(key: string) {
  return `{{${key}}}`;
}

export function insertIntoTextarea(
  textarea: HTMLTextAreaElement,
  token: string,
  onChange: (value: string) => void,
) {
  const start = textarea.selectionStart ?? textarea.value.length;
  const end = textarea.selectionEnd ?? start;
  const next = textarea.value.slice(0, start) + token + textarea.value.slice(end);
  onChange(next);
  requestAnimationFrame(() => {
    textarea.focus();
    const pos = start + token.length;
    textarea.setSelectionRange(pos, pos);
  });
}
