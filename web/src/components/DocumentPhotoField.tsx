import { useRef, useState } from "react";
import { LiveCameraModal } from "./LiveCameraModal";
import "./DocumentPhotoField.css";

export type PhotoDebugInfo = {
  message: string;
  status?: number;
  url?: string;
  fileName?: string;
  fileType?: string;
  fileSizeMb?: string;
  stage?: string;
  at?: string;
};

type Props = {
  step: number;
  label: string;
  hint: string;
  preview?: string;
  fileName?: string;
  error?: string;
  debug?: PhotoDebugInfo;
  uploaded: boolean;
  uploading: boolean;
  onSelect: (file: File) => void;
};

export function DocumentPhotoField({
  step,
  label,
  hint,
  preview,
  fileName,
  error,
  debug,
  uploaded,
  uploading,
  onSelect,
}: Props) {
  const cameraFileRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const [liveOpen, setLiveOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
  }

  async function copyDebug() {
    if (!debug) return;
    const text = [
      `erro: ${debug.message}`,
      `status: ${debug.status ?? "-"}`,
      `url: ${debug.url ?? "-"}`,
      `arquivo: ${debug.fileName ?? "-"}`,
      `tipo: ${debug.fileType ?? "-"}`,
      `tamanho_mb: ${debug.fileSizeMb ?? "-"}`,
      `etapa: ${debug.stage ?? "-"}`,
      `quando: ${debug.at ?? "-"}`,
      `ua: ${navigator.userAgent}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copie o erro abaixo:", text);
    }
  }

  return (
    <div
      className={`doc-photo-field ${uploaded ? "doc-photo-field--done" : ""} ${
        error ? "doc-photo-field--error" : ""
      }`}
    >
      <div className="doc-photo-field-head">
        <span className="doc-photo-step">{step}</span>
        <div>
          <strong className="doc-photo-label">{label}</strong>
          <p className="doc-photo-hint">{hint}</p>
        </div>
        {uploaded && <span className="doc-photo-badge">✓ Anexado</span>}
        {!uploaded && error && <span className="doc-photo-badge doc-photo-badge--error">Erro</span>}
        {!uploaded && !error && preview && <span className="doc-photo-badge">Selecionada</span>}
      </div>

      {preview ? (
        <div className="doc-photo-preview-wrap">
          <img src={preview} alt={label} className="doc-photo-preview" />
          <div className="doc-photo-attached">
            <span>Foto anexada</span>
            {fileName && <small>{fileName}</small>}
          </div>
        </div>
      ) : (
        <div className="doc-photo-empty">
          <span>Sem foto anexada</span>
        </div>
      )}

      {error && <p className="doc-photo-error">{error}</p>}

      {debug && (
        <div className="doc-photo-debug">
          <strong>Detalhes técnicos (para suporte)</strong>
          <pre>
            {`status: ${debug.status ?? "-"}
url: ${debug.url ?? "-"}
arquivo: ${debug.fileName ?? "-"}
tipo: ${debug.fileType ?? "-"}
tamanho: ${debug.fileSizeMb ?? "-"} MB
etapa: ${debug.stage ?? "-"}
quando: ${debug.at ?? "-"}
msg: ${debug.message}`}
          </pre>
          <button type="button" className="btn btn-secondary doc-photo-debug-copy" onClick={copyDebug}>
            {copied ? "Copiado!" : "Copiar erro"}
          </button>
        </div>
      )}

      <div className="doc-photo-actions">
        <button
          type="button"
          className="btn btn-primary doc-photo-btn"
          disabled={uploading}
          onClick={() => setLiveOpen(true)}
        >
          {uploading ? "Enviando..." : uploaded ? "Abrir câmera" : "Abrir câmera"}
        </button>
        <button
          type="button"
          className="btn btn-secondary doc-photo-btn"
          disabled={uploading}
          onClick={() => cameraFileRef.current?.click()}
        >
          Câmera do aparelho
        </button>
        <button
          type="button"
          className="btn btn-secondary doc-photo-btn"
          disabled={uploading}
          onClick={() => galleryRef.current?.click()}
        >
          Escolher da galeria
        </button>
      </div>

      <input
        ref={cameraFileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="doc-photo-input-hidden"
        onChange={handleChange}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        className="doc-photo-input-hidden"
        onChange={handleChange}
      />

      <LiveCameraModal
        open={liveOpen}
        title={label}
        onClose={() => setLiveOpen(false)}
        onCapture={onSelect}
      />
    </div>
  );
}
