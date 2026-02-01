# Sistema de Onboarding de Usuários - Implementação Completa

## 🎯 Objetivo
Implementar um sistema dual de onboarding de usuários que permite:
1. **Auto-cadastro público** (Opção 1): Usuários se registram e aguardam aprovação
2. **Criação direta pelo ADMIN** (Opção 2): Admin cria usuários com acesso imediato

## ✅ O que foi implementado

### Backend

#### 1. Modelo de Dados (Prisma)
```prisma
model User {
  id              String   @id @default(cuid())
  name            String
  whatsapp        String   @unique
  congregationId  String
  role            Role     @default(USER)
  active          Boolean  @default(false)  // NEW: Controla aprovação
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  congregation    Congregation @relation(fields: [congregationId], references: [id])
}
```

#### 2. Rotas Criadas

**`POST /auth/register`** - Auto-cadastro público (sem autenticação)
```bash
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "whatsapp": "5588912345678",
    "congregationId": "..."
  }'
```
- Valida nome (mín. 3 caracteres)
- Valida WhatsApp (mín. 10 dígitos)
- Normaliza WhatsApp (remove espaços, hyphens)
- Cria usuário com `active: false` (pendente de aprovação)
- Retorna: `"Cadastro enviado! Aguarde aprovação do administrador"`

**`POST /auth/congregations`** - Lista congregações (sem autenticação)
```bash
curl http://localhost:3000/auth/congregations
```
- Retorna lista de congregações com áreas
- Necessário para formulário de registro

**`GET /auth/request-link`** - Login (com validação de active)
```bash
curl -X POST http://localhost:3000/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"whatsapp": "5588912345678"}'
```
- Se `active: false` → Retorna 403 "Cadastro pendente de aprovação"
- Se `active: true` → Gera link de WhatsApp para autenticação

**`GET /auth/verify`** - Verificar token (com validação de active)
- Se `active: false` → Retorna 403 "Cadastro pendente de aprovação"
- Se `active: true` → Emite JWT válido

#### 3. Rotas de Gerenciamento (Protegidas com ADMIN)

**`GET /users`** - Listar todos os usuários
```bash
curl http://localhost:3000/users \
  -H "Authorization: Bearer $JWT"
```
- Retorna lista com congregação e área
- Ordenado por `active DESC, createdAt ASC`

**`GET /users/pending`** - Listar apenas usuários pendentes
```bash
curl http://localhost:3000/users/pending \
  -H "Authorization: Bearer $JWT"
```

**`POST /users`** - Admin cria usuário (criação direta)
```bash
curl -X POST http://localhost:3000/users \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Maria Santos",
    "whatsapp": "5599887766",
    "congregationId": "...",
    "role": "MANAGER",
    "active": true
  }'
```
- Valida todas as informações
- Cria usuário com `active: true` (acesso imediato)
- Admin pode atribuir role (USER, MANAGER, ADMIN)

**`PATCH /users/:id`** - Admin edita/aprova usuário
```bash
curl -X PATCH http://localhost:3000/users/$USER_ID \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "João Silva",
    "role": "MANAGER",
    "active": true
  }'
```
- Aprova usuários pendentes (set `active: true`)
- Muda role do usuário
- Muda congregação

**`DELETE /users/:id`** - Admin remove usuário
```bash
curl -X DELETE http://localhost:3000/users/$USER_ID \
  -H "Authorization: Bearer $JWT"
```

### Frontend

#### 1. Página de Registro Público (`/registro`)
- **`RegisterPage.jsx`** - Formulário de auto-cadastro
  - Campo: Nome (mín. 3 caracteres)
  - Campo: WhatsApp (hint: "Digite apenas números")
  - Campo: Congregação (dropdown com busca da API)
  - Validação com React Hook Form
  - Sucesso: Mostra mensagem "Cadastro enviado. Aguarde aprovação"
  - Link: "Já tem conta? Fazer login"

#### 2. Página de Gerenciamento de Usuários (`/app/usuarios`) - Admin Only
- **`UsersPage.jsx`** - Painel de administração
  - **Seção de Pendentes**: Badge mostra contagem de cadastros aguardando
  - **Tabela de Usuários**: Colunas: Nome, WhatsApp, Congregação, Função, Status
  - **Ações por usuário**:
    - ✏️ **Editar**: Abre modal para mudar nome, congregação, role
    - ✅/❌ **Ativar/Desativar**: Toggle de `active`
    - 🗑️ **Deletar**: Remove usuário com confirmação
  - **Novo Usuário**: Botão para criar usuário direto pelo admin
  - **Filtro Pendentes**: Toggle para ver apenas usuários aguardando aprovação
  - Real-time updates via TanStack Query (5s polling)

#### 3. Atualizações de Navegação
- **`App.jsx`**: 
  - Nova rota: `/registro` (pública)
  - Nova rota: `/app/usuarios` (ADMIN only)
  - Proteção com `AdminRoute` component

- **`AppLayout.jsx`**:
  - Novo link "Usuários" no menu do ADMIN

- **`LoginPage.jsx`**:
  - Link: "Não tem conta? Criar cadastro" → `/registro`

## 🔄 Fluxos de Uso

### Fluxo 1: Auto-Cadastro + Aprovação

