import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { adminApi } from "../services/admin-api";
import type { ServiceOrder, ServiceOrderStatus } from "../types/api";
import { statusColors, statusLabels } from "../utils/labels";
import { PriorityBadge } from "../components/PrioritySelect";
import { orderTechnicianNames } from "../utils/order-technicians";
import { formatDate, formatDateTime } from "../utils/dates";

const nextStatuses: Partial<Record<ServiceOrderStatus, ServiceOrderStatus[]>> = {
  OPEN: ["ASSIGNED", "IN_PROGRESS", "CANCELED"],
  ASSIGNED: ["IN_PROGRESS", "CANCELED"],
  IN_PROGRESS: ["DONE", "CANCELED"],
};

export function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<ServiceOrder | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  function load() {
    if (!id) return;
    setLoading(true);
    adminApi
      .getOrder(id)
      .then(setOrder)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, [id]);

  async function changeStatus(status: ServiceOrderStatus) {
    if (!id) return;
    setUpdating(true);
    setError("");
    try {
      await adminApi.updateOrderStatus(id, status);
      load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao atualizar");
    } finally {
      setUpdating(false);
    }
  }

  if (loading) return <div className="empty">Carregando...</div>;
  if (!order) return <div className="alert alert-error">{error || "OS não encontrada"}</div>;

  const actions = nextStatuses[order.status] ?? [];
  const technicianLabel = orderTechnicianNames(order);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>{order.code}</h1>
          <p>{order.title}</p>
        </div>
        <Link to="/" className="btn btn-secondary">
          Voltar
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="grid-2">
        <div className="card card-accent">
          <h3 style={{ marginTop: 0 }}>Datas</h3>
          <p>
            <strong>Criada em:</strong>{" "}
            {order.createdAt ? formatDateTime(order.createdAt) : ""}
          </p>
          <p>
            <strong>Agendada para:</strong>{" "}
            {order.scheduledAt ? formatDate(order.scheduledAt) : "Não agendada"}
          </p>
        </div>

        <div className="card card-accent">
          <h3 style={{ marginTop: 0 }}>Status</h3>
          <span
            className="badge"
            style={{
              color: statusColors[order.status],
              background: `${statusColors[order.status]}18`,
              borderColor: `${statusColors[order.status]}40`,
            }}
          >
            {statusLabels[order.status]}
          </span>
          <p>
            Prioridade: <PriorityBadge priority={order.priority} />
          </p>
          {actions.length > 0 && (
            <div className="card-actions">
              {actions.map((s) => (
                <button
                  key={s}
                  type="button"
                  className="btn btn-secondary"
                  disabled={updating}
                  onClick={() => changeStatus(s)}
                >
                  → {statusLabels[s]}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="card">
          <h3 style={{ marginTop: 0 }}>Cliente</h3>
          <p>
            <strong>{order.customer?.fullName}</strong>
          </p>
          {order.customer?.phone && (
            <p style={{ color: "var(--muted)" }}>{order.customer.phone}</p>
          )}
          {(order.customerPppoeUser || order.customerPppoePassword) && (
            <>
              {order.customerPppoeUser ? (
                <p>
                  <strong>Usuário PPPoE:</strong>{" "}
                  <code>{order.customerPppoeUser}</code>
                </p>
              ) : null}
              {order.customerPppoePassword ? (
                <p>
                  <strong>Senha PPPoE:</strong>{" "}
                  <code>{order.customerPppoePassword}</code>
                </p>
              ) : null}
            </>
          )}
          {order.address && (
            <p style={{ color: "var(--muted)" }}>
              {[order.address.street, order.address.number, order.address.city]
                .filter(Boolean)
                .join(", ")}
            </p>
          )}
        </div>
      </div>

      <div className="card">
        <h3 style={{ marginTop: 0 }}>Técnicos</h3>
        <p>{technicianLabel === "" ? "Não atribuído" : technicianLabel}</p>
        {order.assignees && order.assignees.length > 0 ? (
          <ul className="assignee-list">
            {order.assignees.map((a) => (
              <li key={a.userId}>
                <strong>{a.user.name}</strong>
                {a.user.email ? (
                  <span style={{ color: "var(--muted)" }}>  {a.user.email}</span>
                ) : null}
              </li>
            ))}
          </ul>
        ) : order.assignedTo?.email ? (
          <p style={{ color: "var(--muted)" }}>{order.assignedTo.email}</p>
        ) : null}
      </div>

      {order.description && (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Descrição (abertura)</h3>
          <p>{order.description}</p>
        </div>
      )}

      {order.technicianReport ? (
        <div className="card card-accent">
          <h3 style={{ marginTop: 0 }}>Relatório do técnico</h3>
          <p style={{ whiteSpace: "pre-wrap" }}>{order.technicianReport}</p>
        </div>
      ) : (
        <div className="card">
          <h3 style={{ marginTop: 0 }}>Relatório do técnico</h3>
          <p style={{ color: "var(--muted)" }}>Nenhum relatório registrado pelo técnico.</p>
        </div>
      )}
    </div>
  );
}
