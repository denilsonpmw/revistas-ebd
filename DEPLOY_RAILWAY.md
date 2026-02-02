# Guia de Deploy no Railway

## Pré-requisitos
- Conta no [Railway](https://railway.app)
- Git instalado
- Projeto versionado no GitHub/GitLab

## Passo a Passo

### 1. Criar Novo Projeto no Railway

1. Acesse [railway.app](https://railway.app) e faça login
2. Clique em **"New Project"**
3. Selecione **"Deploy from GitHub repo"**
4. Escolha o repositório `revistas-ebd`

### 2. Adicionar PostgreSQL

1. No seu projeto, clique em **"+ New"**
2. Selecione **"Database"**
3. Escolha **"PostgreSQL"**
4. O Railway criará automaticamente um banco PostgreSQL

### 3. Configurar Variáveis de Ambiente

No painel do seu serviço principal, vá em **"Variables"** e adicione:

#### Variáveis Obrigatórias:

```bash
# Database (gerada automaticamente pelo Railway quando você conectar o PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT Secret (gere uma string aleatória segura)
JWT_SECRET=sua-chave-secreta-muito-segura-aqui

# URLs do Frontend (depois do deploy, atualize com a URL real)
FRONTEND_URL=https://seu-app.up.railway.app

# Tempo de expiração do token em minutos
TOKEN_EXP_MINUTES=15
```

#### Variáveis para Usuário Admin (Opcional):

```bash
# WhatsApp do admin (padrão: 5500000000000)
ADMIN_WHATSAPP=5511999999999

# Senha do admin (padrão: admin123)
ADMIN_PASSWORD=senha-segura-aqui
```

### 4. Conectar PostgreSQL ao Serviço

1. Clique no seu serviço principal
2. Vá em **"Settings"** > **"Service"**
3. Em **"Variables"**, clique em **"+ New Variable"** > **"Reference"**
4. Selecione `DATABASE_URL` do serviço PostgreSQL

### 5. Configurar Build e Deploy

O Railway usará automaticamente o arquivo `railway.toml` na raiz do projeto.

O arquivo já está configurado para:
- ✅ Instalar dependências do frontend e backend
- ✅ Fazer build do frontend
- ✅ Gerar o Prisma Client
- ✅ Rodar migrations
- ✅ Criar usuário administrador inicial
- ✅ Iniciar o servidor

### 6. Deploy

1. O Railway iniciará o deploy automaticamente
2. Acompanhe os logs em **"Deployments"**
3. Aguarde a conclusão (pode levar 2-5 minutos)

### 7. Obter URL do Projeto

1. Após o deploy, clique em **"Settings"**
2. Role até **"Domains"**
3. Clique em **"Generate Domain"**
4. Copie a URL gerada (ex: `https://revistas-ebd-production.up.railway.app`)

### 8. Atualizar FRONTEND_URL

1. Volte nas **"Variables"**
2. Atualize `FRONTEND_URL` com a URL gerada
3. O Railway fará redeploy automaticamente

### 9. Primeiro Acesso

Acesse a URL do seu projeto e faça login com:

**WhatsApp**: O número configurado em `ADMIN_WHATSAPP` (padrão: `5500000000000`)
**Senha**: A senha configurada em `ADMIN_PASSWORD` (padrão: `admin123`)

1. **Use JWT_SECRET único** para cada ambiente
2. **Altere a senha do admin** após primeiro login
3. **Atualize FRONTEND_URL** após obter a URL do Railway

## Comandos Úteis

### Ver logs em tempo real
```bash
railway logs
```

### Rodar migrations manualmente
```bash
railway run npx prisma migrate deploy
```

### Acessar o banco de dados
```bash
railway connect
```

## Estrutura do Projeto

O Railway detectará automaticamente:
- `railway.toml` - Configuração de build e deploy
- `backend/package.json` - Dependências do backend
- `frontend/package.json` - Dependências do frontend
- `backend/prisma/schema.prisma` - Schema do banco

## Troubleshooting

### Deploy falhou nas migrations
- Verifique se `DATABASE_URL` está configurado corretamente
- Veja os logs em "Deployments" > "View Logs"

### Erro ao criar admin
- Verifique se as variáveis `ADMIN_WHATSAPP` e `ADMIN_PASSWORD` estão corretas
- O script `init-admin.js` será executado após as migrations

### Frontend não carrega
- Verifique se `FRONTEND_URL` está correto
- Verifique se o CORS está configurado corretamente no backend

### Não consigo fazer login
- Verifique se o número WhatsApp está no formato correto (com DDI)
- Verifique os logs do backend para erros de autenticação

## Monitoramento

O Railway oferece:
- 📊 Métricas de uso (CPU, RAM, Network)
- 📝 Logs em tempo real
- 🔔 Alertas de deploy
- 💰 Uso de créditos

## Custos

O Railway oferece:
- **$5 de crédito grátis/mês** para novos usuários
- Plano Hobby: **$5/mês** (500 horas de execução)
- Plano Pro: **$20/mês** (uso ilimitado)

## Segurança

✅ Checklist de segurança:
- [ ] Alterar senha do admin após primeiro login
- [ ] Usar JWT_SECRET forte e único
- [ ] Configurar CORS apenas para domínios confiáveis
- [ ] Habilitar HTTPS (Railway faz isso automaticamente)
- [ ] Revisar permissões de usuários regularmente

## Atualizações

Para atualizar o projeto:
1. Faça push das alterações para o GitHub
2. O Railway fará deploy automaticamente
3. As migrations serão executadas antes do deploy

## Suporte

- 📚 [Documentação Railway](https://docs.railway.app)
- 💬 [Discord Railway](https://discord.gg/railway)
- 🐛 [GitHub Issues](https://github.com/railwayapp/railway/issues)
