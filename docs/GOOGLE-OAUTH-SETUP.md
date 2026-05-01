# Google OAuth 配置指南

## 项目信息
- **项目 ID**: `reelkey-1777630710`
- **项目编号**: `918582956024`
- **账号**: `bzfree2003@gmail.com`

---

## 第一步：配置 OAuth 同意屏幕（2 分钟）

### 1. 打开配置页面
🔗 **直达链接**: https://console.cloud.google.com/apis/credentials/consent?project=reelkey-1777630710

### 2. 选择用户类型
- 选择 **"外部"（External）**
- 点击 **"创建"**

### 3. 填写应用信息
**OAuth 同意屏幕**页面：
- **应用名称**: `Reelkey`
- **用户支持电子邮件**: `bzfree2003@gmail.com`
- **应用徽标**: 暂时跳过（可选）
- **应用首页**: `http://localhost:3000`（开发阶段）
- **应用隐私权政策链接**: 暂时跳过（可选）
- **应用服务条款链接**: 暂时跳过（可选）
- **已获授权的网域**: 
  - 添加 `localhost`（开发阶段）
- **开发者联系信息**: `bzfree2003@gmail.com`

点击 **"保存并继续"**

### 4. 配置作用域
点击 **"添加或移除作用域"**，勾选以下三个：
- ✅ `.../auth/userinfo.email` - 查看您的电子邮件地址
- ✅ `.../auth/userinfo.profile` - 查看您的个人信息
- ✅ `openid` - 将您与您在 Google 上的个人信息关联

点击 **"更新"** → **"保存并继续"**

### 5. 添加测试用户
点击 **"添加用户"**，输入：
- `bzfree2003@gmail.com`

点击 **"添加"** → **"保存并继续"**

### 6. 完成
查看摘要信息，点击 **"返回信息中心"**

✅ **OAuth 同意屏幕配置完成！**

---

## 第二步：创建 OAuth 客户端 ID（1 分钟）

### 1. 打开凭据页面
🔗 **直达链接**: https://console.cloud.google.com/apis/credentials?project=reelkey-1777630710

### 2. 创建凭据
点击页面顶部的 **"+ 创建凭据"** → 选择 **"OAuth 客户端 ID"**

### 3. 配置客户端
- **应用类型**: 选择 **"Web 应用"**
- **名称**: `Reelkey Web Client`

**已获授权的 JavaScript 来源**（点击 "+ 添加 URI"）：
```
http://localhost:3000
http://localhost:3001
```

**已获授权的重定向 URI**（点击 "+ 添加 URI"）：
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```

### 4. 创建
点击 **"创建"**

### 5. 保存凭据
弹出窗口会显示：
- **客户端 ID**: `xxxxxx.apps.googleusercontent.com`
- **客户端密钥**: `GOCSPX-xxxxxx`

**⚠️ 重要：复制这两个值！**

---

## 第三步：更新环境变量

将获取到的凭据填入 `.env.local` 文件：

```bash
# Google OAuth
GOOGLE_CLIENT_ID='你的客户端ID.apps.googleusercontent.com'
GOOGLE_CLIENT_SECRET='GOCSPX-你的客户端密钥'
```

---

## 第四步：测试登录

1. 启动开发服务器：
```bash
pnpm dev
```

2. 访问：http://localhost:3000/zh/login

3. 点击 **"使用 Google 登录"** 按钮

4. 选择你的 Google 账号（`bzfree2003@gmail.com`）

5. 如果看到 **"此应用未经验证"** 警告：
   - 点击 **"高级"**
   - 点击 **"前往 Reelkey（不安全）"**
   - 这是正常的，因为应用还在测试阶段

6. 授权后应该会跳转到 `/dashboard`

✅ **Google OAuth 配置完成！**

---

## 常见问题

### Q1: 看到 "此应用未经验证" 警告
**A**: 这是正常的。测试阶段的应用会显示此警告。点击 "高级" → "前往 Reelkey" 即可继续。

### Q2: 重定向 URI 不匹配错误
**A**: 检查 `.env.local` 中的 `NEXT_PUBLIC_APP_URL` 是否与重定向 URI 匹配。

### Q3: 需要添加生产环境域名
**A**: 在 OAuth 客户端配置中添加：
- JavaScript 来源: `https://reelkey.app`
- 重定向 URI: `https://reelkey.app/api/auth/callback/google`

---

## 生产环境发布

当准备发布到生产环境时：

1. **验证应用**（可选，但推荐）
   - 访问：https://console.cloud.google.com/apis/credentials/consent
   - 点击 **"发布应用"**
   - 提交验证申请（需要隐私政策、服务条款等）

2. **添加生产域名**
   - 在 OAuth 客户端中添加生产环境的 URI
   - 在同意屏幕中添加生产域名到 "已获授权的网域"

3. **更新环境变量**
   - 生产环境的 `.env.production` 中设置正确的 `NEXT_PUBLIC_APP_URL`

---

## 需要帮助？

如果遇到问题，请检查：
1. Google Cloud Console 中的错误日志
2. 浏览器开发者工具的 Network 标签
3. 服务器日志（`pnpm dev` 的输出）

或者联系开发者：bzfree2003@gmail.com
