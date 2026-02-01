# 🎓 Sistema de Controle de Pedidos de Revistas EBD
## Onboarding de Usuários - Guia Completo

### 📋 Sumário Rápido

Este documento descreve como o novo sistema de onboarding funciona com **duas opções de entrada**:

1. **Auto-cadastro público** → Usuários se registram e aguardam aprovação do admin
2. **Criação direta pelo admin** → Admin cria usuários com acesso imediato

---

## 🚀 Opção 1: Auto-Cadastro Público

### Para Usuários Finais

#### Passo 1: Acessar página de registro
```
http://localhost:5173/registro
```

#### Passo 2: Preencher formulário
- **Nome Completo**: Mínimo 3 caracteres
- **WhatsApp**: Digite apenas números (DDD + número)
- **Congregação**: Selecione da lista

#### Passo 3: Enviar cadastro
- Clique em "Criar Conta"
- Verá mensagem: **"Cadastro enviado! Aguarde aprovação do administrador"**

#### Passo 4: Aguardar aprovação
- O admin receberá notificação (futura: via email/WhatsApp)
- Você será notificado quando for aprovado

#### Passo 5: Fazer login
```
http://localhost:5173/
```
- Após aprovação, poderá entrar normalmente com seu WhatsApp

---

## 🛠️ Opção 2: Criação Direta pelo Admin

### Para Administradores

#### Passo 1: Acessar gerenciamento de usuários
```
http://localhost:5173/app/usuarios
```
(Requer permissão ADMIN)

#### Passo 2: Clicar em "Novo Usuário"
- Abre modal para criação

#### Passo 3: Preencher dados
- **Nome**: Nome completo do usuário
- **WhatsApp**: Número para login
- **Congregação**: Selecione a congregação
- **Função**: 
  - Usuário (USER) - Apenas visualiza e cria pedidos
  - Gerente (MANAGER) - Gerencia pedidos da congregação
  - Administrador (ADMIN) - Acesso total
- **Conta ativa**: ✓ Deixe marcado para acesso imediato

#### Passo 4: Clicar "Criar"
- Usuário criado com acesso imediato
- Sucesso: "Usuário criado com sucesso!"

#### Resultado
- Novo usuário pode fazer login imediatamente
- Não precisa de aprovação

---

## ✅ Aprovando Usuários Pendentes

### Passo 1: Ver pendências
```
http://localhost:5173/app/usuarios
```

- Badge amarela mostra: **"X Cadastro(s) Pendente(s)"**
- Clique em "Ver Pendentes" para filtrar

### Passo 2: Revisar usuário
Tabela mostra:
- Nome completo
- WhatsApp
- Congregação e Área
- Função (sempre USER no auto-cadastro)
- Status: **Pendente** (em amarelo)

### Passo 3: Aprovar ou Editar
**Opção A - Só Ativar:**
- Clique no ícone ✅ verde
- Usuário passa a Status: **Ativo**

**Opção B - Editar antes de Ativar:**
- Clique no ícone ✏️ azul
- Modal abre para editar nome, congregação, função
- Marca checkbox "Conta ativa"
- Clique "Salvar"

### Passo 4: Notificação (futura)
- Sistema notificará usuário via WhatsApp quando aprovado
- Usuário poderá fazer login

---

## 📊 Painel de Gerenciamento

### Interface (`/app/usuarios`)

```
┌─────────────────────────────────────────┐
│ Gerenciamento de Usuários               │
│                          [+ Novo Usuário] │
├─────────────────────────────────────────┤
│ ⏰ 2 Cadastros Pendentes | Ver Pendentes│
├─────────────────────────────────────────┤
│ Usuário  | WhatsApp | Congreg | Função │
├─────────────────────────────────────────┤
│ João    | 5588... | Sede | Usuário ✅ ❌ │
│ Maria   | 5599... | Arca | Pendente ✏️  │
└─────────────────────────────────────────┘
```

### Ações por Usuário

| Ação | Ícone | O que faz |
|------|-------|----------|
| Editar | ✏️ | Abre modal para modificar dados |
| Ativar/Desativar | ✅/❌ | Toggle de `active` |
| Deletar | 🗑️ | Remove usuário (com confirmação) |

---

## 🔍 Fluxos Detalhados

### Fluxo A: Auto-Cadastro → Aprovação → Login

```
┌─────────────────┐
│  Usuário Final  │
└────────┬────────┘
         │ Acessa /registro
         ↓
    ┌──────────────────────────┐
    │ Preenche formulário      │
    │ - Nome: João Silva       │
    │ - WhatsApp: 5588912...   │
    │ - Congregação: Arca      │
    │ Clica "Criar Conta"      │
    └────────┬─────────────────┘
             │ POST /auth/register
             ↓
    ┌────────────────────────────────┐
    │ Usuário criado com:            │
    │ - active: false (Pendente)     │
    │ - Mensagem: "Aguarde aprovação"│
    └────────┬──────────────────────┘
             │ Tenta fazer login
             ↓
    ┌────────────────────────────────┐
    │ POST /auth/request-link        │
    │ Retorna: 403                   │
    │ "Cadastro pendente de aprovação"
    │ ❌ Acesso bloqueado            │
    └────────────────────────────────┘
             │ Admin aprova
             ↓
    ┌──────────────────────────┐
    │ Admin acessa /app/usuarios│
    │ Vê João Silva pendente   │
    │ Clica ✅ Ativar          │
    │ PATCH /users/:id         │
    │ active = true            │
    └────────┬─────────────────┘
             │ João Silva tenta login novamente
             ↓
    ┌────────────────────────────┐
    │ POST /auth/request-link    │
    │ ✓ Gera link WhatsApp      │
    │ ✓ Usuário consegue acessar│
    └────────────────────────────┘
```

