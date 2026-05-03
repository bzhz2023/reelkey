#!/usr/bin/env bash
# 配置 Resend 发件域名：添加域名 → 写 DNS 记录到 Cloudflare → 触发验证 → 写 .env.local
# 前置：域名已切换到 Cloudflare（DNS active 状态）
#
# 用法：
#   DOMAIN=reelkey.app \
#   RESEND_API_KEY=re_xxx \
#   RESEND_FROM_NAME="ReelKey" \
#   RESEND_FROM_ADDRESS=noreply@reelkey.app \   # 发件用 noreply，收件才用 support
#   CF_API_TOKEN=cfut_xxx \
#   bash scripts/setup-resend.sh

set -e

: "${DOMAIN:?请设置 DOMAIN，如 DOMAIN=reelkey.app}"
: "${RESEND_API_KEY:?请设置 RESEND_API_KEY}"
: "${RESEND_FROM_NAME:?请设置 RESEND_FROM_NAME，如 RESEND_FROM_NAME=ReelKey}"
: "${RESEND_FROM_ADDRESS:?请设置 RESEND_FROM_ADDRESS，如 RESEND_FROM_ADDRESS=support@reelkey.app}"
: "${CF_API_TOKEN:?请设置 CF_API_TOKEN}"

echo "📧 配置 Resend 发件域名：$DOMAIN"
echo ""

# 1. 查询 Cloudflare Zone ID
echo "🔍 查询 Cloudflare Zone ID..."
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq -r '.result[0].id')

if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
  echo "❌ 找不到域名 $DOMAIN 的 Zone，请先运行 setup-domain.sh"
  exit 1
fi
echo "   Zone ID: $ZONE_ID"

# 2. 添加域名到 Resend（如已存在则跳过）
echo ""
echo "📮 添加域名到 Resend..."
RESEND_RESPONSE=$(curl -s -X POST "https://api.resend.com/domains" \
  -H "Authorization: Bearer $RESEND_API_KEY" \
  -H "Content-Type: application/json" \
  -d "{\"name\": \"$DOMAIN\", \"region\": \"us-east-1\"}")

DOMAIN_ID=$(echo "$RESEND_RESPONSE" | jq -r '.id // empty')

if [ -z "$DOMAIN_ID" ]; then
  # 可能已存在，查询现有域名
  DOMAIN_ID=$(curl -s "https://api.resend.com/domains" \
    -H "Authorization: Bearer $RESEND_API_KEY" | \
    jq -r --arg name "$DOMAIN" '.data[] | select(.name == $name) | .id')
  if [ -z "$DOMAIN_ID" ]; then
    echo "❌ 添加域名失败：$(echo "$RESEND_RESPONSE" | jq -r '.message')"
    exit 1
  fi
  echo "   域名已存在，Domain ID: $DOMAIN_ID"
else
  echo "   Domain ID: $DOMAIN_ID"
fi

# 3. 获取所需 DNS 记录
echo ""
echo "🔍 获取 DNS 记录..."
DNS_RECORDS=$(curl -s "https://api.resend.com/domains/$DOMAIN_ID" \
  -H "Authorization: Bearer $RESEND_API_KEY" | jq '.records')

echo "$DNS_RECORDS" | jq -r '.[] | "   \(.type) \(.name) → \(.value)"'

# 4. 写入 DNS 记录到 Cloudflare（新端点：/dns_records）
echo ""
echo "☁️  写入 DNS 记录到 Cloudflare..."

echo "$DNS_RECORDS" | jq -c '.[]' | while read -r record; do
  TYPE=$(echo "$record" | jq -r '.type')
  NAME=$(echo "$record" | jq -r '.name')
  VALUE=$(echo "$record" | jq -r '.value')
  PRIORITY=$(echo "$record" | jq -r '.priority // empty')

  if [ "$TYPE" = "MX" ]; then
    BODY="{\"type\":\"$TYPE\",\"name\":\"$NAME\",\"content\":\"$VALUE\",\"priority\":$PRIORITY,\"ttl\":1}"
  else
    BODY="{\"type\":\"$TYPE\",\"name\":\"$NAME\",\"content\":\"$VALUE\",\"ttl\":1}"
  fi

  RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    -d "$BODY")

  SUCCESS=$(echo "$RESULT" | jq -r '.success')
  if [ "$SUCCESS" = "true" ]; then
    echo "   ✅ $TYPE $NAME"
  else
    ERR=$(echo "$RESULT" | jq -r '.errors[0].message')
    if echo "$ERR" | grep -qi "already exists\|duplicate"; then
      echo "   ⚠️  $TYPE $NAME（已存在，跳过）"
    else
      echo "   ❌ $TYPE $NAME 失败：$ERR"
    fi
  fi
done

# 5. 触发验证
echo ""
echo "🔄 触发域名验证..."
curl -s -X POST "https://api.resend.com/domains/$DOMAIN_ID/verify" \
  -H "Authorization: Bearer $RESEND_API_KEY" > /dev/null
echo "   验证已触发，DNS 传播通常需要 5-10 分钟"

# 6. 写入 .env.local
echo ""
echo "📝 写入 .env.local..."
if [ -f ".env.local" ]; then
  if grep -q "RESEND_API_KEY" .env.local; then
    echo "   ⚠️  RESEND_API_KEY 已存在，跳过写入"
  else
    cat >> .env.local << EOF

# Resend（发件）
RESEND_API_KEY='${RESEND_API_KEY}'
RESEND_FROM='${RESEND_FROM_NAME} <${RESEND_FROM_ADDRESS}>'
EOF
    echo "   ✅ 已写入 RESEND_API_KEY 和 RESEND_FROM"
  fi
else
  echo "   ⚠️  .env.local 不存在，请手动写入："
  echo "   RESEND_API_KEY='${RESEND_API_KEY}'"
  echo "   RESEND_FROM='${RESEND_FROM_NAME} <${RESEND_FROM_ADDRESS}>'"
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Resend 配置完成"
echo "   域名：$DOMAIN（验证中，5-10 分钟后生效）"
echo "   发件人：$RESEND_FROM_NAME <$RESEND_FROM_ADDRESS>"
echo ""
echo "验证状态查询："
echo "  curl -s https://api.resend.com/domains/$DOMAIN_ID \\"
echo "    -H \"Authorization: Bearer \$RESEND_API_KEY\" | jq '{status, records: [.records[] | {record, status}]}'"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
