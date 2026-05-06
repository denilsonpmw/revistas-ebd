
import { formatCurrency } from '../utils/currency';
import { exportRowsToExcel } from './exportToExcel';

import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext.jsx';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '../api/client';
// ...existing code...

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #report-content,
    #report-content * {
      visibility: visible;
    }
    #report-content {
      position: absolute;
      left: 0;
      top: 0;
      width: 100%;
      background: white;
      color: black;
      padding: 20px;
    }
    .no-print {
      display: none !important;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      font-size: 11px;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 8px;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
      font-weight: bold;
    }
  }
`;

export default function GlobalOrdersReportPage() {
  const { user } = useAuth();
  const [periodId, setPeriodId] = useState('');
  const isAdmin = user?.role === 'ADMIN';

  const periodsQuery = useQuery({
    queryKey: ['periods'],
    queryFn: () => apiRequest('/periods/all')
  });

  const reportQuery = useQuery({
    queryKey: ['global-orders-report', periodId],
    queryFn: () => apiRequest(`/admin/report-all-orders?periodId=${encodeURIComponent(periodId)}`),
    enabled: Boolean(periodId) && isAdmin
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExcel = () => {
    if (!rows.length) return;
    exportRowsToExcel(rows, 'relatorio-geral.xlsx');
    toast.success('Excel exportado com sucesso');
  };

  let rows = [];
  let totalQuantity = 0;
  let totalValue = 0;

  if (isAdmin) {
    rows = reportQuery.data?.rows || [];
    totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    totalValue = rows.reduce((sum, row) => sum + Number(row.totalValue || 0), 0);
  }

  const selectedPeriod = periodsQuery.data?.periods?.find(p => p.id === periodId);

  return (
    <>
      <style>{printStyles}</style>
      <div className="flex flex-col gap-6">
        <div className="no-print">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Relatório Geral de Pedidos</h2>
            <div className="flex gap-3 items-center">
              <button
                onClick={handlePrint}
                disabled={!periodId || !rows.length}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={handleExcel}
                disabled={!periodId || !rows.length}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                ⬇️ Exportar Excel
              </button>
            </div>
          </div>
          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Selecione o Período
                </label>
                <select
                  value={periodId}
                  onChange={(e) => setPeriodId(e.target.value)}
                  className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm w-full"
                >
                  <option value="">Escolha um período...</option>
                  {periodsQuery.data?.periods?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.code} - {p.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
        {reportQuery.isLoading && (
          <div className="text-center py-8 text-slate-400">Carregando relatório...</div>
        )}
        {!periodId && !reportQuery.isLoading && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg">Selecione um período para visualizar o relatório</p>
          </div>
        )}
        {rows.length > 0 && (
          <div id="report-content" className="rounded-lg border border-slate-800 bg-white text-black p-6">
            <div className="mb-6 text-center border-b-2 border-slate-300 pb-4">
              <h1 className="text-2xl font-bold mb-2">Relatório Geral de Pedidos de Revistas</h1>
              <p className="text-lg font-semibold text-slate-700">
                Período: {selectedPeriod?.code} - {selectedPeriod?.name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-100 p-4 rounded">
              <div className="text-center">
                <p className="text-xs text-slate-600 uppercase font-semibold">Total de Revistas</p>
                <p className="text-2xl font-bold text-blue-600">{totalQuantity}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 uppercase font-semibold">Valor Total</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {formatCurrency(totalValue)}
                </p>
              </div>
            </div>
            <div className="space-y-6">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 border-b border-slate-300">
                  <tr>
                    <th className="p-2 text-left font-semibold">Cód. Variação</th>
                    <th className="p-2 text-left font-semibold">Revista</th>
                    <th className="p-2 text-left font-semibold">Variação</th>
                    <th className="p-2 text-center font-semibold">Qtd</th>
                    <th className="p-2 text-right font-semibold">Preço Unit.</th>
                    <th className="p-2 text-right font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 font-mono text-xs">{row.variantCode || '-'}</td>
                      <td className="p-2">{row.magazineName}</td>
                      <td className="p-2 text-slate-600">{row.variantName || '-'}</td>
                      <td className="p-2 text-center font-semibold">{row.quantity}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(row.unitPrice || (row.totalValue / row.quantity))}
                      </td>
                      <td className="p-2 text-right font-bold">
                        {formatCurrency(row.totalValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center text-xs text-slate-600">
              <p>Sistema de Controle de Revistas - EBD</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
