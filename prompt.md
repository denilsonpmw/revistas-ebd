Crie um micro-SaaS full-stack completo: Sistema de Controle de Pedidos de Revistas para Escolas Bíblicas em Congregações de Igrejas.
: admin inicial só igreja principal, usuários muitos-por-congregação (1 congregação/usuário, admins migram), auth passwordless via wa.link WhatsApp GRÁTIS (não Twilio), gerentes submetem pedidos revistas via site, admin gera relatórios. Deploy: Railway com Postgres.

## Resumo Histórico Integrado (NÃO PERDIDO)
- Admin profile exclusivo para igreja principal (Sede) inicialmente.
- Estrutura territorial: 1 Sede + 30 congregações, divididas em 3 áreas (Área 1, Área 2, Área 3).
- User rules: Congregation 1:N Users; User 1:1 Congregation (admin moves users).
- Auth evolution: Magic link WhatsApp → ajustado para wa.link zero custo (link abre WA com token pré-preenchido).
- Core: Congregation managers submit magazine orders (Bible school: adultos/juvenis/crianças); maker collects → reports.
- Prompts anteriores: Data model + Copilot help; prefer detailed project desc.
- Deploy: Railway (não Vercel/Netlify).
- Sem custos: wa.link para auth.

## Stack & Configs
- Backend: Node.js 20 LTS, Express.js, Prisma (Postgres), jsonwebtoken, cors, helmet, morgan.
- Frontend: React 18 + Vite + React Router + Tailwind CSS + React Hook Form + TanStack Query + react-hot-toast + PWA (Vite PWA plugin).
- DB: PostgreSQL via Railway (DATABASE_URL env).
- Auth Libs: jsonwebtoken (tokens), uuid/cuid.
- Relatórios: PapaParse (CSV export), html2canvas/jspdf (PDF opcional).
- Deploy Railway: railway.toml com [build] e envs; auto prisma migrate deploy.

## Schema Prisma Completo (Expanso)
```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id              String        @id @default(cuid())
  name            String
  whatsapp        String        @unique
  email           String?       @unique
  congregationId  String
  congregation    Congregation  @relation(fields: [congregationId], references: [id], onDelete: Cascade)
  role            Role          @default(USER)
  lastLogin       DateTime?
  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt
  ordersSubmitted Order[]
  authTokens      AuthToken[]
}

model Congregation {
  id          String       @id @default(cuid())
  name        String
  code        String       @unique // Ex: "IBJ-PB01"
  isHeadquarters Boolean   @default(false) // true para Sede
  areaId      String?
  area        Area?        @relation(fields: [areaId], references: [id])
  address     String?
  city        String?      // João Pessoa, PB
  contactName String?
  users       User[]
  orders      Order[]
  createdAt   DateTime     @default(now())
  updatedAt   DateTime     @updatedAt
}

model Area {
  id            String         @id @default(cuid())
  name          String         // "Área 1", "Área 2", "Área 3"
  congregations Congregation[]
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
}

enum Role {
  USER      // Membro básico
  MANAGER   // Gerente escola bíblica
  ADMIN     // Admin igreja principal
}

model Order {
  id             String      @id @default(cuid())
  congregationId String
  congregation   Congregation @relation(fields: [congregationId], references: [id])
  submittedById  String
  submittedBy    User        @relation(fields: [submittedById], references: [id])
  magazineType   MagazineType
  quantity       Int         // Pacotes ou unidades
  unitPrice      Decimal?    // R$ por pacote (opcional)
  totalValue     Decimal?    // Calculado
  period         String      // "1T2026" (trimestre)
  deliveryDate   DateTime?   // Previsão
  observations   String?
  status         OrderStatus @default(PENDING)
  approvedById   String?
  approvedBy     User?       @relation(fields: [approvedById], references: [id])
  approvedAt     DateTime?
  deliveredAt    DateTime?
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
}

enum MagazineType {
  ADULTOS
  JOVENS
  JUVENIS
  CRIANCAS
  INFANTIS
}

enum OrderStatus {
  PENDING
  APPROVED
  DELIVERED
  CANCELED
}

model AuthToken {
  id        String   @id @default(cuid())
  whatsapp  String
  token     String   @unique @index
  expiresAt DateTime
  ip        String?  // Log segurança
  used      Boolean  @default(false)
  userId    String?  @unique
  user      User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  createdAt DateTime @default(now())
}
