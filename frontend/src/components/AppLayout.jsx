import React, { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { apiRequest } from '../api/client.js';
import ThemeToggle from './ThemeToggle.jsx';

export default function AppLayout() {
  const { user, logout } = useAuth();
  const [showChangePassword, setShowChangePassword] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const roleLabels = {
    USER: 'Usuário',
    MANAGER: 'Gerente',
    ADMIN: 'Administrador'
  };

  const onSubmitChangePassword = async (data) => {
    if (data.newPassword !== data.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    try {
      const response = await apiRequest('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          currentPassword: data.currentPassword,
          newPassword: data.newPassword
        })
      });
      toast.success('Senha alterada com sucesso!');
      setShowChangePassword(false);
      reset();
    } catch (err) {
      // Se for erro de autenticação, mostrar mensagem específica
      if (err.message.includes('incorreta')) {
        toast.error('Senha atual incorreta');
      } else if (err.message.includes('Token')) {
        toast.error('Sessão expirada. Faça login novamente');
      } else {
        toast.error(err.message || 'Erro ao alterar senha');
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <header className="border-b border-slate-800">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-4">
          <Link to="/app" className="text-lg font-semibold">
            Revistas EBD
          </Link>
          <nav className="hidden lg:flex flex-1 flex-wrap items-center justify-center gap-4 text-sm">
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

            {user?.role === 'ADMIN' && (
              <div className="relative group">
                <button
                  type="button"
                  className="text-slate-300 hover:text-slate-100 transition-colors"
                  aria-haspopup="true"
                >
                  Cadastros
                </button>
                <div className="absolute left-0 top-full mt-0 hidden min-w-[220px] rounded-lg border border-slate-800 bg-slate-900 shadow-xl group-hover:block hover:block">
                  <NavLink
                    to="/app/revistas-admin"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-300'} hover:text-slate-100`
                    }
                  >
                    Gerenciar revistas
                  </NavLink>
                  <NavLink
                    to="/app/revistas-variacoes"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-300'} hover:text-slate-100`
                    }
                  >
                    Variações de revistas
                  </NavLink>
                  <NavLink
                    to="/app/periodos"
                    className={({ isActive }) =>
                      `block px-4 py-2 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-300'} hover:text-slate-100`
                    }
                  >
                    Períodos
                  </NavLink>
                </div>
              </div>
            )}

            <div className="relative group">
              <button
                type="button"
                className="text-slate-300 hover:text-slate-100 transition-colors"
                aria-haspopup="true"
              >
                Relatórios
              </button>
              <div className="absolute left-0 top-full mt-0 hidden min-w-[200px] rounded-lg border border-slate-800 bg-slate-900 shadow-xl group-hover:block hover:block">
                <NavLink
                  to="/app/revistas"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-300'} hover:text-slate-100`
                  }
                >
                  Catálogo
                </NavLink>
                <NavLink
                  to="/app/relatorios"
                  className={({ isActive }) =>
                    `block px-4 py-2 text-sm ${isActive ? 'text-emerald-400' : 'text-slate-300'} hover:text-slate-100`
                  }
                >
                  Relatórios
                </NavLink>
              </div>
            </div>

            {user?.role === 'ADMIN' && (
              <NavLink
                to="/app/usuarios"
                className={({ isActive }) =>
                  isActive ? 'text-emerald-400' : 'text-slate-300'
                }
              >
                Usuários
              </NavLink>
            )}
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <div className="hidden xl:block text-xs text-slate-400 whitespace-nowrap">
              {user?.name} ({roleLabels[user?.role] || user?.role})
            </div>
            <ThemeToggle />
            <button
              onClick={() => setShowChangePassword(true)}
              className="
                bg-slate-900/50 hover:bg-slate-900/70 border border-slate-700
                text-slate-100 hover:text-slate-50
                px-3 py-2 rounded-lg
                transition-all duration-200
                text-xs font-semibold
                min-h-[44px] min-w-[44px]
                flex items-center justify-center
              "
              title="Alterar Senha"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0V10.5m-1.5 0h12a1.5 1.5 0 011.5 1.5v6a1.5 1.5 0 01-1.5 1.5h-12A1.5 1.5 0 014.5 18v-6a1.5 1.5 0 011.5-1.5z" />
                <circle cx="12" cy="14" r="1" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2" />
              </svg>
            </button>
            <button
              onClick={logout}
              className="
                bg-slate-900/50 hover:bg-slate-900/70 border border-red-500
                text-slate-100 hover:text-slate-50
                px-3 py-2 rounded-lg
                transition-all duration-200
                text-xs font-semibold
                min-h-[44px] min-w-[44px]
                flex items-center justify-center
              "
              title="Sair"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
              </svg>
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 md:pb-6">
        <Outlet />
      </main>

      {/* Menu inferior (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-800 bg-slate-950/90 backdrop-blur lg:hidden">
        <div className="flex items-center gap-2 overflow-x-auto px-3 py-2 text-xs text-slate-300">
          <NavLink
            to="/app"
            end
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
            }
          >
            Painel
          </NavLink>
          <NavLink
            to="/app/pedidos"
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
            }
          >
            Pedidos
          </NavLink>
          <NavLink
            to="/app/revistas"
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
            }
          >
            Catálogo
          </NavLink>
          <NavLink
            to="/app/relatorios"
            className={({ isActive }) =>
              `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
            }
          >
            Relatórios
          </NavLink>
          {user?.role === 'ADMIN' && (
            <>
              <NavLink
                to="/app/revistas-admin"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
                }
              >
                Revistas
              </NavLink>
              <NavLink
                to="/app/revistas-variacoes"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
                }
              >
                Variações
              </NavLink>
              <NavLink
                to="/app/periodos"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
                }
              >
                Períodos
              </NavLink>
              <NavLink
                to="/app/usuarios"
                className={({ isActive }) =>
                  `whitespace-nowrap rounded px-3 py-2 ${isActive ? 'text-emerald-400' : 'text-slate-300'}`
                }
              >
                Usuários
              </NavLink>
            </>
          )}
        </div>
      </nav>

      {/* Modal de Alterar Senha */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-6">Alterar Senha</h2>

              <form onSubmit={handleSubmit(onSubmitChangePassword)} className="space-y-4">
                <div>
                  <label className="block text-sm text-slate-300 mb-2">Senha Atual</label>
                  <input
                    type="password"
                    {...register('currentPassword', { 
                      required: 'Senha atual é obrigatória',
                      minLength: { value: 4, message: 'Mínimo 4 caracteres' }
                    })}
                    placeholder="Digite sua senha atual"
                    className="w-full px-3 py-2 rounded border border-slate-700 bg-slate-800 text-slate-100"
                  />
                  {errors.currentPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.currentPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Nova Senha</label>
                  <input
                    type="password"
                    {...register('newPassword', { 
                      required: 'Nova senha é obrigatória',
                      minLength: { value: 4, message: 'Mínimo 4 caracteres' }
                    })}
                    placeholder="Digite sua nova senha"
                    className="w-full px-3 py-2 rounded border border-slate-700 bg-slate-800 text-slate-100"
                  />
                  {errors.newPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.newPassword.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm text-slate-300 mb-2">Confirmar Nova Senha</label>
                  <input
                    type="password"
                    {...register('confirmPassword', { 
                      required: 'Confirme a nova senha'
                    })}
                    placeholder="Confirme sua nova senha"
                    className="w-full px-3 py-2 rounded border border-slate-700 bg-slate-800 text-slate-100"
                  />
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-400">{errors.confirmPassword.message}</p>
                  )}
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowChangePassword(false);
                      reset();
                    }}
                    className="flex-1 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                  >
                    Alterar Senha
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
