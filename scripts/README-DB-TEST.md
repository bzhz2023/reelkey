# 数据库验证脚本

## 用途

全面测试数据库配置是否正确、完整、可用。适用于：

- ✅ 新项目初始化后验证数据库
- ✅ 数据库迁移后验收
- ✅ 生产环境部署前检查
- ✅ CI/CD 流程中的数据库健康检查
- ✅ 排查数据库连接问题

## 使用方法

### 1. 基础验证

```bash
# 使用 .env.local 中的配置
node scripts/test-db-full.mjs
```

### 2. 指定数据库连接

```bash
# 临时指定数据库 URL
DATABASE_URL="postgresql://user:pass@host/db" node scripts/test-db-full.mjs
```

### 3. 添加到 package.json

```json
{
  "scripts": {
    "db:test": "node scripts/test-db-full.mjs",
    "db:verify": "node scripts/test-db-full.mjs"
  }
}
```

然后运行：

```bash
pnpm db:test
```

## 测试项目

脚本会执行以下 10 项测试：

### 1️⃣ 数据库连接测试
- 验证能否成功连接到数据库
- 检查网络连通性和认证信息

### 2️⃣ 表结构完整性检查
- 列出所有已创建的表
- 验证核心业务表是否存在
- 检测缺失的表

### 3️⃣ 枚举类型检查
- 验证所有 PostgreSQL 枚举类型
- 确保状态、类型等枚举正确创建

### 4️⃣ 写入操作测试（INSERT）
- 创建测试用户
- 验证数据插入功能

### 5️⃣ 读取操作测试（SELECT）
- 查询刚创建的测试数据
- 验证数据检索功能

### 6️⃣ 关联表操作测试
- 测试外键关联
- 验证积分包等关联表写入

### 7️⃣ 视频表操作测试
- 测试核心业务表（videos）
- 验证 JSONB、枚举等复杂类型

### 8️⃣ 更新操作测试（UPDATE）
- 修改记录状态
- 验证数据更新功能

### 9️⃣ 删除操作测试（DELETE）
- 清理测试数据
- 验证数据删除功能

### 🔟 索引配置检查
- 列出所有数据库索引
- 确保性能优化到位

## 测试输出

### 成功示例

```
🧪 开始全面测试数据库配置...

📍 数据库: ep-xxx.region.aws.neon.tech

1️⃣ 测试数据库连接...
   ✅ 连接成功

2️⃣ 检查表结构...
   ✅ 共 15 个表
   ✅ 所有核心表都存在

...

═══════════════════════════════════════════════════════
🎉 所有测试通过！数据库配置完全可用！
═══════════════════════════════════════════════════════
```

### 失败示例

```
❌ 测试失败: connection refused

错误详情: Error: connect ECONNREFUSED
```

## 环境要求

- Node.js 18+
- 已安装依赖：`postgres`, `@next/env`
- 配置了 `DATABASE_URL` 或 `POSTGRES_URL` 环境变量

## 注意事项

⚠️ **测试数据自动清理**

脚本会创建临时测试数据，并在测试结束后自动清理，不会污染数据库。

⚠️ **生产环境使用**

可以安全地在生产环境运行此脚本，它只执行读取和临时写入操作。

⚠️ **权限要求**

数据库用户需要以下权限：
- SELECT（查询）
- INSERT（插入）
- UPDATE（更新）
- DELETE（删除）

## 集成到 CI/CD

### GitHub Actions 示例

```yaml
name: Database Health Check

on: [push, pull_request]

jobs:
  test-db:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '20'
      - run: npm install
      - name: Test Database
        env:
          DATABASE_URL: ${{ secrets.DATABASE_URL }}
        run: node scripts/test-db-full.mjs
```

### Docker Compose 示例

```yaml
services:
  db-test:
    image: node:20
    volumes:
      - ./scripts:/scripts
    environment:
      - DATABASE_URL=${DATABASE_URL}
    command: node /scripts/test-db-full.mjs
```

## 自定义扩展

如果你的项目有特殊的表或业务逻辑，可以修改脚本中的 `expectedTables` 数组：

```javascript
const expectedTables = [
  'user', 'account', 'session', 'verification',
  'videos', 'credit_packages', 'credit_holds', 'credit_transactions',
  'creem_subscriptions', 'Customer',
  // 添加你的自定义表
  'your_custom_table',
];
```

## 故障排查

### 连接失败

```
❌ 测试失败: connection refused
```

**解决方案：**
- 检查 `DATABASE_URL` 是否正确
- 确认数据库服务是否运行
- 检查防火墙和网络配置

### 表缺失

```
⚠️ 缺少表: videos, credit_packages
```

**解决方案：**
- 运行数据库迁移：`pnpm db:push` 或 `pnpm db:migrate`
- 检查迁移文件是否正确

### 权限不足

```
❌ 测试失败: permission denied
```

**解决方案：**
- 确认数据库用户有足够权限
- 检查数据库角色配置

## 维护建议

1. **定期运行** - 在每次数据库 schema 变更后运行
2. **版本控制** - 将此脚本纳入 Git 版本控制
3. **文档同步** - 当添加新表时，更新 `expectedTables` 列表
4. **CI 集成** - 在 CI/CD 流程中自动运行

## 相关命令

```bash
# 生成迁移文件
pnpm db:generate

# 执行迁移
pnpm db:migrate

# 推送 schema（开发环境）
pnpm db:push

# 打开数据库管理界面
pnpm db:studio

# 验证数据库配置
pnpm db:test
```

## 贡献

如果你发现可以改进的地方，欢迎提交 PR 或 Issue。

## 许可

与项目主体保持一致。
