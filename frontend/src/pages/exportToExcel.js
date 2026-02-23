// Função utilitária para exportar dados para Excel (XLSX)
import * as XLSX from 'xlsx';

export function exportRowsToExcel(rows, filename = 'relatorio-geral.xlsx') {
  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Relatório');
  XLSX.writeFile(wb, filename);
}
