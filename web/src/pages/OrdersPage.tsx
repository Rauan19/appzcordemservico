import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { adminApi, type ListOrdersParams, type OrderCreatedStats } from "../services/admin-api";
import type { ServiceOrder, ServiceOrderStatus, User } from "../types/api";
import { priorityColors, priorityOptions, statusColors, statusLabels } from "../utils/labels";
import { PriorityBadge } from "../components/PrioritySelect";
import { orderTechnicianNames } from "../utils/order-technicians";
import { formatDate, formatDateTime } from "../utils/dates";
import "./OrdersPage.css";

const statusFilters: { label: string; value?: ServiceOrderStatus }[] = [
  { label: "Todas" },
  { label: "Abertas", value: "OPEN" },
  { label: "Atribuídas", value: "ASSIGNED" },
  { label: "Em execução", value: "IN_PROGRESS" },
  { label: "Finalizadas", value: "DONE" },
  { label: "Canceladas", value: "CANCELED" },
];

const scheduledFilters: {
  label: string;
  value?: ListOrdersParams["scheduled"];
}[] = [
  { label: "Qualquer" },
  { label: "Agendadas", value: "scheduled" },
  { label: "Hoje", value: "today" },
  { label: "Atrasadas", value: "overdue" },
  { label: "Sem agendamento", value: "unscheduled" },
];

const createdPeriodFilters: {
  label: string;
  value?: ListOrdersParams["createdPeriod"];
  statKey: keyof OrderCreatedStats;
}[] = [
  { label: "Hoje", value: "day", statKey: "day" },
  { label: "Este mês", value: "month", statKey: "month" },
  { label: "Este ano", value: "year", statKey: "year" },
  { label: "Total", value: undefined, statKey: "total" },
];

const defaultFilters = {
  status: "OPEN" as ServiceOrderStatus | undefined,
  createdPeriod: "" as ListOrdersParams["createdPeriod"] | "",
  priority: "",
  technicianId: "",
  scheduled: "" as ListOrdersParams["scheduled"] | "",
  q: "",
  scheduledFrom: "",
  scheduledTo: "",
  withPppoe: false,
};

