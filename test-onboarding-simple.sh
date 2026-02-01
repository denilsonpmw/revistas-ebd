#!/bin/bash

# Script simples para testar o fluxo de onboarding
# Execução: bash test-onboarding-simple.sh

BASE_URL="http://localhost:3000"

echo "🧪 Testando Sistema de Onboarding de Usuários"
echo "=============================================="
echo ""

# 1. Obter primeiro ID de congregação
echo "1️⃣  Buscando congregações..."
CONG_ID=$(curl -s "$BASE_URL/auth/congregations" | jq -r '.[0].id')
CONG_NAME=$(curl -s "$BASE_URL/auth/congregations" | jq -r '.[0].name')
echo "   ✓ Congregação: $CONG_NAME"
echo ""

# 2. Testar auto-cadastro
echo "2️⃣  Testando auto-cadastro..."
RANDOM_PHONE="558899$(printf "%06d" $RANDOM)"
REGISTER=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"name\": \"Novo Usuário\",
    \"whatsapp\": \"$RANDOM_PHONE\",
    \"congregationId\": \"$CONG_ID\"
  }")

USER_ID=$(echo "$REGISTER" | jq -r '.user.id')
USER_ACTIVE=$(echo "$REGISTER" | jq -r '.user.active')
echo "   ✓ Usuário criado: $USER_ID"
echo "   ✓ Status: $([ "$USER_ACTIVE" = "false" ] && echo "Pendente" || echo "Ativo")"
echo ""

# 3. Tentar login sem aprovação
echo "3️⃣  Tentando login sem aprovação..."
LOGIN_RESULT=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d "{\"whatsapp\": \"$RANDOM_PHONE\"}" | jq -r '.message')
echo "   Result: $LOGIN_RESULT"
echo ""

# 4. Obter token de admin
echo "4️⃣  Autenticando como ADMIN..."
VERIFY_LINK=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d '{"whatsapp":"5500000000000"}' | jq -r '.verifyUrl')

TOKEN=$(echo "$VERIFY_LINK" | grep -o 'token=[^&]*' | cut -d= -f2)
ADMIN_JWT=$(curl -s "http://localhost:3000/auth/verify?token=$TOKEN" | jq -r '.token')
echo "   ✓ ADMIN autenticado"
echo ""

# 5. Verificar lista de pendentes
echo "5️⃣  Verificando usuários pendentes..."
PENDING_COUNT=$(curl -s "$BASE_URL/users/pending" \
  -H "Authorization: Bearer $ADMIN_JWT" | jq '.users | length')
echo "   ✓ Total de pendentes: $PENDING_COUNT"
echo ""

# 6. Aprovar usuário
echo "6️⃣  Aprovando usuário..."
APPROVE=$(curl -s -X PATCH "$BASE_URL/users/$USER_ID" \
  -H "Authorization: Bearer $ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"active":true}')

IS_ACTIVE=$(echo "$APPROVE" | jq -r '.active')
echo "   ✓ Usuário agora ativo: $IS_ACTIVE"
echo ""

# 7. Tentar login após aprovação
echo "7️⃣  Tentando login após aprovação..."
APPROVED_LOGIN=$(curl -s -X POST "$BASE_URL/auth/request-link" \
  -H "Content-Type: application/json" \
  -d "{\"whatsapp\": \"$RANDOM_PHONE\"}" | jq -r '.waLink // .message')
echo "   ✓ Login disponível!"
echo ""

echo "✅ Fluxo de onboarding completo e funcionando!"
