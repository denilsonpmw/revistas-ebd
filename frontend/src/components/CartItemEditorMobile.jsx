import React, { useState } from 'react';
import { Alert } from './Modal';
import { formatCurrency } from '../utils/currency';

/**
 * Modal para editar quantidade de item no carrinho
 * Permite números negativos como delta para remover revistas
 */
export const CartItemEditorMobile = ({ isOpen, onClose, item, onUpdate, onRemove }) => {
  const originalQuantity = item?.quantity || 1;
  const [delta, setDelta] = useState(0);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'warning' });

  if (!isOpen || !item) return null;

  const canGoNegative = originalQuantity > 1;
  const finalQuantity = originalQuantity + delta;

  const incrementDelta = () => {
    setDelta(prev => prev + 1);
  };

  const decrementDelta = () => {
    // Sempre pode decrementar
    setDelta(prev => prev - 1);
  };

  const handleDeltaChange = (e) => {
    const value = parseInt(e.target.value);
    if (isNaN(value)) {
      return;
    }
    
    setDelta(value);
  };

  const handleSave = () => {
    // Se delta é 0, não faz nada
    if (delta === 0) {
      onClose();
      return;
    }

    // Calcula quantidade final
    const newQuantity = originalQuantity + delta;

    // Se a quantidade final for <= 0, remove o item automaticamente
    if (newQuantity <= 0) {
      onRemove(item);
      onClose();
      return;
    }

    // Atualiza com a nova quantidade
    onUpdate({
      ...item,
      quantity: newQuantity
    });

    onClose();
  };

  const handleRemove = () => {
    onRemove(item);
    onClose();
  };

  const subtotal = finalQuantity * item.unitPrice;

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/60 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Bottom Sheet */}
      <div className="fixed bottom-0 left-0 right-0 bg-slate-900 rounded-t-2xl z-50 animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="max-w-md mx-auto">
          {/* Header */}
          <div className="sticky top-0 bg-slate-900 border-b border-slate-700 p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className="text-slate-100 font-bold text-lg">
                  Editar Item
                </h3>
                <p className="text-slate-400 text-sm">
                  {item.magazineName}
                </p>
              </div>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-slate-100 p-2 -mr-2 min-h-[44px] min-w-[44px]"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Conteúdo */}
          <div className="p-4 space-y-4">
            {/* Detalhes do item */}
            <div className="bg-slate-800 rounded-lg p-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Revista:</span>
                  <span className="text-slate-100 font-semibold">
                    {item.magazineName}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Variação:</span>
                  <span className="text-slate-100 font-semibold">
                    {item.variantName}
                  </span>
                </div>
                <div className="flex justify-between text-sm border-t border-slate-700 pt-2 mt-2">
                  <span className="text-slate-400">Quantidade atual:</span>
                  <span className="text-slate-100 font-semibold">
                    {originalQuantity}x
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Preço unitário:</span>
                  <span className="text-slate-100 font-semibold">
                    {formatCurrency(item.unitPrice)}
                  </span>
                </div>
              </div>
            </div>

            {/* Alteração de Quantidade */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Alterar quantidade: {delta !== 0 && <span className={delta > 0 ? 'text-emerald-400' : 'text-red-400'}>({delta > 0 ? '+' : ''}{delta})</span>}
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={decrementDelta}
                  className="
                    bg-slate-800 hover:bg-slate-700 
                    text-slate-100 font-bold 
                    w-12 h-12 rounded-lg
                    transition-all duration-200
                    active:scale-95
                    min-h-[44px] min-w-[44px]
                  "
                >
                  −
                </button>

                <input
                  type="number"
                  value={delta}
                  onChange={handleDeltaChange}
                  className="
                    bg-slate-800 border border-slate-700 
                    text-slate-100 text-center font-bold text-xl
                    w-20 h-12 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-emerald-600
                  "
                />

                <button
                  onClick={incrementDelta}
                  className="
                    bg-slate-800 hover:bg-slate-700 
                    text-slate-100 font-bold 
                    w-12 h-12 rounded-lg
                    transition-all duration-200
                    active:scale-95
                    min-h-[44px] min-w-[44px]
                  "
                >
                  +
                </button>
              </div>

              <div className="mt-3 bg-blue-600/20 border border-blue-600/30 rounded px-3 py-2">
                <div className="text-blue-400 text-xs">
                  ℹ️ Use números negativos para remover revistas (ex: -1 remove 1 revista). Usar 0 não faz alterações.
                </div>
              </div>
            </div>

            {/* Preço e Subtotal */}
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Quantidade original:</span>
                <span className="text-slate-300 font-semibold">
                  {originalQuantity}x
                </span>
              </div>
              {delta !== 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-slate-400">Alteração:</span>
                  <span className={`font-semibold ${delta > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                    {delta > 0 ? '+' : ''}{delta}x
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm border-t border-slate-700 pt-2">
                <span className="text-slate-400">Quantidade final:</span>
                <span className={`font-bold ${finalQuantity <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {finalQuantity}x {finalQuantity <= 0 && '(será removido)'}
                </span>
              </div>
              <div className="flex justify-between border-t border-slate-700 pt-2">
                <span className="text-slate-300 font-semibold">Subtotal:</span>
                <span className={`font-bold text-xl ${finalQuantity <= 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                  {formatCurrency(subtotal)}
                </span>
              </div>
            </div>

            {/* Botões de ação */}
            <div className="space-y-2">
              <button
                onClick={handleSave}
                className="
                  w-full bg-emerald-600 hover:bg-emerald-500 
                  text-white font-bold 
                  py-4 rounded-lg
                  transition-all duration-200
                  active:scale-95
                  min-h-[44px]
                "
              >
                {delta === 0 ? 'Fechar' : finalQuantity <= 0 ? 'Remover Item' : 'Salvar Alterações'}
              </button>

              <button
                onClick={handleRemove}
                className="
                  w-full bg-red-600 hover:bg-red-500 
                  text-white font-bold 
                  py-4 rounded-lg
                  transition-all duration-200
                  active:scale-95
                  min-h-[44px]
                "
              >
                Remover do Pedido
              </button>
            </div>
          </div>

          {/* Espaço extra para safe area */}
          <div className="h-4" />
        </div>
      </div>

      {/* Alert Modal */}
      <Alert
        isOpen={alertState.isOpen}
        title={alertState.title}
        message={alertState.message}
        type={alertState.type}
        onClose={() => setAlertState(prev => ({ ...prev, isOpen: false }))}
      />
    </>
  );
};

export default CartItemEditorMobile;
