#!/bin/bash

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:3000"
ADMIN_WHATSAPP="5500000000000"
ADMIN_TOKEN=""

echo -e "${YELLOW}=== Sistema de Cadastro de Usuários ===${NC}\n"

# 1. Login do ADMIN para obter token
echo -e "${YELLOW}1. Gerando token para ADMIN...${NC}"
ADMIN_LINK=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d "{\"whatsapp\": \"$ADMIN_WHATSAPP\"}" | jq -r '.verifyUrl')

if [ "$ADMIN_LINK" != "null" ] && [ ! -z "$ADMIN_LINK" ]; then
  # Extrair token da URL
  ADMIN_TOKEN=$(echo "$ADMIN_LINK" | grep -o 'token=[^&]*' | cut -d= -f2)
  
  # Verificar token
  VERIFY_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/verify?token=$ADMIN_TOKEN")
  ADMIN_JWT=$(echo "$VERIFY_RESPONSE" | jq -r '.token')
  
  if [ "$ADMIN_JWT" != "null" ] && [ ! -z "$ADMIN_JWT" ]; then
    echo -e "${GREEN}✓ ADMIN autenticado${NC}\n"
  else
    echo -e "${RED}✗ Erro ao verificar token do ADMIN${NC}\n"
    exit 1
  fi
else
  echo -e "${RED}✗ Erro ao gerar link do ADMIN${NC}\n"
  exit 1
fi

# 2. Teste de auto-cadastro
echo -e "${YELLOW}2. Testando auto-cadastro de novo usuário...${NC}"
NEW_WHATSAPP="5588988776655"
CONGREGATION_ID=$(curl -s "$BASE_URL/auth/congregations" | jq -r '.[0].id')

REGISTER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"João Silva\",
    \"whatsapp\": \"$NEW_WHATSAPP\",
    \"congregationId\": \"$CONGREGATION_ID\"
  }")

NEW_USER_ID=$(echo "$REGISTER_RESPONSE" | jq -r '.user.id')
NEW_USER_ACTIVE=$(echo "$REGISTER_RESPONSE" | jq -r '.user.active')

if [ "$NEW_USER_ACTIVE" = "false" ]; then
  echo -e "${GREEN}✓ Usuário criado com active=false (pendente)${NC}\n"
else
  echo -e "${RED}✗ Erro: Usuário deveria ter active=false${NC}\n"
  exit 1
fi

# 3. Tentar login com usuário pendente (deve falhar)
echo -e "${YELLOW}3. Tentando login com usuário pendente (deve falhar)...${NC}"
PENDING_LOGIN=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d "{\"whatsapp\": \"$NEW_WHATSAPP\"}")

PENDING_ERROR=$(echo "$PENDING_LOGIN" | jq -r '.message')
if [[ "$PENDING_ERROR" == *"pendente"* ]]; then
  echo -e "${GREEN}✓ Login rejeitado para usuário pendente${NC}\n"
else
  echo -e "${RED}✗ Erro: Usuário pendente não deveria conseguir login${NC}\n"
  exit 1
fi

# 4. Admin busca usuários pendentes
echo -e "${YELLOW}4. Verificando lista de usuários pendentes...${NC}"
PENDING_USERS=$(curl -s -X GET "$BASE_URL/users/pending" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.[] | select(.whatsapp=="'$NEW_WHATSAPP'")')

if [ ! -z "$PENDING_USERS" ]; then
  echo -e "${GREEN}✓ Usuário encontrado na lista de pendentes${NC}\n"
else
  echo -e "${RED}✗ Usuário não encontrado na lista de pendentes${NC}\n"
  exit 1
fi

# 5. Admin aprova usuário
echo -e "${YELLOW}5. Admin aprovando usuário...${NC}"
APPROVE_RESPONSE=$(curl -s -X PATCH "$BASE_URL/users/$NEW_USER_ID" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{\"active\": true}")

APPROVED_ACTIVE=$(echo "$APPROVE_RESPONSE" | jq -r '.active')
if [ "$APPROVED_ACTIVE" = "true" ]; then
  echo -e "${GREEN}✓ Usuário aprovado com sucesso${NC}\n"
else
  echo -e "${RED}✗ Erro ao aprovar usuário${NC}\n"
  exit 1
fi

# 6. Tentar login novamente (agora deve funcionar)
echo -e "${YELLOW}6. Tentando login com usuário aprovado...${NC}"
APPROVED_LINK=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d "{\"whatsapp\": \"$NEW_WHATSAPP\"}" | jq -r '.verifyUrl')

if [ "$APPROVED_LINK" != "null" ] && [ ! -z "$APPROVED_LINK" ]; then
  echo -e "${GREEN}✓ Login funcionando para usuário aprovado${NC}\n"
else
  echo -e "${RED}✗ Erro ao fazer login com usuário aprovado${NC}\n"
  exit 1
fi

# 7. Teste de criação direta pelo admin
echo -e "${YELLOW}7. Admin criando novo usuário diretamente...${NC}"
DIRECT_CREATE=$(curl -s -X POST "$BASE_URL/users" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Maria Santos\",
    \"whatsapp\": \"5599887766\",
    \"congregationId\": \"$CONGREGATION_ID\",
    \"role\": \"MANAGER\",
    \"active\": true
  }")

DIRECT_ACTIVE=$(echo "$DIRECT_CREATE" | jq -r '.active')
if [ "$DIRECT_ACTIVE" = "true" ]; then
  echo -e "${GREEN}✓ Usuário criado diretamente pelo admin com active=true${NC}\n"
else
  echo -e "${RED}✗ Erro ao criar usuário direto${NC}\n"
  exit 1
fi

echo -e "${GREEN}=== TODOS OS TESTES PASSARAM ✓ ===${NC}"
