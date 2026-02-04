import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import api from '../lib/api';
import { Modal } from '../components/Modal';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPendingOnly, setShowPendingOnly] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);
  const [resetPassword, setResetPassword] = useState(null);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Query para buscar todos os usuários
  const { data: users = [], isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await api.get('/users');
      return response.users || response;
    },
    refetchInterval: 5000 // Atualiza a cada 5 segundos
  });

  // Query para buscar usuários pendentes
  const { data: pendingUsers = [] } = useQuery({
    queryKey: ['users', 'pending'],
    queryFn: async () => {
      const response = await api.get('/users/pending');
      return response.users || response;
    },
    refetchInterval: 5000
  });

  // Query para buscar congregações
  const { data: congregations = [] } = useQuery({
    queryKey: ['congregations'],
    queryFn: async () => {
      const response = await api.get('/admin/congregations');
      return response.congregations || response;
    }
  });

  // Mutation para criar usuário
  const createMutation = useMutation({
    mutationFn: async (userData) => {
      return await api.post('/users', userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      reset();
      toast.success('Usuário criado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao criar usuário');
    }
  });

  // Mutation para atualizar usuário
  const updateMutation = useMutation({
    mutationFn: async ({ id, ...userData }) => {
      return await api.patch(`/users/${id}`, userData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setShowCreateModal(false);
      setEditingUser(null);
      reset();
      toast.success('Usuário atualizado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao atualizar usuário');
    }
  });

  // Mutation para deletar usuário
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      await api.delete(`/users/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário removido com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao remover usuário');
    }
  });

  // Mutation para resetar senha
  const resetPasswordMutation = useMutation({
    mutationFn: async (id) => {
      return await api.patch(`/users/${id}/reset-password`);
    },
    onSuccess: (data) => {
      setResetPassword(data.tempPassword);
      toast.success('Senha resetada com sucesso!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Erro ao resetar senha');
      setShowResetPasswordModal(false);
    }
  });

  const onSubmit = (data) => {
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    reset({
      name: user.name,
      whatsapp: user.whatsapp,
      congregationId: user.congregationId,
      role: user.role,
      active: user.active
    });
    setShowCreateModal(true);
  };

  const handleDelete = (user) => {
    setConfirmState({
      isOpen: true,
      title: 'Remover Usuário',
      message: `Tem certeza que deseja remover o usuário ${user.name}?`,
      confirmText: 'Remover',
      isDangerous: true,
      onConfirm: () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        deleteMutation.mutate(user.id);
      }
    });
  };

  const handleResetPassword = (user) => {
    setSelectedUserForReset(user);
    setResetPassword(null);
    setShowResetPasswordModal(true);
  };

  const confirmResetPassword = () => {
    if (selectedUserForReset) {
      resetPasswordMutation.mutate(selectedUserForReset.id);
    }
  };

  const closeResetPasswordModal = () => {
    setShowResetPasswordModal(false);
    setSelectedUserForReset(null);
    setResetPassword(null);
  };

  const handleToggleActive = (user) => {
    updateMutation.mutate({
      id: user.id,
      active: !user.active
    });
  };

  const closeModal = () => {
    setShowCreateModal(false);
    setEditingUser(null);
    reset();
  };

  const displayUsers = showPendingOnly ? pendingUsers : users;

  const roleLabels = {
    USER: 'Usuário',
    MANAGER: 'Gerente',
    ADMIN: 'Administrador'
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Gerenciamento de Usuários</h1>
          <p className="text-slate-400 mt-1">Gerencie os usuários do sistema</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
          </svg>
          Novo Usuário
        </button>
      </div>

      {/* Badge de Pendentes */}
      {pendingUsers.length > 0 && (
        <div className="mb-4 bg-yellow-900/30 border border-yellow-700 rounded-lg p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-900/60 rounded-full p-2">
              <svg className="w-6 h-6 text-yellow-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-yellow-100">
                {pendingUsers.length} Cadastro{pendingUsers.length !== 1 ? 's' : ''} Pendente{pendingUsers.length !== 1 ? 's' : ''}
              </h3>
              <p className="text-sm text-yellow-200">
                Aguardando aprovação
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowPendingOnly(!showPendingOnly)}
            className="text-sm font-medium text-blue-400 hover:text-blue-300"
          >
            {showPendingOnly ? 'Ver Todos' : 'Ver Pendentes'}
          </button>
        </div>
      )}

      {/* Tabela de Usuários */}
      <div className="bg-slate-900 rounded-lg border border-slate-800 overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center text-slate-400">Carregando...</div>
        ) : displayUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            {showPendingOnly ? 'Nenhum cadastro pendente' : 'Nenhum usuário cadastrado'}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Usuário
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    WhatsApp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Congregação
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Função
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-800">
                {displayUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-slate-100">{user.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-400">{user.whatsapp}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-slate-100">{user.congregation?.name}</div>
                      <div className="text-xs text-slate-400">{user.congregation?.area?.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.role === 'ADMIN' ? 'bg-purple-900/50 text-purple-300' :
                        user.role === 'MANAGER' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-slate-800 text-slate-300'
                      }`}>
                        {roleLabels[user.role]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        user.active ? 'bg-green-900/50 text-green-300' : 'bg-yellow-900/50 text-yellow-300'
                      }`}>
                        {user.active ? 'Ativo' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="text-blue-400 hover:text-blue-300"
                          title="Editar"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleResetPassword(user)}
                          className="text-purple-400 hover:text-purple-300"
                          title="Resetar Senha"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleToggleActive(user)}
                          className={user.active ? 'text-yellow-300 hover:text-yellow-200' : 'text-green-300 hover:text-green-200'}
                          title={user.active ? 'Desativar' : 'Ativar'}
                        >
                          {user.active ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="text-red-400 hover:text-red-300"
                          title="Remover"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Criar/Editar */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
                </h2>
                <button
                  onClick={closeModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome *
                  </label>
                  <input
                    type="text"
                    {...register('name', { required: 'Nome é obrigatório', minLength: { value: 3, message: 'Mínimo 3 caracteres' } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    WhatsApp *
                  </label>
                  <input
                    type="text"
                    {...register('whatsapp', { required: 'WhatsApp é obrigatório', minLength: { value: 10, message: 'Mínimo 10 dígitos' } })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="11999999999"
                  />
                  {errors.whatsapp && (
                    <p className="mt-1 text-sm text-red-600">{errors.whatsapp.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Congregação *
                  </label>
                  <select
                    {...register('congregationId', { required: 'Congregação é obrigatória' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecione...</option>
                    {congregations.map((cong) => (
                      <option key={cong.id} value={cong.id}>
                        {cong.name} - {cong.area.name}
                      </option>
                    ))}
                  </select>
                  {errors.congregationId && (
                    <p className="mt-1 text-sm text-red-600">{errors.congregationId.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função *
                  </label>
                  <select
                    {...register('role', { required: 'Função é obrigatória' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="USER">Usuário</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    {...register('active')}
                    defaultChecked={!editingUser}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label className="ml-2 block text-sm text-gray-900">
                    Conta ativa (usuário pode fazer login)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {editingUser ? 'Salvar' : 'Criar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Reset de Senha */}
      {showResetPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-lg shadow-xl max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-100 mb-4">
                Resetar Senha
              </h2>

              {!resetPassword ? (
                <>
                  <p className="text-slate-300 mb-4">
                    Deseja gerar uma nova senha temporária para <strong>{selectedUserForReset?.name}</strong>?
                  </p>
                  <p className="text-sm text-slate-400 mb-6">
                    Uma senha aleatória será gerada e exibida após a confirmação.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={closeResetPasswordModal}
                      className="flex-1 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Cancelar
                    </button>
                    <button
                      onClick={confirmResetPassword}
                      disabled={resetPasswordMutation.isPending}
                      className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
                    >
                      {resetPasswordMutation.isPending ? 'Processando...' : 'Confirmar'}
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="bg-green-900/30 border border-green-700 rounded-lg p-4 mb-4">
                    <p className="text-green-300 font-semibold mb-2">✅ Senha Resetada com Sucesso!</p>
                    <p className="text-sm text-green-200 mb-3">
                      Envie a nova senha temporária para o usuário:
                    </p>
                    <div className="bg-slate-800 rounded p-3 mb-3">
                      <p className="text-slate-100 font-mono text-center text-lg font-bold">
                        {resetPassword}
                      </p>
                    </div>
                    <p className="text-xs text-green-300">
                      O usuário poderá alterar a senha após fazer login.
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(resetPassword);
                        toast.success('Senha copiada!');
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      📋 Copiar
                    </button>
                    <button
                      onClick={closeResetPasswordModal}
                      className="flex-1 px-4 py-2 bg-slate-800 text-slate-100 rounded-lg hover:bg-slate-700 transition-colors"
                    >
                      Fechar
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      <Modal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        type="confirmation"
        confirmText={confirmState.confirmText || 'Confirmar'}
        cancelText="Cancelar"
        isDangerous={confirmState.isDangerous}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
}

