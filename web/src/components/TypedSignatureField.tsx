import { SignaturePad } from "./SignaturePad";
import "./TypedSignatureField.css";
export type SignatureMode = "typed" | "drawn";

type Props = {
  mode: SignatureMode;
  onModeChange: (mode: SignatureMode) => void;
  signerName: string;
  onSignerNameChange: (name: string) => void;
  onDrawnChange: (dataUrl: string | null) => void;
};

export function TypedSignatureField({
  mode,
  onModeChange,
  signerName,
  onSignerNameChange,
  onDrawnChange,
}: Props) {
  const showPreview = signerName.trim().length >= 3;

  return (
    <div className="typed-signature-field">
      <div className="sign-mode-tabs" role="tablist" aria-label="Forma de assinar">
        <button
          type="button"
          role="tab"
          aria-selected={mode === "typed"}
          className={mode === "typed" ? "sign-mode-tab active" : "sign-mode-tab"}
          onClick={() => onModeChange("typed")}
        >
          ✓ Digitar meu nome
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "drawn"}
          className={mode === "drawn" ? "sign-mode-tab active" : "sign-mode-tab"}
          onClick={() => onModeChange("drawn")}
        >
          Desenhar no dedo
        </button>
      </div>

      {mode === "typed" ? (
        <div className="typed-sign-body">
          <p className="typed-sign-help">
            Digite seu <strong>nome completo</strong> como está no RG ou CNH. É a forma mais fácil — não
            precisa desenhar nada.
          </p>
          <div className="field">
            <label htmlFor="signer-name-signature">Nome completo</label>
            <input
              id="signer-name-signature"
              className="sign-input-large"
              value={signerName}
              onChange={(e) => onSignerNameChange(e.target.value)}
              placeholder="Ex.: Maria da Silva Santos"
              autoComplete="name"
              required
            />
          </div>
          {showPreview && (
            <div className="typed-sign-preview" aria-live="polite">
              <span className="typed-sign-preview-label">Sua assinatura ficará assim:</span>
              <p className="typed-sign-preview-text">{signerName.trim()}</p>
            </div>
          )}
        </div>
      ) : (
        <div className="typed-sign-body">
          <p className="typed-sign-help">Desenhe sua assinatura no quadro com o dedo ou caneta.</p>
          <SignaturePad onChange={onDrawnChange} />
        </div>
      )}
    </div>
  );
}
