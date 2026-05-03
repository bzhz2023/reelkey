#!/usr/bin/env bash
# 配置 Cloudflare Email Routing 转发规则
# 前置：域名已切换到 Cloudflare，且已在 Dashboard 手动启用 Email Routing
# 用法：DOMAIN=reelkey.app FORWARD_FROM=support@reelkey.app FORWARD_TO=xxx@gmail.com CF_API_TOKEN=xxx bash scripts/setup-email-routing.sh

set -e

: "${DOMAIN:?请设置 DOMAIN，如 DOMAIN=reelkey.app}"
: "${FORWARD_FROM:?请设置 FORWARD_FROM，如 FORWARD_FROM=support@reelkey.app}"
: "${FORWARD_TO:?请设置 FORWARD_TO，如 FORWARD_TO=you@gmail.com}"
: "${CF_API_TOKEN:?请设置 CF_API_TOKEN}"

echo "📧 配置 Email Routing：$FORWARD_FROM → $FORWARD_TO"
echo ""

# 查询 Zone ID
echo "🔍 查询 Zone ID..."
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" \
  -H "Authorization: Bearer $CF_API_TOKEN" | jq -r '.result[0].id')

if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
  echo "❌ 找不到域名 $DOMAIN 的 Zone，请先运行 setup-domain.sh"
  exit 1
fi

echo "   Zone ID: $ZONE_ID"
echo ""

# 添加转发规则
echo "📮 添加转发规则..."
RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/email/routing/rules" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"name\": \"Forward $FORWARD_FROM\",
    \"enabled\": true,
    \"matchers\": [{\"type\": \"literal\", \"field\": \"to\", \"value\": \"$FORWARD_FROM\"}],
    \"actions\": [{\"type\": \"forward\", \"value\": [\"$FORWARD_TO\"]}],
    \"priority\": 1
  }")

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')

if [ "$SUCCESS" = "true" ]; then
  RULE_ID=$(echo "$RESPONSE" | jq -r '.result.id')
  echo "✅ 转发规则已添加"
  echo "   $FORWARD_FROM → $FORWARD_TO"
  echo "   Rule ID: $RULE_ID"
  echo ""
  echo "🧪 测试：发一封邮件到 $FORWARD_FROM，确认 $FORWARD_TO 能收到"
else
  ERROR=$(echo "$RESPONSE" | jq -r '.errors[0].message')
  echo "❌ 失败：$ERROR"
  echo ""
  echo "常见原因："
  echo "  - Email Routing 未启用：去 Cloudflare Dashboard → 电子邮件 → 电子邮件路由 → 启用"
  echo "  - 目标地址未验证：目标地址需在 Cloudflare Dashboard 验证"
  exit 1
fi
