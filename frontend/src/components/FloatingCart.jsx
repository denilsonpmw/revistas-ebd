import React from 'react';
import { formatCurrency } from '../utils/currency';

/**
 * Carrinho flutuante fixo no bottom da tela
 * Mostra total de itens e valor total do pedido
 */
export const FloatingCart = ({ items = [], onFinalize, hasPendingOrder = false }) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Não exibe se não houver itens
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Aviso de pedido pendente */}
        {hasPendingOrder && (
          <div className="bg-yellow-600/20 border border-yellow-600/30 rounded px-3 py-2 mb-3">
            <div className="text-yellow-400 text-xs font-semibold">
              ⚠️ Você possui um pedido pendente. Aguarde a aprovação antes de fazer um novo.
            </div>
          </div>
        )}

        {/* Resumo */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-slate-400 text-xs">
              {totalItems} {totalItems === 1 ? 'item' : 'itens'}
            </div>
            <div className="text-emerald-400 font-bold text-xl">
              {formatCurrency(totalPrice)}
            </div>
          </div>

          {/* Botão Finalizar */}
          <button
            onClick={onFinalize}
            disabled={hasPendingOrder}
            className="
              bg-emerald-600 hover:bg-emerald-500 
              disabled:bg-slate-700 disabled:cursor-not-allowed
              text-white font-bold 
              px-6 py-3 rounded-lg
              transition-all duration-200
              active:scale-95 shadow-lg
              min-h-[44px]
            "
          >
            {hasPendingOrder ? 'Pedido Pendente' : 'Finalizar Pedido'}
          </button>
        </div>

        {/* Lista resumida de itens (opcional - exibição compacta) */}
        <div className="space-y-1 max-h-24 overflow-y-auto">
          {items.map((item, index) => (
            <div key={index} className="text-xs text-slate-400 flex justify-between">
              <span className="truncate flex-1">
                {item.magazineName} - {item.variantName}
              </span>
              <span className="ml-2 text-slate-300">
                {item.quantity}x
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;
