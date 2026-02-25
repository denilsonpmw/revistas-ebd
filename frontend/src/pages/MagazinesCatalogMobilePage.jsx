import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MagazinesCatalogMobilePage() {
      // Função para extrair valor máximo da faixa etária
      const getAgeRangeSortKey = (ageRange) => {
        if (!ageRange) return -1;
        // Exemplo: "0-5", "6-10", "11+", "> 15"
        const plusMatch = ageRange.match(/(\d+)\s*\+/);
        if (plusMatch) return Number(plusMatch[1]);
        const greaterMatch = ageRange.match(/^>\s*(\d+)$/);
        if (greaterMatch) return Number(greaterMatch[1]);
        const rangeMatch = ageRange.match(/(\d+)\s*[-–]\s*(\d+)/);
        if (rangeMatch) return Number(rangeMatch[2]);
        const onlyNumber = ageRange.match(/^(\d+)$/);
        if (onlyNumber) return Number(onlyNumber[1]);
        return -1;
      };
    // Buscar usuário
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const nome = user?.name || '';
    const congregacao = user?.congregationName || '';
  const isMobile = useIsMobile();
  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines')
  });

  if (!isMobile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100">
        <div className="text-center">
          <div className="text-4xl mb-4">📱</div>
          <h2 className="text-xl font-bold mb-2">Catálogo Mobile</h2>
          <p className="text-lg">Esta página só pode ser acessada em dispositivos móveis.</p>
        </div>
      </div>
    );
  }

  const magazinesRaw = magazinesQuery.data?.magazines || [];
  // Ordenar pela faixa etária (do maior para o menor)
  const magazines = [...magazinesRaw].sort((a, b) => {
    const aKey = getAgeRangeSortKey(a.ageRange);
    const bKey = getAgeRangeSortKey(b.ageRange);
    return bKey - aKey;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-blue-50 to-emerald-50 text-slate-900 p-4 pb-20">
      {/* Barra superior */}
      <div className="rounded-t-2xl bg-gradient-to-r from-blue-100 via-white to-emerald-100 border-b border-blue-200 px-4 pt-4 pb-2 mb-4 shadow-md">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-tight text-blue-700 drop-shadow">Catálogo de Revistas</h1>
          <span className="text-3xl">📚</span>
        </div>
        <div className="text-sm text-blue-600 mt-1 font-medium">{nome} {congregacao && <>• {congregacao}</>}</div>
      </div>
      <div className="grid gap-6">
        {magazines.map((mag) => (
          <div key={mag.id} className="rounded-xl bg-white shadow-md border border-blue-100 p-4 flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <span className="text-blue-400 text-2xl">📖</span>
              <span className="text-lg font-bold text-blue-700 drop-shadow-sm">{mag.className}</span>
            </div>
            <div className="mt-2">
              {mag.variantCombinations && mag.variantCombinations.length > 0 ? (
                <ul className="space-y-2">
                  {mag.variantCombinations.map((variant) => (
                    <li key={variant.id} className="flex items-center gap-2 bg-blue-50 rounded-lg px-3 py-2 border border-blue-100">
                      <span className="text-lg text-blue-300">🔖</span>
                      <span className="font-semibold text-blue-900">{variant.name}</span>
                      {typeof variant.price !== 'undefined' && variant.price !== null && (
                        <span className="ml-auto text-emerald-600 font-bold text-base bg-emerald-100 px-2 py-1 rounded-lg">{formatCurrency(variant.price)}</span>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <span className="italic text-blue-400">Sem variações</span>
              )}
            </div>
          </div>
        ))}
      </div>
      {/* Botão voltar fixo no rodapé */}
      <button
        onClick={() => window.location.assign('/pedido-mobile')}
        className="fixed bottom-4 right-4 w-16 h-16 rounded-full bg-blue-500 hover:bg-blue-600 flex items-center justify-center shadow-lg z-50 border-2 border-blue-300"
        title="Voltar"
        style={{maxWidth: '64px', maxHeight: '64px'}}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="white" className="w-8 h-8">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
      </button>
    </div>
  );
}
