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
    const unitPrice = typeof values.unitPrice === 'string' 
      ? parseFloat(values.unitPrice.replace(/[^\d,]/g, '').replace(',', '.'))
      : Number(values.unitPrice);
    
    createMutation.mutate({
      code: values.code.trim(),
      name: values.name.trim(),
      className: values.className.trim(),
      ageRange: values.ageRange.trim(),
      unitPrice
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
            <label className="text-xs text-slate-400">Preço Unitário (R$)</label>
            <input
              type="text"
              inputMode="decimal"
              {...register('unitPrice', { 
                required: 'Preço é obrigatório',
                validate: (val) => {
                  const num = parseFloat((val || '').toString().replace(/[^\d,]/g, '').replace(',', '.'));
                  return !isNaN(num) && num > 0 ? true : 'Preço deve ser maior que 0';
                }
              })}
              placeholder="Ex: 8,50"
              className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
            />
            <button className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900">
              Cadastrar
            </button>
          </form>
        </div>
      )}

      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        {magazinesQuery.isLoading && <p className="text-sm">Carregando...</p>}
        {magazinesQuery.data?.magazines?.length ? (
          <div className="overflow-auto">
            <table className="min-w-full text-sm">
              <thead className="border-b border-slate-800">
                <tr>
                  <th className="p-2 text-left">Código</th>
                  <th className="p-2 text-left">Nome</th>
                  <th className="p-2 text-left">Classe</th>
                  <th className="p-2 text-left">Faixa Etária</th>
                  <th className="p-2 text-left">Preço</th>
                  <th className="p-2 text-left">Status</th>
                  <th className="p-2 text-left">Ações</th>
                </tr>
              </thead>
              <tbody>
                {magazinesQuery.data.magazines.map((mag) => (
                  <tr key={mag.id} className="border-t border-slate-800">
                    <td className="p-2 text-sm">{mag.code}</td>
                    <td className="p-2 text-sm">
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
                    <td className="p-2 text-sm">
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
                    <td className="p-2 text-sm">
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
                    <td className="p-2 text-sm">
                      {editingId === mag.id ? (
                        <input
                          type="text"
                          inputMode="decimal"
                          value={editData.unitPrice !== undefined ? editData.unitPrice : Number(mag.unitPrice).toFixed(2)}
                          onChange={(e) => setEditData({ ...editData, unitPrice: e.target.value })}
                          placeholder="Ex: 8,50"
                          className="w-full rounded border border-slate-700 bg-slate-950 px-2 py-1 text-sm"
                        />
                      ) : (
                        <span className="font-medium">R$ {Number(mag.unitPrice).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                      )}
                    </td>
                    <td className="p-2">{mag.active ? 'Ativa' : 'Inativa'}</td>
                    <td className="p-2 text-xs">
                      {editingId === mag.id ? (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              const unitPrice = typeof editData.unitPrice === 'string' 
                                ? parseFloat(editData.unitPrice.replace(/[^\d,]/g, '').replace(',', '.'))
                                : Number(editData.unitPrice);
                              editMutation.mutate({ 
                                id: mag.id, 
                                ...editData,
                                unitPrice
                              });
                            }}
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
                              setEditingId(mag.id);
                              setEditData({ 
                                name: mag.name, 
                                className: mag.className, 
                                ageRange: mag.ageRange, 
                                unitPrice: Number(mag.unitPrice).toFixed(2)
                              });
                            }}
                            className="text-blue-400 hover:underline"
                          >
                            Editar
                          </button>
                          {mag.active ? (
                            <button
                              onClick={() => deleteMutation.mutate(mag.id)}
                              className="text-red-400 hover:underline"
                            >
                              Desativar
                            </button>
                          ) : (
                            <button
                              onClick={() => editMutation.mutate({ id: mag.id, active: true })}
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
        ) : (
          <p className="text-sm text-slate-400">Nenhuma revista cadastrada.</p>
        )}
      </div>
    </div>
  );
}
