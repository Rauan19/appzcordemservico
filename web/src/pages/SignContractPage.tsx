import { FormEvent, useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { DocumentPhotoField } from "../components/DocumentPhotoField";
import { SignedContractView } from "../components/SignedContractView";
import { TypedSignatureField, type SignatureMode } from "../components/TypedSignatureField";
import {
  publicApi,
  publicDocumentUrl,
  publicSign,
  publicSignatureUrl,
  publicUpload,
} from "../lib/public-api";
import type { ContractDocumentType, PublicContract } from "../types/api";
import { DOCUMENT_TYPE_LABELS } from "../utils/contract-status";
import { renderTypedSignatureImage } from "../utils/typed-signature";
import "./SignContractPage.css";

const STEPS = ["Contrato", "Documentos", "Assinatura", "Concluído"] as const;

const DOC_FIELDS: Array<{ type: ContractDocumentType; label: string; hint: string }> = [
  {
    type: "ID_FRONT",
    label: DOCUMENT_TYPE_LABELS.ID_FRONT,
    hint: "Fotografe a parte da frente do RG ou CNH, com todos os dados legíveis.",
  },
  {
    type: "ID_BACK",
    label: DOCUMENT_TYPE_LABELS.ID_BACK,
    hint: "Fotografe o verso do documento, sem cortar as bordas.",
  },
  {
    type: "SELFIE_WITH_ID",
    label: DOCUMENT_TYPE_LABELS.SELFIE_WITH_ID,
    hint: "Tire uma selfie segurando o documento aberto ao lado do rosto.",
  },
];

function allDocumentsUploaded(documents: PublicContract["documents"]) {
  return DOC_FIELDS.every((field) =>
    documents.some((d) => d.type === field.type && d.uploaded),
  );
}

function resolveInitialStep(data: PublicContract) {
  if (data.signed) return 3;
  if (allDocumentsUploaded(data.documents)) return 2;
  if (data.documents.some((d) => d.uploaded)) return 1;
  return 0;
}

export function SignContractPage() {
  const { token } = useParams<{ token: string }>();
  const [contract, setContract] = useState<PublicContract | null>(null);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState<string | null>(null);
  const [signerName, setSignerName] = useState("");
  const [signerCpf, setSignerCpf] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [signMode, setSignMode] = useState<SignatureMode>("typed");
  const [drawnSignature, setDrawnSignature] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [previews, setPreviews] = useState<Partial<Record<ContractDocumentType, string>>>({});
  const [photoNames, setPhotoNames] = useState<Partial<Record<ContractDocumentType, string>>>({});
  const [photoErrors, setPhotoErrors] = useState<Partial<Record<ContractDocumentType, string>>>({});
  const [includeDocumentAttachments, setIncludeDocumentAttachments] = useState(true);
  const signatureUrl = token && contract?.signed ? publicSignatureUrl(token) : undefined;

  function load() {
    if (!token) return;
    setLoading(true);
    publicApi<PublicContract>(`/public/contracts/${token}`)
      .then((data) => {
        setContract(data);
        if (!signerName) setSignerName(data.customerName);
        setPreviews((current) => {
          const next = { ...current };
          for (const field of DOC_FIELDS) {
            const uploaded = data.documents.some((d) => d.type === field.type && d.uploaded);
            if (uploaded && !next[field.type]) {
              next[field.type] = publicDocumentUrl(token, field.type);
            }
          }
          return next;
        });
        setStep(resolveInitialStep(data));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Contrato não encontrado"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [token]);

  function isUploaded(type: ContractDocumentType) {
    return contract?.documents.some((d) => d.type === type && d.uploaded);
  }

  function missingDocuments() {
    return DOC_FIELDS.filter((field) => !isUploaded(field.type));
  }

  async function handleFile(type: ContractDocumentType, file: File) {
    if (!token) return;
    setUploading(type);
    setError("");
    setPhotoErrors((p) => ({ ...p, [type]: undefined }));
    const localPreview = URL.createObjectURL(file);
    setPreviews((p) => ({ ...p, [type]: localPreview }));
    setPhotoNames((p) => ({ ...p, [type]: file.name }));
    try {
      await publicUpload(token, type, file);
      const updated = await publicApi<PublicContract>(`/public/contracts/${token}`);
      setContract(updated);
    } catch (e) {
      const label = DOC_FIELDS.find((field) => field.type === type)?.label ?? "foto";
      const detail = e instanceof Error ? e.message : "Erro no upload";
      setPhotoErrors((p) => ({
        ...p,
        [type]: `Não foi possível enviar ${label.toLowerCase()}. ${detail}. Tente tirar outra foto ou escolher da galeria.`,
      }));
    } finally {
      setUploading(null);
    }
  }

  function canGoToSign() {
    return contract ? allDocumentsUploaded(contract.documents) : false;
  }

  function canSubmitSign() {
    const cpfOk = signerCpf.replace(/\D/g, "").length >= 11;
    const nameOk = signerName.trim().length >= 3;
    if (!accepted || !cpfOk || !nameOk) return false;
    if (signMode === "drawn") return !!drawnSignature;
    return true;
  }

  async function handleSign(e: FormEvent) {
    e.preventDefault();
    if (!token || !canSubmitSign()) return;
    setSubmitting(true);
    setError("");
    try {
      const signatureBase64 =
        signMode === "drawn" && drawnSignature
          ? drawnSignature
          : renderTypedSignatureImage(signerName);

      if (!signatureBase64) {
        setError("Informe seu nome completo para assinar.");
        setSubmitting(false);
        return;
      }
      let latitude: number | undefined;
      let longitude: number | undefined;
      try {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
          navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 8000 }),
        );
        latitude = pos.coords.latitude;
        longitude = pos.coords.longitude;
      } catch {
        /* opcional */
      }

      await publicSign(token, {
        signerName: signerName.trim(),
        signerCpf,
        acceptedTerms: true,
        signatureBase64,
        latitude,
        longitude,
      });
      const updated = await publicApi<PublicContract>(`/public/contracts/${token}`);
      setContract(updated);
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao assinar");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="sign-page">
        <div className="sign-card empty">Carregando contrato...</div>
      </div>
    );
  }

  if (!contract) {
    return (
      <div className="sign-page">
        <div className="sign-card alert alert-error">{error || "Contrato não encontrado."}</div>
      </div>
    );
  }

  function handleExportPdf() {
    window.print();
  }

  return (
    <div className="sign-page">
      <header className="sign-header">
        <img src="/logo.png" alt="ZCnet" className="sign-logo" />
        <div>
          <strong>Assinatura de contrato</strong>
          <span>{contract.code}</span>
        </div>
      </header>

      <div className="sign-steps">
        {STEPS.map((label, i) => (
          <span key={label} className={i <= step ? "sign-step active" : "sign-step"}>
            {i + 1}. {label}
          </span>
        ))}
      </div>

      <div className="sign-card">
        {error && <div className="alert alert-error">{error}</div>}

        {step === 0 && (
          <>
            <h1>{contract.title}</h1>
            <p className="sign-greeting">Olá, {contract.customerName}!</p>
            <pre className="contract-content">{contract.content}</pre>
            <label className="checkbox-field">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} />
              Li e concordo com os termos do contrato
            </label>
            <button
              type="button"
              className="btn btn-primary sign-next sign-btn-large"
              disabled={!accepted}
              onClick={() => {
                setAccepted(false);
                setStep(1);
              }}
            >
              Continuar para documentos
            </button>
          </>
        )}

        {step === 1 && (
          <>
            <h1>Fotos do documento</h1>
            <p className="sign-hint">
              Envie as 3 fotos abaixo. Toque em <strong>Tirar foto</strong> para abrir a câmera ou use{" "}
              <strong>Galeria</strong> se já tiver a imagem salva.
            </p>
            <div className="sign-docs">
              {DOC_FIELDS.map(({ type, label, hint }, index) => (
                <DocumentPhotoField
                  key={type}
                  step={index + 1}
                  label={label}
                  hint={hint}
                  preview={previews[type]}
                  fileName={photoNames[type]}
                  error={photoErrors[type]}
                  uploaded={!!isUploaded(type)}
                  uploading={uploading === type}
                  onSelect={(file) => handleFile(type, file)}
                />
              ))}
            </div>
            {!canGoToSign() && (
              <div className="sign-missing-docs">
                <strong>Para continuar, envie:</strong>
                <ul>
                  {missingDocuments().map((field) => (
                    <li key={field.type}>{field.label}</li>
                  ))}
                </ul>
              </div>
            )}
            <div className="sign-nav">
              <button type="button" className="btn btn-secondary sign-btn-large" onClick={() => setStep(0)}>
                Voltar
              </button>
              <button
                type="button"
                className="btn btn-primary sign-btn-large"
                disabled={!canGoToSign()}
                onClick={() => setStep(2)}
              >
                Continuar para assinatura
              </button>
            </div>
          </>
        )}

        {step === 2 && (
          <form onSubmit={handleSign}>
            <h1>Confirmar assinatura</h1>
            <p className="sign-hint">
              Preencha seus dados e digite seu nome. É simples e rápido.
            </p>
            <TypedSignatureField
              mode={signMode}
              onModeChange={setSignMode}
              signerName={signerName}
              onSignerNameChange={setSignerName}
              onDrawnChange={setDrawnSignature}
            />
            <div className="field">
              <label htmlFor="signer-cpf">CPF (somente números)</label>
              <input
                id="signer-cpf"
                className="sign-input-large"
                value={signerCpf}
                onChange={(e) => setSignerCpf(e.target.value)}
                required
                inputMode="numeric"
                placeholder="000.000.000-00"
                autoComplete="off"
              />
            </div>
            <label className="checkbox-field sign-checkbox-large">
              <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} required />
              Confirmo que li o contrato, as fotos são minhas e as informações são verdadeiras
            </label>
            <div className="sign-nav">
              <button type="button" className="btn btn-secondary sign-btn-large" onClick={() => setStep(1)}>
                Voltar
              </button>
              <button
                type="submit"
                className="btn btn-primary sign-btn-large"
                disabled={submitting || !canSubmitSign()}
              >
                {submitting ? "Enviando..." : "Confirmar e assinar"}
              </button>
            </div>
          </form>
        )}

        {step === 3 && (
          <div className="sign-done printable-contract">
            <div className="no-print">
              <h1>Contrato assinado!</h1>
              <p>Sua assinatura e documentos foram recebidos. Você pode salvar uma cópia em PDF.</p>
              <label className="export-doc-option">
                <input
                  type="checkbox"
                  checked={includeDocumentAttachments}
                  onChange={(e) => setIncludeDocumentAttachments(e.target.checked)}
                />
                <span>Incluir anexos dos documentos no PDF</span>
              </label>
              <button type="button" className="btn btn-primary sign-btn-large" onClick={handleExportPdf}>
                Baixar / salvar PDF
              </button>
            </div>
            <SignedContractView
              compact
              code={contract.code}
              title={contract.title}
              content={contract.content}
              customerName={contract.customerName}
              companyName={contract.variables?.empresa}
              companyCnpj={contract.variables?.cnpj}
              companySignerName={
                contract.variables?.empresa_assina_primeiro === "sim" ? contract.variables?.representante_nome : undefined
              }
              companySignerCpf={contract.variables?.representante_cpf}
              companySignedAt={contract.variables?.empresa_assinatura_data}
              signature={contract.signature ?? { signerName, signerCpf }}
              signatureUrl={signatureUrl}
              documentUrls={
                token && includeDocumentAttachments
                  ? {
                      ID_FRONT: publicDocumentUrl(token, "ID_FRONT"),
                      ID_BACK: publicDocumentUrl(token, "ID_BACK"),
                      SELFIE_WITH_ID: publicDocumentUrl(token, "SELFIE_WITH_ID"),
                    }
                  : undefined
              }
            />
          </div>
        )}
      </div>
    </div>
  );
}
