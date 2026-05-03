#!/usr/bin/env bash
# ============================================================
# setup-r2.sh — Cloudflare R2 一键配置脚本 v3.0
#
# 功能（全自动）：
#   1. 检查 / 创建 R2 Bucket
#   2. 启用公共访问 dev URL（wrangler）
#   3. 设置 CORS 规则（wrangler）
#   4. 生成 R2 S3 API 凭证（两种模式自动切换）
#   5. 写入 .env.local
#   6. 连通性测试
#
# 使用方式：
#   CF_API_TOKEN=xxx CF_ACCOUNT_ID=xxx BUCKET_NAME=xxx bash scripts/setup-r2.sh
#   或直接运行，按提示输入
#
# 所需 CF_API_TOKEN 权限（最高兼容）：
#   - Account > R2 > Edit          必需
#   - User > API Tokens > Edit     可选（有则创建专用 Token，没有则用当前 Token）
#
# 前置：curl, jq, openssl, wrangler（npm i -g wrangler）
# ============================================================

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[✓]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "${RED}[✗]${NC}    $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ "$(basename "$SCRIPT_DIR")" == "scripts" ]] && PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)" || PROJECT_ROOT="$SCRIPT_DIR"
ENV_FILE="$PROJECT_ROOT/.env.local"

for cmd in curl jq openssl; do
  command -v "$cmd" >/dev/null 2>&1 || error "缺少依赖：$cmd（brew install $cmd）"
done

echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Cloudflare R2 一键配置脚本 v3.0    ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── 步骤 1：读取配置 ──────────────────────────────────────────
step "1. 配置信息"

[[ -z "${CF_API_TOKEN:-}" ]] && { echo -e "API Token 创建：${CYAN}https://dash.cloudflare.com/profile/api-tokens${NC}"; read -rsp "CF_API_TOKEN: " CF_API_TOKEN; echo; }
[[ -z "${CF_ACCOUNT_ID:-}" ]] && read -rp "CF_ACCOUNT_ID: " CF_ACCOUNT_ID
[[ -z "${BUCKET_NAME:-}"   ]] && { read -rp "Bucket 名称（默认 videos）: " BUCKET_NAME; BUCKET_NAME="${BUCKET_NAME:-videos}"; }

[[ -z "${CF_API_TOKEN:-}"  ]] && error "CF_API_TOKEN 不能为空"
[[ -z "${CF_ACCOUNT_ID:-}" ]] && error "CF_ACCOUNT_ID 不能为空"

BUCKET_REGION="${BUCKET_REGION:-WNAM}"
CORS_ORIGIN="${CORS_ORIGIN:-*}"
ENABLE_DEV_URL="${ENABLE_DEV_URL:-true}"

info "Account ID  : $CF_ACCOUNT_ID"
info "Bucket 名称 : $BUCKET_NAME"
info "CORS 来源   : $CORS_ORIGIN"
info ".env.local  : $ENV_FILE"

cf_api() {
  local method="$1" path="$2"; shift 2
  curl -s -X "$method" "https://api.cloudflare.com/client/v4${path}" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" "$@"
}
check_api_ok() {
  local ok; ok=$(echo "$1" | jq -r '.success // false')
  [[ "$ok" == "true" ]] && return 0
  echo "$1" | jq -C '.errors // .' >&2; error "API 失败：$2"
}

# ── 步骤 2：验证 Token ────────────────────────────────────────
step "2. 验证 API Token"

VERIFY=$(cf_api GET "/user/tokens/verify")
echo "$VERIFY" | jq -e '.success' > /dev/null 2>&1 || error "Token 无效"
SELF_TOKEN_ID=$(echo "$VERIFY" | jq -r '.result.id')
success "Token 验证通过（ID: $SELF_TOKEN_ID）"

# ── 步骤 3：检查 / 创建 Bucket ───────────────────────────────
step "3. 检查 / 创建 Bucket"

LIST=$(cf_api GET "/accounts/$CF_ACCOUNT_ID/r2/buckets?name_contains=$BUCKET_NAME")
EXISTS=$(echo "$LIST" | jq -r --arg n "$BUCKET_NAME" '.result.buckets[]? | select(.name==$n) | .name')

if [[ "$EXISTS" == "$BUCKET_NAME" ]]; then
  success "Bucket '$BUCKET_NAME' 已存在"
