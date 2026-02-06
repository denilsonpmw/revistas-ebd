import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../api/client';
import { MagazineCardMobile } from '../components/MagazineCardMobile';
import { FloatingCart } from '../components/FloatingCart';
import { VariantModalMobile } from '../components/VariantModalMobile';
import { CartItemEditorMobile } from '../components/CartItemEditorMobile';
import { ReceiptTemplate } from '../components/ReceiptTemplate';
import { Modal, Alert } from '../components/Modal';
import { formatCurrency } from '../utils/currency';

/**
 * Página de pedidos mobile - PDV style
 * Interface simplificada exclusivamente para dispositivos móveis
 */
export default function OrderMobilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  // Estados
  const [cart, setCart] = useState([]);
  const [selectedMagazine, setSelectedMagazine] = useState(null);
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
  const [lastOrderData, setLastOrderData] = useState(null);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isCartItemEditorOpen, setIsCartItemEditorOpen] = useState(false);
  const [selectedCartItem, setSelectedCartItem] = useState(null);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'warning' });
  const [confirmState, setConfirmState] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDangerous: false });

  // Query: Buscar revistas ativas
  const { data: magazines = [], isLoading: loadingMagazines } = useQuery({
    queryKey: ['magazines'],
    queryFn: async () => {
      const data = await apiRequest('/magazines');
      // Filtrar apenas revistas ativas
      const allMagazines = data.magazines || [];
      return allMagazines.filter(mag => mag.active);
    }
  });

  // Query: Buscar pedidos do usuário
  const { data: userOrders = [] } = useQuery({
    queryKey: ['orders', 'user'],
    queryFn: async () => {
      const data = await apiRequest('/orders');
      const orders = data.orders || [];
      // Retornar apenas os 5 mais recentes
      return orders.slice(0, 5);
    }
  });

  // Query: Buscar período ativo e calcular dias restantes
  const { data: periodData } = useQuery({
    queryKey: ['periods', 'active'],
    queryFn: async () => {
      const data = await apiRequest('/periods');
      const periods = data.periods || [];
      const now = new Date();
      
      // Período ativo atual (dentro do intervalo de datas)
      const activePeriod = periods.find(p => {
        if (!p.active) return false;
        const start = new Date(p.startDate);
        const end = new Date(p.endDate);
        return now >= start && now <= end;
      });
      
      // Calcular dias restantes
      const daysRemaining = activePeriod 
        ? Math.ceil((new Date(activePeriod.endDate) - now) / (1000 * 60 * 60 * 24))
        : 0;
      
      return { activePeriod, daysRemaining };
    }
  });

  const activePeriod = periodData?.activePeriod;
  const daysRemaining = periodData?.daysRemaining || 0;

  // Mutation: Criar pedido
  const createOrderMutation = useMutation({
    mutationFn: async (orderData) => {
      return await apiRequest('/orders', {
        method: 'POST',
        body: JSON.stringify(orderData)
      });
    },
    onSuccess: (data) => {
      // Invalida cache de pedidos
      queryClient.invalidateQueries(['orders']);
      
      // Exibe modal de recibo
      setLastOrderData(data.order);
      setIsReceiptModalOpen(true);
      
      // Limpa carrinho
      setCart([]);
    },
    onError: (error) => {
      setAlertState({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao criar pedido: ' + (error.message || 'Erro desconhecido'),
        type: 'error'
      });
    }
  });

  // Mutation: Atualizar pedido pendente
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, items }) => {
      return await apiRequest(`/orders/${orderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          items: items.map(item => ({
            magazineId: item.magazineId,
            combinationId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries(['orders']);
      setLastOrderData(data.order);
      setIsEditingOrder(false);
      setCart([]);
      setAlertState({
        isOpen: true,
        title: 'Sucesso',
        message: 'Pedido atualizado com sucesso!',
        type: 'success'
      });
    },
    onError: (error) => {
      setAlertState({
        isOpen: true,
        title: 'Erro',
        message: 'Erro ao atualizar pedido: ' + (error.message || 'Erro desconhecido'),
        type: 'error'
      });
    }
  });

  // Handlers
  const handleLogout = () => {
    setConfirmState({
      isOpen: true,
      title: 'Sair da Aplicação',
      message: 'Deseja realmente sair?',
      isDangerous: true,
      confirmText: 'Sair',
      onConfirm: () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        logout();
        navigate('/', { replace: true });
      }
    });
  };

  const handleAddMagazine = (magazine) => {
    setSelectedMagazine(magazine);
    setIsVariantModalOpen(true);
  };

  const handleEditCartItem = (item, index) => {
    setSelectedCartItem({ ...item, cartIndex: index });
    setIsCartItemEditorOpen(true);
  };

  const handleUpdateCartItem = (updatedItem) => {
    const index = updatedItem.cartIndex;
    setCart(prevCart => {
      const newCart = [...prevCart];
      newCart[index] = {
        ...newCart[index],
        quantity: updatedItem.quantity
      };
      return newCart;
    });
    setIsCartItemEditorOpen(false);
    setSelectedCartItem(null);
  };

  const handleRemoveCartItem = (item) => {
    const index = item.cartIndex;
    setCart(prevCart => prevCart.filter((_, i) => i !== index));
    setIsCartItemEditorOpen(false);
    setSelectedCartItem(null);
  };

  const handleAddToCart = (item) => {
    // Valida se a variação tem preço
    if (!item.unitPrice || item.unitPrice <= 0) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Esta variação não possui preço definido',
        type: 'warning'
      });
      return;
    }

    setCart(prevCart => {
      // Verifica se já existe no carrinho
      const existingIndex = prevCart.findIndex(
        cartItem => 
          cartItem.magazineId === item.magazineId && 
          cartItem.variantId === item.variantId
      );

      if (existingIndex >= 0) {
        // Atualiza quantidade
        const newCart = [...prevCart];
        newCart[existingIndex].quantity += item.quantity;
        return newCart;
      } else {
        // Adiciona novo item
        return [...prevCart, item];
      }
    });
  };

  const handleFinalize = async () => {
    if (cart.length === 0) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Carrinho vazio',
        type: 'warning'
      });
      return;
    }

    // Verificar se há pedido pendente (apenas se não estiver editando)
    if (!isEditingOrder) {
      const hasPendingOrder = userOrders.some(order => order.status === 'PENDING');
      if (hasPendingOrder) {
        setAlertState({
          isOpen: true,
          title: 'Pedido Pendente',
          message: 'Você não pode fazer um novo pedido enquanto houver um pedido pendente. Aguarde a aprovação do seu pedido anterior ou cancele-o.',
          type: 'warning'
        });
        return;
      }
    }

    if (!activePeriod) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Nenhum período ativo encontrado',
        type: 'warning'
      });
      return;
    }

    if (!user?.congregationId) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Usuário sem congregação associada',
        type: 'warning'
      });
      return;
    }

    // Confirmar antes de enviar
    setConfirmState({
      isOpen: true,
      title: 'Confirmar Pedido',
      message: `Finalizar pedido com ${cart.length} ${cart.length === 1 ? 'item' : 'itens'}?`,
      confirmText: 'Finalizar',
      onConfirm: async () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        
        // Montar dados do pedido
        const orderData = {
          periodId: activePeriod.id,
          congregationId: user.congregationId,
          items: cart.map(item => ({
            magazineId: item.magazineId,
            combinationId: item.variantId,
            quantity: item.quantity,
            unitPrice: item.unitPrice
          }))
        };

        // Criar pedido
        createOrderMutation.mutate(orderData);
      }
    });
  };

  const handleCloseReceipt = (keepData = false) => {
    if (!keepData) {
      setLastOrderData(null);
    }
    setIsReceiptModalOpen(false);
  };

  const handleViewOrder = (order) => {
    setLastOrderData(order);
    setIsEditingOrder(false);
    setIsReceiptModalOpen(true);
  };

  const handleEditOrder = () => {
    // Carregar itens do pedido no carrinho com nomes
    const items = lastOrderData.items.map(item => ({
      magazineId: item.magazineId,
      magazineName: item.magazine?.name || item.magazineName || 'Revista',
      variantId: item.combinationId,
      variantName: item.variantCombination?.name || item.variantName || 'Padrão',
      quantity: item.quantity,
      unitPrice: item.unitPrice
    }));
    setCart(items);
    setIsReceiptModalOpen(false);
    setIsEditingOrder(true);
  };

  const handleSaveEditedOrder = () => {
    if (cart.length === 0) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Adicione pelo menos um item ao pedido',
        type: 'warning'
      });
      return;
    }

    setConfirmState({
      isOpen: true,
      title: 'Atualizar Pedido',
      message: `Confirmar atualização com ${cart.length} ${cart.length === 1 ? 'item' : 'itens'}?`,
      confirmText: 'Atualizar',
      onConfirm: () => {
        setConfirmState(prev => ({ ...prev, isOpen: false }));
        updateOrderMutation.mutate({
          orderId: lastOrderData.id,
          items: cart
        });
      }
    });
  };

  const handleCancelEdit = () => {
    setCart([]);
    setIsEditingOrder(false);
    setLastOrderData(null);
  };

  // Verifica se revista está no carrinho
  const isInCart = (magazineId) => {
    return cart.some(item => item.magazineId === magazineId);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30';
      case 'APPROVED': return 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30';
      case 'DELIVERED': return 'bg-blue-600/20 text-blue-400 border-blue-600/30';
      case 'CANCELED': return 'bg-red-600/20 text-red-400 border-red-600/30';
      default: return 'bg-slate-600/20 text-slate-400 border-slate-600/30';
    }
  };

  const getStatusText = (status) => {
    switch(status) {
      case 'PENDING': return 'Pendente';
      case 'APPROVED': return 'Pago';
      case 'DELIVERED': return 'Entregue';
      case 'CANCELED': return 'Cancelado';
      default: return 'Desconhecido';
    }
  };

  // Renderizar interface de edição ou de visualização
  if (isEditingOrder && lastOrderData && lastOrderData) {
    return (
      <div className="min-h-screen bg-slate-950">
        {/* Header fixo */}
        <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700 shadow-lg">
          <div className="max-w-md mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h1 className="text-slate-100 font-bold text-lg">
                  Editando Pedido
                </h1>
                <p className="text-slate-400 text-xs">
                  #{lastOrderData.number ? String(lastOrderData.number).padStart(4, '0') : lastOrderData.id?.slice(0, 8)}
                </p>
              </div>
              <button
                onClick={handleCancelEdit}
                className="
                  bg-slate-800 hover:bg-slate-700
                  text-slate-300 hover:text-slate-100
                  px-3 py-2 rounded-lg
                  transition-all duration-200
                  text-xs font-semibold
                  min-h-[44px] min-w-[44px]
                  flex items-center gap-1
                "
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <circle cx="12" cy="12" r="9" strokeWidth={2} />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 9l-6 6M9 9l6 6" />
                </svg>
              </button>
            </div>
          </div>
        </header>

        {/* Conteúdo principal */}
        <main className="max-w-md mx-auto px-4 py-4 pb-32">
          {loadingMagazines ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-slate-400">Carregando revistas...</div>
            </div>
          ) : magazines.length === 0 ? (
            <div className="bg-slate-800 rounded-lg p-6 text-center">
              <div className="text-slate-400 text-sm">
                Nenhuma revista cadastrada
              </div>
            </div>
          ) : (
            <>
              {/* Grid de revistas */}
              <div className="grid grid-cols-1 gap-3">
                {magazines.map((magazine) => (
                  <MagazineCardMobile
                    key={magazine.id}
                    magazine={magazine}
                    onAdd={handleAddMagazine}
                    isInCart={isInCart(magazine.id)}
                  />
                ))}
              </div>
            </>
          )}
        </main>

        {/* Carrinho flutuante */}
        <FloatingCart
          items={cart}
          onFinalize={handleSaveEditedOrder}
          hasPendingOrder={false}
          isEditing={true}
          onEditItem={handleEditCartItem}
        />

        {/* Modal de seleção de variações */}
        <VariantModalMobile
          isOpen={isVariantModalOpen}
          onClose={() => setIsVariantModalOpen(false)}
          magazine={selectedMagazine}
          onAddToCart={handleAddToCart}
        />

        {/* Modal de edição de item do carrinho */}
        <CartItemEditorMobile
          isOpen={isCartItemEditorOpen}
          onClose={() => {
            setIsCartItemEditorOpen(false);
            setSelectedCartItem(null);
          }}
          item={selectedCartItem}
          onUpdate={handleUpdateCartItem}
          onRemove={handleRemoveCartItem}
        />

        {/* Alert Modal */}
        <Alert
          isOpen={alertState.isOpen}
          title={alertState.title}
          message={alertState.message}
          type={alertState.type}
          onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
        />

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

        {/* Loading overlay */}
        {updateOrderMutation.isPending && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
            <div className="bg-slate-900 rounded-lg p-6">
              <div className="text-slate-100 font-semibold mb-2">
                Atualizando pedido...
              </div>
              <div className="text-slate-400 text-sm">
                Aguarde um momento
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      {/* Header fixo */}
      <header className="sticky top-0 z-30 bg-slate-900 border-b border-slate-700 shadow-lg">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h1 className="text-slate-100 font-bold text-lg">
                Fazer Pedido
              </h1>
              <p className="text-slate-400 text-xs">
                {user?.name} • {user?.congregation?.name || 'N/A'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {/* Ícone de Pedidos Recentes */}
              {userOrders.length > 0 && (
                <button
                  onClick={() => setIsOrdersModalOpen(true)}
                  className="
                    relative bg-blue-600 hover:bg-blue-500
                    text-white hover:text-slate-50
                    px-3 py-2 rounded-lg
                    transition-all duration-200
                    text-xs font-semibold
                    min-h-[44px] min-w-[44px]
                    flex items-center justify-center
                  "
                  title="Meus Pedidos"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="absolute top-0 right-0 bg-emerald-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center -mt-1 -mr-1">
                    {userOrders.length}
                  </span>
                </button>
              )}

              {/* Botão Logout */}
              <button
                onClick={handleLogout}
                className="
                  bg-red-600 hover:bg-red-500
                  text-white hover:text-slate-50
                  px-3 py-2 rounded-lg
                  transition-all duration-200
                  text-xs font-semibold
                  min-h-[44px] min-w-[44px]
                  flex items-center gap-1
                "
                title="Sair"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" />
                </svg>
              </button>
            </div>
          </div>
          
          {activePeriod && (
            <div className={`mt-2 rounded px-3 py-1.5 flex items-center justify-between ${
              daysRemaining <= 3
                ? 'bg-red-600/10 border border-red-600/30'
                : daysRemaining <= 14
                ? 'bg-yellow-600/10 border border-yellow-600/30' 
                : 'bg-emerald-600/10 border border-emerald-600/30'
            }`}>
              <div className={`text-xs flex items-center gap-1.5 ${
                daysRemaining <= 3 ? 'text-red-400' : daysRemaining <= 14 ? 'text-yellow-400' : 'text-emerald-400'
              }`}>
                <span>{daysRemaining <= 3 ? '🚨' : daysRemaining <= 14 ? '⚠️' : '📅'}</span>
                <span>{activePeriod.name}</span>
              </div>
              <div className={`text-xs font-bold px-2 py-0.5 rounded-full border ${
                daysRemaining <= 3
                  ? 'bg-red-600/20 text-red-300 border-red-600/40'
                  : daysRemaining <= 14 
                  ? 'bg-yellow-600/20 text-yellow-300 border-yellow-600/40'
                  : 'bg-emerald-600/20 text-emerald-300 border-emerald-600/40'
              }`}>
                {daysRemaining > 0 ? (
                  <>Faltam {daysRemaining} {daysRemaining === 1 ? 'dia' : 'dias'}</>
                ) : (
                  <>Fecha hoje</>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Conteúdo principal */}
      <main className="max-w-md mx-auto px-4 py-4 pb-32">
        {loadingMagazines ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-slate-400">Carregando revistas...</div>
          </div>
        ) : magazines.length === 0 ? (
          <div className="bg-slate-800 rounded-lg p-6 text-center">
            <div className="text-slate-400 text-sm">
              Nenhuma revista cadastrada
            </div>
          </div>
        ) : (
          <>
            {/* Grid de revistas */}
            <div className="grid grid-cols-1 gap-3">
              {magazines.map((magazine) => (
                <MagazineCardMobile
                  key={magazine.id}
                  magazine={magazine}
                  onAdd={handleAddMagazine}
                  isInCart={isInCart(magazine.id)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Carrinho flutuante */}
      <FloatingCart
        items={cart}
        onFinalize={handleFinalize}
        hasPendingOrder={userOrders.some(order => order.status === 'PENDING')}
      />

      {/* Modal de seleção de variações */}
      <VariantModalMobile
        isOpen={isVariantModalOpen}
        onClose={() => setIsVariantModalOpen(false)}
        magazine={selectedMagazine}
        onAddToCart={handleAddToCart}
      />

      {/* Modal de Pedidos Recentes */}
      {isOrdersModalOpen && (
        <>
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
            onClick={() => setIsOrdersModalOpen(false)}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-end">
            <div className="w-full bg-slate-900 rounded-t-2xl max-h-[80vh] overflow-y-auto animate-slide-up">
              {/* Header */}
              <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-slate-100 font-bold text-lg">
                    Meus Pedidos
                  </h3>
                  <button
                    onClick={() => setIsOrdersModalOpen(false)}
                    className="text-slate-400 hover:text-slate-100 p-2 -mr-2 min-h-[44px] min-w-[44px]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              {/* Conteúdo */}
              <div className="p-4 space-y-2">
                {userOrders.length === 0 ? (
                  <div className="text-slate-400 text-sm text-center py-6">
                    Nenhum pedido ainda
                  </div>
                ) : (
                  userOrders.map((order) => {
                    const totalPrice = order.items?.reduce((sum, item) => {
                      const itemTotal = item.totalValue || (item.quantity * item.unitPrice);
                      return sum + Number(itemTotal);
                    }, 0) || 0;
                    
                    return (
                      <button
                        key={order.id}
                        onClick={() => {
                          handleViewOrder(order);
                          setIsOrdersModalOpen(false);
                        }}
                        className="
                          w-full bg-slate-800 rounded-lg p-3
                          transition-all duration-200
                          text-left
                        "
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-slate-100 font-semibold text-sm">
                                #{order.number ? String(order.number).padStart(4, '0') : order.id?.slice(0, 8)}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded border ${getStatusColor(order.status)}`}>
                                {getStatusText(order.status)}
                              </span>
                            </div>
                            <div className="text-slate-400 text-xs mb-1">
                              {formatDate(order.createdAt)}
                            </div>
                            <div className="text-slate-400 text-xs">
                              {order.items?.length || 0} {order.items?.length === 1 ? 'item' : 'itens'}
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-emerald-400 font-bold text-sm">
                              {formatCurrency(totalPrice)}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>

              {/* Espaço extra para safe area */}
              <div className="h-4" />
            </div>
          </div>
        </>
      )}

      {/* Modal de recibo com opção de editar se pendente */}
      <ReceiptTemplate
        isOpen={isReceiptModalOpen}
        onClose={handleCloseReceipt}
        orderData={lastOrderData}
        onEdit={lastOrderData?.status === 'PENDING' ? handleEditOrder : null}
      />

      {/* Loading overlay durante criação do pedido */}
      {createOrderMutation.isPending && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-slate-900 rounded-lg p-6">
            <div className="text-slate-100 font-semibold mb-2">
              Criando pedido...
            </div>
            <div className="text-slate-400 text-sm">
              Aguarde um momento
            </div>
          </div>
        </div>
      )}

      {/* Alert Modal */}
      <Alert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />

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
