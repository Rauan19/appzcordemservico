import { FormEvent, useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ProductPicker } from "../components/ProductPicker";
import { adminApi } from "../services/admin-api";
import type { Product, StockBalance } from "../types/api";

type Row = StockBalance & { product?: Product };

export function StockPage() {
  const [searchParams] = useSearchParams();
  const presetProductId = searchParams.get("productId") ?? "";
  const [rows, setRows] = useState<Row[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("1");
  const [batchNote, setBatchNote] = useState("");
  const [reason, setReason] = useState("Entrada manual");

  function load() {
    setLoading(true);
    Promise.all([adminApi.stockBalance(), adminApi.listProducts()])
      .then(([balance, prods]) => {
        const map = new Map(prods.map((p) => [p.id, p]));
        setProducts(prods);
        setBalances(Object.fromEntries(balance.map((b) => [b.productId, b.balance])));
        setRows(
          balance
            .map((b) => ({ ...b, product: map.get(b.productId) }))
            .sort((a, b) => (a.product?.name ?? "").localeCompare(b.product?.name ?? "")),
        );
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  useEffect(() => {
    if (presetProductId && products.some((p) => p.id === presetProductId)) {
      setProductId(presetProductId);
    }
  }, [presetProductId, products]);

  async function handleEntry(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    const qty = Number(quantity);
    if (!productId || !qty || qty <= 0) {
      setError("Informe produto e quantidade válida.");
      return;
    }
    try {
      await adminApi.createStockMovement({
        type: "IN",
        productId,
        quantity: qty,
        reason,
        note: batchNote.trim() || undefined,
      });
      setSuccess("Entrada registrada.");
      setQuantity("1");
      setBatchNote("");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao registrar");
    }
  }

  const selected = products.find((p) => p.id === productId);

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Estoque</h1>
          <p>Saldo atual e entradas manuais</p>
        </div>
        <Link to="/products" className="btn btn-secondary">
          Ir para produtos
        </Link>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <form className="card card-accent form-compact" onSubmit={handleEntry} style={{ maxWidth: 560 }}>
        <h3 style={{ marginTop: 0 }}>Entrada de estoque</h3>
        <p className="field-hint" style={{ marginTop: 0 }}>
          Para repor um produto que já existe, busque abaixo. Produto novo?{" "}
          <Link to="/products">Cadastre em Produtos</Link>.
        </p>
        <div className="field">
          <label>Produto</label>
          <ProductPicker
            products={products}
            value={productId}
            balances={balances}
            onChange={(id) => setProductId(id)}
          />
        </div>
        <div className="grid-2">
          <div className="field">
            <label>Quantidade</label>
            <input
              className="input-sm"
              type="number"
              min="0.001"
              step="any"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              required
            />
          </div>
          <div className="field">
            <label>Unidade</label>
            <input className="input-sm" value={selected?.unit ?? "un"} disabled />
          </div>
        </div>
        <div className="field">
          <label>Lote / série desta entrada</label>
          <input
            className="input-sm"
            value={batchNote}
            onChange={(e) => setBatchNote(e.target.value)}
            placeholder="Opcional  SN, lote, NF..."
          />
        </div>
        <div className="field">
          <label>Motivo</label>
          <input className="input-sm" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary btn-sm">
          Registrar entrada
        </button>
      </form>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Série</th>
                <th>SKU</th>
                <th>Saldo</th>
                <th>Entradas</th>
                <th>Saídas</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.productId}>
                  <td>{r.product?.name ?? r.productId}</td>
                  <td>{r.product?.series ?? ""}</td>
                  <td>{r.product?.sku ?? ""}</td>
                  <td>
                    <strong>
                      {r.balance} {r.product?.unit ?? "un"}
                    </strong>
                  </td>
                  <td>{r.breakdown.in}</td>
                  <td>{r.breakdown.out}</td>
                  <td>
                    {r.product?.active ? (
                      <Link
                        to={`/stock?productId=${r.productId}`}
                        className="btn btn-secondary"
                        onClick={() => setProductId(r.productId)}
                      >
                        Repor
                      </Link>
                    ) : null}
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
