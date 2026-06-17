import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CustomerPicker } from "../components/CustomerPicker";
import { Modal } from "../components/Modal";
import { adminApi } from "../services/admin-api";
import type { Contract, ContractStatus, ContractTemplate, Customer } from "../types/api";
import { CONTRACT_STATUS_LABELS, contractStatusClass } from "../utils/contract-status";

import { CONTRACT_VARIABLES, variableToken } from "../utils/contract-variables";
import "./ContractsPage.css";

const CONTRACT_FIELD_DEFAULTS: Record<string, string> = {
  plano: "100 Mega",
  valor: "99,90",
  velocidade: "100 Mbps",
  fidelidade: "12 meses",
  instalacao: "0,00",
  vencimento: "10",
  equipamento: "ONU em comodato",
  empresa: "ZC NET CONFIG",
  cnpj: "",
  representante_nome: "",
  representante_cpf: "",
};

const CONTRACT_VARIABLES_STORAGE_KEY = "zcnet_contract_variables";

function loadContractVariableDefaults() {
  try {
    const raw = localStorage.getItem(CONTRACT_VARIABLES_STORAGE_KEY);
    if (!raw) return CONTRACT_FIELD_DEFAULTS;
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const values = Object.fromEntries(
      Object.entries(parsed).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
    );
    return { ...CONTRACT_FIELD_DEFAULTS, ...values };
  } catch {
    return CONTRACT_FIELD_DEFAULTS;
  }
}

const CONTRACT_FORM_VARIABLES = CONTRACT_VARIABLES.filter(
  (v) =>
    (v.group === "contrato" || v.group === "provedor") &&
    v.key !== "representante_nome" &&
    v.key !== "representante_cpf",
);

const DEFAULT_VARIABLE_KEYS = new Set(CONTRACT_FORM_VARIABLES.map((v) => v.key));

const STATUS_FILTERS: Array<{ label: string; value?: ContractStatus }> = [
  { label: "Todos" },
  { label: "Rascunho", value: "DRAFT" },
  { label: "Enviado", value: "SENT" },
  { label: "Assinado", value: "SIGNED" },
  { label: "Aprovado", value: "APPROVED" },
  { label: "Rejeitado", value: "REJECTED" },
];

