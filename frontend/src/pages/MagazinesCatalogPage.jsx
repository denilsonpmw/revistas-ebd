import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { apiRequest } from '../api/client';
import { VariantDisplay } from '../components/VariantSelector';

const printStyles = `
  @media print {
    body * {
      visibility: hidden;
    }
    #catalog-content,
    #catalog-content * {
      visibility: visible;
    }
    #catalog-content {
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

export default function MagazinesCatalogPage() {
  const [filterActive, setFilterActive] = useState('all');

  const magazinesQuery = useQuery({
    queryKey: ['magazines'],
    queryFn: () => apiRequest('/magazines')
  });

  const handlePrint = () => {
    window.print();
  };

  const handlePDF = async () => {
    try {
      const html2pdf = (await import('html2pdf.js')).default;
      
      const element = document.getElementById('catalog-content');
      const opt = {
        margin: 10,
        filename: `catalogo-revistas-${new Date().toISOString().split('T')[0]}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      
      await html2pdf().set(opt).from(element).save();
      toast.success('PDF gerado com sucesso');
    } catch (error) {
      toast.error('Erro ao gerar PDF');
    }
  };

  const magazines = magazinesQuery.data?.magazines || [];
  const filteredMagazines = magazines.filter(mag => {
    if (filterActive === 'all') return true;
    if (filterActive === 'active') return mag.active;
    if (filterActive === 'inactive') return !mag.active;
    return true;
  });

  const totalRevistas = filteredMagazines.length;
  const totalAtivas = filteredMagazines.filter(m => m.active).length;

  return (
    <>
      <style>{printStyles}</style>
      <div className="min-h-screen bg-slate-950 text-slate-100">
        <div className="flex flex-col gap-6 p-6">
          {/* Cabeçalho e Filtros - Não imprime */}
          <div className="no-print">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold">Catálogo de Revistas</h2>
              <div className="flex gap-3">
                <button
                  onClick={handlePrint}
                  className="rounded bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                >
                  🖨️ Imprimir
                </button>
                <button
                  onClick={handlePDF}
                  className="rounded bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700"
                >
                  📄 Salvar PDF
                </button>
              </div>
            </div>

          <div className="rounded-lg border border-slate-800 bg-slate-900 p-4 mb-6">
            <div className="flex items-center gap-4">
              <label className="text-sm font-medium text-slate-300">Filtrar:</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setFilterActive('all')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filterActive === 'all' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Todas
                </button>
                <button
                  onClick={() => setFilterActive('active')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filterActive === 'active' 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Ativas
                </button>
                <button
                  onClick={() => setFilterActive('inactive')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filterActive === 'inactive' 
                      ? 'bg-red-600 text-white' 
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  Inativas
                </button>
              </div>
            </div>
          </div>

          {/* Cards de Métricas */}
          <div className="grid gap-4 md:grid-cols-2 mb-6">
            <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
              <div className="text-sm text-slate-400">Total de Revistas</div>
              <div className="mt-2 text-3xl font-bold text-emerald-400">{totalRevistas}</div>
            </div>
            <div className="rounded-lg border border-slate-800 bg-gradient-to-br from-slate-900 to-slate-800 p-6">
              <div className="text-sm text-slate-400">Revistas Ativas</div>
              <div className="mt-2 text-3xl font-bold text-blue-400">{totalAtivas}</div>
            </div>
          </div>
          </div>
        </div>

        {magazinesQuery.isLoading && (
          <div className="text-center py-8 text-slate-400">Carregando catálogo...</div>
        )}

        {/* Conteúdo do Catálogo - Imprimível */}
        {filteredMagazines.length > 0 && (
          <div id="catalog-content" className="rounded-lg border border-slate-800 bg-white text-black p-6">
            {/* Cabeçalho do Catálogo */}
            <div className="mb-6 text-center border-b-2 border-slate-300 pb-4">
              <h1 className="text-2xl font-bold mb-2">Catálogo de Revistas - EBD</h1>
              <p className="text-sm text-slate-600">
                Gerado em: {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>

            {/* Resumo */}
            <div className="grid grid-cols-2 gap-4 mb-6 bg-slate-100 p-4 rounded">
              <div className="text-center">
                <p className="text-xs text-slate-600 uppercase font-semibold">Total de Revistas</p>
                <p className="text-2xl font-bold text-slate-800">{totalRevistas}</p>
              </div>
              <div className="text-center">
                <p className="text-xs text-slate-600 uppercase font-semibold">Revistas Ativas</p>
                <p className="text-2xl font-bold text-emerald-600">{totalAtivas}</p>
              </div>
            </div>

            {/* Tabela de Revistas */}
            <table className="w-full text-sm">
              <thead className="bg-slate-100 border-b-2 border-slate-300">
                <tr>
                  <th className="p-3 text-left font-bold">Código</th>
                  <th className="p-3 text-left font-bold">Nome da Revista</th>
                  <th className="p-3 text-left font-bold">Classe</th>
                  <th className="p-3 text-left font-bold">Faixa Etária</th>
                  <th className="p-3 text-left font-bold">Variações</th>
                  <th className="p-3 text-center font-bold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredMagazines.map((mag, idx) => (
                  <tr key={mag.id} className={`border-b border-slate-200 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50'}`}>
                    <td className="p-3">
                      <span className="font-mono font-semibold text-blue-600">{mag.code}</span>
                    </td>
                    <td className="p-3 font-medium">{mag.name}</td>
                    <td className="p-3">{mag.className}</td>
                    <td className="p-3 text-center">{mag.ageRange}</td>
                    <td className="p-3">
                      {mag.variantCombinations && mag.variantCombinations.length > 0 ? (
                        <div className="text-xs text-slate-700">
                          {mag.variantCombinations.map((combo) => (
                            <div key={combo.id}>
                              {combo.name}: R$ {Number(combo.price).toFixed(2)}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-slate-500">Sem variações</span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {mag.active ? (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-200 text-green-800">
                          Ativa
                        </span>
                      ) : (
                        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-red-200 text-red-800">
                          Inativa
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-100 border-t-2 border-slate-300">
                <tr>
                  <td colSpan="3" className="p-3 font-bold text-right">Total de Revistas:</td>
                  <td className="p-3 text-right font-bold">{totalRevistas}</td>
                  <td className="p-3"></td>
                </tr>
              </tfoot>
            </table>

            {/* Rodapé do Catálogo */}
            <div className="mt-8 pt-4 border-t-2 border-slate-300 text-center text-xs text-slate-600">
              <p>Sistema de Controle de Revistas - EBD</p>
              <p className="mt-1">Para pedidos, entre em contato com a administração</p>
            </div>
          </div>
        )}

        {filteredMagazines.length === 0 && !magazinesQuery.isLoading && (
          <div className="text-center py-12 text-slate-400">
            <div className="text-4xl mb-3">📚</div>
            <p className="text-lg">Nenhuma revista encontrada</p>
          </div>
        )}
      </div>
    </>
  );
}
