import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { formatCurrency } from '../utils/currency';
import { useIsMobile } from '../hooks/useIsMobile';

export default function MagazinesCatalogMobilePage() {
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

  const magazines = magazinesQuery.data?.magazines || [];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 pb-20">
      {/* Barra superior igual à tela Fazer Pedido */}
      <div className="rounded-t-2xl bg-slate-900 border-b border-slate-800 px-4 pt-4 pb-2 mb-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Catálogo de Revistas</h1>
        </div>
        <div className="text-sm text-slate-300 mt-1">{nome} {congregacao && <>• {congregacao}</>}</div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-800">
          <thead className="bg-slate-900">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Classe</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Variações</th>
            </tr>
          </thead>
          <tbody className="bg-slate-950 divide-y divide-slate-800">
            {magazines.map((mag) => (
              <tr key={mag.id}>
                <td className="px-4 py-3 text-sm font-semibold text-slate-100">{mag.className}</td>
                <td className="px-4 py-3 text-sm text-slate-100">
                  {mag.variantCombinations && mag.variantCombinations.length > 0 ? (
                    <ul className="list-disc ml-4">
                      {mag.variantCombinations.map((variant) => (
                        <li key={variant.id}>
                          {variant.name}
                          {typeof variant.price !== 'undefined' && variant.price !== null && (
                            <span className="ml-2 text-emerald-400 font-semibold">{formatCurrency(variant.price)}</span>
                          )}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span>-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Botão voltar fixo no rodapé */}
      <button
        onClick={() => window.location.assign('/pedido-mobile')}
        className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-lg font-semibold shadow-lg z-50"
        style={{maxWidth: '90vw'}}
      >
        Voltar
      </button>
    </div>
  );
}
