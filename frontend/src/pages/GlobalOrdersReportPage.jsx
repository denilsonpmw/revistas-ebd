import React from 'react';
import { exportRowsToExcel } from './exportToExcel';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/currency';

export default function GlobalOrdersReportPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  // Apenas admin pode acessar
  if (!isAdmin) {
    return (
      <div className="max-w-md mx-auto p-6 text-center text-red-500">
        Acesso restrito ao administrador.
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['global-orders-report'],
    queryFn: async () => {
      // Busca todos os pedidos aprovados
      const res = await apiRequest('/admin/report-all-orders');
      return res.rows;
    },
  });

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Relatório Geral de Pedidos</h1>
      <div className="mb-4 flex gap-2">
        <button
          className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 transition-colors disabled:opacity-50"
          disabled={!data || data.length === 0}
          onClick={() => exportRowsToExcel(data)}
        >
          📥 Exportar para Excel
        </button>
      </div>
      {isLoading && <div>Carregando...</div>}
      {error && <div className="text-red-500">Erro ao carregar relatório</div>}
      {data && (
        <div className="overflow-x-auto">
          <table className="min-w-full border text-xs">
            <thead>
              <tr className="bg-slate-200 text-slate-700">
                <th className="border px-2 py-1">Cód. Variação</th>
                <th className="border px-2 py-1">Revista</th>
                <th className="border px-2 py-1">Variação</th>
                <th className="border px-2 py-1">Qtd</th>
                <th className="border px-2 py-1">Preço Unit.</th>
                <th className="border px-2 py-1">Total</th>
              </tr>
            </thead>
            <tbody>
              {data.map((row, idx) => (
                <tr key={idx}>
                  <td className="border px-2 py-1">{row.variantCode}</td>
                  <td className="border px-2 py-1">{row.magazineName}</td>
                  <td className="border px-2 py-1">{row.variantName}</td>
                  <td className="border px-2 py-1 text-right">{row.quantity}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrency(row.unitPrice)}</td>
                  <td className="border px-2 py-1 text-right">{formatCurrency(row.totalValue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
