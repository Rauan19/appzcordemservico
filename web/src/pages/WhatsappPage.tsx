import { FormEvent, useEffect, useRef, useState } from "react";
import { Navigate } from "react-router-dom";
import { useCanAccess } from "../contexts/AuthContext";
import {
  adminApi,
  type WhatsappInstance,
  type WhatsappQr,
  type WhatsappStatus,
} from "../services/admin-api";
import "./WhatsappPage.css";

const statusLabel: Record<WhatsappStatus, string> = {
  open: "Conectado",
  connecting: "Aguardando QR Code",
  close: "Desconectado",
};

const statusBadge: Record<WhatsappStatus, string> = {
  open: "badge-success",
  connecting: "badge-warning",
  close: "badge-muted",
};

function qrSrc(qr: WhatsappQr) {
  if (!qr.base64) return null;
  return qr.base64.startsWith("data:") ? qr.base64 : `data:image/png;base64,${qr.base64}`;
}

export function WhatsappPage() {
  const isAdmin = useCanAccess(["ADMIN"]);
  const [instances, setInstances] = useState<WhatsappInstance[]>([]);
  const [max, setMax] = useState(2);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [newName, setNewName] = useState("");

  const [qrFor, setQrFor] = useState<string | null>(null);
  const [qr, setQr] = useState<WhatsappQr | null>(null);
  const qrForRef = useRef<string | null>(null);
  qrForRef.current = qrFor;

  function load(silent = false) {
    if (!silent) setLoading(true);
    return adminApi
      .listWhatsappInstances()
      .then((data) => {
        setInstances(data.instances);
        setMax(data.max);
        const current = qrForRef.current;
        if (current && data.instances.find((i) => i.name === current)?.status === "open") {
          setQrFor(null);
          setQr(null);
          setSuccess(`${current} conectado com sucesso.`);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  // Enquanto o QR está aberto: confere a conexão e renova o QR (ele expira em ~30s).
  useEffect(() => {
    if (!qrFor) return;
    const name = qrFor;
    const poll = setInterval(() => void load(true), 3000);
    const refresh = setInterval(() => {
      adminApi.getWhatsappQr(name).then(setQr).catch(() => undefined);
    }, 25000);
    return () => {
      clearInterval(poll);
      clearInterval(refresh);
    };
  }, [qrFor]);

  if (!isAdmin) return <Navigate to="/" replace />;

  async function run(name: string, action: () => Promise<void>) {
    setBusy(name);
    setError("");
    setSuccess("");
    try {
      await action();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro na operação");
    } finally {
      setBusy(null);
    }
  }

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    await run("__create", async () => {
      const res = await adminApi.createWhatsappInstance(name);
      setNewName("");
      setQrFor(res.instance.name);
      setQr(res.qr);
      await load(true);
    });
  }

  function handleConnect(name: string) {
    return run(name, async () => {
      const res = await adminApi.getWhatsappQr(name);
      setQrFor(name);
      setQr(res);
    });
  }

  function handleDisconnect(name: string) {
    if (!window.confirm(`Desconectar o aparelho da instância "${name}"?`)) return;
    return run(name, async () => {
      await adminApi.disconnectWhatsapp(name);
      setSuccess(`${name} desconectado.`);
      await load(true);
    });
  }

  function handleDelete(name: string) {
    if (!window.confirm(`Excluir a instância "${name}"? Isso desconecta o aparelho e apaga a instância.`)) return;
    return run(name, async () => {
      await adminApi.deleteWhatsappInstance(name);
      if (qrFor === name) {
        setQrFor(null);
        setQr(null);
      }
      setSuccess(`${name} excluída.`);
      await load(true);
    });
  }

  const full = instances.length >= max;
  const qrImage = qr ? qrSrc(qr) : null;

  return (
    <div className="page whatsapp-page">
      <div className="page-header">
        <div>
          <h1>Conectar WhatsApp</h1>
          <p>
            Cada aparelho é uma instância na Evolution API. Limite de {max} aparelhos
            ({instances.length}/{max} em uso).
          </p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={() => load()} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="grid-2 whatsapp-grid">
        <form className="card card-accent" onSubmit={handleCreate}>
          <h3>Nova instância</h3>
          <div className="field">
            <label htmlFor="wa-name">Nome da instância *</label>
            <input
              id="wa-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="ex.: atendimento1"
              pattern="[a-zA-Z0-9_\-]{2,40}"
              title="2 a 40 caracteres: letras, números, - ou _"
              disabled={full}
              required
            />
          </div>
          <button type="submit" className="btn btn-primary" disabled={full || busy === "__create"}>
            {busy === "__create" ? "Criando…" : "Criar e gerar QR Code"}
          </button>
          {full ? (
            <p className="whatsapp-hint">Limite atingido. Exclua uma instância para criar outra.</p>
          ) : null}
        </form>

        <div className="card whatsapp-qr">
          <h3>QR Code{qrFor ? ` — ${qrFor}` : ""}</h3>
          {qrFor ? (
            <>
              {qrImage ? (
                <img src={qrImage} alt="QR Code do WhatsApp" className="whatsapp-qr-img" />
              ) : (
                <p className="empty">QR ainda não disponível. Aguarde…</p>
              )}
              {qr?.pairingCode ? (
                <p className="whatsapp-hint">
                  Código de pareamento: <strong>{qr.pairingCode}</strong>
                </p>
              ) : null}
              <p className="whatsapp-hint">
                No celular: WhatsApp → Aparelhos conectados → Conectar um aparelho. O QR renova
                sozinho.
              </p>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => {
                  setQrFor(null);
                  setQr(null);
                }}
              >
                Fechar
              </button>
            </>
          ) : (
            <p className="empty">Crie uma instância ou clique em “Conectar” para gerar o QR.</p>
          )}
        </div>
      </div>

      <div className="card">
        <h3>Instâncias</h3>
        {loading && instances.length === 0 ? (
          <p className="empty">Carregando…</p>
        ) : instances.length === 0 ? (
          <p className="empty">Nenhuma instância criada ainda.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Instância</th>
                  <th>Número</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {instances.map((i) => (
                  <tr key={i.name}>
                    <td>
                      <strong>{i.name}</strong>
                      {i.profileName ? <div className="whatsapp-sub">{i.profileName}</div> : null}
                    </td>
                    <td>{i.number ? `+${i.number}` : "—"}</td>
                    <td>
                      <span className={`badge ${statusBadge[i.status]}`}>{statusLabel[i.status]}</span>
                    </td>
                    <td className="whatsapp-actions">
                      {i.status === "open" ? (
                        <button
                          type="button"
                          className="btn btn-secondary"
                          disabled={busy === i.name}
                          onClick={() => handleDisconnect(i.name)}
                        >
                          Desconectar
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="btn btn-primary"
                          disabled={busy === i.name}
                          onClick={() => handleConnect(i.name)}
                        >
                          Conectar
                        </button>
                      )}
                      <button
                        type="button"
                        className="btn btn-danger"
                        disabled={busy === i.name}
                        onClick={() => handleDelete(i.name)}
                      >
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
