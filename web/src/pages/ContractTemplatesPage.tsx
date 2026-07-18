import { FormEvent, useEffect, useRef, useState } from "react";
import { Modal } from "../components/Modal";
import { bindTemplateTextareaDrop, TemplateVariableChips } from "../components/TemplateVariableChips";
import { adminApi } from "../services/admin-api";
import type { ContractTemplate } from "../types/api";
import DEFAULT_CONTENT from "../utils/zcnet-contract-template.txt?raw";
import "./ContractTemplatesPage.css";

const emptyForm = { name: "Termo de Adesão ZC NET (SCM/SVA)", content: DEFAULT_CONTENT, active: true };

export function ContractTemplatesPage() {
  const [templates, setTemplates] = useState<ContractTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<ContractTemplate | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  const textareaDrop = bindTemplateTextareaDrop(contentRef, (content) =>
    setForm((f) => ({ ...f, content })),
  );

  function load() {
    setLoading(true);
    adminApi
      .listContractTemplates()
      .then(setTemplates)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function openEdit(t: ContractTemplate) {
    setEditing(t);
    setForm({ name: t.name, content: t.content, active: t.active });
    setError("");
    setModalOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (editing) {
        await adminApi.updateContractTemplate(editing.id, form);
        setSuccess("Modelo atualizado.");
      } else {
        await adminApi.createContractTemplate(form);
        setSuccess("Modelo criado.");
      }
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Modelos de contrato</h1>
          <p>Arraste ou clique nas variáveis para montar o contrato.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openCreate}>
          Novo modelo
        </button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      {loading ? (
        <div className="empty">Carregando...</div>
      ) : templates.length === 0 ? (
        <div className="empty">Nenhum modelo cadastrado.</div>
      ) : (
        <div className="card table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Versão</th>
                <th>Contratos</th>
                <th>Status</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {templates.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>v{t.version}</td>
                  <td>{t._count?.contracts ?? 0}</td>
                  <td>{t.active ? "Ativo" : "Inativo"}</td>
                  <td>
                    <button type="button" className="btn btn-secondary" onClick={() => openEdit(t)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        open={modalOpen}
        title={editing ? "Editar modelo" : "Novo modelo"}
        onClose={() => !saving && setModalOpen(false)}
        wide
      >
        <form onSubmit={handleSubmit}>
          <div className="field">
            <label htmlFor="tpl-name">Nome</label>
            <input
              id="tpl-name"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="tpl-content">Conteúdo do contrato</label>
            <TemplateVariableChips
              textareaRef={contentRef}
              onInsert={(content) => setForm((f) => ({ ...f, content }))}
            />
            <textarea
              id="tpl-content"
              ref={contentRef}
              className="template-content-area"
              rows={14}
              value={form.content}
              onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))}
              onDragOver={textareaDrop.onDragOver}
              onDrop={textareaDrop.onDrop}
              required
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Modelo ativo
          </label>
          {error && <div className="alert alert-error">{error}</div>}
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
