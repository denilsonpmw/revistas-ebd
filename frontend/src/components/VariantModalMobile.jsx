import React, { useState } from 'react';
import { Alert } from './Modal';
import { formatCurrency } from '../utils/currency';

/**
 * Modal bottom-sheet para seleção de variações e quantidade
 * Estilo mobile-friendly
 */
export const VariantModalMobile = ({ isOpen, onClose, magazine, onAddToCart }) => {
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [alertState, setAlertState] = useState({ isOpen: false, title: '', message: '', type: 'warning' });

  // Não renderiza se não estiver aberto
  if (!isOpen || !magazine) return null;

  const variants = magazine.variantCombinations || [];

  const handleAdd = () => {
    if (!selectedVariant) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Selecione uma variação',
        type: 'warning'
      });
      return;
    }

    // Validar se a variação tem preço
    if (!selectedVariant.price || selectedVariant.price <= 0) {
      setAlertState({
        isOpen: true,
        title: 'Aviso',
        message: 'Esta variação não possui preço definido',
        type: 'warning'
      });
      return;
    }

    onAddToCart({
      magazineId: magazine.id,
      magazineName: magazine.name,
      magazineCode: magazine.code,
      variantId: selectedVariant.id,
      variantName: selectedVariant.name,
      variantCode: selectedVariant.code,
      quantity: quantity,
      unitPrice: parseFloat(selectedVariant.price) // Usar preço da variação
    });

    // Reset e fecha
    setSelectedVariant(null);
    setQuantity(1);
    onClose();
  };

  const incrementQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value >= 1) {
      setQuantity(value);
    }
  };

  // Calcular subtotal com o preço da variação selecionada
  const unitPrice = selectedVariant?.price ? parseFloat(selectedVariant.price) : 0;
  const subtotal = quantity * unitPrice;

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
                  {magazine.name}
                </h3>
                <p className="text-slate-400 text-sm">
                  Código: {magazine.code}
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
            {/* Lista de variações */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Selecione a variação:
              </label>
              <div className="space-y-2">
                {variants.length === 0 ? (
                  <div className="text-slate-400 text-sm italic p-4 bg-slate-800 rounded">
                    Nenhuma variação disponível
                  </div>
                ) : (
                  variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
                      disabled={!variant.active || !variant.price}
                      className={`
                        w-full text-left p-4 rounded-lg transition-all duration-200
                        min-h-[44px]
                        ${!variant.active || !variant.price 
                          ? 'opacity-50 cursor-not-allowed bg-slate-800 text-slate-500'
                          : selectedVariant?.id === variant.id
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-800 text-slate-300'
                        }
                      `}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="font-semibold">{variant.name}</div>
                          <div className="text-sm opacity-75 flex items-center gap-2">
                            <span>Código: {variant.code}</span>
                            {variant.price && (
                              <span className="font-semibold">
                                • {formatCurrency(variant.price)}
                              </span>
                            )}
                            {!variant.price && (
                              <span className="text-red-400">• Sem preço</span>
                            )}
                          </div>
                        </div>
                        {selectedVariant?.id === variant.id && (
                          <span className="text-xl">✓</span>
                        )}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Quantidade */}
            <div>
              <label className="block text-slate-300 font-semibold mb-2">
                Quantidade:
              </label>
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                  className="
                    bg-slate-800 hover:bg-slate-700 
                    disabled:opacity-50 disabled:cursor-not-allowed
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
                  min="1"
                  value={quantity}
                  onChange={handleQuantityChange}
                  className="
                    bg-slate-800 border border-slate-700 
                    text-slate-100 text-center font-bold text-xl
                    w-20 h-12 rounded-lg
                    focus:outline-none focus:ring-2 focus:ring-emerald-600
                  "
                />

                <button
                  onClick={incrementQuantity}
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
            </div>

            {/* Preço e Subtotal */}
            <div className="bg-slate-800 rounded-lg p-4 space-y-2">
              {selectedVariant ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-400">Preço unitário:</span>
                    <span className="text-slate-100 font-semibold">
                      {formatCurrency(unitPrice)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-300 font-semibold">Subtotal:</span>
                    <span className="text-emerald-400 font-bold text-xl">
                      {formatCurrency(subtotal)}
                    </span>
                  </div>
                </>
              ) : (
                <div className="text-slate-400 text-sm text-center py-2">
                  Selecione uma variação para ver o preço
                </div>
              )}
            </div>

            {/* Botão Adicionar */}
            <button
              onClick={handleAdd}
              disabled={!selectedVariant || !unitPrice}
              className="
                w-full bg-emerald-600 hover:bg-emerald-500 
                disabled:bg-slate-700 disabled:cursor-not-allowed
                text-white font-bold 
                py-4 rounded-lg
                transition-all duration-200
                active:scale-95
                min-h-[44px]
              "
            >
              {!selectedVariant 
                ? 'Selecione uma variação' 
                : !unitPrice 
                  ? 'Variação sem preço'
                  : 'Adicionar ao Pedido'
              }
            </button>
          </div>

          {/* Espaço extra para safe area em alguns celulares */}
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

export default VariantModalMobile;
