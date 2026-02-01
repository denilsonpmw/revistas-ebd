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
      startDate: new Date(data.startDate).toISOString(),
      endDate: new Date(data.endDate).toISOString()
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
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="border-b border-slate-700 bg-slate-800 text-slate-100">
              <tr>
                <th className="p-2">Código</th>
                <th className="p-2">Nome</th>
                <th className="p-2">Data Início</th>
                <th className="p-2">Data Fim</th>
                <th className="p-2">Status</th>
                <th className="p-2">Ações</th>
              </tr>
            </thead>
            <tbody>
              {periodsQuery.data.periods.map((period) => (
                <tr key={period.id} className="border-t border-slate-800">
                  <td className="p-2">{period.code}</td>
                  <td className="p-2">
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
                  <td className="p-2">
                    {editingId === period.id ? (
                      <input
                        type="date"
                        value={editData.startDate ? editData.startDate.split('T')[0] : new Date(period.startDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditData({ ...editData, startDate: new Date(e.target.value).toISOString() })}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      />
                    ) : (
                      new Date(period.startDate).toLocaleDateString('pt-BR')
                    )}
                  </td>
                  <td className="p-2">
                    {editingId === period.id ? (
                      <input
                        type="date"
                        value={editData.endDate ? editData.endDate.split('T')[0] : new Date(period.endDate).toISOString().split('T')[0]}
                        onChange={(e) => setEditData({ ...editData, endDate: new Date(e.target.value).toISOString() })}
                        className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                      />
                    ) : (
                      new Date(period.endDate).toLocaleDateString('pt-BR')
                    )}
                  </td>
                  <td className="p-2">{period.active ? 'Ativo' : 'Inativo'}</td>
                  <td className="p-2 text-xs">
                    {editingId === period.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => editMutation.mutate({ id: period.id, ...editData })}
                          className="text-emerald-400 hover:underline"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditData({});
                          }}
                          className="text-slate-400 hover:underline"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-1">
                        <button
                          onClick={() => {
                            setEditingId(period.id);
                            setEditData({ name: period.name, startDate: period.startDate, endDate: period.endDate });
                          }}
                          className="text-blue-400 hover:underline"
                        >
                          Editar
                        </button>
                        {period.active ? (
                          <button
                            onClick={() => deleteMutation.mutate(period.id)}
                            className="text-red-400 hover:underline"
                          >
                            Desativar
                          </button>
                        ) : (
                          <button
                            onClick={() => editMutation.mutate({ id: period.id, active: true })}
                            className="text-emerald-400 hover:underline"
                          >
                            Reativar
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
