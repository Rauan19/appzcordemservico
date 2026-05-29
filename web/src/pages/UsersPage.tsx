import { FormEvent, useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth, useCanAccess } from "../contexts/AuthContext";
import { adminApi } from "../services/admin-api";
import type { User, UserRole } from "../types/api";
import { roleLabels } from "../utils/labels";

export function UsersPage() {
  const isAdmin = useCanAccess(["ADMIN"]);
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("TECHNICIAN");

  function load() {
    setLoading(true);
    adminApi
      .listUsers()
      .then(setUsers)
      .catch((e) => setError(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  if (!isAdmin) return <Navigate to="/" replace />;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    try {
      await adminApi.createUser({ name, email, password, role });
      setShowForm(false);
      setName("");
      setEmail("");
      setPassword("");
      setRole("TECHNICIAN");
      setSuccess("Usuário criado.");
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar");
    }
  }

  async function toggleActive(target: User) {
    const nextActive = target.active === false;
    const action = nextActive ? "reativar" : "inativar";
    if (
      !window.confirm(
        `${nextActive ? "Reativar" : "Inativar"} o usuário ${target.name}?${
          !nextActive && target.role === "TECHNICIAN"
            ? " Ele não poderá entrar no app nem aparecer em novas OS."
            : ""
        }`,
      )
    ) {
      return;
    }
    setError("");
    setSuccess("");
    setTogglingId(target.id);
    try {
      await adminApi.setUserActive(target.id, nextActive);
      setSuccess(
        nextActive
          ? `${target.name} reativado.`
          : `${target.name} inativado.`,
      );
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Erro ao ${action}`);
    } finally {
      setTogglingId(null);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1>Usuários</h1>
          <p>Cadastre usuários e inative técnicos que saíram da equipe</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>
          {showForm ? "Cancelar" : "+ Novo usuário"}
        </button>
      </div>

      {error ? <div className="alert alert-error">{error}</div> : null}
      {success ? <div className="alert alert-success">{success}</div> : null}

      {showForm && (
        <form className="card card-accent" onSubmit={handleSubmit} style={{ maxWidth: 520 }}>
          <div className="field">
            <label>Nome *</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="field">
            <label>E-mail *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="field">
            <label>Senha *</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className="field">
            <label>Perfil *</label>
            <select value={role} onChange={(e) => setRole(e.target.value as UserRole)}>
              <option value="TECHNICIAN">Técnico</option>
              <option value="MANAGER">Gerente</option>
              <option value="STOCK">Estoque</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <button type="submit" className="btn btn-primary">
            Criar usuário
          </button>
        </form>
      )}

      <div className="card table-wrap">
        {loading ? (
          <div className="empty">Carregando...</div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>E-mail</th>
                <th>Perfil</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => {
                const isActive = u.active !== false;
                const isSelf = currentUser?.id === u.id;
                return (
                <tr key={u.id} className={!isActive ? "row-inactive" : undefined}>
                  <td>{u.name}</td>
                  <td>{u.email}</td>
                  <td>{roleLabels[u.role] ?? u.role}</td>
                  <td>
                    <span
                      className="badge"
                      style={{
                        color: isActive ? "var(--success)" : "var(--muted)",
                        background: isActive ? "#ecfdf518" : "#f1f5f918",
                        borderColor: isActive ? "#a7f3d040" : "var(--border)",
                      }}
                    >
                      {isActive ? "Ativo" : "Inativo"}
                    </span>
                  </td>
                  <td>
                    {!isSelf ? (
                      <button
                        type="button"
                        className={isActive ? "btn btn-secondary" : "btn btn-primary"}
                        disabled={togglingId === u.id}
                        onClick={() => toggleActive(u)}
                      >
                        {togglingId === u.id
                          ? "..."
                          : isActive
                            ? "Inativar"
                            : "Reativar"}
                      </button>
                    ) : (
                      <span style={{ color: "var(--muted)", fontSize: "0.75rem" }}>Você</span>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
