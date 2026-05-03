#!/usr/bin/env bash
# 添加域名到 Cloudflare，输出需要填入 Namecheap 的 nameservers
# 用法：DOMAIN=reelkey.app CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx bash scripts/setup-domain.sh

set -e

: "${DOMAIN:?请设置 DOMAIN，如 DOMAIN=reelkey.app}"
: "${CF_API_TOKEN:?请设置 CF_API_TOKEN}"
: "${CF_ACCOUNT_ID:?请设置 CF_ACCOUNT_ID}"

echo "🌐 添加域名 $DOMAIN 到 Cloudflare..."

RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"name\": \"$DOMAIN\",
    \"account\": {\"id\": \"$CF_ACCOUNT_ID\"},
    \"jump_start\": true
  }")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" != "true" ]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message')
  # 如果已存在，查询现有 zone
  if echo "$ERROR" | grep -qi "already exists\|duplicate"; then
    echo "⚠️  域名已存在于 Cloudflare，查询现有 zone..."
    RESPONSE=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
      -H "Authorization: Bearer $CF_API_TOKEN")
  else
    echo "❌ 失败：$ERROR"
    exit 1
  fi
fi

ZONE_ID=$(echo "$RESPONSE" | jq -r '.result.id // .result[0].id')
STATUS=$(echo "$RESPONSE" | jq -r '.result.status // .result[0].status')
NS1=$(echo "$RESPONSE" | jq -r '.result.name_servers[0] // .result[0].name_servers[0]')
NS2=$(echo "$RESPONSE" | jq -r '.result.name_servers[1] // .result[0].name_servers[1]')

echo ""
echo "✅ Zone 已添加"
echo "   Zone ID : $ZONE_ID"
echo "   状态    : $STATUS"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔴 下一步：去 Namecheap 手动修改 Nameservers"
echo ""
echo "   1. 登录 namecheap.com → Domain List → $DOMAIN → Manage"
echo "   2. Nameservers → 改为 Custom DNS"
echo "   3. 填入："
echo "      $NS1"
echo "      $NS2"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "等 DNS 生效后（通常 5-30 分钟），验证命令："
echo "  curl -s \"https://api.cloudflare.com/client/v4/zones?name=$DOMAIN\" \\"
echo "    -H \"Authorization: Bearer \$CF_API_TOKEN\" | jq '.result[0].status'"
echo ""
echo "ZONE_ID=$ZONE_ID  # 后续脚本会用到，请记录"