export function OrdersPage() {
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [stats, setStats] = useState<OrderCreatedStats | null>(null);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [filters, setFilters] = useState(defaultFilters);
  const [searchInput, setSearchInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const queryParams = useMemo<ListOrdersParams>(() => {
    const params: ListOrdersParams = {};
    if (filters.status) params.status = filters.status;
    if (filters.priority) params.priority = filters.priority;
    if (filters.technicianId) params.technicianId = filters.technicianId;
    if (filters.scheduled) params.scheduled = filters.scheduled;
    if (filters.createdPeriod) params.createdPeriod = filters.createdPeriod;
    if (filters.q) params.q = filters.q;
    if (filters.scheduledFrom) params.scheduledFrom = filters.scheduledFrom;
    if (filters.scheduledTo) params.scheduledTo = filters.scheduledTo;
    if (filters.withPppoe) params.withPppoe = true;
    return params;
  }, [filters]);

  const hasExtraFilters =
    filters.priority !== defaultFilters.priority ||
    filters.technicianId !== defaultFilters.technicianId ||
    filters.scheduled !== defaultFilters.scheduled ||
    filters.q !== defaultFilters.q ||
    filters.scheduledFrom !== defaultFilters.scheduledFrom ||
    filters.scheduledTo !== defaultFilters.scheduledTo ||
    filters.withPppoe !== defaultFilters.withPppoe ||
    filters.createdPeriod !== defaultFilters.createdPeriod ||
    filters.status !== defaultFilters.status;

  useEffect(() => {
    adminApi.listTechnicians().then(setTechnicians).catch(() => setTechnicians([]));
    adminApi
      .getOrderCreatedStats()
      .then(setStats)
      .catch(() => setStats(null));
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((prev) => ({ ...prev, q: searchInput.trim() }));
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    setLoading(true);
    adminApi
      .listOrders(queryParams)
      .then(setOrders)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar"))
      .finally(() => setLoading(false));
  }, [queryParams]);

  function updateFilter<K extends keyof typeof defaultFilters>(
    key: K,
    value: (typeof defaultFilters)[K],
  ) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  function clearFilters() {
    setSearchInput("");
    setFilters(defaultFilters);
  }

  async function handleDelete(order: ServiceOrder) {
    const msg = `Excluir a OS ${order.code} permanentemente?`;
    if (!window.confirm(msg)) return;

    setDeletingId(order.id);
    setError("");
    try {
      await adminApi.deleteOrder(order.id);
      setOrders((prev) => prev.filter((x) => x.id !== order.id));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao excluir OS");
    } finally {
      setDeletingId(null);
    }
  }

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

      <div className="orders-stats-grid">
        {createdPeriodFilters.map((f) => {
          const active = filters.createdPeriod === (f.value ?? "");
          const count = stats?.[f.statKey];
          return (
            <button
              key={f.label}
              type="button"
              className={active ? "orders-stat-card active" : "orders-stat-card"}
              onClick={() => updateFilter("createdPeriod", f.value ?? "")}
            >
              <span className="orders-stat-value">
                {stats ? count : ""}
              </span>
              <span className="orders-stat-label">{f.label}</span>
              <span className="orders-stat-hint">criadas</span>
            </button>
          );
        })}
      </div>

      <div className="card orders-filters">
        <div className="orders-filters-header">
          <h2>Filtros</h2>
          <span className="orders-filters-meta">
            {loading
              ? "Carregando…"
              : `${orders.length} ${orders.length === 1 ? "OS na lista" : "OS na lista"}${
                  filters.createdPeriod
                    ? ` · filtro: ${
                        createdPeriodFilters.find(
                          (f) => (f.value ?? "") === filters.createdPeriod,
                        )?.label ?? ""
                      }`
                    : ""
                }`}
          </span>
        </div>

        <div className="orders-filters-body">
        <div className="orders-search-row">
          <div className="field">
            <label>Buscar</label>
            <input
              className="input-sm"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Código, título ou cliente…"
            />
          </div>
        </div>

        <div className="orders-filter-group">
          <span>Status</span>
          <div className="orders-filter-chips">
            {statusFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                className={filters.status === f.value ? "chip active" : "chip"}
                onClick={() => updateFilter("status", f.value)}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-filter-group">
          <span>Prioridade</span>
          <div className="orders-filter-chips">
            <button
              type="button"
              className={filters.priority === "" ? "chip active" : "chip"}
              onClick={() => updateFilter("priority", "")}
            >
              Todas
            </button>
            {priorityOptions.map((opt) => {
              const color = priorityColors[opt.value];
              const active = filters.priority === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  className={active ? "chip chip-priority active" : "chip chip-priority"}
                  style={
                    active
                      ? {
                          borderColor: color,
                          background: `${color}18`,
                          color,
                        }
                      : undefined
                  }
                  onClick={() => updateFilter("priority", opt.value)}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="orders-filter-group">
          <span>Agendamento</span>
          <div className="orders-filter-chips">
            {scheduledFilters.map((f) => (
              <button
                key={f.label}
                type="button"
                className={
                  filters.scheduled === (f.value ?? "")
                    ? "chip chip-scheduled active"
                    : "chip chip-scheduled"
                }
                onClick={() => updateFilter("scheduled", f.value ?? "")}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="orders-filter-row">
          <div className="field">
            <label>Técnico</label>
            <select
              className="input-sm"
              value={filters.technicianId}
              onChange={(e) => updateFilter("technicianId", e.target.value)}
            >
              <option value="">Todos</option>
              {technicians.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>Agendada a partir de</label>
            <input
              className="input-sm"
              type="date"
              value={filters.scheduledFrom}
              onChange={(e) => updateFilter("scheduledFrom", e.target.value)}
            />
          </div>
          <div className="field">
            <label>Agendada até</label>
            <input
              className="input-sm"
              type="date"
              value={filters.scheduledTo}
              onChange={(e) => updateFilter("scheduledTo", e.target.value)}
            />
          </div>
        </div>
        </div>

        <div className="orders-filters-footer">
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={filters.withPppoe}
              onChange={(e) => updateFilter("withPppoe", e.target.checked)}
            />
            Somente OS com PPPoE
          </label>
          {hasExtraFilters ? (
            <button type="button" className="btn btn-secondary btn-sm" onClick={clearFilters}>
              Limpar filtros
            </button>
          ) : null}
        </div>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : orders.length === 0 ? (
          <div className="empty">Nenhuma OS encontrada com os filtros selecionados.</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Código</th>
                <th>Título</th>
                <th>Cliente</th>
                <th>Técnico</th>
                <th>Status</th>
                <th>Criada</th>
                <th>Agendada</th>
                <th>Prioridade</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id}>
                  <td>
                    <strong>{o.code}</strong>
                    {(o.customerPppoeUser || o.customerPppoePassword) ? (
                      <div style={{ fontSize: "0.6875rem", color: "var(--muted)", marginTop: 2 }}>
                        PPPoE
                      </div>
                    ) : null}
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
                  <td>{o.createdAt ? formatDateTime(o.createdAt) : ""}</td>
                  <td>{o.scheduledAt ? formatDate(o.scheduledAt) : ""}</td>
                  <td>
                    <PriorityBadge priority={o.priority} />
                  </td>
                  <td>
                    <div className="card-actions" style={{ flexWrap: "nowrap" }}>
                      <Link to={`/orders/${o.id}`} className="btn btn-secondary btn-sm">
                        Abrir
                      </Link>
                      <Link to={`/orders/${o.id}/edit`} className="btn btn-secondary btn-sm">
                        Editar
                      </Link>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === o.id}
                        onClick={() => handleDelete(o)}
                      >
                        {deletingId === o.id ? "..." : "Excluir"}
                      </button>
                    </div>
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
