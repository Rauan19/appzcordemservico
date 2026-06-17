import type { ContractDocumentType } from "../types/api";
import { DOCUMENT_TYPE_LABELS } from "../utils/contract-status";
import "./SignedContractView.css";

type SignatureInfo = {
  signerName?: string | null;
  signerCpf?: string | null;
  signedAt?: string | null;
  ipAddress?: string | null;
};

type Props = {
  code: string;
  title: string;
  content: string;
  customerName: string;
  customerCpf?: string | null;
  companyName?: string | null;
  companyCnpj?: string | null;
  companySignerName?: string | null;
  companySignerCpf?: string | null;
  companySignedAt?: string | null;
  signature?: SignatureInfo | null;
  signatureUrl?: string;
  documentUrls?: Partial<Record<ContractDocumentType, string>>;
  compact?: boolean;
};

function formatDateTime(value?: string | null) {
  if (!value) return "";
  return new Date(value).toLocaleString("pt-BR");
}

export function SignedContractView({
  code,
  title,
  content,
  customerName,
  customerCpf,
  companyName,
  companyCnpj,
  companySignerName,
  companySignerCpf,
  companySignedAt,
  signature,
  signatureUrl,
  documentUrls,
  compact,
}: Props) {
  const hasCompanySignature = Boolean(companySignerName);

  return (
    <article className={compact ? "signed-contract compact" : "signed-contract"}>
      <header className="signed-contract-header">
        <div>
          <p className="signed-contract-label">Contrato eletrônico</p>
          <h2>{title}</h2>
          <span>{code}</span>
        </div>
        <div className="signed-contract-company">
          <strong>{companyName || "Empresa"}</strong>
          {companyCnpj && <span>CNPJ: {companyCnpj}</span>}
        </div>
      </header>

      <section className="signed-contract-parties">
        <div>
          <span>Contratante</span>
          <strong>{customerName}</strong>
          {customerCpf && <p>CPF: {customerCpf}</p>}
        </div>
        <div>
          <span>Assinatura</span>
          <strong>{signature?.signerName || customerName}</strong>
          {signature?.signerCpf && <p>CPF confirmado: {signature.signerCpf}</p>}
          {signature?.signedAt && <p>Data: {formatDateTime(signature.signedAt)}</p>}
          {signature?.ipAddress && <p>IP: {signature.ipAddress}</p>}
        </div>
      </section>

      <section className="signed-contract-text">
        <pre>{content}</pre>
      </section>

      <section className="signed-contract-signatures">
        {hasCompanySignature && (
          <div className="signature-block company-signature-block">
            <span>Assinatura da empresa</span>
            <strong>{companySignerName}</strong>
            {companySignerCpf && <p>CPF: {companySignerCpf}</p>}
            {companySignedAt && <p>Data: {formatDateTime(companySignedAt)}</p>}
            <p>Assinado eletronicamente pela empresa antes do envio ao cliente.</p>
          </div>
        )}
        <div className="signature-block">
          <span>Assinatura do cliente</span>
          {signatureUrl ? (
            <img src={signatureUrl} alt="Assinatura digital" />
          ) : (
            <strong>{signature?.signerName || customerName}</strong>
          )}
          <p>Documento assinado eletronicamente pelo link individual do contrato.</p>
        </div>
      </section>

      {documentUrls && Object.keys(documentUrls).length > 0 && (
        <section className="signed-contract-docs">
          <h3>Documentos anexados</h3>
          <div className="signed-contract-doc-grid">
            {(Object.keys(documentUrls) as ContractDocumentType[]).map((type) => (
              <div key={type}>
                <span>{DOCUMENT_TYPE_LABELS[type]}</span>
                {documentUrls[type] && <img src={documentUrls[type]} alt={DOCUMENT_TYPE_LABELS[type]} />}
              </div>
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
