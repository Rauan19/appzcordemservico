import { useEffect, useRef, useState } from "react";
import "./LiveCameraModal.css";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onCapture: (file: File) => void;
};

export function LiveCameraModal({ open, title, onClose, onCapture }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");

  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setError("");
    setReady(false);

    async function start() {
      stopStream();
      if (!navigator.mediaDevices?.getUserMedia) {
        setError("Este navegador não permite abrir a câmera nesta página. Use HTTPS ou escolha da galeria.");
        return;
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: {
            facingMode: { ideal: facingMode },
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const video = videoRef.current;
        if (video) {
          video.srcObject = stream;
          await video.play();
          setReady(true);
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Erro ao abrir câmera";
        setError(
          `Não foi possível abrir a câmera (${msg}). Permita o acesso à câmera nas configurações do navegador ou use a galeria.`,
        );
      }
    }

    void start();

    return () => {
      cancelled = true;
      stopStream();
    };
  }, [open, facingMode]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }

  function handleClose() {
    stopStream();
    onClose();
  }

  function handleCapture() {
    const video = videoRef.current;
    if (!video || !ready) return;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setError("Não foi possível capturar o frame da câmera.");
      return;
    }
    ctx.drawImage(video, 0, 0, w, h);
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          setError("Falha ao gerar a foto da câmera.");
          return;
        }
        const file = new File([blob], `camera-${Date.now()}.jpg`, {
          type: "image/jpeg",
          lastModified: Date.now(),
        });
        stopStream();
        onCapture(file);
        onClose();
      },
      "image/jpeg",
      0.92,
    );
  }

  if (!open) return null;

  return (
    <div className="live-cam-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="live-cam-sheet">
        <header className="live-cam-header">
          <strong>{title}</strong>
          <button type="button" className="btn btn-secondary live-cam-close" onClick={handleClose}>
            Fechar
          </button>
        </header>

        {error ? (
          <p className="live-cam-error">{error}</p>
        ) : (
          <div className="live-cam-video-wrap">
            <video ref={videoRef} className="live-cam-video" playsInline muted autoPlay />
            {!ready && <p className="live-cam-loading">Abrindo câmera...</p>}
          </div>
        )}

        <div className="live-cam-actions">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setFacingMode((m) => (m === "environment" ? "user" : "environment"))}
            disabled={!!error}
          >
            Virar câmera
          </button>
          <button type="button" className="btn btn-primary" onClick={handleCapture} disabled={!ready || !!error}>
            Capturar foto
          </button>
        </div>
      </div>
    </div>
  );
}
