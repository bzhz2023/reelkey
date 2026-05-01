# Cloudflare R2 存储配置指南

## 项目信息
- **Account ID**: `99a7580169295945d5e5f17af605d0c8`
- **Bucket Name**: `reelkey`
- **Public URL**: `https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev`
- **Location**: WNAM (Western North America)
- **Storage Class**: Standard

---

## ✅ 已完成的步骤

1. ✅ **Bucket 已创建**: `reelkey`
2. ✅ **公共访问已启用**: `https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev`
3. ✅ **CORS 配置**: 待配置（下一步）

---

## 🔧 需要手动完成的步骤

### 步骤 1: 创建 R2 API 令牌

#### 1.1 打开 API 令牌页面
🔗 **直达链接**: https://dash.cloudflare.com/99a7580169295945d5e5f17af605d0c8/r2/api-tokens

#### 1.2 创建新令牌
点击 **"Create API Token"** 按钮

#### 1.3 配置令牌
- **Token Name**: `reelkey-api-token`
- **Permissions**: 
  - ✅ **Object Read & Write** (读写对象)
  - ✅ **Bucket Read** (读取 bucket 信息)
- **Bucket Scope**: 
  - 选择 **"Apply to specific buckets only"**
  - 勾选 `reelkey`
- **TTL**: 永不过期（或根据需要设置）

#### 1.4 创建并保存凭据
点击 **"Create API Token"** 后，会显示：
- **Access Key ID**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
- **Secret Access Key**: `yyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy`

**⚠️ 重要：立即复制这两个值！关闭窗口后无法再次查看 Secret Access Key。**

---

### 步骤 2: 配置 CORS（跨域资源共享）

#### 2.1 创建 CORS 配置文件
```bash
cat > /tmp/r2-cors.json << 'EOF'
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": ["ETag"],
    "MaxAgeSeconds": 3600
  }
]
EOF
```

#### 2.2 应用 CORS 配置
```bash
wrangler r2 bucket cors put reelkey --file /tmp/r2-cors.json
```

或者通过 Cloudflare Dashboard:
1. 访问: https://dash.cloudflare.com/99a7580169295945d5e5f17af605d0c8/r2/buckets/reelkey/settings
2. 找到 **"CORS Policy"** 部分
3. 点击 **"Edit"**
4. 添加以下规则：
   - **Allowed Origins**: `*` (生产环境应改为具体域名)
   - **Allowed Methods**: `GET, PUT, POST, DELETE, HEAD`
   - **Allowed Headers**: `*`
   - **Expose Headers**: `ETag`
   - **Max Age**: `3600`

---

## 📝 环境变量配置

获取到 API 凭据后，更新 `.env.local` 文件：

```bash
# R2/S3 Storage
STORAGE_ENDPOINT=https://99a7580169295945d5e5f17af605d0c8.r2.cloudflarestorage.com
STORAGE_REGION=auto
STORAGE_ACCESS_KEY=你的_Access_Key_ID
STORAGE_SECRET_KEY=你的_Secret_Access_Key
STORAGE_BUCKET=reelkey
STORAGE_DOMAIN=https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev
```

**注意事项：**
- `STORAGE_ENDPOINT` 格式: `https://{ACCOUNT_ID}.r2.cloudflarestorage.com`
- `STORAGE_REGION` 固定为 `auto`（R2 自动选择区域）
- `STORAGE_DOMAIN` 是公共访问 URL，用于生成视频下载链接

---

## 🧪 测试 R2 存储

### 方法 1: 使用 wrangler 上传测试文件
```bash
echo "Hello ReelKey!" > /tmp/test.txt
wrangler r2 object put reelkey/test.txt --file /tmp/test.txt
```

### 方法 2: 验证公共访问
```bash
curl https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev/test.txt
```

应该返回: `Hello ReelKey!`

### 方法 3: 使用项目代码测试
启动开发服务器后，尝试生成一个视频，检查是否能成功上传到 R2。

---

## 🔒 生产环境安全建议

### 1. 限制 CORS 来源
将 `AllowedOrigins` 从 `*` 改为具体域名：
```json
"AllowedOrigins": ["https://reelkey.app", "https://www.reelkey.app"]
```

### 2. 使用自定义域名
配置自定义域名代替 `r2.dev` URL：
1. 在 Cloudflare DNS 中添加 CNAME 记录
2. 使用 `wrangler r2 bucket domain add` 绑定域名
3. 更新 `STORAGE_DOMAIN` 环境变量

### 3. 设置 Bucket 生命周期规则
自动清理过期或失败的视频文件：
```bash
wrangler r2 bucket lifecycle put reelkey --file lifecycle-rules.json
```

示例规则（删除 30 天前的临时文件）：
```json
{
  "Rules": [
    {
      "Id": "delete-temp-files",
      "Status": "Enabled",
      "Filter": {
        "Prefix": "temp/"
      },
      "Expiration": {
        "Days": 30
      }
    }
  ]
}
```

### 4. 启用访问日志
监控 R2 访问情况：
```bash
wrangler r2 bucket notification create reelkey \
  --event-type object-create \
  --queue your-queue-name
```

---

## 📊 R2 定价（参考）

- **存储**: $0.015/GB/月
- **Class A 操作** (写入): $4.50/百万次
- **Class B 操作** (读取): $0.36/百万次
- **出站流量**: 免费（无限制）

**估算（1000 个视频/月）：**
- 存储 (100GB): $1.50/月
- 上传操作 (1000 次): $0.0045/月
- 读取操作 (10000 次): $0.036/月
- **总计**: ~$1.54/月

---

## 🛠️ 常用命令

```bash
# 列出所有文件
wrangler r2 object list reelkey

# 上传文件
wrangler r2 object put reelkey/path/to/file.mp4 --file local-file.mp4

# 下载文件
wrangler r2 object get reelkey/path/to/file.mp4 --file downloaded.mp4

# 删除文件
wrangler r2 object delete reelkey/path/to/file.mp4

# 查看 bucket 信息
wrangler r2 bucket info reelkey

# 查看 CORS 配置
wrangler r2 bucket cors get reelkey
```

---

## ❓ 常见问题

### Q1: 上传失败，提示 "Access Denied"
**A**: 检查 API 令牌权限是否包含 `Object Read & Write`，并且 bucket scope 包含 `reelkey`。

### Q2: 公共 URL 无法访问
**A**: 确认已启用 `dev-url`：
```bash
wrangler r2 bucket dev-url enable reelkey
```

### Q3: CORS 错误
**A**: 检查 CORS 配置是否正确应用：
```bash
wrangler r2 bucket cors get reelkey
```

### Q4: 如何迁移现有视频？
**A**: 使用 `rclone` 或 AWS CLI 批量迁移：
```bash
# 使用 rclone
rclone copy source-bucket: r2:reelkey --progress
```

---

## 📚 相关文档

- [Cloudflare R2 官方文档](https://developers.cloudflare.com/r2/)
- [Wrangler CLI 文档](https://developers.cloudflare.com/workers/wrangler/)
- [R2 API 参考](https://developers.cloudflare.com/r2/api/)
- [S3 兼容性](https://developers.cloudflare.com/r2/api/s3/api/)

---

## 需要帮助？

如果遇到问题，请检查：
1. Cloudflare Dashboard 中的 R2 日志
2. 应用服务器日志（`pnpm dev` 输出）
3. 浏览器开发者工具的 Network 标签

或者联系开发者：bzfree2003@gmail.com
