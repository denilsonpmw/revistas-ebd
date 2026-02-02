# Variáveis de Ambiente - Railway

## Configuração no Railway

Acesse: Settings > Variables e adicione as seguintes variáveis:

### ✅ Obrigatórias

```bash
# Database - Conecte ao serviço PostgreSQL do Railway
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret - Gere uma string aleatória forte
# Exemplo: openssl rand -base64 32
JWT_SECRET=sua-chave-jwt-secreta-e-forte-aqui

# URL do Frontend - Será a URL gerada pelo Railway
# Atualize após o primeiro deploy
FRONTEND_URL=https://seu-projeto.up.railway.app

# Tempo de expiração do token (em minutos)
TOKEN_EXP_MINUTES=15
```

### 🔧 Opcionais (Usuário Admin)

Se não configuradas, os valores padrão serão usados:

```bash
# WhatsApp do administrador provisório
# Padrão: 5500000000000
ADMIN_WHATSAPP=5511999999999

# Senha do administrador provisório
# Padrão: admin123
ADMIN_PASSWORD=minhasenhasegura123
```

## Como Gerar JWT_SECRET Seguro

### No terminal (Mac/Linux):
```bash
openssl rand -base64 32
```

### No Node.js:
```javascript
require('crypto').randomBytes(32).toString('base64')
```

### Online (use com cuidado):
https://randomkeygen.com/ (escolha "256-bit WEP Keys")

## Exemplo Completo

```bash
DATABASE_URL=postgresql://postgres:senha@postgres.railway.internal:5432/railway
JWT_SECRET=xK8mQ7vR2wN5pL9tH3jF6aS1dG4kM8zC
FRONTEND_URL=https://revistas-ebd.up.railway.app
TOKEN_EXP_MINUTES=15
ADMIN_WHATSAPP=5511987654321
ADMIN_PASSWORD=SuperSenhaSegura2025!
```

## ⚠️ Importante

1. **Nunca commite** essas variáveis no Git
2. **Altere a senha do admin** após primeiro login
3. **Use JWT_SECRET único** para cada ambiente
4. **Atualize FRONTEND_URL** após obter a URL do Railway
5. **Configure o número WhatsApp** corretamente com DDI

## Checklist de Configuração

- [ ] PostgreSQL criado no Railway
- [ ] DATABASE_URL conectado ao serviço
- [ ] JWT_SECRET gerado (mínimo 32 caracteres)
- [ ] FRONTEND_URL definido (pode atualizar depois)
- [ ] ADMIN_WHATSAPP configurado (opcional)
- [ ] ADMIN_PASSWORD definido (opcional)
- [ ] TOKEN_EXP_MINUTES ajustado conforme necessidade
