#!/bin/bash
# 自动更新 R2 环境变量脚本

set -e

echo "🔧 R2 存储环境变量配置工具"
echo "================================"
echo ""

# 固定值
ACCOUNT_ID="99a7580169295945d5e5f17af605d0c8"
BUCKET_NAME="reelkey"
PUBLIC_URL="https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev"
ENDPOINT="https://${ACCOUNT_ID}.r2.cloudflarestorage.com"

echo "📦 Bucket 信息:"
echo "  - Account ID: ${ACCOUNT_ID}"
echo "  - Bucket Name: ${BUCKET_NAME}"
echo "  - Public URL: ${PUBLIC_URL}"
echo "  - Endpoint: ${ENDPOINT}"
echo ""

# 提示用户输入 API 凭据
echo "🔑 请输入 R2 API 凭据（从 Cloudflare Dashboard 获取）:"
echo ""
echo "📍 获取凭据链接: https://dash.cloudflare.com/${ACCOUNT_ID}/r2/api-tokens"
echo ""

read -p "Access Key ID: " ACCESS_KEY
read -p "Secret Access Key: " SECRET_KEY

if [ -z "$ACCESS_KEY" ] || [ -z "$SECRET_KEY" ]; then
  echo "❌ 错误: Access Key 和 Secret Key 不能为空"
  exit 1
fi

echo ""
echo "✅ 凭据已接收"
echo ""

# 备份现有 .env.local
ENV_FILE="/Volumes/ExternalSSD/Projects/reelkey/.env.local"
if [ -f "$ENV_FILE" ]; then
  BACKUP_FILE="${ENV_FILE}.backup.$(date +%Y%m%d_%H%M%S)"
  cp "$ENV_FILE" "$BACKUP_FILE"
  echo "📋 已备份现有配置到: ${BACKUP_FILE}"
fi

# 更新环境变量
echo "📝 更新 .env.local 文件..."

# 使用 sed 更新或添加环境变量
sed -i '' "s|^STORAGE_ENDPOINT=.*|STORAGE_ENDPOINT=${ENDPOINT}|" "$ENV_FILE"
sed -i '' "s|^STORAGE_REGION=.*|STORAGE_REGION=auto|" "$ENV_FILE"
sed -i '' "s|^STORAGE_ACCESS_KEY=.*|STORAGE_ACCESS_KEY=${ACCESS_KEY}|" "$ENV_FILE"
sed -i '' "s|^STORAGE_SECRET_KEY=.*|STORAGE_SECRET_KEY=${SECRET_KEY}|" "$ENV_FILE"
sed -i '' "s|^STORAGE_BUCKET=.*|STORAGE_BUCKET=${BUCKET_NAME}|" "$ENV_FILE"
sed -i '' "s|^STORAGE_DOMAIN=.*|STORAGE_DOMAIN=${PUBLIC_URL}|" "$ENV_FILE"

echo "✅ 环境变量已更新"
echo ""

# 测试连接
echo "🧪 测试 R2 连接..."
echo ""

TEST_FILE="/tmp/r2-test-$(date +%s).txt"
echo "ReelKey R2 Test - $(date)" > "$TEST_FILE"

if wrangler r2 object put "${BUCKET_NAME}/test/connection-test.txt" --file "$TEST_FILE" 2>&1 | grep -q "Uploaded"; then
  echo "✅ 上传测试成功"

  # 测试公共访问
  TEST_URL="${PUBLIC_URL}/test/connection-test.txt"
  if curl -s "$TEST_URL" | grep -q "ReelKey"; then
    echo "✅ 公共访问测试成功"
    echo "   URL: ${TEST_URL}"
  else
    echo "⚠️  公共访问测试失败，请检查 dev-url 是否已启用"
  fi

  # 清理测试文件
  wrangler r2 object delete "${BUCKET_NAME}/test/connection-test.txt" > /dev/null 2>&1
  rm -f "$TEST_FILE"
else
  echo "❌ 上传测试失败，请检查 API 凭据是否正确"
  exit 1
fi

echo ""
echo "🎉 R2 存储配置完成！"
echo ""
echo "📚 下一步:"
echo "  1. 重启开发服务器: pnpm dev"
echo "  2. 测试视频生成功能"
echo "  3. 检查视频是否成功上传到 R2"
echo ""
echo "📖 详细文档: docs/R2-STORAGE-SETUP.md"
