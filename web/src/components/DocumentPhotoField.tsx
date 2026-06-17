import { useRef } from "react";
import "./DocumentPhotoField.css";

type Props = {
  step: number;
  label: string;
  hint: string;
  preview?: string;
  fileName?: string;
  error?: string;
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
  uploaded,
  uploading,
  onSelect,
}: Props) {
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onSelect(file);
    e.target.value = "";
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

      <div className="doc-photo-actions">
        <button
          type="button"
          className="btn btn-primary doc-photo-btn"
          disabled={uploading}
          onClick={() => cameraRef.current?.click()}
        >
          {uploading ? "Enviando..." : uploaded ? "Trocar foto" : "Tirar foto"}
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
        ref={cameraRef}
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
    </div>
  );
}
