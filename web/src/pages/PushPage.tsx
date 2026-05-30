import { FormEvent, useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { useCanAccess } from "../contexts/AuthContext";
import { adminApi } from "../services/admin-api";
import type { PushOverview, User } from "../types/api";
import "./PushPage.css";

const platformLabels: Record<string, string> = {
  android: "Android",
  ios: "iOS",
  web: "Web",
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("pt-BR");
}

export function PushPage() {
  const isAdmin = useCanAccess(["ADMIN"]);
  const [overview, setOverview] = useState<PushOverview | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [title, setTitle] = useState("Teste ZCnet");
  const [body, setBody] = useState("Notificação de teste enviada pelo painel administrativo.");
  const [orderId, setOrderId] = useState("");
  const [selectedTechIds, setSelectedTechIds] = useState<string[]>([]);
  const [sendToAll, setSendToAll] = useState(true);

  const connectedTechIds = useMemo(() => {
    if (!overview) return new Set<string>();
    return new Set(
      overview.devices
        .filter((d) => d.user.role === "TECHNICIAN" && d.user.active !== false)
        .map((d) => d.user.id),
    );
  }, [overview]);

  const connectedTechnicians = useMemo(
    () => technicians.filter((t) => connectedTechIds.has(t.id)),
    [technicians, connectedTechIds],
  );

  function load() {
    setLoading(true);
    setError("");
    Promise.all([adminApi.getPushOverview(), adminApi.listTechnicians()])
      .then(([data, techs]) => {
        setOverview(data);
        setTechnicians(techs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  function toggleTechnician(id: string) {
    setSendToAll(false);
    setSelectedTechIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function handleSend(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    const trimmedTitle = title.trim();
    const trimmedBody = body.trim();
    if (!trimmedTitle || !trimmedBody) {
      setError("Informe título e mensagem da notificação.");
      return;
    }

    const technicianIds = sendToAll ? undefined : selectedTechIds;
    if (!sendToAll && (!technicianIds || technicianIds.length === 0)) {
      setError("Selecione ao menos um técnico ou marque enviar para todos.");
      return;
    }

    if (
      !window.confirm(
        sendToAll
          ? "Enviar push para todos os dispositivos conectados?"
          : `Enviar push para ${technicianIds!.length} técnico(s) selecionado(s)?`,
      )
    ) {
      return;
    }

    setSending(true);
    try {
      const result = await adminApi.sendPush({
        title: trimmedTitle,
        body: trimmedBody,
        technicianIds,
        orderId: orderId.trim() || undefined,
      });
      setSuccess(
        `Push enviado: ${result.sent} entregue(s), ${result.failed} falha(s), ${result.targetedDevices} dispositivo(s) alvo.`,
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao enviar push");
    } finally {
      setSending(false);
    }
  }

  const stats = overview?.stats;
  const platformEntries = Object.entries(stats?.byPlatform ?? {});

  return (
    <div className="page push-page">
      <div className="page-header">
        <div>
          <h1>Push &amp; dispositivos</h1>
          <p>Teste notificações, envie avisos manuais e veja tablets conectados ao app.</p>
        </div>
        <button type="button" className="btn btn-secondary" onClick={load} disabled={loading}>
          {loading ? "Atualizando…" : "Atualizar"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="push-stats">
        <div className="card push-stat">
          <span className="push-stat-label">Dispositivos conectados</span>
          <strong className="push-stat-value">{stats?.totalDevices ?? ""}</strong>
        </div>
        <div className="card push-stat">
          <span className="push-stat-label">Técnicos com app ativo</span>
          <strong className="push-stat-value">{stats?.connectedTechnicians ?? ""}</strong>
        </div>
        <div className="card push-stat push-stat-wide">
          <span className="push-stat-label">Firebase na API</span>
          <strong
            className={`push-stat-value ${overview?.firebaseConfigured ? "push-ok" : "push-warn"}`}
          >
            {overview?.firebaseConfigured ? "Configurado" : "Não configurado"}
          </strong>
          {!overview?.firebaseConfigured ? (
            <span className="push-stat-hint">
              Coloque firebase-service-account.json na VPS ou configure FIREBASE_* no .env da API.
            </span>
          ) : null}
        </div>
      </div>

      {platformEntries.length > 0 ? (
        <div className="card push-platforms">
          <strong>Por plataforma</strong>
          <div className="push-platform-chips">
            {platformEntries.map(([platform, count]) => (
              <span key={platform} className="chip">
                {platformLabels[platform] ?? platform}: {count}
              </span>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid-2 push-grid">
        <form className="card card-accent push-form" onSubmit={handleSend}>
          <h3>Enviar notificação manual</h3>
          <p className="push-form-hint">
            Use para testar push no tablet. Se informar ID da OS, o toque abre essa ordem no app.
          </p>

          <div className="field">
            <label htmlFor="push-title">Título *</label>
            <input
              id="push-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="push-body">Mensagem *</label>
            <textarea
              id="push-body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              maxLength={500}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="push-order">ID da OS (opcional)</label>
            <input
              id="push-order"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              placeholder="Cole o ID da ordem para abrir ao tocar"
            />
          </div>

          <label className="push-check">
            <input
              type="checkbox"
              checked={sendToAll}
              onChange={(e) => {
                setSendToAll(e.target.checked);
                if (e.target.checked) setSelectedTechIds([]);
              }}
            />
            Enviar para todos os técnicos conectados
          </label>

          {!sendToAll ? (
            <div className="push-tech-list">
              <span className="push-tech-list-label">Técnicos</span>
              {connectedTechnicians.length === 0 ? (
                <p className="push-empty-tech">Nenhum técnico com dispositivo conectado no momento.</p>
              ) : (
                connectedTechnicians.map((tech) => (
                  <label key={tech.id} className="push-tech-item">
                    <input
                      type="checkbox"
                      checked={selectedTechIds.includes(tech.id)}
                      onChange={() => toggleTechnician(tech.id)}
                    />
                    <span>
                      {tech.name}
                      <small>{tech.email}</small>
                    </span>
                  </label>
                ))
              )}
            </div>
          ) : null}

          <button
            type="submit"
            className="btn btn-primary"
            disabled={sending || !overview?.firebaseConfigured}
          >
            {sending ? "Enviando…" : "Enviar push agora"}
          </button>
        </form>

        <div className="card push-help">
          <h3>Como testar</h3>
          <ol>
            <li>Instale o app nativo no tablet (não funciona no Expo Go).</li>
            <li>Faça login como técnico e aceite permissão de notificação.</li>
            <li>Volte aqui e clique em <strong>Atualizar</strong>  o dispositivo deve aparecer na lista.</li>
            <li>Envie um push de teste e confira som/vibração no tablet.</li>
          </ol>
          <p className="push-help-note">
            Tokens inválidos são removidos automaticamente após falha no Firebase.
          </p>
        </div>
      </div>

      <div className="card push-devices-card">
        <div className="push-devices-head">
          <h3>Dispositivos conectados</h3>
          <span className="push-devices-count">
            {overview?.devices.length ?? 0}{" "}
            {overview?.devices.length === 1 ? "celular/tablet" : "celulares/tablets"}
          </span>
        </div>

        {loading && !overview ? (
          <p className="empty">Carregando…</p>
        ) : (overview?.devices.length ?? 0) === 0 ? (
          <p className="empty">
            Nenhum dispositivo registrado ainda. Abra o app no tablet com um técnico logado.
          </p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Técnico</th>
                  <th>Plataforma</th>
                  <th>Token</th>
                  <th>Última atualização</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {overview!.devices.map((device) => (
                  <tr key={device.id}>
                    <td>
                      <strong>{device.user.name}</strong>
                      <div className="push-device-email">{device.user.email}</div>
                    </td>
                    <td>{platformLabels[device.platform] ?? device.platform}</td>
                    <td>
                      <code className="push-token">{device.tokenPreview}</code>
                    </td>
                    <td>{formatDate(device.updatedAt)}</td>
                    <td>
                      {device.user.active === false ? (
                        <span className="badge badge-muted">Usuário inativo</span>
                      ) : (
                        <span className="badge badge-success">Conectado</span>
                      )}
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