export function ContractsPage() {
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContractStatus | undefined>();
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [customerId, setCustomerId] = useState("");
  const [templateId, setTemplateId] = useState("");
  const [variables, setVariables] = useState<Record<string, string>>(loadContractVariableDefaults);
  const [manualVariableKey, setManualVariableKey] = useState("");
  const [manualVariableValue, setManualVariableValue] = useState("");
  const [expiresInDays, setExpiresInDays] = useState("7");
  const [companySignsFirst, setCompanySignsFirst] = useState(false);

  const manualVariableKeys = useMemo(
    () => Object.keys(variables).filter((key) => !DEFAULT_VARIABLE_KEYS.has(key)),
    [variables],
  );

  function updateVariable(key: string, value: string) {
    setVariables((prev) => ({ ...prev, [key]: value }));
  }

  function normalizeVariableKey(value: string) {
    return value
      .trim()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9_]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function addManualVariable() {
    const key = normalizeVariableKey(manualVariableKey);
    if (!key) {
      setError("Informe o nome da variável manual.");
      return;
    }

    setVariables((prev) => ({ ...prev, [key]: manualVariableValue }));
    setManualVariableKey("");
    setManualVariableValue("");
    setError("");
  }

  function removeManualVariable(key: string) {
    setVariables((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  }

  function load() {
    setLoading(true);
    Promise.all([
      adminApi.listContracts({ status: statusFilter, q: search.trim() || undefined }),
      adminApi.listCustomers(),
      adminApi.listContractTemplates(true),
    ])
      .then(([list, custs, tpls]) => {
        setContracts(list);
        setCustomers(custs);
        setTemplates(tpls);
        if (!templateId && tpls[0]) setTemplateId(tpls[0].id);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [statusFilter]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return contracts;
    return contracts.filter(
      (c) =>
        c.code.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.customer?.fullName.toLowerCase().includes(q),
    );
  }, [contracts, search]);

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    if (!customerId || !templateId) {
      setError("Selecione cliente e modelo.");
      return;
    }
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const contractVariables = Object.fromEntries(
        Object.entries(variables).filter(([, value]) => value.trim() !== ""),
      );
      if (companySignsFirst) {
        contractVariables.empresa_assina_primeiro = "sim";
        contractVariables.empresa_assinatura_data = new Date().toISOString();
      } else {
        delete contractVariables.empresa_assina_primeiro;
        delete contractVariables.empresa_assinatura_data;
      }
      const contract = await adminApi.createContract({
        customerId,
        templateId,
        variables: contractVariables,
        expiresInDays: Number(expiresInDays) || 7,
      });
      localStorage.setItem(CONTRACT_VARIABLES_STORAGE_KEY, JSON.stringify(variables));
      const sent = await adminApi.sendContract(contract.id);
      setModalOpen(false);
      setSuccess(`Contrato ${sent.code} criado. Link pronto para envio.`);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar contrato");
    } finally {
      setSaving(false);
    }
  }

  async function copyLink(contract: Contract) {
    try {
      const full = await adminApi.getContract(contract.id);
      if (!full.signingUrl) return;
      await navigator.clipboard.writeText(full.signingUrl);
      setSuccess("Link copiado para a área de transferência.");
    } catch {
      setError("Não foi possível copiar o link.");
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Contratos</h1>
          <p>Gere contratos para clientes e envie o link de assinatura.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setModalOpen(true)}>
          Novo contrato
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="search-bar card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="contract-search">Buscar</label>
          <input
            id="contract-search"
            type="search"
            placeholder="Código, cliente..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && load()}
          />
        </div>
      </div>

      <div className="filters">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.label}
              type="button"
              className={statusFilter === f.value ? "chip active" : "chip"}
              onClick={() => setStatusFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
      </div>

      {loading ? (
        <div className="empty">Carregando...</div>
      ) : filtered.length === 0 ? (
        <div className="empty">Nenhum contrato encontrado.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>
                    <Link to={`/contracts/${c.id}`}>{c.code}</Link>
                  </td>
                  <td>{c.customer?.fullName ?? ""}</td>
                  <td>
                    <span className={contractStatusClass(c.status)}>{CONTRACT_STATUS_LABELS[c.status]}</span>
                  </td>
                  <td>{c.createdAt ? new Date(c.createdAt).toLocaleString("pt-BR") : ""}</td>
                  <td>
                    <div className="table-actions">
                    <Link to={`/contracts/${c.id}`} className="btn btn-secondary">
                      Ver
                    </Link>
                    {c.status !== "APPROVED" && c.status !== "CANCELED" && (
                      <button type="button" className="btn btn-secondary" onClick={() => copyLink(c)}>
                        Copiar link
                      </button>
                    )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={modalOpen} title="Novo contrato" onClose={() => !saving && setModalOpen(false)} wide>
        <form onSubmit={handleCreate}>
          {templates.length === 0 ? (
            <div className="alert alert-error">
              Cadastre um modelo em{" "}
              <Link to="/contract-templates">Modelos de contrato</Link> antes de continuar.
            </div>
          ) : (
            <>
              <CustomerPicker
                customers={customers}
                value={customerId}
                onChange={(id) => setCustomerId(id)}
              />
              <div className="field">
                <label htmlFor="contract-template">Modelo</label>
                <select
                  id="contract-template"
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value)}
                  required
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="card manual-vars-card">
                <p className="form-section-title">Criar minha variável</p>
                <p className="search-meta">
                  Informe o nome e o valor. Depois use no modelo com chaves. Ex.: nome{" "}
                  <strong>cnpj</strong> vira <strong>{"{{cnpj}}"}</strong>.
                </p>
                <div className="grid-2">
                  <div className="field">
                    <label htmlFor="manual-variable-key">Nome da variável</label>
                    <input
                      id="manual-variable-key"
                      value={manualVariableKey}
                      onChange={(e) => setManualVariableKey(e.target.value)}
                      placeholder="Ex.: cnpj, empresa, responsavel"
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="manual-variable-value">Informação</label>
                    <input
                      id="manual-variable-value"
                      value={manualVariableValue}
                      onChange={(e) => setManualVariableValue(e.target.value)}
                      placeholder="Ex.: 00.000.000/0001-00"
                    />
                  </div>
                </div>
                <button type="button" className="btn btn-primary" onClick={addManualVariable}>
                  Criar variável
                </button>

                {manualVariableKeys.length > 0 && (
                  <div className="manual-vars-list">
                    {manualVariableKeys.map((key) => (
                      <span key={key} className="manual-var-item">
                        <strong>{variableToken(key)}</strong>
                        <span>{variables[key]}</span>
                        <button type="button" onClick={() => removeManualVariable(key)}>
                          Remover
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <p className="form-section-title">Dados do contrato</p>
              <div className="grid-2">
                {CONTRACT_FORM_VARIABLES.map((variable) => (
                  <div key={variable.key} className="field">
                    <label htmlFor={`contract-${variable.key}`}>{variable.label}</label>
                    <input
                      id={`contract-${variable.key}`}
                      value={variables[variable.key] ?? ""}
                      onChange={(e) => updateVariable(variable.key, e.target.value)}
                      placeholder={variableToken(variable.key)}
                    />
                  </div>
                ))}
              </div>
              <div className="card company-sign-card">
                <label className="checkbox-row">
                  <input
                    type="checkbox"
                    checked={companySignsFirst}
                    onChange={(e) => setCompanySignsFirst(e.target.checked)}
                  />
                  <span>Empresa assina primeiro este contrato</span>
                </label>
                <p className="search-meta">
                  Opcional. Quando marcado, o contrato assinado/PDF mostra a assinatura eletrônica da empresa antes da
                  assinatura do cliente.
                </p>
                {companySignsFirst && (
                  <div className="grid-2">
                    <div className="field">
                      <label htmlFor="contract-representante_nome">Nome de quem assina pela empresa</label>
                      <input
                        id="contract-representante_nome"
                        value={variables.representante_nome ?? ""}
                        onChange={(e) => updateVariable("representante_nome", e.target.value)}
                        placeholder="Ex.: João da Silva"
                        required={companySignsFirst}
                      />
                    </div>
                    <div className="field">
                      <label htmlFor="contract-representante_cpf">CPF do representante</label>
                      <input
                        id="contract-representante_cpf"
                        value={variables.representante_cpf ?? ""}
                        onChange={(e) => updateVariable("representante_cpf", e.target.value)}
                        placeholder="Ex.: 000.000.000-00"
                      />
                    </div>
                  </div>
                )}
              </div>
              <div className="field">
                <label htmlFor="contract-expires">Validade do link (dias)</label>
                <input
                  id="contract-expires"
                  type="number"
                  min={1}
                  max={90}
                  value={expiresInDays}
                  onChange={(e) => setExpiresInDays(e.target.value)}
                />
              </div>
            </>
          )}
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving || templates.length === 0}>
              {saving ? "Criando..." : "Criar e gerar link"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
