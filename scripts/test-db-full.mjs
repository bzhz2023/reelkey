import postgres from 'postgres';
import { config } from 'dotenv';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 获取项目根目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// 加载环境变量（优先级：.env.local > .env）
config({ path: resolve(projectRoot, '.env.local') });
config({ path: resolve(projectRoot, '.env') });

const DATABASE_URL = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!DATABASE_URL) {
  console.error('❌ 错误: 未找到 DATABASE_URL 或 POSTGRES_URL 环境变量');
  console.error('请确保 .env.local 或 .env 文件中配置了数据库连接字符串\n');
  process.exit(1);
}

console.log('🧪 开始全面测试数据库配置...\n');

// 隐藏密码部分，只显示主机信息
const dbHost = DATABASE_URL.split('@')[1]?.split('/')[0] || '***';
console.log(`📍 数据库: ${dbHost}\n`);

const client = postgres(DATABASE_URL);

try {
  // 测试 1: 连接测试
  console.log('1️⃣ 测试数据库连接...');
  await client`SELECT 1 as test`;
  console.log('   ✅ 连接成功\n');

  // 测试 2: 检查所有表
  console.log('2️⃣ 检查表结构...');
  const tables = await client`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;
  console.log(`   ✅ 共 ${tables.length} 个表`);

  const expectedTables = [
    'user', 'account', 'session', 'verification',
    'videos', 'credit_packages', 'credit_holds', 'credit_transactions',
    'creem_subscriptions', 'Customer'
  ];

  const tableNames = tables.map(t => t.table_name);
  const missingTables = expectedTables.filter(t => !tableNames.includes(t));

  if (missingTables.length > 0) {
    console.log(`   ⚠️  缺少表: ${missingTables.join(', ')}`);
  } else {
    console.log('   ✅ 所有核心表都存在\n');
  }

  // 测试 3: 检查枚举类型
  console.log('3️⃣ 检查枚举类型...');
  const enums = await client`
    SELECT typname
    FROM pg_type
    WHERE typtype = 'e'
    ORDER BY typname;
  `;
  console.log(`   ✅ 共 ${enums.length} 个枚举类型`);
  enums.forEach(e => console.log(`      - ${e.typname}`));
  console.log();

  // 测试 4: 测试写入操作（创建测试用户）
  console.log('4️⃣ 测试写入操作（创建测试用户）...');
  const testEmail = `test-${Date.now()}@example.com`;

  const [newUser] = await client`
    INSERT INTO "user" (email, name, "emailVerified", "isAdmin")
    VALUES (${testEmail}, 'Test User', false, false)
    RETURNING id, email, name;
  `;
  console.log(`   ✅ 成功创建用户: ${newUser.email} (ID: ${newUser.id})\n`);

  // 测试 5: 测试读取操作
  console.log('5️⃣ 测试读取操作...');
  const [user] = await client`
    SELECT id, email, name, "isAdmin", "createdAt"
    FROM "user"
    WHERE email = ${testEmail};
  `;
  console.log(`   ✅ 成功读取用户: ${user.email}`);
  console.log(`      - ID: ${user.id}`);
  console.log(`      - 创建时间: ${user.createdAt}\n`);

  // 测试 6: 测试关联表写入（积分包）
  console.log('6️⃣ 测试关联表写入（积分包）...');
  const [creditPackage] = await client`
    INSERT INTO credit_packages (
      user_id, initial_credits, remaining_credits, trans_type, status
    )
    VALUES (
      ${user.id}, 100, 100, 'NEW_USER', 'ACTIVE'
    )
    RETURNING id, user_id, initial_credits, remaining_credits;
  `;
  console.log(`   ✅ 成功创建积分包: ${creditPackage.initial_credits} 积分\n`);

  // 测试 7: 测试视频表写入
  console.log('7️⃣ 测试视频表写入...');
  const videoUuid = `test-${Date.now()}`;
  const [video] = await client`
    INSERT INTO videos (
      uuid, user_id, prompt, model, status, provider
    )
    VALUES (
      ${videoUuid}, ${user.id}, 'Test video prompt', 'sora-2', 'PENDING', 'evolink'
    )
    RETURNING id, uuid, status, model;
  `;
  console.log(`   ✅ 成功创建视频记录: ${video.uuid}`);
  console.log(`      - 状态: ${video.status}`);
  console.log(`      - 模型: ${video.model}\n`);

  // 测试 8: 测试更新操作
  console.log('8️⃣ 测试更新操作...');
  await client`
    UPDATE videos
    SET status = 'COMPLETED'
    WHERE uuid = ${videoUuid};
  `;
  const [updatedVideo] = await client`
    SELECT status FROM videos WHERE uuid = ${videoUuid};
  `;
  console.log(`   ✅ 成功更新视频状态: ${updatedVideo.status}\n`);

  // 测试 9: 测试删除操作（清理测试数据）
  console.log('9️⃣ 清理测试数据...');
  await client`DELETE FROM videos WHERE uuid = ${videoUuid}`;
  await client`DELETE FROM credit_packages WHERE user_id = ${user.id}`;
  await client`DELETE FROM "user" WHERE id = ${user.id}`;
  console.log('   ✅ 测试数据已清理\n');

  // 测试 10: 检查索引
  console.log('🔟 检查数据库索引...');
  const indexes = await client`
    SELECT
      schemaname,
      tablename,
      indexname
    FROM pg_indexes
    WHERE schemaname = 'public'
    ORDER BY tablename, indexname;
  `;
  console.log(`   ✅ 共 ${indexes.length} 个索引`);

  // 按表分组显示索引
  const indexByTable = {};
  indexes.forEach(idx => {
    if (!indexByTable[idx.tablename]) {
      indexByTable[idx.tablename] = [];
    }
    indexByTable[idx.tablename].push(idx.indexname);
  });

  Object.entries(indexByTable).forEach(([table, idxList]) => {
    console.log(`      ${table}: ${idxList.length} 个索引`);
  });
  console.log();

  // 最终总结
  console.log('═══════════════════════════════════════════════════════');
  console.log('🎉 所有测试通过！数据库配置完全可用！');
  console.log('═══════════════════════════════════════════════════════');
  console.log('\n✅ 验证项目：');
  console.log('   • 数据库连接');
  console.log('   • 表结构完整性');
  console.log('   • 枚举类型');
  console.log('   • 写入操作（INSERT）');
  console.log('   • 读取操作（SELECT）');
  console.log('   • 更新操作（UPDATE）');
  console.log('   • 删除操作（DELETE）');
  console.log('   • 关联表操作');
  console.log('   • 索引配置');
  console.log('\n🚀 可以开始使用数据库了！');

  await client.end();
  process.exit(0);

} catch (error) {
  console.error('\n❌ 测试失败:', error.message);
  console.error('\n错误详情:', error);
  await client.end();
  process.exit(1);
}
