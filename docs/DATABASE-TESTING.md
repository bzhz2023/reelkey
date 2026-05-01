# 数据库测试脚本使用指南

## 📋 概述

`scripts/test-db-full.mjs` 是一个全面的数据库验证脚本，用于确保数据库配置正确、完整、可用。

## 🎯 适用场景

- ✅ **新项目初始化** - 验证数据库是否正确创建
- ✅ **数据库迁移** - 确认迁移后数据库状态正常
- ✅ **生产部署前** - 部署前的最后检查
- ✅ **CI/CD 流程** - 自动化测试数据库健康状态
- ✅ **故障排查** - 快速诊断数据库连接和配置问题

## 🚀 快速开始

### 方式 1：使用 npm 脚本（推荐）

```bash
# 验证数据库配置
pnpm db:test

# 或者使用别名
pnpm db:verify
```

### 方式 2：直接运行脚本

```bash
node scripts/test-db-full.mjs
```

### 方式 3：指定数据库连接

```bash
# 临时使用不同的数据库
DATABASE_URL="postgresql://user:pass@host/db" node scripts/test-db-full.mjs
```

## 📊 测试内容

脚本会执行 **10 项全面测试**：

| 测试项 | 说明 | 验证内容 |
|--------|------|----------|
| 1️⃣ 数据库连接 | 验证网络连通性和认证 | 能否成功连接数据库 |
| 2️⃣ 表结构完整性 | 检查所有表是否创建 | 15 个核心表是否存在 |
| 3️⃣ 枚举类型 | 验证 PostgreSQL 枚举 | 5 个枚举类型是否正确 |
| 4️⃣ 写入操作 | 测试 INSERT 语句 | 能否插入新记录 |
| 5️⃣ 读取操作 | 测试 SELECT 查询 | 能否查询数据 |
| 6️⃣ 关联表操作 | 测试外键关联 | 积分包等关联表是否正常 |
| 7️⃣ 视频表操作 | 测试核心业务表 | JSONB、枚举等复杂类型 |
| 8️⃣ 更新操作 | 测试 UPDATE 语句 | 能否修改记录 |
| 9️⃣ 删除操作 | 测试 DELETE 语句 | 能否删除记录 |
| 🔟 索引配置 | 检查性能优化 | 44 个索引是否就位 |

## ✅ 成功输出示例

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

✅ 验证项目：
   • 数据库连接
   • 表结构完整性
   • 枚举类型
   • 写入操作（INSERT）
   • 读取操作（SELECT）
   • 更新操作（UPDATE）
   • 删除操作（DELETE）
   • 关联表操作
   • 索引配置

🚀 可以开始使用数据库了！
```

## ❌ 常见错误及解决方案

### 错误 1：找不到环境变量

```
❌ 错误: 未找到 DATABASE_URL 或 POSTGRES_URL 环境变量
```

**解决方案：**
1. 确保 `.env.local` 或 `.env` 文件存在
2. 检查文件中是否配置了 `DATABASE_URL`
3. 确认环境变量格式正确

### 错误 2：连接被拒绝

```
❌ 测试失败: connection refused
```

**解决方案：**
1. 检查数据库服务是否运行
2. 验证连接字符串中的主机名和端口
3. 检查防火墙和网络配置
4. 确认数据库允许远程连接

### 错误 3：表缺失

```
⚠️ 缺少表: videos, credit_packages
```

**解决方案：**
```bash
# 推送数据库 schema
pnpm db:push

# 或运行迁移
pnpm db:migrate
```

### 错误 4：权限不足

```
❌ 测试失败: permission denied
```

**解决方案：**
1. 确认数据库用户有 SELECT、INSERT、UPDATE、DELETE 权限
2. 检查数据库角色配置
3. 联系数据库管理员授予权限

## 🔧 集成到工作流

### 开发流程

```bash
# 1. 创建/更新数据库 schema
pnpm db:push

# 2. 验证数据库配置
pnpm db:test

# 3. 启动开发服务器
pnpm dev
```

### CI/CD 流程

在 `.github/workflows/test.yml` 中添加：

```yaml
- name: Test Database Configuration
  env:
    DATABASE_URL: ${{ secrets.DATABASE_URL }}
  run: pnpm db:test
```

### 部署前检查清单

- [ ] 运行 `pnpm db:test` 验证数据库
- [ ] 检查所有测试项通过
- [ ] 确认索引配置正确
- [ ] 验证生产环境连接字符串

## 📝 自定义配置

如果你的项目有额外的表，可以修改脚本中的 `expectedTables` 数组：

```javascript
const expectedTables = [
  'user', 'account', 'session', 'verification',
  'videos', 'credit_packages', 'credit_holds', 'credit_transactions',
  'creem_subscriptions', 'Customer',
  // 添加你的自定义表
  'your_custom_table',
];
```

## 🔒 安全说明

- ✅ **自动清理** - 测试数据会自动删除，不会污染数据库
- ✅ **只读为主** - 大部分操作是读取，临时写入会立即清理
- ✅ **生产安全** - 可以安全地在生产环境运行
- ⚠️ **密码保护** - 输出中会隐藏数据库密码

## 📚 相关命令

```bash
# 数据库操作
pnpm db:generate    # 生成迁移文件
pnpm db:migrate     # 执行迁移
pnpm db:push        # 推送 schema（开发环境）
pnpm db:studio      # 打开 Drizzle Studio

# 数据库验证
pnpm db:test        # 验证数据库配置
pnpm db:verify      # 同上（别名）

# 积分管理脚本
pnpm script:add-credits      # 添加积分
pnpm script:check-credits    # 查询积分
pnpm script:reset-credits    # 重置积分
```

## 💡 最佳实践

1. **定期运行** - 每次修改 schema 后运行验证
2. **CI 集成** - 在 CI/CD 流程中自动运行
3. **部署前检查** - 部署到生产环境前必须通过测试
4. **文档同步** - 添加新表时更新 `expectedTables`
5. **版本控制** - 将脚本纳入 Git 管理

## 🤝 贡献

如果你发现可以改进的地方：
1. 修改 `scripts/test-db-full.mjs`
2. 更新此文档
3. 提交 PR

## 📖 更多信息

- 详细技术文档：`scripts/README-DB-TEST.md`
- 项目文档：`CLAUDE.md`
- Drizzle ORM 文档：https://orm.drizzle.team/
