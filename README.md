# Revistas EBD - Micro-SaaS

Monorepo com backend (Express + Prisma) e frontend (React + Vite).

## Estrutura
- backend: API, autenticação via wa.link, relatórios
- frontend: PWA para pedidos e painel admin

## Setup rápido
1. Copie `backend/.env.example` para `backend/.env` e ajuste valores.
2. Copie `frontend/.env.example` para `frontend/.env`.
3. Instale dependências em `backend` e `frontend`.
4. Rode migrations e seed no backend.
5. Inicie API e frontend.

## Usuário admin inicial
- WhatsApp: 5500000000000
- Congregação: SEDE
- Perfil: ADMIN

## Fluxo de autenticação
1. Digite o WhatsApp no login.
2. O sistema gera um link wa.link com token.
3. Abra o WhatsApp e envie o token.
4. Clique no link de verificação no site para concluir o login.
