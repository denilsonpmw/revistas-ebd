import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatCurrency as formatCurrencyUtil } from './currency';

/**
 * Formata data para exibição no recibo
 */
const formatDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata valor monetário (alias para função utilitária)
 */
const formatCurrency = formatCurrencyUtil;

/**
 * Gera PDF do recibo de pedido
 * @param {Object} orderData - Dados do pedido
 * @returns {Blob} - Blob do PDF gerado
 */
export const generateReceiptPDF = (orderData) => {
  // Calcular total a partir dos items se não existir
  const calculateTotal = () => {
    if (orderData.totalPrice) return orderData.totalPrice;
    if (!orderData.items || orderData.items.length === 0) return 0;
    return orderData.items.reduce((sum, item) => {
      const itemTotal = item.totalValue || (item.quantity * item.unitPrice);
      return sum + Number(itemTotal);
    }, 0);
  };

  const totalPrice = calculateTotal();

  // Cria documento PDF (largura de 80mm ~ 226 pixels, altura automática)
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [80, 200] // Largura fixa 80mm, altura ajustável
  });

  let yPosition = 10;

  // Cabeçalho
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('SISTEMA DE REVISTAS EBD', 40, yPosition, { align: 'center' });
  
  yPosition += 6;
  doc.setFontSize(12);
  doc.text('EXTRATO DE PEDIDO', 40, yPosition, { align: 'center' });
  
  yPosition += 8;
  
  // Linha divisória
  doc.setLineWidth(0.5);
  doc.line(5, yPosition, 75, yPosition);
  
  yPosition += 6;

  // Informações do pedido
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const orderNumber = orderData.number ? String(orderData.number).padStart(4, '0') : orderData.id?.slice(0, 8) || 'N/A';
  doc.text(`Pedido: #${orderNumber}`, 5, yPosition);
  yPosition += 5;
  
  doc.text(`Data: ${formatDate(orderData.createdAt)}`, 5, yPosition);
  yPosition += 7;
  
  const userName = orderData.submittedBy?.name || orderData.user?.name || 'N/A';
  doc.text(`Usuário: ${userName}`, 5, yPosition);
  yPosition += 5;
  
  doc.text(`Congregação: ${orderData.congregation?.name || 'N/A'}`, 5, yPosition);
  yPosition += 5;
  
  doc.text(`Período: ${orderData.period?.name || 'N/A'}`, 5, yPosition);
  yPosition += 7;

  // Linha divisória
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;

  // Título dos itens
  doc.setFont('helvetica', 'bold');
  doc.text('ITENS DO PEDIDO', 5, yPosition);
  yPosition += 5;

  // Linha divisória
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 5;

  // Itens do pedido
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  orderData.items?.forEach((item) => {
    const magazineName = item.magazine?.name || 'Revista';
    const variantName = item.variantCombination?.name || 
                       item.variantData?.combinationName ||
                       item.variantData?.name || 
                       'Variação';
    const quantity = item.quantity;
    const unitPrice = item.unitPrice;
    const total = item.totalValue || (quantity * unitPrice);

    // Nome da revista
    const magazineLines = doc.splitTextToSize(magazineName, 70);
    magazineLines.forEach((line) => {
      doc.text(line, 5, yPosition);
      yPosition += 4;
    });

    // Variação
    doc.setFont('helvetica', 'italic');
    doc.text(`Variação: ${variantName}`, 5, yPosition);
    yPosition += 4;

    // Quantidade, preço unitário e total
    doc.setFont('helvetica', 'normal');
    const leftText = `${quantity} x ${formatCurrency(unitPrice)}`;
    const rightText = formatCurrency(total);
    
    // Calcular largura do texto
    const leftWidth = doc.getTextWidth(leftText);
    const rightWidth = doc.getTextWidth(rightText);
    const availableSpace = 70 - leftWidth - rightWidth; // 70mm é a largura total (80 - 10 margens)
    const dotWidth = doc.getTextWidth('.');
    const numDots = Math.floor(availableSpace / dotWidth);
    const dots = '.'.repeat(Math.max(numDots, 2));
    
    doc.text(leftText, 5, yPosition);
    doc.text(dots, 5 + leftWidth, yPosition);
    doc.text(rightText, 75, yPosition, { align: 'right' });
    yPosition += 6;
  });

  // Linha divisória antes do total
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;

  // Total do pedido
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`TOTAL:`, 5, yPosition);
  doc.text(`${formatCurrency(totalPrice)}`, 75, yPosition, { align: 'right' });
  yPosition += 7;

  // Linha divisória
  doc.line(5, yPosition, 75, yPosition);
  yPosition += 6;

  // Status e data de geração
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  
  const statusText = orderData.status === 'PENDING' || orderData.status === 'pending' ? 'Pendente' : 
                    orderData.status === 'APPROVED' || orderData.status === 'confirmed' ? 'Pago' : 
                    orderData.status === 'DELIVERED' ? 'Entregue' :
                    orderData.status === 'CANCELED' || orderData.status === 'cancelled' ? 'Cancelado' : 
                    'Pendente';
  
  doc.text(`Status: ${statusText}`, 5, yPosition);
  yPosition += 5;
  
  const now = new Date();
  doc.text(`Gerado em: ${formatDate(now)}`, 5, yPosition);

  // Retorna o PDF como Blob
  return doc.output('blob');
};

/**
 * Faz download do PDF do recibo
 * @param {Object} orderData - Dados do pedido
 */
export const downloadReceipt = (orderData) => {
  const pdfBlob = generateReceiptPDF(orderData);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  const orderNumber = orderData.number ? String(orderData.number).padStart(4, '0') : orderData.id?.slice(0, 8) || 'pedido';
  link.download = `pedido-${orderNumber}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * Compartilha o recibo via Web Share API
 * @param {Object} orderData - Dados do pedido
 * @returns {Promise<boolean>} - True se compartilhou, false se fez download
 */
export const shareReceipt = async (orderData) => {
  const pdfBlob = generateReceiptPDF(orderData);
  
  // Verifica se o navegador suporta Web Share API
  if (navigator.share && navigator.canShare) {
    try {
      const orderNumber = orderData.number ? String(orderData.number).padStart(4, '0') : orderData.id?.slice(0, 8) || 'pedido';
      const file = new File(
        [pdfBlob], 
        `pedido-${orderNumber}.pdf`, 
        { type: 'application/pdf' }
      );

      const shareData = {
        title: `Pedido #${orderNumber}`,
        text: `Recibo do pedido #${orderNumber} - Revistas EBD`,
        files: [file]
      };

      // Verifica se pode compartilhar arquivos
      if (navigator.canShare(shareData)) {
        await navigator.share(shareData);
        return true;
      }
    } catch (error) {
      // Se o usuário cancelou ou houve erro, faz download
      if (error.name !== 'AbortError') {
        console.error('Erro ao compartilhar:', error);
      }
    }
  }
  
  // Fallback: faz download direto
  downloadReceipt(orderData);
  return false;
};
