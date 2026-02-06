import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { useAuth } from '../context/AuthContext.jsx';
import { formatCurrency } from '../utils/currency';

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

export default function ReportsPage() {
  const { user } = useAuth();
  const [periodId, setPeriodId] = useState('');
  const [congregationFilter, setCongregationFilter] = useState('');
  const isAdmin = user?.role === 'ADMIN';

  const periodsQuery = useQuery({
    queryKey: ['periods'],
    queryFn: () => apiRequest('/periods')
  });

  const congregationsQuery = useQuery({
    queryKey: ['congregations'],
    queryFn: () => apiRequest('/admin/congregations'),
    enabled: isAdmin
  });

  const ordersQuery = useQuery({
    queryKey: ['orders'],
    queryFn: () => apiRequest('/orders'),
    enabled: !isAdmin
  });

  const reportQuery = useQuery({
    queryKey: ['report', periodId],
    queryFn: () => apiRequest(`/admin/report?periodId=${encodeURIComponent(periodId)}`),
    enabled: Boolean(periodId) && isAdmin
  });

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('report-content');
      const opt = {
        margin: 10,
        filename: `relatorio-${reportQuery.data?.periodCode || 'report'}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'landscape' }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  // Para ADMIN: usa dados do report
  // Para USER/MANAGER: filtra pedidos da própria congregação
  let rows = [];
  let byChurch = {};
  let totalQuantity = 0;
  let totalValue = 0;

  if (isAdmin) {
    rows = reportQuery.data?.rows || [];
    
    // Filtra por congregação se selecionada
    const filteredRows = congregationFilter 
      ? rows.filter(row => row.congregationId === congregationFilter)
      : rows;
    
    totalQuantity = filteredRows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    totalValue = filteredRows.reduce((sum, row) => sum + Number(row.totalValue || 0), 0);
    
    // Agrupa por congregação (admin vê todas)
    byChurch = filteredRows.reduce((acc, row) => {
      const key = row.congregationName;
      if (!acc[key]) acc[key] = { items: [], total: 0, quantity: 0 };
      acc[key].items.push(row);
      acc[key].total += Number(row.totalValue || 0);
      acc[key].quantity += Number(row.quantity || 0);
      return acc;
    }, {});
  } else {
    // Usuário normal: filtra apenas pedidos da sua congregação
    const allOrders = ordersQuery.data?.orders || [];
    const myOrders = allOrders.filter(o => 
      o.periodId === periodId && 
      o.congregationId === user?.congregationId
    );

    const normalizeStatus = (status) => String(status || '').toUpperCase();
    const pickStatus = (current, next) => {
      const currentKey = normalizeStatus(current);
      const nextKey = normalizeStatus(next);
      if (currentKey === 'PENDING' || nextKey === 'PENDING') return 'PENDING';
      return currentKey || nextKey || 'PENDING';
    };

    // Converte orders para formato de rows incluindo variações
    const rowsMap = new Map();
    for (const order of myOrders) {
      for (const item of order.items || []) {
        const variantIdKey = item.combinationId
          || item.variantCombination?.id
          || item.variantData?.combinationId
          || item.variantData?.combinationCode
          || item.variantCombination?.code
          || item.variantCode
          || item.variantCombination?.name
          || item.variantData?.combinationName
          || item.variantName
          || 'no-variant';
        const key = `${item.magazineId}-${variantIdKey}`;
        if (!rowsMap.has(key)) {
          rowsMap.set(key, {
            congregationId: order.congregationId,
            congregationName: user?.congregation?.name || 'Minha Congregação',
            magazineCode: item.magazine?.code || '',
            magazineName: item.magazine?.name || '',
            className: item.magazine?.className || '',
            variantCode: item.variantCombination?.code || item.variantData?.combinationCode || item.variantCode || '-',
            variantName: item.variantCombination?.name || item.variantData?.combinationName || item.variantName || 'Sem variação',
            status: normalizeStatus(order.status),
            quantity: 0,
            unitPrice: Number(item.unitPrice || 0),
            totalValue: 0
          });
        }
        const entry = rowsMap.get(key);
        entry.status = pickStatus(entry.status, order.status);
        if (entry.variantCode === '-' || !entry.variantCode) {
          entry.variantCode = item.variantCombination?.code || item.variantData?.combinationCode || entry.variantCode;
        }
        if (entry.variantName === 'Sem variação' || !entry.variantName) {
          entry.variantName = item.variantCombination?.name || item.variantData?.combinationName || entry.variantName;
        }
        entry.quantity += item.quantity || 0;
        entry.totalValue += Number(item.totalValue || 0);
      }
    }
    
    rows = Array.from(rowsMap.values());
    totalQuantity = rows.reduce((sum, row) => sum + Number(row.quantity || 0), 0);
    totalValue = rows.reduce((sum, row) => sum + Number(row.totalValue || 0), 0);

    // Para usuário normal, só mostra sua congregação
    byChurch = {
      [user?.congregation?.name || 'Minha Congregação']: {
        items: rows,
        total: totalValue,
        quantity: totalQuantity
      }
    };
  }
  
  const selectedPeriod = periodsQuery.data?.periods?.find(p => p.id === periodId);

  const statusPT = {
    PENDING: 'Pendente',
    APPROVED: 'Pago',
    DELIVERED: 'Entregue',
    CANCELED: 'Cancelado'
  };

  return (
    <>
      <style>{printStyles}</style>
      <div className="flex flex-col gap-6">
        {/* Cabeçalho e Filtros - Não imprime */}
        <div className="no-print">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Relatórios de Pedidos</h2>
            <div className="flex gap-3">
              <button
                onClick={handlePrint}
                disabled={!periodId || !rows.length}
                className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                🖨️ Imprimir
              </button>
              <button
                onClick={handlePDF}
                disabled={!periodId || !rows.length}
                className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                📄 Salvar PDF
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
              
              {isAdmin && (
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Filtrar por Igreja
                  </label>
                  <select
                    value={congregationFilter}
                    onChange={(e) => setCongregationFilter(e.target.value)}
                    className="rounded border border-slate-700 bg-slate-950 px-4 py-2 text-sm w-full"
                    disabled={!periodId}
                  >
                    <option value="">Todas as igrejas</option>
                    {congregationsQuery.data?.congregations?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {(reportQuery.isLoading || ordersQuery.isLoading) && (
          <div className="text-center py-8 text-slate-400">Carregando relatório...</div>
        )}

        {!periodId && !reportQuery.isLoading && !ordersQuery.isLoading && (
          <div className="text-center py-12 text-slate-400">
            <p className="text-lg">Selecione um período para visualizar o relatório</p>
          </div>
        )}

        {/* Conteúdo do Relatório - Imprimível */}
        {rows.length > 0 && (
          <div id="report-content" className="rounded-lg border border-slate-800 bg-white text-black p-6">
            {/* Cabeçalho do Relatório */}
            <div className="mb-6 text-center border-b-2 border-slate-300 pb-4">
              <h1 className="text-2xl font-bold mb-2">Relatório de Pedidos de Revistas</h1>
              <p className="text-lg font-semibold text-slate-700">
                Período: {selectedPeriod?.code} - {selectedPeriod?.name}
              </p>
              <p className="text-sm text-slate-600 mt-1">
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* Resumo Geral */}
            <div className={`grid ${isAdmin ? 'grid-cols-3' : 'grid-cols-2'} gap-4 mb-6 bg-slate-100 p-4 rounded`}>
              {isAdmin && (
                <div className="text-center">
                  <p className="text-xs text-slate-600 uppercase font-semibold">Total de Igrejas</p>
                  <p className="text-2xl font-bold text-slate-800">{Object.keys(byChurch).length}</p>
                </div>
              )}
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

            {/* Detalhamento por Congregação */}
            <div className="space-y-6">
              {Object.entries(byChurch).map(([churchName, data]) => (
                <div key={churchName} className="border border-slate-300 rounded">
                  <div className="bg-slate-200 px-4 py-2 font-bold text-slate-800 flex justify-between items-center">
                    <span>{churchName}</span>
                    <span className="text-sm">
                      {data.quantity} revistas | {formatCurrency(data.total)}
                    </span>
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-100 border-b border-slate-300">
                      <tr>
                        <th className="p-2 text-left font-semibold">Cód. Variação</th>
                        <th className="p-2 text-left font-semibold">Revista</th>
                        <th className="p-2 text-left font-semibold">Variação</th>
                        <th className="p-2 text-center font-semibold">Qtd</th>
                        <th className="p-2 text-right font-semibold">Preço Unit.</th>
                        <th className="p-2 text-right font-semibold">Total</th>
                        <th className="p-2 text-center font-semibold">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.items.map((row, idx) => (
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
                          <td className="p-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-xs font-semibold ${
                              row.status === 'PENDING' ? 'bg-yellow-200 text-yellow-800' :
                              row.status === 'APPROVED' ? 'bg-blue-200 text-blue-800' :
                              row.status === 'DELIVERED' ? 'bg-green-200 text-green-800' :
                              'bg-red-200 text-red-800'
                            }`}>
                              {statusPT[row.status] || row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))}
            </div>

            {/* Rodapé do Relatório */}
            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center text-xs text-slate-600">
              <p>Sistema de Controle de Revistas - EBD</p>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
