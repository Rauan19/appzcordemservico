import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CustomerPicker } from "../components/CustomerPicker";
import { PrioritySelect } from "../components/PrioritySelect";
import { TechnicianMultiPicker } from "../components/TechnicianMultiPicker";
import { adminApi } from "../services/admin-api";
import type { Customer, User } from "../types/api";
import "./NewOrderPage.css";

export function NewOrderPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetCustomerId = searchParams.get("customerId") ?? "";
  const fromCustomers = searchParams.get("from") === "customers" || Boolean(presetCustomerId);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [technicians, setTechnicians] = useState<User[]>([]);
  const [addresses, setAddresses] = useState<Customer["addresses"]>([]);
  const [customerId, setCustomerId] = useState("");
  const [addressId, setAddressId] = useState("");
  const [assignedToIds, setAssignedToIds] = useState<string[]>([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("NORMAL");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([adminApi.listCustomers(), adminApi.listTechnicians()])
      .then(([c, t]) => {
        setCustomers(c);
        setTechnicians(t);
        if (presetCustomerId && c.some((x) => x.id === presetCustomerId)) {
          setCustomerId(presetCustomerId);
          const customer = c.find((x) => x.id === presetCustomerId);
          if (customer) {
            setTitle(`Atendimento  ${customer.fullName}`);
          }
        }
      })
      .catch(() => setError("Erro ao carregar dados"));
  }, [presetCustomerId]);

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
        setAddressId(c.addresses?.[0]?.id ?? "");
      })
      .catch(() => setAddresses([]));
  }, [customerId]);

  function handleCustomerChange(id: string, customer: Customer) {
    setCustomerId(id);
    if (!title || title.startsWith("Atendimento ")) {
      setTitle(`Atendimento  ${customer.fullName}`);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!customerId) {
      setError("Selecione um cliente.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const order = await adminApi.createOrder({
        customerId,
        addressId: addressId || undefined,
        assignedToIds: assignedToIds.length > 0 ? assignedToIds : undefined,
        title,
        description: description || undefined,
        priority,
      });
      navigate(`/orders/${order.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar OS");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Nova ordem de serviço</h1>
          <p>Preencha os dados e atribua um ou mais técnicos</p>
        </div>
        <Link to={fromCustomers ? "/customers" : "/"} className="btn btn-secondary btn-sm">
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
          <label>Prioridade</label>
          <PrioritySelect value={priority} onChange={setPriority} />
          <p className="field-hint">Urgente aparece em vermelho para o técnico no app.</p>
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
          <label>Descrição</label>
          <textarea
            className="input-sm textarea-sm"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-sm" disabled={loading}>
          {loading ? "Salvando..." : "Criar OS"}
        </button>
      </form>
    </div>
  );
}
