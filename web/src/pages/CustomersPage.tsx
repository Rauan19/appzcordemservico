import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { adminApi } from "../services/admin-api";
import type { Customer } from "../types/api";

const emptyForm = {
  fullName: "",
  cpf: "",
  phone: "",
  email: "",
  street: "",
  number: "",
  city: "",
};

export function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  function load() {
    setLoading(true);
    adminApi
      .listCustomers()
      .then(setCustomers)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.fullName.toLowerCase().includes(q) ||
        c.cpf.includes(q) ||
        c.phone.includes(q) ||
        (c.email?.toLowerCase().includes(q) ?? false),
    );
  }, [customers, search]);

  function openModal() {
    setForm(emptyForm);
    setError("");
    setModalOpen(true);
  }

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
  }

  function updateField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setSaving(true);
    try {
      const customer = await adminApi.createCustomer({
        fullName: form.fullName,
        cpf: form.cpf,
        phone: form.phone,
        email: form.email || undefined,
      });
      if (form.street.trim()) {
        await adminApi.createAddress(customer.id, {
          street: form.street.trim(),
          number: form.number.trim() || undefined,
          city: form.city.trim() || undefined,
          label: "Principal",
        });
      }
      setModalOpen(false);
      setForm(emptyForm);
      setSuccess("Cliente cadastrado com sucesso.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Clientes</h1>
          <p>Cadastro de clientes do provedor</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={openModal}>
          + Novo cliente
        </button>
      </div>

      {error && !modalOpen ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="search-bar card">
        <div className="field" style={{ marginBottom: 0 }}>
          <label htmlFor="customer-search">Buscar cliente</label>
          <input
            id="customer-search"
            type="search"
            placeholder="Nome, CPF, telefone ou e-mail..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {search.trim() && (
          <p className="search-meta">
            {filtered.length} resultado(s) de {customers.length}
          </p>
        )}
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : filtered.length === 0 ? (
          <div className="empty">
            {search.trim() ? "Nenhum cliente encontrado na busca." : "Nenhum cliente cadastrado."}
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>CPF</th>
                <th>Telefone</th>
                <th>E-mail</th>
                <th style={{ width: 140 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr key={c.id}>
                  <td>{c.fullName}</td>
                  <td>{c.cpf}</td>
                  <td>{c.phone}</td>
                  <td>{c.email ?? ""}</td>
                  <td>
                    <Link
                      to={`/orders/new?customerId=${c.id}`}
                      className="btn btn-primary"
                    >
                      + Nova OS
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={modalOpen}
        title="Novo cliente"
        onClose={closeModal}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="customer-form" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar cliente"}
            </button>
          </>
        }
      >
        {error && modalOpen ? <div className="alert alert-error">{error}</div> : null}

        <form id="customer-form" onSubmit={handleSubmit}>
          <div className="field">
            <label>Nome completo *</label>
            <input
              value={form.fullName}
              onChange={(e) => updateField("fullName", e.target.value)}
              required
              autoFocus
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>CPF *</label>
              <input
                value={form.cpf}
                onChange={(e) => updateField("cpf", e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>Telefone *</label>
              <input
                value={form.phone}
                onChange={(e) => updateField("phone", e.target.value)}
                required
              />
            </div>
          </div>
          <div className="field">
            <label>E-mail</label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
            />
          </div>
          <p className="form-section-title">Endereço (opcional)</p>
          <div className="field">
            <label>Rua</label>
            <input value={form.street} onChange={(e) => updateField("street", e.target.value)} />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Número</label>
              <input value={form.number} onChange={(e) => updateField("number", e.target.value)} />
            </div>
            <div className="field">
              <label>Cidade</label>
              <input value={form.city} onChange={(e) => updateField("city", e.target.value)} />
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
