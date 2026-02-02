import React from 'react';

export function VariantSelector({ magazine, selectedCombinationId, onCombinationChange, onPriceUpdate }) {
  if (!magazine?.variantTypes || magazine.variantTypes.length === 0) {
    return null;
  }

  const handleChange = (combinationId) => {
    onCombinationChange(combinationId);
    
    // Buscar preço da combinação selecionada
    if (magazine.variantCombinations) {
      const combo = magazine.variantCombinations.find(c => c.id === combinationId);
      if (combo && onPriceUpdate) {
        onPriceUpdate(Number(combo.price));
      }
    }
  };

  return (
    <div className="rounded bg-slate-900 p-3">
      <label className="text-sm font-semibold text-slate-200">
        Escolha a Variação *
      </label>
      <select
        value={selectedCombinationId || ''}
        onChange={(e) => handleChange(e.target.value)}
        className="w-full rounded bg-slate-800 px-3 py-2 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500 mt-2"
        required
      >
        <option value="">-- Selecione uma variação --</option>
        {magazine.variantCombinations?.map((combo) => (
          <option key={combo.id} value={combo.id}>
            {combo.name} - R$ {Number(combo.price).toFixed(2)}
          </option>
        ))}
      </select>
    </div>
  );
}

export function VariantDisplay({ magazine }) {
  if (!magazine?.variantCombinations || magazine.variantCombinations.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-1 text-xs text-slate-400">
      <span className="font-semibold">Variações Disponíveis:</span>
      {magazine.variantCombinations.map((combo) => (
        <div key={combo.id}>
          {combo.name} - R$ {Number(combo.price).toFixed(2)}
        </div>
      ))}
    </div>
  );
}

export function getPriceForCombination(magazine, combinationId) {
  if (!magazine?.variantCombinations) return Number(magazine.unitPrice);
  
  const combo = magazine.variantCombinations.find(c => c.id === combinationId);
  return combo ? Number(combo.price) : Number(magazine.unitPrice);
}
