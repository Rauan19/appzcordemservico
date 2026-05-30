import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth, useCanAccess } from "../contexts/AuthContext";
import "./Layout.css";

const links = [
  { to: "/", label: "Ordens de serviço", roles: ["ADMIN", "MANAGER", "STOCK"] as const },
  { to: "/customers", label: "Clientes", roles: ["ADMIN", "MANAGER"] as const },
  { to: "/evaluations", label: "Avaliações", roles: ["ADMIN", "MANAGER"] as const },
  { to: "/products", label: "Produtos", roles: ["ADMIN", "MANAGER", "STOCK"] as const },
  { to: "/stock", label: "Estoque", roles: ["ADMIN", "MANAGER", "STOCK"] as const },
  { to: "/users", label: "Usuários", roles: ["ADMIN"] as const },
  { to: "/push", label: "Push", roles: ["ADMIN"] as const },
];

export function Layout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    signOut();
    navigate("/login");
  }

  return (
    <div className="layout">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <img src="/logo.png" alt="ZCnet" className="sidebar-logo" />
          <div>
            <strong>ZCnet Config</strong>
            <span>Painel administrativo</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavItem key={link.to} link={link} />
          ))}
        </nav>

        <div className="sidebar-user">
          <div className="user-name">{user?.name}</div>
          <div className="user-role">{user?.role}</div>
          <button type="button" className="btn btn-secondary logout-btn" onClick={handleLogout}>
            Sair
          </button>
        </div>
      </aside>

      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}

function NavItem({
  link,
}: {
  link: { to: string; label: string; roles: readonly ("ADMIN" | "MANAGER" | "STOCK")[] };
}) {
  const allowed = useCanAccess([...link.roles]);
  if (!allowed) return null;

  return (
    <NavLink
      to={link.to}
      end={link.to === "/"}
      className={({ isActive }) => (isActive ? "nav-link active" : "nav-link")}
    >
      {link.label}
    </NavLink>
  );
}
