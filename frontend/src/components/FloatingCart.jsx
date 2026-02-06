import React from 'react';
import { formatCurrency } from '../utils/currency';

/**
 * Carrinho flutuante fixo no bottom da tela
 * Mostra total de itens e valor total do pedido
 */
export const FloatingCart = ({ items = [], onFinalize, onPendingOrder = null, hasPendingOrder = false, isEditing = false, onEditItem = null, onCancelEdit = null }) => {
  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);

  // Não exibe se não houver itens
  if (totalItems === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-700 shadow-2xl z-50 animate-slide-up">
      <div className="max-w-md mx-auto px-4 py-3">
        {/* Aviso de modo edição */}
        {isEditing && (
          <div className="bg-blue-600/20 border border-blue-600/30 rounded px-3 py-2 mb-3">
            <div className="text-blue-400 text-xs font-semibold">
              🗒 Editando pedido
            </div>
          </div>
        )}

        {/* Aviso de pedido pendente */}
        {hasPendingOrder && !isEditing && (
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

          {/* Botões de ação */}
          <div className="flex items-center gap-2">
            <button
              onClick={hasPendingOrder && !isEditing && onPendingOrder ? onPendingOrder : onFinalize}
              className="
                bg-emerald-600 hover:bg-emerald-500 
                data-[pending=true]:bg-yellow-600 data-[pending=true]:hover:bg-yellow-500
                disabled:bg-slate-700 disabled:cursor-not-allowed
                text-white font-bold 
                px-6 py-3 rounded-lg
                transition-all duration-200
                active:scale-95 shadow-lg
                min-h-[44px]
              "
              data-pending={hasPendingOrder && !isEditing ? 'true' : 'false'}
            >
              {isEditing ? 'Atualizar Pedido' : hasPendingOrder ? 'Pedido Pendente' : 'Finalizar Pedido'}
            </button>
            {isEditing && onCancelEdit && (
              <button
                onClick={onCancelEdit}
                className="
                  bg-red-600 hover:bg-red-500
                  text-white font-bold
                  px-4 py-3 rounded-lg
                  transition-all duration-200
                  active:scale-95 shadow-lg
                  min-h-[44px]
                "
                aria-label="Fechar edição"
                title="Fechar"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Lista resumida de itens (opcional - exibição compacta) */}
        <div className="space-y-1 max-h-64 overflow-y-auto">
          {items.map((item, index) => {
            const ItemWrapper = isEditing && onEditItem ? 'button' : 'div';
            return (
              <ItemWrapper
                key={index}
                onClick={isEditing && onEditItem ? () => onEditItem(item, index) : undefined}
                className={`
                  text-xs flex justify-between
                  ${isEditing && onEditItem 
                    ? 'text-slate-300 hover:text-slate-100 cursor-pointer hover:bg-slate-800 px-2 py-1.5 -mx-2 rounded transition-all duration-200 active:scale-98 w-full text-left'
                    : 'text-slate-400'
                  }
                `}
              >
                <span className="truncate flex-1">
                  {item.magazineName} - {item.variantName || item.variantData?.combinationName || item.variantData?.name || 'Padrão'}
                </span>
                <span className={`ml-2 ${isEditing && onEditItem ? 'text-slate-100 font-semibold' : 'text-slate-300'}`}>
                  {item.quantity}x {isEditing && onEditItem && '✎'}
                </span>
              </ItemWrapper>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default FloatingCart;
