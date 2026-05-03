#!/usr/bin/env bash
# ============================================================
# setup-neon-db.sh — Neon 数据库一键配置脚本
#
# 功能：
#   1. 创建 Neon 数据库项目
#   2. 获取连接字符串
#   3. 写入 .env.local
#
# 使用方式：
#   NEON_ORG_ID=org-xxx PROJECT_NAME=my-project bash scripts/setup-neon-db.sh
#   或直接运行，按提示输入
#
# 前置：neonctl（brew install neonctl && neonctl auth）
# ============================================================

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; BOLD='\033[1m'; NC='\033[0m'
info()    { echo -e "${CYAN}[INFO]${NC}  $*"; }
success() { echo -e "${GREEN}[✓]${NC}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC}  $*"; }
error()   { echo -e "\033[0;31m[✗]${NC}    $*" >&2; exit 1; }
step()    { echo -e "\n${BOLD}${CYAN}── $* ──${NC}"; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
[[ "$(basename "$SCRIPT_DIR")" == "scripts" ]] && PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)" || PROJECT_ROOT="$SCRIPT_DIR"
ENV_FILE="$PROJECT_ROOT/.env.local"

command -v neonctl >/dev/null 2>&1 || error "未安装 neonctl（brew install neonctl && neonctl auth）"

echo -e "${BOLD}"
echo "  ╔══════════════════════════════════════╗"
echo "  ║   Neon 数据库一键配置脚本            ║"
echo "  ╚══════════════════════════════════════╝"
echo -e "${NC}"

# ── 步骤 1：读取配置 ──────────────────────────────────────────
step "1. 配置信息"

if [[ -z "${NEON_ORG_ID:-}" ]]; then
  echo "查询组织列表..."
  neonctl orgs list
  read -rp "NEON_ORG_ID（格式：org-xxx-xxx）: " NEON_ORG_ID
fi

if [[ -z "${PROJECT_NAME:-}" ]]; then
  SUGGESTED_NAME="$(basename "$PROJECT_ROOT")"
  read -rp "项目名称（默认 $SUGGESTED_NAME）: " PROJECT_NAME
  PROJECT_NAME="${PROJECT_NAME:-$SUGGESTED_NAME}"
fi

REGION_ID="${NEON_REGION_ID:-aws-us-east-1}"

info "组织 ID  : $NEON_ORG_ID"
info "项目名称 : $PROJECT_NAME"
info "区域     : $REGION_ID"
info ".env.local: $ENV_FILE"

# ── 步骤 2：检查项目是否已存在 ───────────────────────────────
step "2. 检查项目"

EXISTING=$(neonctl projects list --output json 2>/dev/null | \
  python3 -c "import sys,json; projects=json.load(sys.stdin).get('projects',[]); print(next((p['id'] for p in projects if p['name']=='$PROJECT_NAME'),''))" 2>/dev/null || echo "")

if [[ -n "$EXISTING" ]]; then
  success "项目 '$PROJECT_NAME' 已存在（ID: $EXISTING）"
else
  step "创建项目"
  neonctl projects create \
    --name "$PROJECT_NAME" \
    --org-id "$NEON_ORG_ID" \
    --region-id "$REGION_ID"
  success "项目 '$PROJECT_NAME' 创建成功"
fi

# ── 步骤 3：获取连接字符串 ────────────────────────────────────
step "3. 获取连接字符串"

DB_URL=$(neonctl connection-string "$PROJECT_NAME" --show-password 2>/dev/null)
[[ -z "$DB_URL" ]] && error "无法获取连接字符串，请检查项目名称"
success "连接字符串获取成功"

# ── 步骤 4：写入 .env.local ───────────────────────────────────
step "4. 更新 .env.local"

[[ ! -f "$ENV_FILE" ]] && touch "$ENV_FILE"
cp "$ENV_FILE" "${ENV_FILE}.bak.$(date +%Y%m%d_%H%M%S)"

write_env() {
  local key="$1" value="$2"
  if grep -q "^${key}=" "$ENV_FILE" 2>/dev/null; then
    sed -i '' "s|^${key}=.*|${key}=${value}|" "$ENV_FILE"
  else
    echo "${key}=${value}" >> "$ENV_FILE"
  fi
}

write_env "DATABASE_URL" "'${DB_URL}'"
write_env "POSTGRES_URL"  "'${DB_URL}'"

success ".env.local 已更新"

# ── 步骤 5：验证连接 ──────────────────────────────────────────
step "5. 验证连接"

if command -v psql >/dev/null 2>&1; then
  psql "$DB_URL" -c "SELECT version();" -t 2>/dev/null | head -1 | xargs && success "数据库连接正常" || warn "psql 测试失败，请手动验证"
else
  warn "未安装 psql，跳过连接验证（可运行 pnpm db:test 验证）"
fi

# ── 完成 ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}${BOLD}╔══════════════════════════════════════════╗${NC}"
echo -e "${GREEN}${BOLD}║         Neon 数据库配置完成！            ║${NC}"
echo -e "${GREEN}${BOLD}╚══════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${CYAN}DATABASE_URL 已写入 .env.local${NC}"
echo ""
echo -e "下一步："
echo -e "  pnpm drizzle-kit push   # 推送 schema"
echo -e "  pnpm db:test            # 验证数据库"
