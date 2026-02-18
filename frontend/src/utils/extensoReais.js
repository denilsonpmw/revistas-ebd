// Função simples para converter valor numérico para extenso em reais (até centenas)
// Exemplo: 51.50 -> cinquenta e um reais e cinquenta centavos

const unidades = ['zero', 'um', 'dois', 'três', 'quatro', 'cinco', 'seis', 'sete', 'oito', 'nove'];
const dezenas = ['dez', 'onze', 'doze', 'treze', 'quatorze', 'quinze', 'dezesseis', 'dezessete', 'dezoito', 'dezenove'];
const dezenas2 = ['', '', 'vinte', 'trinta', 'quarenta', 'cinquenta', 'sessenta', 'setenta', 'oitenta', 'noventa'];
const centenas = ['', 'cem', 'cento', 'duzentos', 'trezentos', 'quatrocentos', 'quinhentos', 'seiscentos', 'setecentos', 'oitocentos', 'novecentos'];

function extensoReais(valor) {
  valor = Number(valor);
  if (isNaN(valor)) return '';
  const inteiro = Math.floor(valor);
  const centavos = Math.round((valor - inteiro) * 100);

  let extenso = '';
  // Centenas
  if (inteiro >= 100) {
    if (inteiro === 100) {
      extenso += 'cem';
    } else {
      extenso += centenas[Math.floor(inteiro / 100)];
    }
    if (inteiro % 100 !== 0) extenso += ' e ';
  }
  // Dezenas
  const dez = Math.floor((inteiro % 100) / 10);
  const uni = inteiro % 10;
  if (dez === 1) {
    extenso += dezenas[uni];
  } else if (dez > 1) {
    extenso += dezenas2[dez];
    if (uni > 0) extenso += ' e ' + unidades[uni];
  } else if (uni > 0 || inteiro === 0) {
    extenso += unidades[uni];
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
