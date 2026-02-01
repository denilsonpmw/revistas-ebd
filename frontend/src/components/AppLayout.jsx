import React from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();

  const roleLabels = {
    USER: 'Usuário',
    MANAGER: 'Gerente',
    ADMIN: 'Administrador'
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/app" className="text-lg font-semibold">
            Revistas EBD
          </Link>
          <nav className="flex gap-4 text-sm">
            <NavLink
              to="/app"
              end
              className={({ isActive }) =>
                isActive ? 'text-emerald-400' : 'text-slate-300'
              }
            >
              Painel
            </NavLink>
            <NavLink
              to="/app/pedidos"
              className={({ isActive }) =>
                isActive ? 'text-emerald-400' : 'text-slate-300'
              }
            >
              Pedidos
            </NavLink>
            <NavLink
              to="/app/revistas"
              className={({ isActive }) =>
                isActive ? 'text-emerald-400' : 'text-slate-300'
              }
            >
              Catálogo
            </NavLink>
            <NavLink
              to="/app/relatorios"
              className={({ isActive }) =>
                isActive ? 'text-emerald-400' : 'text-slate-300'
              }
            >
              Relatórios
            </NavLink>
            {user?.role === 'ADMIN' && (
              <>
                <NavLink
                  to="/app/revistas-admin"
                  className={({ isActive }) =>
                    isActive ? 'text-emerald-400' : 'text-slate-300'
                  }
                >
                  Gerenciar Revistas
                </NavLink>
                <NavLink
                  to="/app/periodos"
                  className={({ isActive }) =>
                    isActive ? 'text-emerald-400' : 'text-slate-300'
                  }
                >
                  Períodos
                </NavLink>
                <NavLink
                  to="/app/usuarios"
                  className={({ isActive }) =>
                    isActive ? 'text-emerald-400' : 'text-slate-300'
                  }
                >
                  Usuários
                </NavLink>
              </>
            )}
          </nav>
          <div className="flex items-center gap-3">
            <div className="text-xs text-slate-400">
              {user?.name} ({roleLabels[user?.role] || user?.role})
            </div>
            <button
              onClick={logout}
              className="rounded bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
