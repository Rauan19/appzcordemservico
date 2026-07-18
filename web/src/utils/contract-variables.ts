export type ContractVariable = {
  key: string;
  label: string;
  hint?: string;
  group: "cliente" | "contrato" | "provedor";
};

export const CONTRACT_VARIABLES: ContractVariable[] = [
  { key: "nome", label: "Nome do assinante", group: "cliente" },
  { key: "cpf", label: "CPF/CNPJ", group: "cliente" },
  { key: "rg", label: "RG/ID", group: "cliente" },
  { key: "data_nascimento", label: "Data de nascimento", group: "cliente" },
  { key: "naturalidade", label: "Naturalidade", group: "cliente" },
  { key: "pai", label: "Nome do pai", group: "cliente" },
  { key: "mae", label: "Nome da mãe", group: "cliente" },
  { key: "rua", label: "Endereço (rua)", group: "cliente" },
  { key: "numero", label: "Número", group: "cliente" },
  { key: "bairro", label: "Bairro", group: "cliente" },
  { key: "cidade", label: "Cidade", group: "cliente" },
  { key: "estado", label: "Estado", group: "cliente" },
  { key: "cep", label: "CEP", group: "cliente" },
  { key: "endereco", label: "Endereço completo", group: "cliente" },
  { key: "whatsapp", label: "Celular WhatsApp", group: "cliente" },
  { key: "telefone", label: "Ligação celular", group: "cliente" },
  { key: "email", label: "E-mail", group: "cliente" },
  { key: "data", label: "Data do contrato", hint: "Preenchida automaticamente", group: "cliente" },
  { key: "plano", label: "Plano", hint: "Ex.: 100MB", group: "contrato" },
  { key: "valor", label: "Valor mensal (R$)", group: "contrato" },
  { key: "instalacao", label: "Taxa instalação/adesão", group: "contrato" },
  { key: "vencimento", label: "Dia de vencimento", hint: "5, 10, 15, 20, 25 ou 30", group: "contrato" },
  { key: "prazo_contratual", label: "Prazo contratual", group: "contrato" },
  { key: "equipamento", label: "Equipamento ONU/ONT", group: "contrato" },
  { key: "serial_onu", label: "Serial ONU/ONT", group: "contrato" },
  { key: "forma_pagamento", label: "Forma de pagamento", group: "contrato" },
  { key: "autoriza_publicidade", label: "Autoriza publicidade", hint: "Sim ou Não", group: "contrato" },
  { key: "autoriza_cobranca_eletronica", label: "Autoriza cobrança eletrônica", hint: "Sim ou Não", group: "contrato" },
  { key: "autoriza_dados_terceiros", label: "Autoriza dados a terceiros", hint: "Sim ou Não", group: "contrato" },
  { key: "empresa", label: "Nome da empresa", group: "provedor" },
  { key: "cnpj", label: "CNPJ", group: "provedor" },
  { key: "empresa_endereco", label: "Endereço da empresa", group: "provedor" },
  { key: "telefone_empresa", label: "Telefone da empresa", group: "provedor" },
  { key: "representante_nome", label: "Representante da empresa", group: "provedor" },
  { key: "representante_cpf", label: "CPF do representante", group: "provedor" },
];

export const CONTRACT_VARIABLE_GROUPS: Record<ContractVariable["group"], string> = {
  cliente: "Dados do assinante",
  contrato: "Plano e condições",
  provedor: "Dados da prestadora",
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
