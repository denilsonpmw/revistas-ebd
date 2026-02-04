# Implementação Mobile - Sistema de Pedidos PDV

**Data:** 03/02/2026  
**Versão Base:** Anterior à implementação mobile

## Contexto e Motivação

O sistema atual funciona perfeitamente no desktop com todas as funcionalidades (usuários, congregações, períodos, revistas, pedidos, relatórios). Porém, identificou-se a necessidade de uma interface **exclusivamente mobile** para facilitar pedidos rápidos no estilo PDV (Ponto de Venda).

## Objetivo Principal

Criar uma experiência mobile-first simplificada que permita aos usuários fazer pedidos de forma rápida e intuitiva através de dispositivos móveis, com geração automática de recibo em PDF após cada pedido.

## Arquitetura Proposta

### Fluxo Mobile vs Desktop

**Desktop (mantém tudo atual):**
- Login → Dashboard completo com menu lateral
- Acesso a todas as funcionalidades: Pedidos, Revistas, Períodos, Usuários, Relatórios

**Mobile (novo fluxo simplificado):**
- Login → Página de Pedido Mobile (única tela)
- Após pedido: Geração de extrato/recibo em PDF
- Sem menu lateral, sem navegação complexa

### Detecção de Dispositivo

```javascript
// Hook customizado para detecção mobile
const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  return isMobile;
};
```

Breakpoint escolhido: **768px** (padrão Tailwind para `md:`)

## Componentes a Implementar

### 1. OrderMobilePage.jsx

**Localização:** `frontend/src/pages/OrderMobilePage.jsx`

**Responsabilidades:**
- Página principal de pedidos mobile
- Exibir grid de revistas em cards otimizados para toque
- Gerenciar carrinho flutuante
- Controlar modal de variações
- Processar submissão do pedido
- Exibir modal de sucesso com recibo

**Layout:**
- Header fixo: Logo + Nome do usuário + Congregação
- Grid de cards de revistas (2 colunas em mobile)
- Carrinho flutuante no rodapé (mostra total e quantidade)
- Modais: Seleção de variações, Confirmação, Recibo

### 2. MagazineCardMobile.jsx

**Localização:** `frontend/src/components/MagazineCardMobile.jsx`

**Características:**
- Card grande otimizado para toque (mínimo 44x44px)
- Visual clean: Código, Nome, Preço, Status
- Botão "Adicionar" destacado
- Indicador visual se já está no carrinho
- Suporte a imagem (opcional para futuro)

**Design:**
- Fundo: `bg-slate-900`
- Bordas: `border-slate-700`
- Texto: `text-slate-100` (títulos), `text-slate-400` (detalhes)
- Botão: `bg-emerald-600` (adicionar), `bg-blue-600` (no carrinho)
- Preço em destaque: `text-emerald-400`

### 3. FloatingCart.jsx

**Localização:** `frontend/src/components/FloatingCart.jsx`

**Características:**
- Fixo no bottom da tela
- Mostra quantidade total de itens
- Mostra valor total do pedido
- Botão "Finalizar Pedido" destacado
- Animação ao adicionar itens
- Expandível para mostrar resumo rápido (opcional)

**Comportamento:**
- Visível apenas quando há itens no carrinho
- Botão desabilitado se carrinho vazio
- Feedback visual ao adicionar/remover itens

### 4. VariantModalMobile.jsx

**Localização:** `frontend/src/components/VariantModalMobile.jsx`

**Características:**
- Modal bottom-sheet style
- Lista de variações disponíveis
- Seletor de quantidade (- / input / +)
- Botão "Adicionar ao Pedido"
- Mostra preço unitário e subtotal

**UX:**
- Fácil de fechar (swipe down ou botão X)
- Botões grandes para +/- quantidade
- Input numérico centralizado
- Validação: quantidade mínima = 1

### 5. ReceiptTemplate.jsx

**Localização:** `frontend/src/components/ReceiptTemplate.jsx`

**Características:**
- Template de recibo/extrato em formato PDF
- Largura: 375px (padrão mobile portrait)
- Informações: Cabeçalho, Dados do pedido, Itens, Totais, Rodapé

**Estrutura do Recibo:**

