// Função simples para converter valor numérico para extenso em reais (até centenas)
// Exemplo: 51.50 -> cinquenta e um reais e cinquenta centavos

const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const dezenas = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas2 = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function extensoReais(valor) {
  valor = Number(valor);
  if (isNaN(valor)) return '';
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let extenso = '';
  // Centenas, dezenas e unidades
  if (inteiro === 0) {
    extenso += 'zero';
  } else {
    const c = Math.floor(inteiro / 100);
    const d = Math.floor((inteiro % 100) / 10);
    const u = inteiro % 10;
    if (c > 0) {
      if (inteiro === 100) {
        extenso += 'cem';
      } else {
        extenso += centenas[c];
      }
      if (inteiro % 100 !== 0) extenso += ' e ';
    }
    if (d === 1) {
      extenso += dezenas[u];
    } else if (d > 1) {
      extenso += dezenas2[d];
      if (u > 0) extenso += ' e ' + unidades[u];
    } else if (u > 0 && d === 0) {
      extenso += unidades[u];
    }
  }
  if (inteiro > 0) extenso += ' reais';
  if (centavos > 0) {
    if (inteiro > 0) extenso += ' e ';
    if (centavos < 10) {
      extenso += unidades[centavos] + ' centavos';
    } else if (centavos < 20) {
      extenso += dezenas[centavos - 10] + ' centavos';
    } else {
      extenso += dezenas2[Math.floor(centavos / 10)];
      if (centavos % 10 > 0) extenso += ' e ' + unidades[centavos % 10];
      extenso += ' centavos';
    }
  }
  return extenso;
}

export default extensoReais;
