import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { VariantSelector, getPriceForCombination } from '../components/VariantSelector';
import { Modal } from '../components/Modal';
import { formatCurrency } from '../utils/currency';

const statusPT = {
  PENDING: 'Pendente',
  APPROVED: 'Pago',
  DELIVERED: 'Entregue',
  CANCELED: 'Cancelado'
};

// Estilos de impressão
const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #print-area,
    #print-area * {
      visibility: visible;
    }
    #print-area {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
      color: black;
      padding: 20px;
    }
    #print-area p {
      margin: 8px 0;
    }
    #print-area .grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    #print-area .space-y-3 > * + * {
      margin-top: 12px;
    }
    #print-area .text-xs {
      font-size: 12px;
      color: #666;
    }
    #print-area .font-semibold {
      font-weight: bold;
    }
    #print-area .bg-slate-900 {
      background: #f5f5f5;
      border: 1px solid #ddd;
    }
    #print-area .bg-slate-950 {
      background: white !important;
      color: black !important;
      border: 1px solid #ddd;
    }
    #print-area .border-t {
      border-top: 1px solid #ddd;
    }
    #print-area .bg-yellow-900 {
      background: #ffe066 !important;
      color: #222 !important;
      border: 1px solid #bbb;
    }
    #print-area .bg-blue-900 {
      background: #a5d8ff !important;
      color: #222 !important;
      border: 1px solid #bbb;
    }
    #print-area .bg-green-900 {
      background: #b2f2bb !important;
      color: #222 !important;
      border: 1px solid #bbb;
    }
    #print-area .bg-red-900 {
      background: #ffa8a8 !important;
      color: #222 !important;
      border: 1px solid #bbb;
    }
    #print-area .text-yellow-100,
    #print-area .text-blue-100,
    #print-area .text-green-100,
    #print-area .text-red-100 {
      color: #222 !important;
    }
  }