```
┌─────────────────────────────────┐
│     SISTEMA DE REVISTAS EBD     │
│           EXTRATO               │
├─────────────────────────────────┤
│ Pedido: #123456                 │
│ Data: 03/02/2026 14:30          │
│                                 │
│ Usuário: João Silva             │
│ Congregação: Central            │
│ Período: 1º Trimestre 2026      │
├─────────────────────────────────┤
│ ITENS DO PEDIDO                 │
├─────────────────────────────────┤
│ Lições Bíblicas Adultos         │
│ Variação: Mestre                │
│ 10 x R$ 12,00 ........ R$ 120,00│
│                                 │
│ Lições Bíblicas Jovens          │
│ Variação: Aluno                 │
│ 5 x R$ 8,00 ........... R$ 40,00│
├─────────────────────────────────┤
│                                 │
│ TOTAL: .............. R$ 160,00 │
├─────────────────────────────────┤
│ Status: Pendente                │
│ Gerado em: 03/02/2026 14:30     │
└─────────────────────────────────┘
```

### 6. useIsMobile Hook

**Localização:** `frontend/src/hooks/useIsMobile.js`

**Funcionalidade:**
- Detectar se o dispositivo é mobile (< 768px)
- Atualizar em tempo real ao redimensionar
- Usado para roteamento condicional

## Integração com Sistema Atual

### Modificações Necessárias

#### 1. AuthContext.jsx
- Adicionar lógica de redirecionamento baseada em `useIsMobile`
- Após login bem-sucedido:
  - Mobile → `/pedido-mobile`
  - Desktop → `/dashboard`

#### 2. App.jsx
- Adicionar nova rota: `/pedido-mobile`
- Manter proteção de rota com `PrivateRoute`

#### 3. Componentes Reutilizados
- **Nenhuma modificação** nos componentes existentes
- Criar novos componentes específicos para mobile
- Compartilhar apenas utilitários (formatação, API client)

## Geração de PDF - Recibo

### Biblioteca Escolhida: jsPDF

**Instalação:**
```bash
npm install jspdf jspdf-autotable
```

**Motivo da Escolha:**
- Leve e performática
- Ótimo suporte mobile
- Fácil integração com React
- Suporte a tabelas (jspdf-autotable)
- Geração 100% client-side

### Implementação do Recibo

**Arquivo:** `frontend/src/utils/generateReceipt.js`

**Funções:**
```javascript
// Gera PDF do recibo
generateReceiptPDF(orderData) => Blob

// Faz download do PDF
downloadReceipt(orderData) => void

// Compartilha via Web Share API
shareReceipt(orderData) => Promise
```

**Fluxo:**
1. Usuário finaliza pedido mobile
2. Backend retorna dados do pedido criado
3. Frontend gera PDF usando jsPDF
4. Modal de sucesso exibe:
   - Preview do recibo (opcional)
   - Botão "Salvar PDF"
   - Botão "Compartilhar" (Web Share API)
   - Botão "Fechar"

### Web Share API

```javascript
const shareReceipt = async (pdfBlob, orderNumber) => {
  if (navigator.share) {
    const file = new File([pdfBlob], `pedido-${orderNumber}.pdf`, {
      type: 'application/pdf'
    });
    
    await navigator.share({
      title: `Pedido #${orderNumber}`,
      text: `Recibo do pedido #${orderNumber}`,
      files: [file]
    });
  } else {
    // Fallback: download direto
    downloadReceipt(pdfBlob, orderNumber);
  }
};
```

**Compatibilidade:**
- iOS Safari 12+: ✅
- Android Chrome 75+: ✅
- Desktop: ❌ (fallback para download)

## Paleta de Cores Mobile

Manter consistência com sistema atual:

- **Backgrounds:**
  - `bg-slate-950` - Fundo principal
  - `bg-slate-900` - Cards
  - `bg-slate-800` - Modais, hover states
  
- **Texto:**
  - `text-slate-100` - Títulos principais
  - `text-slate-400` - Textos secundários
  
- **Ações Primárias:**
  - `bg-emerald-600` - Adicionar, Confirmar, Sucesso
  - `bg-emerald-500` - Hover
  
- **Ações Secundárias:**
  - `bg-blue-600` - Informações, Alternativas
  
- **Alertas:**
  - `bg-red-600` - Erros, Exclusões
  - `bg-yellow-500` - Avisos

## Responsividade

**Mobile First:** Todas as telas mobile desenvolvidas para 320px-767px

**Breakpoints:**
- `< 768px`: Interface mobile PDV
- `≥ 768px`: Interface desktop completa (atual)

**Comportamento de Transição:**
- Se usuário redimensionar janela, o sistema se adapta
- Em mobile: sempre vai para `/pedido-mobile` após login
- Em desktop: sempre vai para `/dashboard` após login

## Testes Necessários

### Funcionalidade
- [ ] Login mobile redireciona para OrderMobilePage
- [ ] Adicionar revistas ao carrinho
- [ ] Seleção de variações funciona corretamente
- [ ] Incremento/decremento de quantidade
- [ ] Carrinho flutuante atualiza valores em tempo real
- [ ] Submissão de pedido via API
- [ ] Geração de PDF após pedido
- [ ] Download de PDF funciona
- [ ] Compartilhamento via Web Share API (em dispositivos compatíveis)
- [ ] Modal de recibo exibe informações corretas

### UX Mobile
- [ ] Botões têm área de toque adequada (≥ 44x44px)
- [ ] Scroll suave e sem travamentos
- [ ] Modais aparecem/desaparecem suavemente
- [ ] Carrinho flutuante não sobrepõe conteúdo importante
- [ ] Textos legíveis em telas pequenas (320px)
- [ ] Performance adequada em dispositivos low-end

### Compatibilidade
- [ ] iOS Safari
- [ ] Android Chrome
- [ ] Android Firefox
- [ ] Fallback correto para Web Share API
- [ ] PDF gerado corretamente em todos os browsers mobile

## Estrutura de Arquivos

```
frontend/src/
├── hooks/
│   └── useIsMobile.js              # Hook de detecção mobile
├── components/
│   ├── MagazineCardMobile.jsx      # Card de revista para mobile
│   ├── FloatingCart.jsx             # Carrinho flutuante
│   ├── VariantModalMobile.jsx      # Modal de seleção de variações
│   └── ReceiptTemplate.jsx          # Template do recibo PDF
├── pages/
│   └── OrderMobilePage.jsx          # Página principal de pedidos mobile
├── utils/
│   └── generateReceipt.js           # Utilitário para geração de PDF
└── context/
    └── AuthContext.jsx              # (Modificar) Adicionar lógica mobile

