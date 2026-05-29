import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { StarRating, formatRating } from "../components/StarRating";
import { useCanAccess } from "../contexts/AuthContext";
import { adminApi } from "../services/admin-api";
import type { EvaluableOrder, EvaluationStats, ServiceOrderEvaluation, User } from "../types/api";
import "./EvaluationsPage.css";

const ratingFilters = [
  { label: "Todas", value: undefined },
  { label: "5★", value: 5 },
  { label: "4★", value: 4 },
  { label: "3★", value: 3 },
  { label: "2★", value: 2 },
  { label: "1★", value: 1 },
] as const;

export function EvaluationsPage() {
  const canManage = useCanAccess(["ADMIN", "MANAGER"]);
  const [evaluations, setEvaluations] = useState<ServiceOrderEvaluation[]>([]);
  const [stats, setStats] = useState<EvaluationStats | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [ratingFilter, setRatingFilter] = useState<number | undefined>();
  const [technicianFilter, setTechnicianFilter] = useState("");

  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [evaluableOrders, setEvaluableOrders] = useState<EvaluableOrder[]>([]);
  const [serviceOrderId, setServiceOrderId] = useState("");
  const [technicianId, setTechnicianId] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const selectedOrder = useMemo(
    () => evaluableOrders.find((o) => o.id === serviceOrderId),
    [evaluableOrders, serviceOrderId],
  );

  const orderTechnicians = useMemo(() => {
    if (!selectedOrder) return [];
    const fromAssignees = selectedOrder.assignees?.map((a) => a.user) ?? [];
    if (fromAssignees.length > 0) return fromAssignees;
    return selectedOrder.assignedTo ? [selectedOrder.assignedTo] : [];
  }, [selectedOrder]);

  function load() {
    setLoading(true);
    setError("");
    Promise.all([
      adminApi.listEvaluations({
        rating: ratingFilter,
        technicianId: technicianFilter || undefined,
      }),
      adminApi.getEvaluationStats(),
      adminApi.listTechnicians(),
    ])
      .then(([list, st, techs]) => {
        setEvaluations(list);
        setStats(st);
        setTechnicians(techs);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [ratingFilter, technicianFilter]);

  async function openModal() {
    setError("");
    setSuccess("");
    setServiceOrderId("");
    setTechnicianId("");
    setRating(5);
    setComment("");
    try {
      const orders = await adminApi.listEvaluableOrders();
      setEvaluableOrders(orders);
      if (orders.length === 0) {
        setError("Não há OS finalizadas pendentes de avaliação.");
        return;
      }
      setModalOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao carregar OS");
    }
  }

  useEffect(() => {
    if (!serviceOrderId) {
      setTechnicianId("");
      return;
    }
    const techs = orderTechnicians;
    setTechnicianId(techs[0]?.id ?? "");
  }, [serviceOrderId, orderTechnicians]);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!serviceOrderId) {
      setError("Selecione uma OS.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await adminApi.createEvaluation({
        serviceOrderId,
        technicianId: technicianId || undefined,
        rating,
        comment: comment.trim() || undefined,
      });
      setModalOpen(false);
      setSuccess("Avaliação registrada.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (!canManage) {
    return (
      <div className="page">
        <div className="alert alert-error">Sem permissão para acessar avaliações.</div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Avaliações</h1>
          <p>Notas e feedback das ordens de serviço finalizadas</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          + Nova avaliação
        </button>
      </div>

      {error && !modalOpen ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      {stats ? (
        <div className="eval-stats">
          <div className="eval-stat card">
            <span className="eval-stat-label">Total</span>
            <strong className="eval-stat-value">{stats.total}</strong>
          </div>
          <div className="eval-stat card">
            <span className="eval-stat-label">Média geral</span>
            <strong className="eval-stat-value">
              {stats.total > 0 ? (
                <>
                  {formatRating(stats.averageRating)}
                  <StarRating value={Math.round(stats.averageRating)} readonly size="sm" />
                </>
              ) : (
                ""
              )}
            </strong>
          </div>
          <div className="eval-stat card eval-stat-wide">
            <span className="eval-stat-label">Por técnico</span>
            {stats.byTechnician.length === 0 ? (
              <span className="eval-stat-muted">Sem dados</span>
            ) : (
              <ul className="eval-tech-list">
                {stats.byTechnician.map((t) => (
                  <li key={t.technicianId}>
                    <span>{t.technicianName}</span>
                    <span>
                      {formatRating(t.averageRating)} ★ ({t.count})
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}

      <div className="eval-filters">
        <div className="filters">
          {ratingFilters.map((f) => (
            <button
              key={f.label}
              type="button"
              className={ratingFilter === f.value ? "chip active" : "chip"}
              onClick={() => setRatingFilter(f.value)}
            >
              {f.label}
            </button>
          ))}
        </div>
        <select
          className="input-sm eval-tech-filter"
          value={technicianFilter}
          onChange={(e) => setTechnicianFilter(e.target.value)}
        >
          <option value="">Todos os técnicos</option>
          {technicians.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : evaluations.length === 0 ? (
          <div className="empty">Nenhuma avaliação encontrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>OS</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Nota</th>
                <th>Comentário</th>
                <th>Data</th>
              </tr>
            </thead>
            <tbody>
              {evaluations.map((ev) => (
                <tr key={ev.id}>
                  <td>
                    <Link to={`/orders/${ev.serviceOrderId}`}>
                      <strong>{ev.serviceOrder?.code}</strong>
                    </Link>
                    <div className="eval-order-title">{ev.serviceOrder?.title}</div>
                  </td>
                  <td>{ev.serviceOrder?.customer?.fullName ?? ""}</td>
                  <td>{ev.technician?.name ?? ""}</td>
                  <td>
                    <StarRating value={ev.rating} readonly size="sm" />
                  </td>
                  <td className="eval-comment">{ev.comment || ""}</td>
                  <td>
                    {ev.createdAt
                      ? new Date(ev.createdAt).toLocaleDateString("pt-BR")
                      : ""}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Nova avaliação"
        onClose={() => !saving && setModalOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              disabled={saving}
              onClick={() => setModalOpen(false)}
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="eval-form"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        {error && modalOpen ? <div className="alert alert-error">{error}</div> : null}
        <form id="eval-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>OS finalizada *</label>
            <select
              className="input-sm"
              value={serviceOrderId}
              onChange={(e) => setServiceOrderId(e.target.value)}
              required
            >
              <option value="">Selecione...</option>
              {evaluableOrders.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.code}  {o.customer?.fullName ?? o.title}
                </option>
              ))}
            </select>
          </div>

          {orderTechnicians.length > 0 ? (
            <div className="field">
              <label>Técnico avaliado</label>
              <select
                className="input-sm"
                value={technicianId}
                onChange={(e) => setTechnicianId(e.target.value)}
              >
                {orderTechnicians.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="field">
            <label>Nota *</label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="field">
            <label>Comentário</label>
            <textarea
              className="input-sm textarea-sm"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={3}
              placeholder="Feedback do cliente ou observações internas..."
            />
          </div>
        </form>
      </Modal>
    </div>
  );
}