`;

export default function OrdersPage() {
  const { register, handleSubmit, reset } = useForm();
  const [items, setItems] = useState([]);
  const [selectedMagazineId, setSelectedMagazineId] = useState('');
  const [selectedCombinationId, setSelectedCombinationId] = useState(null);
  const [currentUnitPrice, setCurrentUnitPrice] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [userRole, setUserRole] = useState(null);
  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editItems, setEditItems] = useState([]);
  const [editSelectedMagazineId, setEditSelectedMagazineId] = useState('');
  const [editSelectedCombinationId, setEditSelectedCombinationId] = useState(null);
  const [editCurrentUnitPrice, setEditCurrentUnitPrice] = useState(0);
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
  const queryClient = useQueryClient();

  const meQuery = useQuery({
    queryKey: ['me'],
    queryFn: () => apiRequest('/auth/me')
  });

  React.useEffect(() => {
    if (meQuery.data?.user?.role) {
      setUserRole(meQuery.data.user.role);
    }
  }, [meQuery.data]);

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiRequest('/orders'),
    refetchInterval: 5000
  });

  const orderDetailQuery = useQuery({
    queryKey: ['order', selectedOrderId],
    queryFn: () => apiRequest(`/orders/${selectedOrderId}`),
    enabled: !!selectedOrderId
  });

  const statusMutation = useMutation({
    mutationFn: ({ orderId, status }) =>
      apiRequest(`/orders/${orderId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      toast.success('Status atualizado');
      queryClient.invalidateQueries({ queryKey: ['order', selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const editMutation = useMutation({
    mutationFn: ({ orderId, payload }) =>
      apiRequest(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Pedido atualizado com sucesso');
      setEditingOrderId(null);
      setEditItems([]);
      queryClient.invalidateQueries({ queryKey: ['order', selectedOrderId] });
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const deleteMutation = useMutation({
    mutationFn: (orderId) =>
      apiRequest(`/orders/${orderId}`, {
        method: 'DELETE'
      }),
    onSuccess: () => {
      toast.success('Pedido deletado com sucesso');
      setSelectedOrderId(null);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines?active=true')
  });

  const periodsQuery = useQuery({
    queryKey: ['periods'],
    queryFn: () => apiRequest('/periods')
  });

  React.useEffect(() => {
    if (editingOrderId && orderDetailQuery.data?.order?.items && magazinesQuery.data?.magazines) {
      setEditItems(
        orderDetailQuery.data.order.items.map(item => {
          // Buscar a revista atualizada da lista de revistas para ter o unitPrice correto
          const currentMagazine = magazinesQuery.data.magazines.find(m => m.id === item.magazineId);
          const combinationName = item.variantData?.combinationName || item.combinationName;
          const combinationId = item.variantData?.combinationId || item.combinationId;
          return {
            magazineId: item.magazineId,
            quantity: item.quantity,
            magazine: currentMagazine || item.magazine, // Usar a revista atualizada se encontrada
            combinationId,
            combinationName,
            unitPrice: Number(item.unitPrice || 0),
            totalValue: Number(item.totalValue || 0)
          };
        })
      );
      // Resetar seleção de revista e combinação para novo item
      setEditSelectedMagazineId('');
      setEditSelectedCombinationId(null);
      setEditCurrentUnitPrice(0);
    }
  }, [editingOrderId, orderDetailQuery.data, magazinesQuery.data]);

  const createMutation = useMutation({
    mutationFn: (payload) =>
      apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(payload)
      }),
    onSuccess: () => {
      toast.success('Pedido enviado com sucesso');
      reset();
      setItems([]);
      queryClient.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err) => toast.error(err.message)
  });

  const onSubmit = (values) => {
    if (items.length === 0) {
      toast.error('Adicione pelo menos uma revista');
      return;
    }

    createMutation.mutate({
      periodId: values.periodId,
      items,
      observations: values.observations || undefined
    });
  };

  const addItem = () => {
    const quantityInput = document.querySelector('[name="quantity"]');
    const quantity = parseInt(quantityInput?.value) || 1;

    if (!selectedMagazineId) {
      toast.error('Selecione uma revista');
      return;
    }

    if (!selectedCombinationId) {
      toast.error('Selecione uma variação');
      return;
    }

    const magazine = magazinesQuery.data?.magazines?.find(m => m.id === selectedMagazineId);
    if (!magazine) {
      toast.error('Revista não encontrada');
      return;
    }

    // Verificar se revista com mesma combinação já foi adicionada
    if (items.some(item => item.magazineId === selectedMagazineId && item.combinationId === selectedCombinationId)) {
      toast.error('Esta variação já foi adicionada');
      return;
    }

    // Obter combinação selecionada
    const combination = magazine.variantCombinations?.find(c => c.id === selectedCombinationId);
    if (!combination) {
      toast.error('Combinação não encontrada');
      return;
    }

    const unitPrice = Number(combination.price);
    const totalValue = Number((quantity * unitPrice).toFixed(2));

    setItems([...items, {
      magazineId: selectedMagazineId,
      combinationId: selectedCombinationId,
      combinationName: combination.name,
      quantity,
      magazine: {
        id: magazine.id,
        name: magazine.name,
        className: magazine.className,
        ageRange: magazine.ageRange
      },
      unitPrice,
      totalValue
    }]);

    // Limpar campos
    setSelectedMagazineId('');
    quantityInput.value = '1';
    setSelectedCombinationId(null);
    setCurrentUnitPrice(0);
  };

  const removeItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handlePrint = () => {
    window.print();
  };

  const totalValue = items.reduce((sum, item) => sum + item.totalValue, 0);

  const formatDate = (date) => new Date(date).toLocaleDateString('pt-BR');

  // ...existing code...
  // Buscar pedidos pendentes da congregação do usuário
  const user = meQuery.data?.user;
  const orders = ordersQuery.data?.orders || [];
  const myPendingOrders = orders.filter(o => o.congregationId === user?.congregationId && o.status === 'PENDING');

  return (
    <>
      <style>{printStyles}</style>
      <div className="grid gap-6 lg:grid-cols-[1fr_1.5fr]">
      {/* Formulário */}
      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-4 text-lg font-semibold">Novo Pedido</h3>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-3">
          <label className="text-xs text-slate-400">Período *</label>
          <select
            {...register('periodId', { required: 'Período é obrigatório' })}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          >
            <option value="">Selecione...</option>
            {periodsQuery.data?.periods?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.code} - {p.name}
              </option>
            ))}
          </select>

          <div className="space-y-2">
            <label className="text-xs text-slate-400">Adicionar Revistas</label>
            <div className="space-y-2">
              <select
                name="magazineId"
                value={selectedMagazineId}
                className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm w-full"
                onChange={(e) => {
                  setSelectedMagazineId(e.target.value);
                  // Resetar variante quando mudar revista
                  setSelectedCombinationId(null);
                  setCurrentUnitPrice(0);
                }}
              >
                <option value="">Selecione revista...</option>
                {magazinesQuery.data?.magazines?.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name} - {m.className}
                  </option>
                ))}
              </select>

              {/* Mostrar seletor de variações se a revista tiver variantes */}
              {(() => {
                const magazine = magazinesQuery.data?.magazines?.find(m => m.id === selectedMagazineId);
                
                if (!selectedMagazineId || !magazine) {
                  return null;
                }
                
                if (!magazine.variantCombinations || magazine.variantCombinations.length === 0) {
                  return null;
                }
                
                return (
                  <VariantSelector
                    magazine={magazine}
                    selectedCombinationId={selectedCombinationId}
                    onCombinationChange={(combId) => setSelectedCombinationId(combId)}
                    onPriceUpdate={(price) => setCurrentUnitPrice(price)}
                  />
                );
              })()}

              <div className="flex gap-2">
                <input
                  type="number"
                  name="quantity"
                  defaultValue="1"
                  className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                  placeholder="Qtd"
                />
                <button
                  type="button"
                  onClick={addItem}
                  className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  +
                </button>
              </div>
            </div>

            {items.length > 0 && (
              <div className="space-y-2 bg-slate-950 p-2 rounded">
                <p className="text-xs text-slate-400 font-semibold">Itens adicionados:</p>
                {items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-xs bg-slate-900 p-2 rounded gap-2">
                    <div className="flex-1">
                      <p className="text-slate-100">{item.magazine.name}</p>
                      <p className="text-slate-400 mt-1">
                        Variação: <span className="font-semibold">{item.combinationName}</span>
                      </p>
                      <p className="text-slate-400 mt-1">
                        {item.quantity}x {formatCurrency(item.unitPrice)} = {formatCurrency(item.totalValue)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="text-red-400 hover:text-red-300 font-bold flex-shrink-0"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <div className="border-t border-slate-700 pt-2">
                  <p className="text-sm font-semibold text-emerald-400">
                    Total: {formatCurrency(totalValue)}
                  </p>
                </div>
              </div>
            )}
          </div>

          <label className="text-xs text-slate-400">Observações</label>
          <textarea
            {...register('observations')}
            className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm h-20"
            placeholder="Observações do pedido..."
          />

          <button
            type="submit"
            disabled={items.length === 0 || createMutation.isPending || myPendingOrders.length > 0}
            className="rounded bg-emerald-500 px-4 py-2 text-sm font-semibold text-slate-900 hover:bg-emerald-600 disabled:opacity-50"
            title={myPendingOrders.length > 0 ? 'Você possui pedido pendente de aprovação. Aguarde antes de enviar um novo pedido.' : ''}
          >
            {createMutation.isPending ? 'Enviando...' : myPendingOrders.length > 0 ? 'Aguardando aprovação do pedido anterior' : 'Enviar Pedido'}
          </button>
        </form>
      </div>

      {/* Lista de Pedidos */}
      <div className="rounded border border-slate-800 bg-slate-900 p-4">
        <h3 className="mb-4 text-lg font-semibold">
          {selectedOrderId ? 'Detalhe do Pedido' : 'Pedidos Recentes'}
        </h3>

        {selectedOrderId && orderDetailQuery.isLoading && (
          <p className="text-sm text-slate-400">Carregando...</p>
        )}

        {selectedOrderId && orderDetailQuery.data?.order && (
          <div className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <button
                onClick={() => setSelectedOrderId(null)}
                className="text-blue-400 hover:text-blue-300 text-sm"
              >
                ← Voltar à lista
              </button>
              <div className="flex gap-2">
                <button
                  onClick={handlePrint}
                  className="text-emerald-400 hover:text-emerald-300 text-sm font-semibold"
                >
                  🖨️ Imprimir
                </button>
                {orderDetailQuery.data.order.status === 'PENDING' && (
                  <>
                    <button
                      onClick={() => setEditingOrderId(selectedOrderId)}
                      className="text-blue-400 hover:text-blue-300 text-sm font-semibold"
                    >
                      ✏️ Editar
                    </button>
                    <button
                      onClick={() => {
                        setConfirmState({
                          isOpen: true,
                          title: 'Deletar Pedido',
                          message: 'Deseja deletar este pedido? Essa ação não pode ser desfeita.',
                          confirmText: 'Deletar',
                          isDangerous: true,
                          onConfirm: () => {
                            setConfirmState(prev => ({ ...prev, isOpen: false }));
                            deleteMutation.mutate(selectedOrderId);
                          }
                        });
                      }}
                      disabled={deleteMutation.isPending}
                      className="text-red-400 hover:text-red-300 text-sm font-semibold disabled:opacity-50"
                    >
                      🗑️ Deletar
                    </button>
                  </>
                )}
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded space-y-3 text-sm" id="print-area">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-slate-400">Nº do Pedido</p>
                  <p className="font-semibold text-emerald-400">#{orderDetailQuery.data.order.number ? String(orderDetailQuery.data.order.number).padStart(4, '0') : orderDetailQuery.data.order.id?.slice(0, 8)}</p>
                </div>
                <div>
                  <p className="text-xs text-slate-400">Data do Pedido</p>
                  <p className="font-semibold">{formatDate(orderDetailQuery.data.order.createdAt)}</p>
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400">Congregação</p>
                <p className="font-semibold">{orderDetailQuery.data.order.congregation.name}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Responsável</p>
                <p className="font-semibold">{orderDetailQuery.data.order.submittedBy.name}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400">Período</p>
                <p className="font-semibold">{orderDetailQuery.data.order.period.code}</p>
              </div>

              <div>
                <p className="text-xs text-slate-400 mb-2">Status</p>
                {userRole === 'ADMIN' ? (
                  <select
                    value={orderDetailQuery.data.order.status}
                    onChange={(e) => statusMutation.mutate({ orderId: selectedOrderId, status: e.target.value })}
                    className={`rounded px-3 py-2 text-sm w-full font-semibold ${
                      orderDetailQuery.data.order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-100 border border-yellow-700' :
                      orderDetailQuery.data.order.status === 'APPROVED' ? 'bg-blue-900 text-blue-100 border border-blue-700' :
                      orderDetailQuery.data.order.status === 'DELIVERED' ? 'bg-green-900 text-green-100 border border-green-700' :
                      'bg-red-900 text-red-100 border border-red-700'
                    }`}
                    disabled={statusMutation.isPending}
                  >
                    <option value="PENDING">{statusPT.PENDING}</option>
                    <option value="APPROVED">{statusPT.APPROVED}</option>
                    <option value="DELIVERED">{statusPT.DELIVERED}</option>
                    <option value="CANCELED">{statusPT.CANCELED}</option>
                  </select>
                ) : (
                  <span className={`px-2 py-1 rounded text-xs font-semibold ${
                    orderDetailQuery.data.order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-100' :
                    orderDetailQuery.data.order.status === 'APPROVED' ? 'bg-blue-900 text-blue-100' :
                    orderDetailQuery.data.order.status === 'DELIVERED' ? 'bg-green-900 text-green-100' :
                    'bg-red-900 text-red-100'
                  }`}>
                    {statusPT[orderDetailQuery.data.order.status] || orderDetailQuery.data.order.status}
                  </span>
                )}
              </div>

              <div className="border-t border-slate-700 pt-3">
                <p className="text-xs text-slate-400 font-semibold mb-2">Revistas</p>
                <div className="space-y-2">
                  {orderDetailQuery.data.order.items?.map((item, idx) => (
                    <div key={idx} className="bg-slate-900 p-2 rounded text-xs">
                      <div className="flex justify-between">
                        <span className="font-semibold">
                          {item.variantData?.combinationName || item.combinationName
                            ? `${item.magazine.name} - ${item.variantData?.combinationName || item.combinationName}`
                            : item.magazine.name}
                        </span>
                        <span>{item.quantity}x</span>
                      </div>
                      <div className="flex justify-between text-slate-300 mt-1">
                        <span>{formatCurrency(item.unitPrice)} cada</span>
                        <span className="font-semibold">{formatCurrency(item.totalValue)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {orderDetailQuery.data.order.observations && (
                <div className="bg-slate-950 p-2 rounded">
                  <p className="text-xs text-slate-400">Observações</p>
                  <p className="text-xs text-slate-200">{orderDetailQuery.data.order.observations}</p>
                </div>
              )}

              <div className="border-t border-slate-700 pt-3 text-right">
                <p className="text-slate-400 text-xs">Total do Pedido:</p>
                <p className="text-lg font-bold text-emerald-400">
                  {formatCurrency(
                    orderDetailQuery.data.order.items?.reduce((sum, item) => sum + Number(item.totalValue), 0) || 0
                  )}
                </p>
              </div>
            </div>
          </div>
        )}

        {!selectedOrderId && (
          <div className="space-y-2">
            {ordersQuery.isLoading && <p className="text-sm text-slate-400">Carregando...</p>}

            {ordersQuery.data?.orders?.length ? (
              ordersQuery.data.orders.map((order) => {
                const itemsTotal = order.items?.reduce((sum, item) => sum + Number(item.totalValue), 0) || 0;
                return (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrderId(order.id)}
                    className="w-full text-left rounded border border-slate-700 bg-slate-950 p-3 hover:border-slate-600 transition text-sm"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-semibold text-emerald-400">Pedido #{order.number ? String(order.number).padStart(4, '0') : order.id?.slice(0, 8)}</p>
                        <p className="text-xs text-slate-400">{order.congregation.name}</p>
                        <p className="text-xs text-slate-500">{order.period.code}</p>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        order.status === 'PENDING' ? 'bg-yellow-900 text-yellow-100' :
                        order.status === 'APPROVED' ? 'bg-blue-900 text-blue-100' :
                        order.status === 'DELIVERED' ? 'bg-green-900 text-green-100' :
                        'bg-red-900 text-red-100'
                      }`}>
                        {statusPT[order.status] || order.status}
                      </span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-400">
                      <span>{order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0} revista(s)</span>
                      <span>{formatDate(order.createdAt)}</span>
                    </div>
                    <div className="flex justify-between text-xs text-slate-300 mt-2">
                      <span>{order.submittedBy.name}</span>
                      <span className="font-semibold text-emerald-400">{formatCurrency(itemsTotal)}</span>
                    </div>
                  </button>
                );
              })
            ) : (
              <p className="text-sm text-slate-400">Nenhum pedido cadastrado.</p>
            )}
          </div>
        )}
      </div>

      {/* Modal de Edição */}
      {editingOrderId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4" onClick={() => {
          setEditingOrderId(null);
          setEditItems([]);
        }}>
          <div className="bg-slate-900 rounded-lg border border-slate-700 w-full max-w-2xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4 flex justify-between items-center">
              <h3 className="text-lg font-semibold">Editar Pedido #{orderDetailQuery.data?.order?.number ? String(orderDetailQuery.data.order.number).padStart(4, '0') : orderDetailQuery.data?.order?.id?.slice(0, 8)}</h3>
              <button
                onClick={() => {
                  setEditingOrderId(null);
                  setEditItems([]);
                }}
                className="text-slate-400 hover:text-slate-300 text-xl"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs text-slate-400 font-semibold">Adicionar/Remover Revistas</label>
                <div className="mt-2 space-y-2">
                  <select
                    name="editMagazineId"
                    value={editSelectedMagazineId}
                    className="rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm w-full"
                    onChange={(e) => {
                      setEditSelectedMagazineId(e.target.value);
                      setEditSelectedCombinationId(null);
                      setEditCurrentUnitPrice(0);
                    }}
                  >
                    <option value="">Selecione revista...</option>
                    {magazinesQuery.data?.magazines?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} - {m.className}
                      </option>
                    ))}
                  </select>
                  {(() => {
                    const magazine = magazinesQuery.data?.magazines?.find(m => m.id === editSelectedMagazineId);
                    
                    if (!editSelectedMagazineId || !magazine) {
                      return null;
                    }
                    
                    if (!magazine.variantCombinations || magazine.variantCombinations.length === 0) {
                      return null;
                    }
                    
                    return (
                      <VariantSelector
                        magazine={magazine}
                        selectedCombinationId={editSelectedCombinationId}
                        onCombinationChange={(combId) => setEditSelectedCombinationId(combId)}
                        onPriceUpdate={(price) => setEditCurrentUnitPrice(price)}
                      />
                    );
                  })()}
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="editQuantity"
                      defaultValue="1"
                      className="flex-1 rounded border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
                      placeholder="Qtd"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const quantityInput = document.querySelector('[name="editQuantity"]');
                        const quantity = parseInt(quantityInput?.value) || 1;

                        if (!editSelectedMagazineId) {
                          toast.error('Selecione uma revista');
                          return;
                        }

                        if (!editSelectedCombinationId) {
                          toast.error('Selecione uma variação');
                          return;
                        }

                        if (editItems.some(item => item.magazineId === editSelectedMagazineId && item.combinationId === editSelectedCombinationId)) {
                          toast.error('Esta revista já foi adicionada');
                          return;
                        }

                        const magazine = magazinesQuery.data?.magazines?.find(m => m.id === editSelectedMagazineId);
                        if (!magazine) {
                          toast.error('Revista não encontrada');
                          return;
                        }

                        const combination = magazine.variantCombinations?.find(c => c.id === editSelectedCombinationId);
                        if (!combination) {
                          toast.error('Combinação não encontrada');
                          return;
                        }

                        const unitPrice = Number(combination.price);
                        const totalValue = Number((quantity * unitPrice).toFixed(2));

                        setEditItems([...editItems, {
                          magazineId: editSelectedMagazineId,
                          quantity,
                          magazine,
                          combinationId: editSelectedCombinationId,
                          combinationName: combination.name,
                          unitPrice,
                          totalValue
                        }]);

                        setEditSelectedMagazineId('');
                        quantityInput.value = '1';
                        setEditSelectedCombinationId(null);
                        setEditCurrentUnitPrice(0);
                      }}
                      className="rounded bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                    >
                      + Adicionar
                    </button>
                  </div>
                </div>

                {editItems.length > 0 && (
                  <div className="mt-4 space-y-2 bg-slate-950 p-3 rounded border border-slate-800">
                    <p className="text-xs text-slate-400 font-semibold">Itens do pedido:</p>
                    {editItems.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm bg-slate-900 p-3 rounded border border-slate-800">
                        <div className="flex-1">
                          <p className="text-slate-100 font-medium">{item.magazine.name}</p>
                          {item.combinationName && (
                            <p className="text-xs text-slate-400 mt-1">
                              Variação: <span className="font-semibold">{item.combinationName}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">
                            {item.quantity}x {formatCurrency(item.unitPrice)} = <span className="font-semibold text-emerald-400">{formatCurrency(item.totalValue)}</span>
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setEditItems(editItems.filter((_, i) => i !== idx))}
                          className="text-red-400 hover:text-red-300 font-bold ml-3 text-lg"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div className="border-t border-slate-700 pt-3 mt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-slate-400">Total:</span>
                        <span className="text-lg font-bold text-emerald-400">
                          {formatCurrency(editItems.reduce((sum, item) => sum + Number(item.totalValue || 0), 0))}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setEditingOrderId(null);
                    setEditItems([]);
                  }}
                  className="flex-1 rounded bg-slate-700 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (editItems.length === 0) {
                      toast.error('Adicione pelo menos uma revista');
                      return;
                    }
                    if (editItems.some(item => !item.combinationId)) {
                      toast.error('Selecione a variação de todos os itens');
                      return;
                    }
                    editMutation.mutate({
                      orderId: selectedOrderId,
                      payload: {
                        items: editItems.map(item => ({
                          magazineId: item.magazineId,
                          combinationId: item.combinationId,
                          quantity: item.quantity
                        }))
                      }
                    });
                  }}
                  disabled={editMutation.isPending}
                  className="flex-1 rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                >
                  {editMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
                </button>
              </div>
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
    </>
  );
}
