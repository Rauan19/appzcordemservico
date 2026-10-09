import { FormEvent, useEffect, useState } from "react";
import { adminApi } from "../services/admin-api";
import type { Contract } from "../types/api";
import { Modal } from "./Modal";
import "../pages/ContractDetailPage.css";

type VariableRow = { id: string; key: string; value: string };

/** Contratos nesses status já foram assinados/encerrados e não podem mais ser editados. */
export function canEditContract(status: Contract["status"]) {
  return !["SIGNED", "APPROVED", "CANCELED"].includes(status);
}

function normalizeVariableKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function variablesToRows(variables: Record<string, string> = {}): VariableRow[] {
  return Object.entries(variables).map(([key, value], index) => ({
    id: `${key}-${index}`,
    key,
    value,
  }));
}

type Props = {
  /** Contrato a editar; `null` mantém o modal fechado. */
  contract: Contract | null;
  onClose: () => void;
  onSaved: (updated: Contract) => void;
};

export function ContractEditModal({ contract, onClose, onSaved }: Props) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [variables, setVariables] = useState<VariableRow[]>([]);
  const [regenerate, setRegenerate] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Recarrega o formulário sempre que abrir outro contrato.
  useEffect(() => {
    if (!contract) return;
    setTitle(contract.title);
    setContent(contract.content);
    setVariables(variablesToRows(contract.variables ?? {}));
    setRegenerate(false);
    setError("");
  }, [contract?.id]);

  function updateVariable(id: string, field: "key" | "value", value: string) {
    setVariables((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contract) return;
    setSaving(true);
    setError("");
    try {
      const vars = Object.fromEntries(
        variables
          .map((row) => [normalizeVariableKey(row.key), row.value.trim()] as const)
          .filter(([key, value]) => key && value),
      );
      const updated = await adminApi.updateContract(contract.id, {
        title,
        content,
        variables: vars,
        regenerate: regenerate || undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar contrato");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal open={!!contract} title="Editar contrato" onClose={() => !saving && onClose()} wide>
      <form onSubmit={handleSubmit}>
        {error ? <div className="alert alert-error">{error}</div> : null}
        {contract ? (
          <p className="edit-contract-hint">
            {contract.code} — {contract.customer?.fullName ?? ""}. Só dá para editar antes da assinatura.
          </p>
        ) : null}
        <div className="field">
          <label>Título</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="field">
          <label>Texto do contrato</label>
          <textarea
            rows={12}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={regenerate}
            required
          />
        </div>
        <div className="field">
          <label>Variáveis do contrato</label>
          <div className="edit-variable-list">
            {variables.map((row) => (
              <div className="edit-variable-row" key={row.id}>
                <input
                  placeholder="nome_da_variavel"
                  value={row.key}
                  onChange={(e) => updateVariable(row.id, "key", e.target.value)}
                />
                <input
                  placeholder="Valor"
                  value={row.value}
                  onChange={(e) => updateVariable(row.id, "value", e.target.value)}
                />
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setVariables((prev) => prev.filter((r) => r.id !== row.id))}
                >
                  Remover
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() =>
              setVariables((prev) => [...prev, { id: `new-${Date.now()}`, key: "", value: "" }])
            }
          >
            Adicionar variável
          </button>
          <small>Exemplo: nome `cnpj_minha_empresa` para usar no modelo como {"{{cnpj_minha_empresa}}"}</small>
        </div>
        <label className="checkbox-field">
          <input type="checkbox" checked={regenerate} onChange={(e) => setRegenerate(e.target.checked)} />
          Refazer o texto a partir do modelo com estas variáveis (descarta o que foi digitado no texto acima)
        </label>
        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={saving}>
            Cancelar
          </button>
          <button type="submit" className="btn btn-primary" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
