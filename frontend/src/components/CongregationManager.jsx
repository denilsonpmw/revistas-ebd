import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { FormModal } from './Modal';

export default function CongregationManager() {
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCongregation, setEditingCongregation] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    isHeadquarters: false,
    areaId: '',
    address: '',
    city: '',
    contactName: ''
  });

  const { data: congregationsData, isLoading } = useQuery({
    queryKey: ['congregations'],
    queryFn: () => apiRequest('/admin/congregations')
  });

  const { data: areasData } = useQuery({
    queryKey: ['areas'],
    queryFn: () => apiRequest('/admin/areas')
  });

  const congregations = congregationsData?.congregations || [];
  const areas = areasData?.areas || [];

  const createMutation = useMutation({
    mutationFn: (data) => apiRequest('/admin/congregations', { method: 'POST', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['congregations']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      alert(error.message || 'Erro ao criar congregação');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, ...data }) => apiRequest(`/admin/congregations/${id}`, { method: 'PUT', body: data }),
    onSuccess: () => {
      queryClient.invalidateQueries(['congregations']);
      setIsModalOpen(false);
      resetForm();
    },
    onError: (error) => {
      alert(error.message || 'Erro ao atualizar congregação');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => apiRequest(`/admin/congregations/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      queryClient.invalidateQueries(['congregations']);
    },
    onError: (error) => {
      alert(error.message || 'Erro ao excluir congregação');
    }
  });

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      isHeadquarters: false,
      areaId: '',
      address: '',
      city: '',
      contactName: ''
    });
    setEditingCongregation(null);
  };

  const handleOpenCreate = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const handleOpenEdit = (congregation) => {
    setEditingCongregation(congregation);
    setFormData({
      name: congregation.name,
      code: congregation.code,
      isHeadquarters: congregation.isHeadquarters,
      areaId: congregation.areaId || '',
      address: congregation.address || '',
      city: congregation.city || '',
      contactName: congregation.contactName || ''
    });
    setIsModalOpen(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Sanitizar campos vazios para null
    const dataToSend = {
      name: formData.name.trim(),
      code: formData.code.trim(),
      isHeadquarters: Boolean(formData.isHeadquarters),
      areaId: formData.areaId ? formData.areaId.trim() : null,
      address: formData.address ? formData.address.trim() : null,
      city: formData.city ? formData.city.trim() : null,
      contactName: formData.contactName ? formData.contactName.trim() : null
    };
    
    if (editingCongregation) {
      updateMutation.mutate({ id: editingCongregation.id, ...dataToSend });
    } else {
      createMutation.mutate(dataToSend);
    }
  };

  const handleDelete = (congregation) => {
    if (window.confirm(`Tem certeza que deseja excluir a congregação "${congregation.name}"?`)) {
      deleteMutation.mutate(congregation.id);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (isLoading) {
    return <div className="p-6">Carregando congregações...</div>;
  }

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 p-6">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gerenciar Congregações</h3>
        <button
          onClick={handleOpenCreate}
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold hover:bg-emerald-700"
        >
          + Nova Congregação
        </button>
      </div>

      <div className="overflow-auto">
        <table className="min-w-full text-sm">
          <thead className="border-b border-slate-800">
            <tr>
              <th className="p-3 text-left">Nome</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Área</th>
              <th className="p-3 text-left">Cidade</th>
              <th className="p-3 text-left">Contato</th>
              <th className="p-3 text-left">Tipo</th>
              <th className="p-3 text-right">Ações</th>
            </tr>
          </thead>
          <tbody>
            {congregations.map((congregation) => (
              <tr key={congregation.id} className="border-t border-slate-800">
                <td className="p-3">{congregation.name}</td>
                <td className="p-3">
                  <span className="rounded bg-slate-700 px-2 py-1 font-mono text-xs">
                    {congregation.code}
                  </span>
                </td>
                <td className="p-3">{congregation.area?.name || '-'}</td>
                <td className="p-3">{congregation.city || '-'}</td>
                <td className="p-3">{congregation.contactName || '-'}</td>
                <td className="p-3">
                  {congregation.isHeadquarters ? (
                    <span className="rounded bg-purple-500/20 px-2 py-1 text-xs font-semibold text-purple-400">
                      Sede
                    </span>
                  ) : (
                    <span className="text-slate-500">Congregação</span>
                  )}
                </td>
                <td className="p-3 text-right">
                  <button
                    onClick={() => handleOpenEdit(congregation)}
                    className="mr-2 rounded bg-blue-600 px-3 py-1 text-xs hover:bg-blue-700"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(congregation)}
                    className="rounded bg-red-600 px-3 py-1 text-xs hover:bg-red-700"
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingCongregation ? 'Editar Congregação' : 'Nova Congregação'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300">Nome *</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Código *</label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              required
              placeholder="Ex: SEDE, CONG01"
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 font-mono text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Área</label>
            <select
              name="areaId"
              value={formData.areaId}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">Sem área</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Cidade</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Endereço</label>
            <input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300">Nome do Contato</label>
            <input
              type="text"
              name="contactName"
              value={formData.contactName}
              onChange={handleChange}
              className="mt-1 w-full rounded border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-blue-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="isHeadquarters"
              checked={formData.isHeadquarters}
              onChange={handleChange}
              className="h-4 w-4 rounded border-slate-700 bg-slate-800 text-blue-600 focus:ring-blue-500"
            />
            <label className="ml-2 text-sm font-medium text-slate-300">
              É Sede
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
              className="rounded border border-slate-700 px-4 py-2 hover:bg-slate-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending || updateMutation.isPending}
              className="rounded bg-blue-600 px-4 py-2 hover:bg-blue-700 disabled:opacity-50"
            >
              {createMutation.isPending || updateMutation.isPending
                ? 'Salvando...'
                : editingCongregation
                ? 'Atualizar'
                : 'Criar'}
            </button>
          </div>
        </form>
      </FormModal>
    </div>
  );
}
