import { useMemo, useState } from "react";
import type { Product } from "../types/api";
import "./ProductPicker.css";

type Props = {
  products: Product[];
  value: string;
  onChange: (productId: string, product: Product) => void;
  balances?: Record<string, number>;
};

export function ProductPicker({ products, value, onChange, balances }: Props) {
  const [search, setSearch] = useState("");

  const activeProducts = useMemo(() => products.filter((p) => p.active), [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return activeProducts;
    return activeProducts.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        (p.series?.toLowerCase().includes(q) ?? false) ||
        (p.sku?.toLowerCase().includes(q) ?? false),
    );
  }, [activeProducts, search]);

  const selected = products.find((p) => p.id === value);

  function label(p: Product) {
    const parts = [p.name];
    if (p.series) parts.push(p.series);
    return parts.join(" · ");
  }

  return (
    <div className="product-picker">
      <input
        type="search"
        className="product-picker-search"
        placeholder="Buscar por nome, série ou SKU..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {selected && (
        <div className="product-picker-selected">
          <span>Selecionado:</span>
          <strong>{label(selected)}</strong>
          {selected.sku ? <span className="product-picker-meta">SKU {selected.sku}</span> : null}
          {balances && balances[selected.id] !== undefined ? (
            <span className="product-picker-balance">
              Saldo: {balances[selected.id]} {selected.unit}
            </span>
          ) : null}
        </div>
      )}

      <div className="product-picker-list" role="listbox">
        {filtered.length === 0 ? (
          <p className="product-picker-empty">Nenhum produto encontrado.</p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={value === p.id}
              className={value === p.id ? "product-picker-item active" : "product-picker-item"}
              onClick={() => onChange(p.id, p)}
            >
              <span className="product-picker-name">{label(p)}</span>
              <span className="product-picker-meta">
                {[p.sku, balances?.[p.id] !== undefined ? `Saldo ${balances[p.id]} ${p.unit}` : null]
                  .filter(Boolean)
                  .join(" · ")}
              </span>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