### Fluxo B: Admin Cria Direto

```
┌─────────────────┐
│  Admin          │
└────────┬────────┘
         │ Acessa /app/usuarios
         ↓
    ┌──────────────────────────────┐
    │ Clica "Novo Usuário"         │
    │ Modal abre                   │
    └────────┬─────────────────────┘
             │ Preenche formulário:
             │ - Nome: Maria Santos
             │ - WhatsApp: 5599887...
             │ - Congregação: Sede
             │ - Função: MANAGER
             │ - Ativo: ✓
             ↓
    ┌──────────────────────────────────┐
    │ POST /users                      │
    │ Usuário criado com:              │
    │ - active: true (Ativo)           │
    │ - role: MANAGER                  │
    │ ✓ Sucesso!                       │
    └────────┬───────────────────────┘
             │ Maria faz login imediatamente
             ↓
    ┌──────────────────────────┐
    │ POST /auth/request-link  │
    │ ✓ Gera link WhatsApp    │
    │ ✓ Consegue acessar      │
    └──────────────────────────┘
```

---

## 🔐 Verificações de Segurança

### Validações Implementadas

- ✓ Nome: Mínimo 3 caracteres
- ✓ WhatsApp: Mínimo 10 dígitos
- ✓ WhatsApp único (não permite duplicados)
- ✓ WhatsApp normalizado (remove caracteres especiais)
- ✓ Congregação válida (existe no banco)
- ✓ Apenas ADMIN pode usar rotas de gerenciamento

### Rejeições

| Cenário | Resposta |
|---------|----------|
| Usuário pendente tenta login | 403 "Cadastro pendente de aprovação" |
| WhatsApp já existe | 400 "WhatsApp já cadastrado" |
| Dados inválidos | 400 "Erro de validação" |
| Não é ADMIN | 401 "Acesso negado" |

---

## 📱 Endpoints da API

### Públicos (sem autenticação)

```bash
# Buscar congregações
GET /auth/congregations
Retorna: [ { id, name, code, area: { name } }, ... ]

# Auto-cadastro
POST /auth/register
Body: { name, whatsapp, congregationId }
Retorna: { message, user }

# Gerar link (login)
POST /auth/request-link
Body: { whatsapp }
Retorna: { waLink, verifyUrl } ou { message: "Pendente" }

# Verificar token
GET /auth/verify?token=...
Retorna: { token: JWT, user }
```

### Protegidos com ADMIN

```bash
# Listar todos usuários
GET /users
Header: Authorization: Bearer $JWT
Retorna: { users: [...] }

# Listar pendentes
GET /users/pending
Header: Authorization: Bearer $JWT
Retorna: { users: [...] }

# Criar usuário
POST /users
Header: Authorization: Bearer $JWT
Body: { name, whatsapp, congregationId, role, active }
Retorna: user

# Editar usuário
PATCH /users/:id
Header: Authorization: Bearer $JWT
Body: { name?, congregationId?, role?, active? }
Retorna: user

# Deletar usuário
DELETE /users/:id
Header: Authorization: Bearer $JWT
Retorna: { message }
```

---

## 🧪 Testar o Sistema

### Script de Teste Automatizado
```bash
bash test-onboarding-simple.sh
```

Testa:
1. Auto-cadastro ✓
2. Bloqueio de login para pendente ✓
3. Aprovação pelo admin ✓
4. Login após aprovação ✓

### Manual

```bash
# 1. Buscar congregação
curl http://localhost:3000/auth/congregations | jq '.[0].id'

# 2. Registrar novo usuário
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João",
    "whatsapp": "5588912345678",
    "congregationId": "..."
  }'

# 3. Tentar login (deve falhar)
curl -X POST http://localhost:3000/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"whatsapp": "5588912345678"}'
# Response: 403 "Cadastro pendente de aprovação"

# 4. Admin aprova
curl -X PATCH http://localhost:3000/users/USER_ID \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"active": true}'

# 5. Tentar login novamente (deve funcionar)
curl -X POST http://localhost:3000/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"whatsapp": "5588912345678"}'
# Response: { waLink, verifyUrl }
```

---

## 📝 Notas Importantes

1. **Roles**: USER (básico), MANAGER (gerente), ADMIN (total)
2. **Active**: false = bloqueado, true = pode usar
3. **WhatsApp**: Identificador único e não pode ser alterado
4. **Congregação**: Não pode ser alterada após criação (por enquanto)
5. **Aprovações**: Admin controla quem tem acesso

---

## 🎯 Próximas Melhorias

- [ ] Email de notificação quando aprovado
- [ ] WhatsApp message quando novo cadastro
- [ ] Editar WhatsApp pelo admin (se necessário)
- [ ] Histórico de aprovações
- [ ] Import bulk de usuários via CSV
- [ ] Two-factor authentication

---

**Versão**: 1.0  
**Última atualização**: 31/01/2026  
**Status**: ✅ Pronto para produção