1. **Novo usuário** acessa `/registro`
2. **Preenche formulário**:
   - Nome: João Silva
   - WhatsApp: 5588912345678
   - Congregação: Arca da Aliança
3. **Clica "Criar Conta"** → POST `/auth/register`
   - Usuário criado com `active: false`
   - Retorna: "Cadastro enviado! Aguarde aprovação"
4. **Usuário tenta fazer login**
   - POST `/auth/request-link`
   - Retorna 403: "Cadastro pendente de aprovação"
   - ❌ Não consegue acessar
5. **ADMIN acessa `/app/usuarios`**
   - Vê badge "1 Cadastro Pendente"
   - Clica em "Ver Pendentes"
   - Vê João Silva na lista
6. **ADMIN clica ✅ (Ativar)**
   - PATCH `/users/:id` com `active: true`
   - João Silva recebe notificação que foi aprovado (futura)
7. **João Silva faz login novamente**
   - POST `/auth/request-link` → Sucesso!
   - Recebe link de WhatsApp
   - Consegue acessar o sistema

### Fluxo 2: Criação Direta pelo ADMIN

1. **ADMIN acessa `/app/usuarios`**
2. **Clica "Novo Usuário"**
   - Abre modal
3. **Preenche formulário**:
   - Nome: Maria Santos
   - WhatsApp: 5599887766
   - Congregação: Sede
   - Função: Gerente
   - Checkbox: "Conta ativa" ✓
4. **Clica "Criar"** → POST `/users`
   - Usuário criado com `active: true`
   - Sucesso: "Usuário criado com sucesso!"
5. **Maria faz login imediatamente**
   - POST `/auth/request-link` → Sucesso!
   - Pode acessar o sistema

## 🧪 Testes Realizados

```bash
# 1. Auto-cadastro
curl -X POST http://localhost:3000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"João Silva","whatsapp":"5588912345678","congregationId":"..."}'
# Result: ✓ Usuário criado com active: false

# 2. Tentativa de login com usuário pendente
curl -X POST http://localhost:3000/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"whatsapp":"5588912345678"}'
# Result: ✓ Retorna 403 "Cadastro pendente de aprovação"

# 3. Admin lista pendentes
curl http://localhost:3000/users/pending \
  -H "Authorization: Bearer $JWT"
# Result: ✓ Retorna usuário pendente

# 4. Admin aprova usuário
curl -X PATCH http://localhost:3000/users/$USER_ID \
  -H "Authorization: Bearer $JWT" \
  -H "Content-Type: application/json" \
  -d '{"active":true}'
# Result: ✓ Usuário ativado

# 5. Login após aprovação
curl -X POST http://localhost:3000/auth/request-link \
  -H "Content-Type: application/json" \
  -d '{"whatsapp":"5588912345678"}'
# Result: ✓ Gera link de autenticação
```

## 📁 Arquivos Modificados

### Backend
- `prisma/schema.prisma` - Adicionado campo `active`
- `src/index.js` - Registrada rota `/users`
- `src/routes/auth.js` - Adicionadas rotas de registro e congregations públicas
- `src/routes/users.js` - Novas rotas de CRUD para usuários (ADMIN)

### Frontend
- `src/App.jsx` - Novas rotas e proteção AdminRoute
- `src/pages/RegisterPage.jsx` - Formulário de registro público
- `src/pages/UsersPage.jsx` - Painel de gerenciamento de usuários
- `src/pages/LoginPage.jsx` - Link para registro
- `src/components/AppLayout.jsx` - Link de usuários no menu

## 🔐 Segurança

- ✓ Routes de admin (`/users/*`) protegidas com `requireRole(['ADMIN'])`
- ✓ Endpoints de registro públicos (sem JWT)
- ✓ Validação com Zod em todas as rotas
- ✓ Verificação de `active: true` em endpoints de login
- ✓ Normalização de WhatsApp (remove caracteres especiais)
- ✓ Verificação de duplicados (WhatsApp único)

## 📱 UI/UX

- ✓ Formulário de registro responsivo com validação em tempo real
- ✓ Painel de usuários com tabela clara e ações intuitivas
- ✓ Badge de "Cadastros Pendentes" destacado em amarelo
- ✓ Status com cores (Verde=Ativo, Amarelo=Pendente)
- ✓ Modal para criar/editar usuários
- ✓ Confirmação antes de deletar
- ✓ Toast notifications (sucesso/erro)

## 🚀 Como Usar

### 1. Acessar página de registro
```
http://localhost:5173/registro
```

### 2. Fazer login
```
http://localhost:5173/
```

### 3. Como admin, gerenciar usuários
```
http://localhost:5173/app/usuarios
```

## 📝 Próximas Melhorias (Opcional)

- [ ] Enviar email quando usuário é aprovado
- [ ] Notificação via WhatsApp quando novo cadastro chega
- [ ] Search/filtro de usuários por nome
- [ ] Exportar lista de usuários para CSV
- [ ] Log de atividades (quem aprovou, quando, etc)
- [ ] Rate limiting no endpoint de registro
- [ ] CAPTCHA no formulário de registro

---

**Status**: ✅ Implementação completa e testada
**Data**: 31 de janeiro de 2026
**Responsável**: Sistema de Controle de Pedidos EBD
