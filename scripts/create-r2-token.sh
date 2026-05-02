#!/usr/bin/env bash
# ============================================================
# create_r2_token.sh
# 通过 Cloudflare API 创建 R2 User Token（Admin Read & Write）
# 并自动计算 S3 兼容的 Access Key ID 和 Secret Access Key
# ============================================================

set -euo pipefail

# ── 1. 配置区（必填） ────────────────────────────────────────
# 从环境变量读取，或在此处填写
CF_API_TOKEN="${CF_API_TOKEN:-}"
CF_ACCOUNT_ID="${CF_ACCOUNT_ID:-}"
TOKEN_NAME="R2 Admin Token $(date +%Y%m%d-%H%M%S)"
# ────────────────────────────────────────────────────────────

# ── 颜色输出 ─────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; CYAN='\033[0;36m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[OK]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; exit 1; }

# ── 2. 前置检查 ───────────────────────────────────────────────
[[ -z "$CF_API_TOKEN"  ]] && error "请先填写 CF_API_TOKEN"
[[ -z "$CF_ACCOUNT_ID" ]] && error "请先填写 CF_ACCOUNT_ID"
command -v curl   >/dev/null 2>&1 || error "需要安装 curl"
command -v jq     >/dev/null 2>&1 || error "需要安装 jq"
command -v openssl >/dev/null 2>&1 || error "需要安装 openssl（用于计算 Secret Access Key）"

# ── 3. 获取 R2 Admin Write 权限组 ID ─────────────────────────
info "正在获取权限组列表..."

PERM_RESPONSE=$(curl -s -X GET "https://api.cloudflare.com/client/v4/user/tokens/permission_groups" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json")

# 检查 API 调用是否成功
if ! echo "$PERM_RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
  error "API 调用失败，请检查 CF_API_TOKEN 是否有效"
fi

# 提取 Workers R2 Storage Write 的 ID
R2_WRITE_ID=$(echo "$PERM_RESPONSE" | jq -r '.result[] | select(.name == "Workers R2 Storage Write") | .id')

if [[ -z "$R2_WRITE_ID" ]]; then
  warn "未找到 'Workers R2 Storage Write'，尝试模糊匹配..."
  R2_WRITE_ID=$(echo "$PERM_RESPONSE" | jq -r '.result[] | select(.name | test("R2.*Write"; "i")) | .id' | head -1)
fi

[[ -z "$R2_WRITE_ID" ]] && error "无法找到 R2 Write 权限组 ID，请手动检查权限列表"
success "R2 Write 权限组 ID: $R2_WRITE_ID"

# ── 4. 创建 User Token ────────────────────────────────────────
info "正在创建 R2 User Token: $TOKEN_NAME"

CREATE_RESPONSE=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
  -H "Authorization: Bearer $CF_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{
    \"name\": \"$TOKEN_NAME\",
    \"policies\": [
      {
        \"effect\": \"allow\",
        \"resources\": {
          \"com.cloudflare.api.account.$CF_ACCOUNT_ID\": \"*\"
        },
        \"permission_groups\": [
          {
            \"id\": \"$R2_WRITE_ID\",
            \"name\": \"Workers R2 Storage Write\"
          }
        ]
      }
    ]
  }")

# ── 5. 解析结果 ───────────────────────────────────────────────
SUCCESS=$(echo "$CREATE_RESPONSE" | jq -r '.success')
if [[ "$SUCCESS" != "true" ]]; then
  echo "$CREATE_RESPONSE" | jq '.errors'
  error "Token 创建失败，请查看上方错误信息"
fi

TOKEN_ID=$(echo "$CREATE_RESPONSE"    | jq -r '.result.id')
TOKEN_VALUE=$(echo "$CREATE_RESPONSE" | jq -r '.result.value')

# ── 6. 计算 Secret Access Key（SHA-256 of token value） ───────
SECRET_ACCESS_KEY=$(printf '%s' "$TOKEN_VALUE" | openssl dgst -sha256 | awk '{print $2}')

# ── 7. 输出结果 ───────────────────────────────────────────────
echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}  R2 Token 创建成功！${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "  Token 名称       : ${YELLOW}$TOKEN_NAME${NC}"
echo -e "  Token ID         : ${YELLOW}$TOKEN_ID${NC}"
echo ""
echo -e "  ── S3 兼容凭证 ──────────────────────────"
echo -e "  Access Key ID    : ${CYAN}$TOKEN_ID${NC}"
echo -e "  Secret Access Key: ${CYAN}$SECRET_ACCESS_KEY${NC}"
echo -e "  Endpoint         : ${CYAN}https://$CF_ACCOUNT_ID.r2.cloudflarestorage.com${NC}"
echo -e "  Region           : ${CYAN}auto${NC}"
echo ""
echo -e "${RED}  ⚠️  Secret Access Key 只能计算一次，请立即保存！${NC}"
echo -e "${RED}     Token Value 原文同样请妥善保管（如需再次计算 Secret Key）${NC}"
echo ""

# 可选：写入本地文件
OUTPUT_FILE="r2_credentials_$(date +%Y%m%d_%H%M%S).txt"
cat > "$OUTPUT_FILE" <<EOF
# Cloudflare R2 S3 凭证（$(date)）
# ⚠️  请妥善保管，不要提交到 Git

ACCESS_KEY_ID=$TOKEN_ID
SECRET_ACCESS_KEY=$SECRET_ACCESS_KEY
ENDPOINT=https://$CF_ACCOUNT_ID.r2.cloudflarestorage.com
REGION=auto

# Cloudflare Token Value（原文，仅用于备份）
# TOKEN_VALUE=$TOKEN_VALUE
EOF

success "凭证已保存到: ./$OUTPUT_FILE"
