import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';

export default function PeriodsPage() {
  const { register, handleSubmit, reset } = useForm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const periodsQuery = useQuery({
    queryKey: ['periods'],
    queryFn: async () => {
      const response = await apiRequest('/periods/admin/all', { method: 'GET' });
      return response;
    }
  });

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest('/periods', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Período cadastrado');
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiRequest(`/periods/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Período atualizado');
      setEditingId(null);
      setEditData({});
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiRequest(`/periods/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      toast.success('Período desativado');
      queryClient.invalidateQueries({ queryKey: ['periods'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCreate = (data) => {
    createMutation.mutate({
      code: data.code,
      name: data.name,
      startDate: data.startDate,
      endDate: data.endDate
    });
  };

  if (periodsQuery.isLoading) return <div className="p-4">Carregando...</div>;
  if (periodsQuery.isError) return <div className="p-4 text-red-400">Erro ao carregar períodos</div>;

  return (
    <div className="min-h-screen bg-slate-950 p-4">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Períodos de Revistas</h1>
          <button
            onClick={() => setShowForm(!showForm)}
            className="rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
          >
            {showForm ? 'Cancelar' : 'Novo Período'}
          </button>
        </div>

        {showForm && (
          <div className="mb-6 rounded border border-slate-700 bg-slate-900 p-4">
            <form onSubmit={handleSubmit(handleCreate)}>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <input
                  {...register('code', { required: true })}
                  placeholder="Código (ex: 1T2026)"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500"
                />
                <input
                  {...register('name', { required: true })}
                  placeholder="Nome (ex: 1º Trimestre 2026)"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white placeholder-slate-500"
                />
                <input
                  {...register('startDate', { required: true })}
                  type="date"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
                <input
                  {...register('endDate', { required: true })}
                  type="date"
                  className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-white"
                />
              </div>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="mt-4 rounded bg-emerald-600 px-4 py-2 text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {createMutation.isPending ? 'Salvando...' : 'Salvar'}
              </button>
            </form>
          </div>
        )}

        <div className="rounded border border-slate-700 bg-slate-900 overflow-x-auto">
          <table className="w-full divide-y divide-slate-800">
            <thead className="bg-slate-950">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data Início</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Data Fim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-slate-900 divide-y divide-slate-800">
              {periodsQuery.data.periods.map((period) => (
                <tr key={period.id} className="hover:bg-slate-800/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{period.code}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {editingId === period.id ? (
                      <input
                        value={editData.name || period.name}
                        onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      />
                    ) : (
                      period.name
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {editingId === period.id ? (
                      <input
                        type="date"
                        value={editData.startDate || new Date(period.startDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditData({ ...editData, startDate: e.target.value })}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      />
                    ) : (
                      new Date(period.startDate).toLocaleDateString('pt-BR')
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                    {editingId === period.id ? (
                      <input
                        type="date"
                        value={editData.endDate || new Date(period.endDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditData({ ...editData, endDate: e.target.value })}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      />
                    ) : (
                      new Date(period.endDate).toLocaleDateString('pt-BR')
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      period.active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                    }`}>
                      {period.active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {editingId === period.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => editMutation.mutate({ id: period.id, ...editData })}
                          className="text-emerald-400 hover:text-emerald-300"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({});
                          }}
                          className="text-slate-400 hover:text-slate-300"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setEditingId(period.id);
                            setEditData({ 
                              name: period.name, 
                              startDate: new Date(period.startDate).toISOString().split('T')[0], 
                              endDate: new Date(period.endDate).toISOString().split('T')[0] 
                            });
                          }}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        {period.active ? (
                          <button
                            onClick={() => deleteMutation.mutate(period.id)}
                            className="text-red-400 hover:text-red-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        ) : (
                          <button
                            onClick={() => editMutation.mutate({ id: period.id, active: true })}
                            className="text-emerald-400 hover:text-emerald-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