else
  CREATE=$(cf_api POST "/accounts/$CF_ACCOUNT_ID/r2/buckets" \
    --data "{\"name\":\"$BUCKET_NAME\",\"locationHint\":\"$BUCKET_REGION\"}")
  check_api_ok "$CREATE" "创建 Bucket"
  success "Bucket '$BUCKET_NAME' 已创建"
fi

# ── 步骤 4：启用公共访问 dev URL（wrangler）──────────────────
step "4. 启用公共访问 dev URL"

if command -v wrangler >/dev/null 2>&1; then
  DEV_URL_OUTPUT=$(CLOUDFLARE_API_TOKEN="$CF_API_TOKEN" \
    wrangler r2 bucket dev-url enable "$BUCKET_NAME" 2>&1)

  # 解析 dev URL（可能已存在或刚启用）
  DEV_URL=$(echo "$DEV_URL_OUTPUT" | grep -oE 'https://pub-[a-f0-9]+\.r2\.dev' | head -1)

  if [[ -n "$DEV_URL" ]]; then
    success "dev URL 已启用：$DEV_URL"
  else
    # 已经启用过，尝试获取现有 URL
    DEV_INFO=$(CLOUDFLARE_API_TOKEN="$CF_API_TOKEN" \
      wrangler r2 bucket dev-url get "$BUCKET_NAME" 2>&1)
    DEV_URL=$(echo "$DEV_INFO" | grep -oE 'https://pub-[a-f0-9]+\.r2\.dev' | head -1)
    [[ -n "$DEV_URL" ]] && success "dev URL（已存在）：$DEV_URL" || warn "无法获取 dev URL，可在 Dashboard 手动启用"
  fi
else
  warn "未安装 wrangler，跳过 dev URL 自动启用（npm i -g wrangler 后重新运行）"
  DEV_URL=""
fi

# ── 步骤 5：设置 CORS（wrangler）─────────────────────────────
step "5. 配置 CORS 规则"

if command -v wrangler >/dev/null 2>&1; then
  CORS_RULE="[{\"AllowedOrigins\":[\"$CORS_ORIGIN\"],\"AllowedMethods\":[\"GET\",\"PUT\",\"POST\",\"DELETE\",\"HEAD\"],\"AllowedHeaders\":[\"*\"],\"ExposeHeaders\":[\"ETag\"],\"MaxAgeSeconds\":3600}]"
  CORS_OUT=$(CLOUDFLARE_API_TOKEN="$CF_API_TOKEN" \
    wrangler r2 bucket cors put "$BUCKET_NAME" --rules "$CORS_RULE" 2>&1) || true

  if echo "$CORS_OUT" | grep -qi "success\|updated\|set"; then
    success "CORS 规则已设置"
  else
    warn "CORS 设置结果不明确，请手动确认："
    warn "https://dash.cloudflare.com/$CF_ACCOUNT_ID/r2/buckets/$BUCKET_NAME/settings"
  fi
else
  warn "未安装 wrangler，跳过 CORS 自动配置"
fi

# ── 步骤 6：生成 R2 S3 凭证（双模式）────────────────────────
# 模式 A：如果 CF_API_TOKEN 有 User:API Tokens:Edit 权限
#          → 创建一个专用的、权限最小的 S3 Token（推荐）
# 模式 B：如果没有该权限（只有 R2 权限）
#          → 直接用当前 Token 派生 S3 凭证（简单快速）
step "6. 生成 R2 S3 凭证"

ENDPOINT="https://${CF_ACCOUNT_ID}.r2.cloudflarestorage.com"

PERM_RESP=$(cf_api GET "/user/tokens/permission_groups")
CAN_CREATE_TOKEN=$(echo "$PERM_RESP" | jq -r '.success // false')

