import { useMemo, useState } from "react";
import type { Customer } from "../types/api";
import "./CustomerPicker.css";

type Props = {
  customers: Customer[];
  value: string;
  onChange: (customerId: string, customer: Customer) => void;
};

export function CustomerPicker({ customers, value, onChange }: Props) {
  const [search, setSearch] = useState("");

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

  const selected = customers.find((c) => c.id === value);

  return (
    <div className="customer-picker">
      <input
        type="search"
        className="customer-picker-search"
        placeholder="Buscar por nome, CPF, telefone..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {selected && (
        <div className="customer-picker-selected">
          <span>Selecionado:</span>
          <strong>{selected.fullName}</strong>
          <span className="customer-picker-meta">{selected.cpf}</span>
        </div>
      )}

      <div className="customer-picker-list" role="listbox">
        {filtered.length === 0 ? (
          <p className="customer-picker-empty">Nenhum cliente encontrado.</p>
        ) : (
          filtered.map((c) => (
            <button
              key={c.id}
              type="button"
              role="option"
              aria-selected={value === c.id}
              className={value === c.id ? "customer-picker-item active" : "customer-picker-item"}
              onClick={() => onChange(c.id, c)}
            >
              <span className="customer-picker-name">{c.fullName}</span>
              <span className="customer-picker-meta">
                {c.cpf} · {c.phone}
              </span>
            </button>
          ))
        )}
      </div>

      {!value && <p className="customer-picker-hint">Selecione um cliente da lista acima *</p>}
    </div>
  );
}
