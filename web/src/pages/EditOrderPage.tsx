import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { CustomerPicker } from "../components/CustomerPicker";
import { PrioritySelect } from "../components/PrioritySelect";
import { TechnicianMultiPicker } from "../components/TechnicianMultiPicker";
import { adminApi } from "../services/admin-api";
import type { Customer, ServiceOrderStatus, User } from "../types/api";
import { statusLabels } from "../utils/labels";
import "./NewOrderPage.css";

const statusOptions: ServiceOrderStatus[] = [
  "OPEN",
  "ASSIGNED",
  "IN_PROGRESS",
  "DONE",
  "CANCELED",
];

function toDateInputValue(iso?: string | null) {
  if (!iso) return "";
  return iso.slice(0, 10);
}

export function EditOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [addresses, setAddresses] = useState<Customer["addresses"]>([]);
  const [customerId, setCustomerId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [customerPppoeUser, setCustomerPppoeUser] = useState("");
  const [customerPppoePassword, setCustomerPppoePassword] = useState("");
  const [technicianReport, setTechnicianReport] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [status, setStatus] = useState<ServiceOrderStatus>("OPEN");
  const [orderCode, setOrderCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([adminApi.getOrder(id), adminApi.listCustomers(), adminApi.listTechnicians()])
      .then(([order, c, t]) => {
        setOrderCode(order.code);
        setCustomerId(order.customerId);
        setAddressId(order.addressId ?? "");
        setAssignedToIds(
          order.assignees?.map((a) => a.userId) ??
            (order.assignedToId ? [order.assignedToId] : []),
        );
        setTitle(order.title);
        setDescription(order.description ?? "");
        setScheduledAt(toDateInputValue(order.scheduledAt));
        setCustomerPppoeUser(order.customerPppoeUser ?? "");
        setCustomerPppoePassword(order.customerPppoePassword ?? "");
        setTechnicianReport(order.technicianReport ?? "");
        setPriority(order.priority);
        setStatus(order.status);
        setCustomers(c);
        setTechnicians(t);
        const customer = c.find((x) => x.id === order.customerId);
        setAddresses(customer?.addresses ?? order.customer?.addresses ?? []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar OS"))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!customerId) {
      setAddresses([]);
      setAddressId("");
      return;
    }
    adminApi
      .getCustomer(customerId)
      .then((c) => {
        setAddresses(c.addresses ?? []);
        if (!c.addresses?.some((a) => a.id === addressId)) {
          setAddressId(c.addresses?.[0]?.id ?? "");
        }
      })
      .catch(() => setAddresses([]));
  }, [customerId]);

  function handleCustomerChange(nextId: string, _customer: Customer) {
    setCustomerId(nextId);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!id || !customerId) {
      setError("Selecione um cliente.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await adminApi.updateOrder(id, {
        customerId,
        addressId: addressId || null,
        assignedToIds,
        title,
        description: description.trim() || null,
        priority,
        status,
        scheduledAt: scheduledAt || null,
        customerPppoeUser: customerPppoeUser.trim() || null,
        customerPppoePassword: customerPppoePassword.trim() || null,
        technicianReport: technicianReport.trim() || null,
      });
      navigate(`/orders/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar OS");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="empty">Carregando...</div>;

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Editar OS {orderCode}</h1>
          <p>Altere qualquer campo da ordem de serviço</p>
        </div>
        <Link to={`/orders/${id}`} className="btn btn-secondary btn-sm">
          Voltar
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}

      <form className="card card-accent form-compact order-form" onSubmit={handleSubmit}>
        <div className="field">
          <label>Cliente *</label>
          <CustomerPicker
            customers={customers}
            value={customerId}
            onChange={handleCustomerChange}
          />
        </div>

        {addresses && addresses.length > 0 && (
          <div className="field">
            <label>Endereço</label>
            <select
              className="input-sm"
              value={addressId}
              onChange={(e) => setAddressId(e.target.value)}
            >
              {addresses.map((a) => (
                <option key={a.id} value={a.id}>
                  {[a.street, a.number, a.city].filter(Boolean).join(", ")}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="field">
          <label>Técnicos</label>
          <TechnicianMultiPicker
            technicians={technicians}
            value={assignedToIds}
            onChange={setAssignedToIds}
          />
        </div>

        <div className="field">
          <label>Status</label>
          <select
            className="input-sm"
            value={status}
            onChange={(e) => setStatus(e.target.value as ServiceOrderStatus)}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
        </div>

        <div className="field">
          <label>Prioridade</label>
          <PrioritySelect value={priority} onChange={setPriority} />
        </div>

        <div className="field">
          <label>Título *</label>
          <input
            className="input-sm"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            minLength={3}
          />
        </div>

        <div className="field">
          <label>Descrição (abertura)</label>
          <textarea
            className="input-sm textarea-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <div className="field">
          <label>Relatório do técnico</label>
          <textarea
            className="input-sm textarea-sm"
            value={technicianReport}
            onChange={(e) => setTechnicianReport(e.target.value)}
            rows={4}
            placeholder="Texto registrado pelo técnico no app"
          />
        </div>

        <div className="field">
          <label>Data do agendamento</label>
          <input
            className="input-sm"
            type="date"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
          />
        </div>

        <div className="field">
          <label>Usuário PPPoE</label>
          <input
            className="input-sm"
            type="text"
            value={customerPppoeUser}
            onChange={(e) => setCustomerPppoeUser(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="field">
          <label>Senha PPPoE</label>
          <input
            className="input-sm"
            type="text"
            value={customerPppoePassword}
            onChange={(e) => setCustomerPppoePassword(e.target.value)}
            autoComplete="off"
          />
        </div>

        <div className="card-actions">
          <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
            {saving ? "Salvando..." : "Salvar alterações"}
          </button>
          <Link to={`/orders/${id}`} className="btn btn-secondary btn-sm">
            Cancelar
          </Link>
        </div>
      </form>
    </div>
  );
}
