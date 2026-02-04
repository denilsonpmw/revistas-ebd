import React from 'react';

/**
 * Card de revista otimizado para mobile
 * Toque fácil, visual limpo, área de toque mínima 44x44px
 */
export const MagazineCardMobile = ({ magazine, onAdd, isInCart = false }) => {
  const { code, name, active, variantCombinations = [] } = magazine;
  
  // Verifica se tem variações disponíveis
  const hasVariants = variantCombinations.length > 0;
  const isDisabled = !active || !hasVariants;

  return (
    <button
      onClick={() => !isDisabled && onAdd(magazine)}
      disabled={isDisabled}
      className={`
        w-full text-left
        bg-slate-800 rounded-lg p-4 
        ${active ? '' : 'opacity-60'}
        shadow-md transition-all duration-200
        ${isInCart ? 'ring-2 ring-blue-600' : ''}
        ${!isDisabled ? 'active:scale-98 cursor-pointer' : 'cursor-not-allowed'}
      `}
    >
      {/* Cabeçalho com código e status */}
      <div className="flex items-start justify-between mb-2">
        <span className="text-slate-400 text-xs font-mono">{code}</span>
        <div className="flex gap-1">
          {!active && (
            <span className="bg-red-600/20 text-red-400 text-xs px-2 py-0.5 rounded">
              Inativa
            </span>
          )}
          {!hasVariants && active && (
            <span className="bg-yellow-600/20 text-yellow-400 text-xs px-2 py-0.5 rounded">
              Sem variações
            </span>
          )}
          {isInCart && (
            <span className="bg-blue-600/20 text-blue-400 text-xs px-2 py-0.5 rounded">
              No carrinho
            </span>
          )}
        </div>
      </div>

      {/* Nome da revista */}
      <h3 className="text-slate-100 font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
        {name}
      </h3>

      {/* Variações disponíveis */}
      <div className="flex items-center justify-between gap-3">
        {/* Info de variações */}
        <div className="flex-1">
          {hasVariants ? (
            <div className="text-slate-400 text-xs">
              {variantCombinations.length} {variantCombinations.length === 1 ? 'variação' : 'variações'}
            </div>
          ) : (
            <div className="text-slate-500 text-xs italic">
              Sem variações cadastradas
            </div>
          )}
        </div>

        {/* Indicador visual */}
        {!isDisabled && (
          <div className={`
            flex items-center justify-center
            w-8 h-8 rounded-full
            ${isInCart ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}
            transition-all duration-200
          `}>
            {isInCart ? '✓' : '+'}
          </div>
        )}
      </div>
    </button>
  );
};

export default MagazineCardMobile;
