import { FormEvent, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Modal } from "../components/Modal";
import { ProductPicker } from "../components/ProductPicker";
import { adminApi } from "../services/admin-api";
import type { Product } from "../types/api";
import "./ProductsPage.css";

type IntakeMode = "restock" | "new";

const emptyNew = { name: "", series: "", sku: "", unit: "un", quantity: "1", batchNote: "" };
const emptyEdit = { name: "", series: "", sku: "", unit: "un", active: true, targetBalance: "" };

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [balances, setBalances] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showIntake, setShowIntake] = useState(false);
  const [intakeMode, setIntakeMode] = useState<IntakeMode>("restock");
  const [saving, setSaving] = useState(false);

  const [restockProductId, setRestockProductId] = useState("");
  const [restockQty, setRestockQty] = useState("1");
  const [restockNote, setRestockNote] = useState("");
  const [newForm, setNewForm] = useState(emptyNew);

  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editForm, setEditForm] = useState(emptyEdit);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  function load() {
    setLoading(true);
    Promise.all([adminApi.listProducts(), adminApi.stockBalance()])
      .then(([prods, bal]) => {
        setProducts(prods);
        setBalances(Object.fromEntries(bal.map((b) => [b.productId, b.balance])));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const similarProducts = useMemo(() => {
    const name = newForm.name.trim().toLowerCase();
    if (!name || intakeMode !== "new") return [];
    return products.filter(
      (p) =>
        p.active &&
        (p.name.toLowerCase().includes(name) ||
          name.includes(p.name.toLowerCase()) ||
          (newForm.series &&
            p.series?.toLowerCase() === newForm.series.trim().toLowerCase())),
    );
  }, [newForm.name, newForm.series, products, intakeMode]);

  function openIntake(mode: IntakeMode, productId?: string) {
    setIntakeMode(mode);
    setRestockProductId(productId ?? "");
    setRestockQty("1");
    setRestockNote("");
    setNewForm(emptyNew);
    setError("");
    setShowIntake(true);
  }

  function closeIntake() {
    if (saving) return;
    setShowIntake(false);
  }

  async function handleIntake(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      if (intakeMode === "restock") {
        const qty = Number(restockQty);
        if (!restockProductId || !qty || qty <= 0) {
          setError("Selecione o produto e informe a quantidade.");
          return;
        }
        const result = await adminApi.productIntake({
          action: "restock",
          productId: restockProductId,
          quantity: qty,
          batchNote: restockNote.trim() || undefined,
        });
        setShowIntake(false);
        setSuccess(
          `Estoque atualizado: ${result.product.name}  saldo ${result.balance} ${result.product.unit}.`,
        );
      } else {
        const qty = newForm.quantity.trim() ? Number(newForm.quantity) : undefined;
        if (qty !== undefined && qty <= 0) {
          setError("Quantidade inicial inválida.");
          return;
        }
        const result = await adminApi.productIntake({
          action: "new",
          name: newForm.name.trim(),
          series: newForm.series.trim() || undefined,
          sku: newForm.sku.trim() || undefined,
          unit: newForm.unit.trim() || "un",
          quantity: qty,
          batchNote: newForm.batchNote.trim() || undefined,
        });
        setShowIntake(false);
        setSuccess(
          qty
            ? `"${result.product.name}" cadastrado com ${qty} ${result.product.unit} em estoque.`
            : `"${result.product.name}" cadastrado.`,
        );
      }
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  function openEdit(product: Product) {
    setEditing(product);
    setEditForm({
      name: product.name,
      series: product.series ?? "",
      sku: product.sku ?? "",
      unit: product.unit,
      active: product.active,
      targetBalance: String(balances[product.id] ?? 0),
    });
    setError("");
    setEditOpen(true);
  }

  async function handleEditSubmit(e: FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      await adminApi.updateProduct(editing.id, {
        name: editForm.name,
        series: editForm.series.trim() || null,
        sku: editForm.sku.trim() || null,
        unit: editForm.unit,
        active: editForm.active,
      });

      const targetBalance = Number(editForm.targetBalance);
      const currentBalance = balances[editing.id] ?? 0;
      if (!Number.isNaN(targetBalance) && targetBalance >= 0 && targetBalance !== currentBalance) {
        await adminApi.setProductStockBalance({
          productId: editing.id,
          targetBalance,
          reason: "Ajuste pelo cadastro de produtos",
        });
      }

      setEditOpen(false);
      setEditing(null);
      setSuccess("Produto atualizado.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  }

  function setEditTargetBalance(value: number) {
    setEditForm((f) => ({ ...f, targetBalance: String(value) }));
  }

  async function handleDelete(product: Product) {
    const msg = product.active
      ? `Excluir "${product.name}"? Se já foi usado, será apenas desativado.`
      : `Remover "${product.name}" da lista?`;
    if (!window.confirm(msg)) return;
    setDeletingId(product.id);
    setError("");
    try {
      const result = await adminApi.deleteProduct(product.id);
      setSuccess(
        result.deactivated ? `"${product.name}" desativado.` : `"${product.name}" excluído.`,
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao excluir");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Produtos</h1>
          <p>Reponha o que já existe ou cadastre nova série / modelo</p>
        </div>
        <div className="page-header-actions">
          <button type="button" className="btn btn-secondary" onClick={() => openIntake("restock")}>
            Repor estoque
          </button>
          <button type="button" className="btn btn-primary" onClick={() => openIntake("new")}>
            + Novo produto
          </button>
        </div>
      </div>

      {error && !showIntake && !editOpen ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      <div className="card intake-help">
        <strong>Como funciona</strong>
        <ul>
          <li>
            <b>Repor estoque</b>  chegou mais do mesmo item (mesma série)? Só informe a quantidade.
          </li>
          <li>
            <b>Novo produto</b>  equipamento de série ou modelo diferente? Cadastre como item novo.
          </li>
          <li>
            Use <b>Série / modelo</b> para diferenciar variantes (ex: HG8245Q, Lote 2024-A).
          </li>
        </ul>
      </div>

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Produto</th>
                <th>Série / modelo</th>
                <th>SKU</th>
                <th>Saldo</th>
                <th>Un.</th>
                <th style={{ minWidth: 220 }}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={6} className="empty">
                    Nenhum produto cadastrado.
                  </td>
                </tr>
              ) : (
              products.map((p) => (
                <tr key={p.id} className={!p.active ? "row-inactive" : undefined}>
                  <td>
                    <strong>{p.name}</strong>
                    {!p.active ? (
                      <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>Inativo</div>
                    ) : null}
                  </td>
                  <td>{p.series ?? "—"}</td>
                  <td>{p.sku ?? "—"}</td>
                  <td>
                    <strong>{balances[p.id] ?? 0}</strong>
                  </td>
                  <td>{p.unit}</td>
                  <td>
                    <div className="table-actions">
                      {p.active ? (
                        <button
                          type="button"
                          className="btn btn-secondary btn-sm"
                          onClick={() => openIntake("restock", p.id)}
                        >
                          Repor
                        </button>
                      ) : null}
                      <button
                        type="button"
                        className="btn btn-primary btn-sm"
                        onClick={() => openEdit(p)}
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === p.id}
                        onClick={() => handleDelete(p)}
                      >
                        {deletingId === p.id ? "..." : "Excluir"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        )}
      </div>

      <Modal
        open={showIntake}
        title={intakeMode === "restock" ? "Repor estoque" : "Novo produto / série"}
        onClose={closeIntake}
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={closeIntake} disabled={saving}>
              Cancelar
            </button>
            <button type="submit" form="product-intake-form" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : intakeMode === "restock" ? "Registrar entrada" : "Cadastrar"}
            </button>
          </>
        }
      >
        {error && showIntake ? <div className="alert alert-error">{error}</div> : null}

        <div className="intake-tabs">
          <button
            type="button"
            className={intakeMode === "restock" ? "chip active" : "chip"}
            onClick={() => setIntakeMode("restock")}
          >
            Repor existente
          </button>
          <button
            type="button"
            className={intakeMode === "new" ? "chip active" : "chip"}
            onClick={() => setIntakeMode("new")}
          >
            Nova série / produto
          </button>
        </div>

        <form id="product-intake-form" onSubmit={handleIntake}>
          {intakeMode === "restock" ? (
            <>
              <div className="field">
                <label>Produto no estoque *</label>
                <ProductPicker
                  products={products}
                  value={restockProductId}
                  balances={balances}
                  onChange={(id) => setRestockProductId(id)}
                />
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Quantidade recebida *</label>
                  <input
                    className="input-sm"
                    type="number"
                    min="0.001"
                    step="any"
                    value={restockQty}
                    onChange={(e) => setRestockQty(e.target.value)}
                    required
                  />
                </div>
                <div className="field">
                  <label>Unidade</label>
                  <input
                    className="input-sm"
                    value={
                      products.find((p) => p.id === restockProductId)?.unit ?? "un"
                    }
                    disabled
                  />
                </div>
              </div>
              <div className="field">
                <label>Lote / números de série (opcional)</label>
                <textarea
                  className="input-sm textarea-sm"
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="Ex: SN001–SN050, Lote mar/2026..."
                  rows={2}
                />
              </div>
            </>
          ) : (
            <>
              <div className="field">
                <label>Nome do produto *</label>
                <input
                  className="input-sm"
                  value={newForm.name}
                  onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: ONT Huawei, Cabo UTP..."
                  required
                />
              </div>

              {similarProducts.length > 0 ? (
                <div className="similar-box">
                  <p>Já existe algo parecido. Quer repor em vez de cadastrar de novo?</p>
                  <ul>
                    {similarProducts.slice(0, 4).map((p) => (
                      <li key={p.id}>
                        <span>
                          {p.name}
                          {p.series ? ` · ${p.series}` : ""}
                          {balances[p.id] !== undefined ? ` (saldo ${balances[p.id]})` : ""}
                        </span>
                        <button
                          type="button"
                          className="btn btn-secondary"
                          onClick={() => {
                            setIntakeMode("restock");
                            setRestockProductId(p.id);
                          }}
                        >
                          Repor este
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid-2">
                <div className="field">
                  <label>Série / modelo / lote</label>
                  <input
                    className="input-sm"
                    value={newForm.series}
                    onChange={(e) => setNewForm((f) => ({ ...f, series: e.target.value }))}
                    placeholder="Ex: HG8245Q2, Rev. B..."
                  />
                </div>
                <div className="field">
                  <label>SKU / código</label>
                  <input
                    className="input-sm"
                    value={newForm.sku}
                    onChange={(e) => setNewForm((f) => ({ ...f, sku: e.target.value }))}
                  />
                </div>
              </div>
              <div className="grid-2">
                <div className="field">
                  <label>Quantidade inicial</label>
                  <input
                    className="input-sm"
                    type="number"
                    min="0"
                    step="any"
                    value={newForm.quantity}
                    onChange={(e) => setNewForm((f) => ({ ...f, quantity: e.target.value }))}
                  />
                </div>
                <div className="field">
                  <label>Unidade</label>
                  <input
                    className="input-sm"
                    value={newForm.unit}
                    onChange={(e) => setNewForm((f) => ({ ...f, unit: e.target.value }))}
                  />
                </div>
              </div>
              <div className="field">
                <label>Obs. desta entrada (lote / série)</label>
                <textarea
                  className="input-sm textarea-sm"
                  value={newForm.batchNote}
                  onChange={(e) => setNewForm((f) => ({ ...f, batchNote: e.target.value }))}
                  rows={2}
                />
              </div>
            </>
          )}
        </form>

        <p className="intake-footer-link">
          Entradas detalhadas também em <Link to="/stock">Estoque</Link>.
        </p>
      </Modal>

      <Modal
        open={editOpen}
        title="Editar produto"
        onClose={() => !saving && setEditOpen(false)}
        footer={
          <>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setEditOpen(false)}
              disabled={saving}
            >
              Cancelar
            </button>
            <button type="submit" form="product-edit-form" className="btn btn-primary" disabled={saving}>
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </>
        }
      >
        {error && editOpen ? <div className="alert alert-error">{error}</div> : null}
        <form id="product-edit-form" onSubmit={handleEditSubmit}>
          <div className="field">
            <label>Nome *</label>
            <input
              value={editForm.name}
              onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div className="grid-2">
            <div className="field">
              <label>Série / modelo</label>
              <input
                value={editForm.series}
                onChange={(e) => setEditForm((f) => ({ ...f, series: e.target.value }))}
              />
            </div>
            <div className="field">
              <label>SKU</label>
              <input
                value={editForm.sku}
                onChange={(e) => setEditForm((f) => ({ ...f, sku: e.target.value }))}
              />
            </div>
          </div>
          <div className="field">
            <label>Unidade</label>
            <input
              value={editForm.unit}
              onChange={(e) => setEditForm((f) => ({ ...f, unit: e.target.value }))}
              required
            />
          </div>
          <label className="checkbox-field">
            <input
              type="checkbox"
              checked={editForm.active}
              onChange={(e) => setEditForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Produto ativo
          </label>

          <div className="field" style={{ marginTop: 16 }}>
            <label>Saldo em estoque</label>
            <p className="field-hint" style={{ marginTop: 0 }}>
              Saldo atual: <strong>{editing ? balances[editing.id] ?? 0 : 0}</strong> {editForm.unit}
            </p>
            <div className="grid-2">
              <div className="field" style={{ marginBottom: 0 }}>
                <input
                  className="input-sm"
                  type="number"
                  min="0"
                  step="any"
                  value={editForm.targetBalance}
                  onChange={(e) => setEditForm((f) => ({ ...f, targetBalance: e.target.value }))}
                />
              </div>
              <div className="table-actions" style={{ alignItems: "center" }}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setEditTargetBalance(0)}
                >
                  Zerar estoque
                </button>
              </div>
            </div>
            <p className="field-hint">
              Defina o saldo desejado. Ao salvar, o sistema registra um ajuste automático.
            </p>
          </div>
        </form>
      </Modal>
    </div>
  );
}
