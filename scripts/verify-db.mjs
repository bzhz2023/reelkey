import postgres from 'postgres';

const client = postgres('postgresql://neondb_owner:npg_ZRlJTiV4e2xC@ep-plain-star-amxxsqjy.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require');

try {
  const result = await client`
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `;

  console.log('✅ Neon 数据库连接成功！');
  console.log(`\n📊 共创建了 ${result.length} 个表：\n`);
  result.forEach((row, index) => {
    console.log(`  ${index + 1}. ${row.table_name}`);
  });

  await client.end();
} catch (error) {
  console.error('❌ 错误:', error.message);
  process.exit(1);
}
