import React from 'react';
import { downloadReceipt, shareReceipt } from '../utils/generateReceipt';
import { formatCurrency } from '../utils/currency';

/**
 * Modal de sucesso com recibo do pedido
 * Exibe após a criação bem-sucedida do pedido mobile
 */
export const ReceiptTemplate = ({ isOpen, onClose, orderData, onEdit }) => {
  if (!isOpen || !orderData) return null;

  // Calcular total a partir dos items se não existir
  const calculateTotal = () => {
    if (orderData.totalPrice) return orderData.totalPrice;
    if (!orderData.items || orderData.items.length === 0) return 0;
    return orderData.items.reduce((sum, item) => {
      const itemTotal = item.totalValue || (item.quantity * item.unitPrice);
      return sum + Number(itemTotal);
    }, 0);
  };

  const totalPrice = calculateTotal();

  const handleDownload = () => {
    downloadReceipt({ ...orderData, totalPrice });
  };

  const handleShare = async () => {
    await shareReceipt({ ...orderData, totalPrice });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-slate-900 rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto animate-scale-in">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center">
                  <span className="text-white text-2xl">✓</span>
                </div>
                <div>
                  <h3 className="text-slate-100 font-bold text-lg">
                    Pedido Realizado!
                  </h3>
                  <p className="text-slate-400 text-sm">
                    #{orderData.number ? String(orderData.number).padStart(4, '0') : orderData.id?.slice(0, 8) || 'N/A'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-100 p-2 -mr-2 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Conteúdo - Preview do Recibo */}
          <div className="p-6 space-y-4">
            {/* Informações do pedido */}
            <div className="bg-slate-800 rounded-lg p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Data:</span>
                <span className="text-slate-100">{formatDate(orderData.createdAt)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Usuário:</span>
                <span className="text-slate-100">{orderData.submittedBy?.name || orderData.user?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Congregação:</span>
                <span className="text-slate-100">{orderData.congregation?.name || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Período:</span>
                <span className="text-slate-100">{orderData.period?.name || 'N/A'}</span>
              </div>
            </div>

            {/* Itens do pedido */}
            <div>
              <h4 className="text-slate-300 font-semibold mb-2">Itens:</h4>
              <div className="space-y-2">
                {orderData.items?.map((item, index) => {
                  const variantName = item.variantCombination?.name || 
                                     item.variantData?.combinationName || 
                                     item.variantData?.name || 
                                     'Variação';
                  const itemTotal = item.totalValue || (item.quantity * item.unitPrice);
                  
                  return (
                    <div key={index} className="bg-slate-800 rounded-lg p-3">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex-1">
                          <div className="text-slate-100 font-semibold text-sm">
                            {item.magazine?.name || 'Revista'}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {variantName}
                          </div>
                        </div>
                        <div className="text-right ml-2">
                          <div className="text-slate-100 font-semibold text-sm">
                            {formatCurrency(itemTotal)}
                          </div>
                          <div className="text-slate-400 text-xs">
                            {item.quantity}x {formatCurrency(item.unitPrice)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Total */}
            <div className="bg-emerald-600/10 border border-emerald-600/30 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 font-semibold text-lg">Total:</span>
                <span className="text-emerald-400 font-bold text-2xl">
                  {formatCurrency(totalPrice)}
                </span>
              </div>
            </div>

            {/* Status */}
            <div className="bg-slate-800 rounded-lg p-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-400">Status:</span>
                <span className={`font-semibold ${
                  orderData.status === 'PENDING' || orderData.status === 'pending' ? 'text-yellow-400' :
                  orderData.status === 'APPROVED' || orderData.status === 'confirmed' ? 'text-emerald-400' :
                  orderData.status === 'DELIVERED' ? 'text-blue-400' :
                  orderData.status === 'CANCELED' || orderData.status === 'cancelled' ? 'text-red-400' :
                  'text-slate-400'
                }`}>
                  {orderData.status === 'PENDING' || orderData.status === 'pending' ? 'Pendente' :
                   orderData.status === 'APPROVED' || orderData.status === 'confirmed' ? 'Pago' :
                   orderData.status === 'DELIVERED' ? 'Entregue' :
                   orderData.status === 'CANCELED' || orderData.status === 'cancelled' ? 'Cancelado' :
                   'Pendente'}
                </span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="grid grid-cols-2 gap-2 pt-2">
              {/* Botão Salvar PDF */}
              <button
                onClick={handleDownload}
                className="
                  w-full
                  text-white font-semibold 
                  py-3 rounded-lg
                  transition-all duration-200
                  active:scale-95
                  min-h-[44px]
                  flex items-center justify-center gap-2
                "
                style={{ backgroundColor: '#FF5C00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF7A33'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF5C00'}
              >
                Salvar PDF
              </button>

              {/* Botão Compartilhar */}
              <button
                onClick={handleShare}
                className="
                  w-full
                  text-white font-semibold 
                  py-3 rounded-lg
                  transition-all duration-200
                  active:scale-95
                  min-h-[44px]
                  flex items-center justify-center gap-2
                "
                style={{ backgroundColor: '#FF5C00' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF7A33'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF5C00'}
              >
                Compartilhar Recibo
              </button>

            {/* Botão Editar - Apenas para pedidos PENDENTES */}
              {onEdit && (orderData.status === 'PENDING' || orderData.status === 'pending') && (
                <button
                  onClick={() => {
                    onEdit();
                    onClose(true);
                  }}
                  className="
                    w-full
                    text-white font-semibold 
                    py-3 rounded-lg
                    transition-all duration-200
                    active:scale-95
                    min-h-[44px]
                    flex items-center justify-center gap-2
                  "
                  style={{ backgroundColor: '#FF5C00' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF7A33'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF5C00'}
                >
                  Editar Pedido
                </button>
              )}

              {/* Botão Fechar */}
              <button
                onClick={onClose}
                className="
                  w-full
                  text-white font-semibold 
                  py-3 rounded-lg
                  transition-all duration-200
                  active:scale-95
                  min-h-[44px]
                "
                style={{ backgroundColor: '#FF3F34' }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#FF6057'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#FF3F34'}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptTemplate;
