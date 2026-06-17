import { FormEvent, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Modal } from "../components/Modal";
import { SignedContractView } from "../components/SignedContractView";
import { adminApi } from "../services/admin-api";
import type { Contract, ContractDocumentType } from "../types/api";
import { CONTRACT_STATUS_LABELS, DOCUMENT_TYPE_LABELS, contractStatusClass } from "../utils/contract-status";
import "./ContractDetailPage.css";

const DOC_TYPES: ContractDocumentType[] = ["ID_FRONT", "ID_BACK", "SELFIE_WITH_ID"];

type VariableRow = {
  id: string;
  key: string;
  value: string;
};

function normalizeVariableKey(value: string) {
  return value
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function variablesToRows(variables: Record<string, string> = {}) {
  return Object.entries(variables).map(([key, value], index) => ({
    id: `${key}-${index}`,
    key,
    value,
  }));
}

export function ContractDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccessMsg] = useState("");
  const [rejectNote, setRejectNote] = useState("");
  const [showReject, setShowReject] = useState(false);
  const [acting, setActing] = useState(false);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});
  const [editOpen, setEditOpen] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editVariables, setEditVariables] = useState<VariableRow[]>([]);
  const [includeDocumentAttachments, setIncludeDocumentAttachments] = useState(true);

  function load() {
    if (!id) return;
    setLoading(true);
    adminApi
      .getContract(id)
      .then(setContract)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  useEffect(() => {
    if (!contract) return;
    const urls: Record<string, string> = {};
    const revokes: string[] = [];

    async function loadImages() {
      for (const type of DOC_TYPES) {
        if (contract!.documents?.some((d) => d.type === type)) {
          try {
            const blob = await adminApi.getContractDocumentBlob(contract!.id, type);
            const url = URL.createObjectURL(blob);
            urls[type] = url;
            revokes.push(url);
          } catch {
            /* ignore */
          }
        }
      }
      if (contract!.signature) {
        try {
          const blob = await adminApi.getContractSignatureBlob(contract!.id);
          const url = URL.createObjectURL(blob);
          urls.signature = url;
          revokes.push(url);
        } catch {
          /* ignore */
        }
      }
      setImageUrls({ ...urls });
    }

    loadImages();
    return () => revokes.forEach((u) => URL.revokeObjectURL(u));
  }, [contract]);

  async function copyLink() {
    if (!contract?.signingUrl) return;
    await navigator.clipboard.writeText(contract.signingUrl);
    setSuccessMsg("Link copiado.");
  }

  async function handleSend() {
    if (!contract) return;
    setActing(true);
    try {
      const updated = await adminApi.sendContract(contract.id);
      setContract(updated);
      if (updated.signingUrl) {
        await navigator.clipboard.writeText(updated.signingUrl);
      }
      setSuccessMsg("Link enviado/gerado e copiado. Envie para o cliente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setActing(false);
    }
  }

  function openEdit() {
    if (!contract) return;
    setEditTitle(contract.title);
    setEditContent(contract.content);
    setEditVariables(variablesToRows(contract.variables ?? {}));
    setEditOpen(true);
    setError("");
  }

  function updateEditVariable(id: string, field: "key" | "value", value: string) {
    setEditVariables((prev) => prev.map((row) => (row.id === id ? { ...row, [field]: value } : row)));
  }

  function addEditVariable() {
    setEditVariables((prev) => [...prev, { id: `new-${Date.now()}`, key: "", value: "" }]);
  }

  function removeEditVariable(id: string) {
    setEditVariables((prev) => prev.filter((row) => row.id !== id));
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!contract) return;
    setActing(true);
    try {
      const variables = Object.fromEntries(
        editVariables
          .map((row) => [normalizeVariableKey(row.key), row.value.trim()] as const)
          .filter(([key, value]) => key && value),
      );
      const updated = await adminApi.updateContract(contract.id, {
        title: editTitle,
        content: editContent,
        variables,
      });
      setContract(updated);
      setEditOpen(false);
      setSuccessMsg("Contrato atualizado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao editar contrato");
    } finally {
      setActing(false);
    }
  }

  async function handleGenerateEditLink() {
    if (!contract) return;
    const ok = confirm(
      "Gerar link de edição vai apagar a assinatura e os documentos já enviados para o cliente refazer. Continuar?",
    );
    if (!ok) return;

    setActing(true);
    try {
      const updated = await adminApi.sendContract(contract.id);
      setContract(updated);
      if (updated.signingUrl) {
        await navigator.clipboard.writeText(updated.signingUrl);
      }
      setSuccessMsg("Link de edição gerado e copiado. O cliente poderá reenviar documentos e assinar novamente.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao gerar link de edição");
    } finally {
      setActing(false);
    }
  }

  async function handleApprove() {
    if (!contract) return;
    setActing(true);
    try {
      const updated = await adminApi.approveContract(contract.id);
      setContract(updated);
      setSuccessMsg("Contrato aprovado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setActing(false);
    }
  }

  async function handleReject(e: FormEvent) {
    e.preventDefault();
    if (!contract) return;
    setActing(true);
    try {
      const updated = await adminApi.rejectContract(contract.id, rejectNote);
      setContract(updated);
      setShowReject(false);
      setSuccessMsg("Contrato rejeitado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setActing(false);
    }
  }

  async function handleCancel() {
    if (!contract || !confirm("Cancelar este contrato?")) return;
    setActing(true);
    try {
      const updated = await adminApi.cancelContract(contract.id);
      setContract(updated);
      setSuccessMsg("Contrato cancelado.");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro");
    } finally {
      setActing(false);
    }
  }

  function handleExportPdf() {
    window.print();
  }

  if (loading) return <div className="page empty">Carregando...</div>;
  if (!contract) return <div className="page empty">Contrato não encontrado.</div>;

  return (
    <div className="page contract-detail">
      <div className="page-header">
        <div>
          <p className="breadcrumb">
            <Link to="/contracts">Contratos</Link> / {contract.code}
          </p>
          <h1>{contract.title}</h1>
          <span className={contractStatusClass(contract.status)}>
            {CONTRACT_STATUS_LABELS[contract.status]}
          </span>
        </div>
        <div className="card-actions">
          {!["SIGNED", "APPROVED", "CANCELED"].includes(contract.status) && (
            <button type="button" className="btn btn-secondary" onClick={openEdit} disabled={acting}>
              Editar contrato
            </button>
          )}
          {contract.signingUrl && contract.status !== "APPROVED" && contract.status !== "CANCELED" && (
            <button type="button" className="btn btn-secondary" onClick={copyLink}>
              Copiar link
            </button>
          )}
          {contract.signature && (
            <button type="button" className="btn btn-secondary" onClick={handleExportPdf}>
              Exportar PDF
            </button>
          )}
          {(contract.status === "DRAFT" || contract.status === "REJECTED") && (
            <button type="button" className="btn btn-primary" onClick={handleSend} disabled={acting}>
              {contract.status === "REJECTED" ? "Reenviar para cliente" : "Enviar para cliente"}
            </button>
          )}
          {contract.status === "SIGNED" && (
            <>
              <button type="button" className="btn btn-primary" onClick={handleApprove} disabled={acting}>
                Aprovar
              </button>
              <button type="button" className="btn btn-secondary" onClick={handleGenerateEditLink} disabled={acting}>
                Gerar link de edição
              </button>
              <button type="button" className="btn btn-secondary" onClick={() => setShowReject(true)} disabled={acting}>
                Rejeitar
              </button>
            </>
          )}
          {!["APPROVED", "CANCELED"].includes(contract.status) && (
            <button type="button" className="btn btn-danger" onClick={handleCancel} disabled={acting}>
              Cancelar
            </button>
          )}
        </div>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="grid-2">
        <div className="card">
          <h3>Cliente</h3>
          <p>
            <strong>{contract.customer?.fullName}</strong>
          </p>
          <p>CPF: {contract.customer?.cpf}</p>
          <p>Telefone: {contract.customer?.phone}</p>
          {contract.signingUrl && (
            <p className="signing-link">
              Link:{" "}
              <a href={contract.signingUrl} target="_blank" rel="noreferrer">
                {contract.signingUrl}
              </a>
            </p>
          )}
        </div>
        <div className="card">
          <h3>Auditoria</h3>
          <p>Enviado: {contract.sentAt ? new Date(contract.sentAt).toLocaleString("pt-BR") : ""}</p>
          <p>Aberto: {contract.openedAt ? new Date(contract.openedAt).toLocaleString("pt-BR") : ""}</p>
          <p>Assinado: {contract.signedAt ? new Date(contract.signedAt).toLocaleString("pt-BR") : ""}</p>
          {contract.signature && (
            <>
              <p>IP: {contract.signature.ipAddress ?? ""}</p>
              <p>Assinante: {contract.signature.signerName}</p>
            </>
          )}
          {contract.reviewNote && <p className="review-note">Motivo rejeição: {contract.reviewNote}</p>}
        </div>
      </div>

      <div className="card contract-content-box">
        <h3>Texto do contrato</h3>
        <pre className="contract-content">{contract.content}</pre>
      </div>

      <div className="card">
        <h3>Documentos enviados</h3>
        <div className="doc-grid">
          {DOC_TYPES.map((type) => (
            <div key={type} className="doc-item">
              <p>{DOCUMENT_TYPE_LABELS[type]}</p>
              {imageUrls[type] ? (
                <img src={imageUrls[type]} alt={DOCUMENT_TYPE_LABELS[type]} />
              ) : (
                <div className="doc-missing">Não enviado</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {contract.signature && (
        <div className="card">
          <h3>Assinatura</h3>
          {imageUrls.signature ? (
            <img src={imageUrls.signature} alt="Assinatura" className="signature-preview" />
          ) : (
            <div className="doc-missing">Assinatura registrada</div>
          )}
        </div>
      )}

      {contract.signature && (
        <div className="card printable-contract">
          <div className="card-actions no-print">
            <label className="export-doc-option">
              <input
                type="checkbox"
                checked={includeDocumentAttachments}
                onChange={(e) => setIncludeDocumentAttachments(e.target.checked)}
              />
              <span>Incluir anexos dos documentos no PDF</span>
            </label>
            <button type="button" className="btn btn-primary" onClick={handleExportPdf}>
              Baixar / salvar como PDF
            </button>
          </div>
          <SignedContractView
            code={contract.code}
            title={contract.title}
            content={contract.content}
            customerName={contract.customer?.fullName ?? ""}
            customerCpf={contract.customer?.cpf}
            companyName={contract.variables?.empresa}
            companyCnpj={contract.variables?.cnpj}
            companySignerName={
              contract.variables?.empresa_assina_primeiro === "sim" ? contract.variables?.representante_nome : undefined
            }
            companySignerCpf={contract.variables?.representante_cpf}
            companySignedAt={contract.variables?.empresa_assinatura_data}
            signature={contract.signature}
            signatureUrl={imageUrls.signature}
            documentUrls={
              includeDocumentAttachments
                ? {
                    ID_FRONT: imageUrls.ID_FRONT,
                    ID_BACK: imageUrls.ID_BACK,
                    SELFIE_WITH_ID: imageUrls.SELFIE_WITH_ID,
                  }
                : undefined
            }
          />
        </div>
      )}

      {showReject && (
        <div className="card">
          <h3>Rejeitar contrato</h3>
          <form onSubmit={handleReject}>
            <div className="field">
              <label>Motivo</label>
              <textarea value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} required rows={3} />
            </div>
            <div className="card-actions">
              <button type="button" className="btn btn-secondary" onClick={() => setShowReject(false)}>
                Voltar
              </button>
              <button type="submit" className="btn btn-danger" disabled={acting}>
                Confirmar rejeição
              </button>
            </div>
          </form>
        </div>
      )}

      <Modal open={editOpen} title="Editar contrato" onClose={() => !acting && setEditOpen(false)} wide>
        <form onSubmit={handleEditSubmit}>
          <div className="field">
            <label>Título</label>
            <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} required />
          </div>
          <div className="field">
            <label>Texto do contrato</label>
            <textarea
              rows={12}
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Variáveis do contrato</label>
            <div className="edit-variable-list">
              {editVariables.map((row) => (
                <div className="edit-variable-row" key={row.id}>
                  <input
                    placeholder="nome_da_variavel"
                    value={row.key}
                    onChange={(e) => updateEditVariable(row.id, "key", e.target.value)}
                  />
                  <input
                    placeholder="Valor"
                    value={row.value}
                    onChange={(e) => updateEditVariable(row.id, "value", e.target.value)}
                  />
                  <button type="button" className="btn btn-secondary" onClick={() => removeEditVariable(row.id)}>
                    Remover
                  </button>
                </div>
              ))}
            </div>
            <button type="button" className="btn btn-secondary" onClick={addEditVariable}>
              Adicionar variável
            </button>
            <small>Exemplo: nome `cnpj_minha_empresa` para usar no modelo como {"{{cnpj_minha_empresa}}"}</small>
          </div>
          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => setEditOpen(false)} disabled={acting}>
              Cancelar
            </button>
            <button type="submit" className="btn btn-primary" disabled={acting}>
              {acting ? "Salvando..." : "Salvar alterações"}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
