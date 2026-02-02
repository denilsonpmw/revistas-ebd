import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';

export default function MagazinesPage() {
  const { register, handleSubmit, reset } = useForm();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const queryClient = useQueryClient();

  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines')
  });

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest('/magazines', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Revista cadastrada');
      reset();
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const editMutation = useMutation({
    mutationFn: ({ id, ...payload }) =>
      apiRequest(`/magazines/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Revista atualizada');
      setEditingId(null);
      setEditData({});
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (id) =>
      apiRequest(`/magazines/${id}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast.success('Revista desativada');
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const onSubmit = (values) => {
    createMutation.mutate({
      code: values.code.trim(),
      name: values.name.trim(),
      className: values.className.trim(),
      ageRange: values.ageRange.trim(),
      unitPrice: 0
    });
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Gerenciar Revistas</h2>
        <button
          onClick={() => setShowForm(!showForm)}
          className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900"
        >
          {showForm ? 'Cancelar' : 'Nova Revista'}
        </button>
      </div>

      {showForm && (
        <div className="rounded border border-slate-800 bg-slate-900 p-4">
          <h3 className="mb-4 text-lg font-semibold">Cadastrar Revista</h3>
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
            <label className="text-xs text-slate-400">Código</label>
            <input
              {...register('code', { required: true })}
              placeholder="Ex: ADU-01"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="text-xs text-slate-400">Nome da Classe</label>
            <input
              {...register('name', { required: true })}
              placeholder="Ex: Lições Bíblicas Adultos"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="text-xs text-slate-400">Classe (Nome)</label>
            <input
              {...register('className', { required: true })}
              placeholder="Ex: Lições Adultos"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <label className="text-xs text-slate-400">Faixa Etária</label>
            <input
              {...register('ageRange', { required: true })}
              placeholder="Ex: 1-2, 3-4, 5-7"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Cadastrar
            </button>
          </form>
        </div>
      )}

      <div className="rounded border border-slate-800 bg-slate-900 overflow-hidden">
        {magazinesQuery.isLoading && <p className="text-sm p-4">Carregando...</p>}
        {magazinesQuery.data?.magazines?.length ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-950">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Classe</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Faixa Etária</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-400 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-slate-900 divide-y divide-slate-800">
                {magazinesQuery.data.magazines.map((mag) => (
                  <tr key={mag.id} className="hover:bg-slate-800/50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-100">{mag.code}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {editingId === mag.id ? (
                        <input
                          value={editData.name || mag.name}
                          onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                        />
                      ) : (
                        mag.name
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {editingId === mag.id ? (
                        <input
                          value={editData.className || mag.className}
                          onChange={(e) => setEditData({ ...editData, className: e.target.value })}
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                        />
                      ) : (
                        mag.className
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-100">
                      {editingId === mag.id ? (
                        <input
                          value={editData.ageRange || mag.ageRange}
                          onChange={(e) => setEditData({ ...editData, ageRange: e.target.value })}
                          placeholder="Ex: 18+"
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                        />
                      ) : (
                        mag.ageRange
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        mag.active ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                      }`}>
                        {mag.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {editingId === mag.id ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              editMutation.mutate({ 
                                id: mag.id, 
                                ...editData
                              });
                            }}
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
                              setEditingId(mag.id);
                              setEditData({ 
                                name: mag.name, 
                                className: mag.className, 
                                ageRange: mag.ageRange
                              });
                            }}
                            className="text-blue-400 hover:text-blue-300"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                          </button>
                          {mag.active ? (
                            <button
                              onClick={() => deleteMutation.mutate(mag.id)}
                              className="text-red-400 hover:text-red-300"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          ) : (
                            <button
                              onClick={() => editMutation.mutate({ id: mag.id, active: true })}
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
        ) : (
          <p className="text-sm text-slate-400">Nenhuma revista cadastrada.</p>
        )}
      </div>
    </div>
  );
}