if [[ "$CAN_CREATE_TOKEN" == "true" ]]; then
  # ── 模式 A：创建专用 S3 Token ────────────────────────────
  info "模式 A：创建项目专用 S3 Token"
  R2_WRITE_ID=$(echo "$PERM_RESP" | jq -r '
    .result[] | select(.name == "Workers R2 Storage Write") | .id')
  [[ -z "$R2_WRITE_ID" ]] && R2_WRITE_ID=$(echo "$PERM_RESP" | jq -r '
    .result[] | select(.name | test("R2.*Write";"i")) | .id' | head -1)
  [[ -z "$R2_WRITE_ID" ]] && error "找不到 R2 Write 权限组 ID"

  TOKEN_RESP=$(curl -s -X POST "https://api.cloudflare.com/client/v4/user/tokens" \
    -H "Authorization: Bearer $CF_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data "{\"name\":\"${BUCKET_NAME}-s3-$(date +%Y%m%d)\",
      \"policies\":[{\"effect\":\"allow\",
        \"resources\":{\"com.cloudflare.api.account.$CF_ACCOUNT_ID\":\"*\"},
        \"permission_groups\":[{\"id\":\"$R2_WRITE_ID\"}]}]}")
  check_api_ok "$TOKEN_RESP" "创建 S3 Token"
  TOKEN_ID=$(echo "$TOKEN_RESP"    | jq -r '.result.id')
  TOKEN_VALUE=$(echo "$TOKEN_RESP" | jq -r '.result.value')
  SECRET_ACCESS_KEY=$(printf '%s' "$TOKEN_VALUE" | openssl dgst -sha256 | awk '{print $2}')
  success "已创建专用 S3 Token（ID: $TOKEN_ID）"
else
  # ── 模式 B：用当前 Token 派生 ────────────────────────────
  warn "Token 无 User:API Tokens:Edit 权限，使用当前 Token 派生 S3 凭证（模式 B）"
  TOKEN_ID="$SELF_TOKEN_ID"
  TOKEN_VALUE="$CF_API_TOKEN"
  SECRET_ACCESS_KEY=$(printf '%s' "$TOKEN_VALUE" | openssl dgst -sha256 | awk '{print $2}')
  success "S3 凭证已从当前 Token 派生（ID: $TOKEN_ID）"
fi

# ── 步骤 7：写入 .env.local ───────────────────────────────────
step "7. 更新 .env.local"

write_env() {
  local key="$1" value="$2"
  if [[ -f "$ENV_FILE" ]] && grep -q "^${key}=" "$ENV_FILE"; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

[[ ! -f "$ENV_FILE" ]] && touch "$ENV_FILE"
cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

write_env "STORAGE_ENDPOINT"   "$ENDPOINT"
write_env "STORAGE_REGION"     "auto"
write_env "STORAGE_ACCESS_KEY" "$TOKEN_ID"
write_env "STORAGE_SECRET_KEY" "$SECRET_ACCESS_KEY"
write_env "STORAGE_BUCKET"     "$BUCKET_NAME"
[[ -n "${DEV_URL:-}" ]] && write_env "STORAGE_DOMAIN" "$DEV_URL"

success ".env.local 已更新"

# ── 步骤 8：保存凭证备份 ──────────────────────────────────────
CRED_FILE="$PROJECT_ROOT/.r2-credentials-$(date +%Y%m%d_%H%M%S).txt"
cat > "$CRED_FILE" <<CRED
# Cloudflare R2 凭证备份 — $(date)
# ⚠️  请勿提交到 Git

ACCOUNT_ID=$CF_ACCOUNT_ID
BUCKET_NAME=$BUCKET_NAME

STORAGE_ENDPOINT=$ENDPOINT
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=$TOKEN_ID
STORAGE_SECRET_KEY=$SECRET_ACCESS_KEY
STORAGE_BUCKET=$BUCKET_NAME
STORAGE_DOMAIN=${DEV_URL:-（未配置）}

# 原始 Token Value（用于重新计算 Secret Key）
# TOKEN_VALUE=$TOKEN_VALUE
CRED
chmod 600 "$CRED_FILE"

if [[ -f "$PROJECT_ROOT/.gitignore" ]] && ! grep -q "\.r2-credentials" "$PROJECT_ROOT/.gitignore"; then
  printf '\n# R2 凭证备份\n.r2-credentials*.txt\n' >> "$PROJECT_ROOT/.gitignore"
fi

# ── 步骤 9：连通性测试 ────────────────────────────────────────
step "9. 连通性测试"

TEST_KEY="_setup-test/$(date +%s).txt"
CONTENT="R2 setup test $(date)"
NOW=$(date -u +%Y%m%dT%H%M%SZ)

TEST_RESULT=$(node -e "
const {createHmac,createHash}=require('crypto');
const [AK,SK,HOST,BUCKET,KEY,BODY,DT]=[
  '$TOKEN_ID','$SECRET_ACCESS_KEY',
  '${CF_ACCOUNT_ID}.r2.cloudflarestorage.com',
  '$BUCKET_NAME','$TEST_KEY','$CONTENT','$NOW'];
const SD=DT.slice(0,8);
const bh=createHash('sha256').update(BODY).digest('hex');
const canon=['PUT','/'+BUCKET+'/'+KEY,'',
  'host:'+HOST+'\nx-amz-content-sha256:'+bh+'\nx-amz-date:'+DT,'',
  'host;x-amz-content-sha256;x-amz-date',bh].join('\n');
const cs=SD+'/auto/s3/aws4_request';
const sts=['AWS4-HMAC-SHA256',DT,cs,createHash('sha256').update(canon).digest('hex')].join('\n');
const k=createHmac('sha256','AWS4'+SK).update(SD).digest();
const k2=createHmac('sha256',k).update('auto').digest();
const k3=createHmac('sha256',k2).update('s3').digest();
const k4=createHmac('sha256',k3).update('aws4_request').digest();
const sig=createHmac('sha256',k4).update(sts).digest('hex');
const auth='AWS4-HMAC-SHA256 Credential='+AK+'/'+cs+',SignedHeaders=host;x-amz-content-sha256;x-amz-date,Signature='+sig;
const {execSync}=require('child_process');
try {
  const code=execSync(\`curl -s -o /dev/null -w '%{http_code}' -X PUT 'https://\${HOST}/\${BUCKET}/\${KEY}' -H 'Authorization: \${auth}' -H 'x-amz-date: \${DT}' -H 'x-amz-content-sha256: \${bh}' -H 'Content-Type: text/plain' --data '\${BODY}'\`).toString();
  process.stdout.write(code);
} catch(e) { process.stdout.write('ERR'); }
" 2>/dev/null)

if [[ "$TEST_RESULT" == "200" ]]; then
  success "上传测试通过（HTTP 200）"
  # 清理
  node -e "
  const {createHmac,createHash}=require('crypto');
  const [AK,SK,HOST,BUCKET,KEY,DT]=['$TOKEN_ID','$SECRET_ACCESS_KEY',
    '${CF_ACCOUNT_ID}.r2.cloudflarestorage.com','$BUCKET_NAME','$TEST_KEY','$NOW'];
  const SD=DT.slice(0,8);
  const bh=createHash('sha256').update('').digest('hex');
  const canon=['DELETE','/'+BUCKET+'/'+KEY,'',
    'host:'+HOST+'\nx-amz-content-sha256:'+bh+'\nx-amz-date:'+DT,'',
    'host;x-amz-content-sha256;x-amz-date',bh].join('\n');
  const cs=SD+'/auto/s3/aws4_request';
  const sts=['AWS4-HMAC-SHA256',DT,cs,createHash('sha256').update(canon).digest('hex')].join('\n');
  const k=createHmac('sha256','AWS4'+SK).update(SD).digest();
  const k2=createHmac('sha256',k).update('auto').digest();
  const k3=createHmac('sha256',k2).update('s3').digest();
  const k4=createHmac('sha256',k3).update('aws4_request').digest();
  const sig=createHmac('sha256',k4).update(sts).digest('hex');
  const auth='AWS4-HMAC-SHA256 Credential='+AK+'/'+cs+',SignedHeaders=host;x-amz-content-sha256;x-amz-date,Signature='+sig;
  const {execSync}=require('child_process');
  execSync(\`curl -s -o /dev/null -X DELETE 'https://\${HOST}/\${BUCKET}/\${KEY}' -H 'Authorization: \${auth}' -H 'x-amz-date: \${DT}' -H 'x-amz-content-sha256: \${bh}'\`);
  " 2>/dev/null && info "测试文件已清理"
else
  warn "上传测试返回 $TEST_RESULT，请检查凭证或运行 node scripts/test-r2.mjs 排查"
fi

# ── 完成 ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║         R2 配置全部完成！                ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
grep "STORAGE_" "$ENV_FILE" | while IFS= read -r line; do
  echo -e "  ${CYAN}${line}${NC}"
done
echo ""
echo -e "${YELLOW}  凭证备份：$(basename "$CRED_FILE")${NC}"
echo ""
echo -e "下一步：pnpm dev"
