import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi } from "../services/admin-api";
import type { ServiceOrder, ServiceOrderStatus } from "../types/api";
import { statusColors, statusLabels } from "../utils/labels";
import { PriorityBadge } from "../components/PrioritySelect";
import { orderTechnicianNames } from "../utils/order-technicians";

const filters: { label: string; value?: ServiceOrderStatus }[] = [
  { label: "Todas" },
  { label: "Abertas", value: "OPEN" },
  { label: "Atribuídas", value: "ASSIGNED" },
  { label: "Em execução", value: "IN_PROGRESS" },
  { label: "Finalizadas", value: "DONE" },
];

export function OrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [filter, setFilter] = useState<ServiceOrderStatus | undefined>("OPEN");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    adminApi
      .listOrders(filter)
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [filter]);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Ordens de serviço</h1>
          <p>Crie, acompanhe e atribua OS aos técnicos</p>
        </div>
        <Link to="/orders/new" className="btn btn-primary">
          + Nova OS
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <div className="filters">
        {filters.map((f) => (
          <button
            key={f.label}
            type="button"
            className={filter === f.value ? "chip active" : "chip"}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="empty">Nenhuma OS encontrada.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Prioridade</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.code}</strong>
                  </td>
                  <td>{o.title}</td>
                  <td>{o.customer?.fullName ?? ""}</td>
                  <td>{orderTechnicianNames(o)}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        color: statusColors[o.status],
                        background: `${statusColors[o.status]}18`,
                        borderColor: `${statusColors[o.status]}40`,
                      }}
                    >
                      {statusLabels[o.status]}
                    </span>
                  </td>
                  <td>
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td>
                    <Link to={`/orders/${o.id}`} className="btn btn-secondary">
                      Abrir
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
