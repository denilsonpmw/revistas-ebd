/**
 * Formata um valor numérico para o padrão brasileiro de moeda
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} - Valor formatado no padrão R$ 2.584,39
 */
export const formatCurrency = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return 'R$ 0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(numValue);
};

/**
 * Formata um valor numérico para o padrão brasileiro sem o símbolo da moeda
 * @param {number|string} value - Valor a ser formatado
 * @returns {string} - Valor formatado no padrão 2.584,39
 */
export const formatNumber = (value) => {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) {
    return '0,00';
  }
  
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};
