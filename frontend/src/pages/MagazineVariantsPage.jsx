import React, { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
export default function MagazineVariantsPage() {
  const [selectedMagazineId, setSelectedMagazineId] = useState(null);
  const [showNewCombo, setShowNewCombo] = useState(false);
  const [newComboName, setNewComboName] = useState('');
  const [newComboCode, setNewComboCode] = useState('');
  const [newComboPrice, setNewComboPrice] = useState('');
  const [newComboVariantData, setNewComboVariantData] = useState({});
  const queryClient = useQueryClient();

  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines')
  });

  const selectedMagazine = magazinesQuery.data?.magazines?.find(m => m.id === selectedMagazineId);

  const createCombinationMutation = useMutation({
    mutationFn: ({ magazineId, name, code, price, variantData }) =>
      apiRequest(`/variants/${magazineId}/combinations`, {
        method: 'POST',
        body: JSON.stringify({
          name,
          code,
          price: Number(price),
          variantData: variantData || {}
        })
      }),
    onSuccess: () => {
      toast.success('Combinação criada com sucesso');
      setNewComboName('');
      setNewComboCode('');
      setNewComboPrice('');
      setNewComboVariantData({});
      setShowNewCombo(false);
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const updateCombinationMutation = useMutation({
    mutationFn: ({ combinationId, name, code, price, variantData }) =>
      apiRequest(`/variants/combinations/${combinationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          name,
          code,
          price: Number(price),
          variantData: variantData || {}
        })
      }),
    onSuccess: () => {
      toast.success('Combinação atualizada');
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteCombinationMutation = useMutation({
    mutationFn: (combinationId) =>
      apiRequest(`/variants/combinations/${combinationId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast.success('Combinação deletada');
      queryClient.invalidateQueries({ queryKey: ['magazines'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const handleCreateCombination = () => {
    if (!selectedMagazineId || !newComboName.trim() || !newComboCode.trim() || !newComboPrice) {
      toast.error('Preencha o nome, código e preço da combinação');
      return;
    }
    createCombinationMutation.mutate({
      magazineId: selectedMagazineId,
      name: newComboName,
      code: newComboCode,
      price: newComboPrice,
      variantData: newComboVariantData
    });
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Gerenciar Combinações de Preços</h1>

        <div className="grid lg:grid-cols-[300px_1fr] gap-6">
          {/* Seleção de Revista */}
          <div className="rounded border border-slate-800 bg-slate-900 p-4">
            <h2 className="text-lg font-semibold mb-4">Revistas</h2>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {magazinesQuery.data?.magazines?.map((mag) => (
                <button
                  key={mag.id}
                  onClick={() => {
                    setSelectedMagazineId(mag.id);
                    setShowNewCombo(false);
                  }}
                  className={`w-full text-left px-3 py-2 rounded transition ${
                    selectedMagazineId === mag.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-800 hover:bg-slate-700'
                  }`}
                >
                  <div className="font-semibold">{mag.name}</div>
                  <div className="text-xs text-slate-400">{mag.code}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Gerenciamento de Combinações */}
          {selectedMagazine ? (
            <div className="space-y-6">
              {/* Header da Revista Selecionada */}
              <div className="rounded border border-slate-800 bg-slate-900 p-4">
                <h2 className="text-xl font-bold">{selectedMagazine.name}</h2>
                <p className="text-sm text-slate-400">Código: {selectedMagazine.code}</p>
                <p className="text-sm text-slate-400">Preço Base: {formatCurrency(selectedMagazine.unitPrice)}</p>
              </div>

              {/* Criar Nova Combinação */}
              {!showNewCombo ? (
                <button
                  onClick={() => setShowNewCombo(true)}
                  className="w-full rounded bg-emerald-600 px-4 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  + Adicionar Combinação de Preço
                </button>
              ) : (
                <div className="rounded border border-slate-800 bg-slate-900 p-4">
                  <h3 className="text-lg font-semibold mb-4">Nova Combinação</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Nome da Combinação</label>
                      <input
                        type="text"
                        value={newComboName}
                        onChange={(e) => setNewComboName(e.target.value)}
                        placeholder="Ex: Aluno-Normal, Professor-Letra Grande..."
                        className="w-full rounded bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Código da Combinação</label>
                      <input
                        type="text"
                        value={newComboCode}
                        onChange={(e) => setNewComboCode(e.target.value.toUpperCase())}
                        placeholder="Ex: ADU-001, ADU-002..."
                        className="w-full rounded bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm text-slate-400 mb-2">Preço (R$)</label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={newComboPrice}
                        onChange={(e) => setNewComboPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded bg-slate-950 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleCreateCombination}
                        disabled={createCombinationMutation.isPending}
                        className="flex-1 rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                      >
                        {createCombinationMutation.isPending ? 'Criando...' : 'Criar'}
                      </button>
                      <button
                        onClick={() => {
                          setShowNewCombo(false);
                          setNewComboName('');
                          setNewComboCode('');
                          setNewComboPrice('');
                          setNewComboVariantData({});
                        }}
                        className="flex-1 rounded bg-slate-700 px-3 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Lista de Combinações */}
              {selectedMagazine.variantCombinations && selectedMagazine.variantCombinations.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Combinações de Preços ({selectedMagazine.variantCombinations.length})</h3>
                  {selectedMagazine.variantCombinations.map((combo) => (
                    <div key={combo.id} className="rounded border border-slate-800 bg-slate-900 p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-3">
                            <h4 className="font-semibold text-lg">{combo.name}</h4>
                            <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded">{combo.code}</span>
                          </div>
                          <p className="text-sm text-slate-400 mt-1">{formatCurrency(combo.price)}</p>
                          {combo.variantData && Object.keys(combo.variantData).length > 0 && (
                            <div className="text-xs text-slate-400 mt-2">
                              {Object.entries(combo.variantData).map(([key, value]) => (
                                <div key={key}>{key}: {value}</div>
                              ))}
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => deleteCombinationMutation.mutate(combo.id)}
                          disabled={deleteCombinationMutation.isPending}
                          className="text-red-400 hover:text-red-300 text-sm font-semibold"
                        >
                          Deletar
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-slate-400 rounded border border-slate-800 bg-slate-900">
                  Nenhuma combinação criada ainda. Crie uma para começar.
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-96 text-slate-400">
              Selecione uma revista para gerenciar suas combinações de preços
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