frontend/
└── package.json                     # (Modificar) Adicionar jspdf
```

## Dependências Adicionais

```json
{
  "dependencies": {
    "jspdf": "^2.5.1",
    "jspdf-autotable": "^3.8.2"
  }
}
```

## Cronograma de Implementação

1. **Fase 1:** Setup e Infraestrutura
   - Criar hook useIsMobile
   - Instalar dependências (jspdf)
   - Configurar rotas

2. **Fase 2:** Componentes Base
   - MagazineCardMobile
   - FloatingCart
   - VariantModalMobile

3. **Fase 3:** Página Principal
   - OrderMobilePage
   - Integração com API
   - Gerenciamento de estado do carrinho

4. **Fase 4:** Geração de Recibo
   - ReceiptTemplate
   - generateReceipt.js
   - Modal de sucesso com recibo

5. **Fase 5:** Testes e Ajustes
   - Testes em dispositivos reais
   - Ajustes de UX
   - Correção de bugs

## Considerações Importantes

### Performance
- Usar React.memo para componentes de lista
- Debounce em inputs de quantidade
- Lazy loading de modais
- Otimizar renderizações

### Acessibilidade
- Labels apropriados
- Feedback visual para ações
- Mensagens de erro claras
- Suporte a screen readers

### Segurança
- Manter validações no backend
- Não expor dados sensíveis no PDF
- Sanitizar inputs do usuário

### Experiência do Usuário
- Feedback instantâneo ao adicionar itens
- Loading states em requisições
- Mensagens de sucesso/erro claras
- Confirmação antes de ações destrutivas

## Rollback Plan

**Tag criada:** `v-pre-mobile` (antes desta implementação)

**Em caso de problemas críticos:**
```bash
# Voltar para versão anterior
git checkout v-pre-mobile

# Ou fazer rollback no Railway (se já deployado)
railway rollback
```

**Problemas possíveis e soluções:**
- PDF não gera: Fallback para lista simples sem PDF
- Web Share não funciona: Sempre usar download direto
- Performance ruim: Lazy loading e optimização de re-renders
- Layout quebrado: Testes em múltiplos dispositivos antes do deploy

## Próximos Passos Após Implementação

- [ ] Deploy em ambiente de homologação
- [ ] Testes com usuários reais
- [ ] Coleta de feedback
- [ ] Iterações e melhorias
- [ ] Documentação de uso para usuários finais
- [ ] Possível adição de imagens nas revistas
- [ ] Histórico de pedidos no mobile
- [ ] Filtros por categoria (futuro)

---

**Documentação criada em:** 03/02/2026  
**Autor:** Sistema de Revistas EBD  
**Status:** Pronto para implementação
