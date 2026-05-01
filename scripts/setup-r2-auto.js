#!/usr/bin/env node
/**
 * Cloudflare R2 自动化配置脚本
 * 通过 Cloudflare API 创建 R2 credentials
 */

const https = require('https');
const fs = require('fs');
const readline = require('readline');

const ACCOUNT_ID = '99a7580169295945d5e5f17af605d0c8';
const BUCKET_NAME = 'reelkey';
const PUBLIC_URL = 'https://pub-dbd6955e3f9f4ad299471309b659d274.r2.dev';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function createR2Credentials(apiToken) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify({
      name: 'reelkey-api-token'
    });

    const options = {
      hostname: 'api.cloudflare.com',
      port: 443,
      path: `/client/v4/accounts/${ACCOUNT_ID}/r2/credentials`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          const response = JSON.parse(body);
          if (response.success) {
            resolve(response.result);
          } else {
            reject(new Error(JSON.stringify(response.errors)));
          }
        } catch (error) {
          reject(error);
        }
      });
    });

    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function updateEnvFile(accessKeyId, secretAccessKey) {
  const envPath = '/Volumes/ExternalSSD/Projects/reelkey/.env.local';
  let envContent = fs.readFileSync(envPath, 'utf-8');

  const endpoint = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;

  // 更新环境变量
  envContent = envContent.replace(/^STORAGE_ENDPOINT=.*/m, `STORAGE_ENDPOINT=${endpoint}`);
  envContent = envContent.replace(/^STORAGE_REGION=.*/m, `STORAGE_REGION=auto`);
  envContent = envContent.replace(/^STORAGE_ACCESS_KEY=.*/m, `STORAGE_ACCESS_KEY=${accessKeyId}`);
  envContent = envContent.replace(/^STORAGE_SECRET_KEY=.*/m, `STORAGE_SECRET_KEY=${secretAccessKey}`);
  envContent = envContent.replace(/^STORAGE_BUCKET=.*/m, `STORAGE_BUCKET=${BUCKET_NAME}`);
  envContent = envContent.replace(/^STORAGE_DOMAIN=.*/m, `STORAGE_DOMAIN=${PUBLIC_URL}`);

  // 备份
  const backupPath = `${envPath}.backup.${Date.now()}`;
  fs.copyFileSync(envPath, backupPath);
  console.log(`📋 已备份到: ${backupPath}`);

  // 写入
  fs.writeFileSync(envPath, envContent);
  console.log('✅ 环境变量已更新');
}

async function main() {
  console.log('🚀 Cloudflare R2 自动化配置');
  console.log('================================\n');

  console.log('📦 Bucket 信息:');
  console.log(`  - Account ID: ${ACCOUNT_ID}`);
  console.log(`  - Bucket Name: ${BUCKET_NAME}`);
  console.log(`  - Public URL: ${PUBLIC_URL}\n`);

  console.log('🔑 需要 Cloudflare API Token 来创建 R2 credentials\n');
  console.log('📍 获取 API Token:');
  console.log('   1. 访问: https://dash.cloudflare.com/profile/api-tokens');
  console.log('   2. 点击 "Create Token"');
  console.log('   3. 使用 "Edit Cloudflare Workers" 模板或自定义');
  console.log('   4. 确保包含权限: Account > R2 > Edit');
  console.log('   5. 复制生成的 Token\n');

  const apiToken = await question('请输入 Cloudflare API Token: ');

  if (!apiToken || apiToken.trim().length === 0) {
    console.error('❌ API Token 不能为空');
    rl.close();
    process.exit(1);
  }

  console.log('\n🔧 正在创建 R2 credentials...');

  try {
    const credentials = await createR2Credentials(apiToken.trim());

    console.log('\n✅ R2 Credentials 创建成功!\n');
    console.log('📝 凭据信息:');
    console.log(`  Access Key ID: ${credentials.accessKeyId}`);
    console.log(`  Secret Access Key: ${credentials.secretAccessKey}\n`);

    const shouldUpdate = await question('是否自动更新 .env.local? (y/n): ');

    if (shouldUpdate.toLowerCase() === 'y') {
      await updateEnvFile(credentials.accessKeyId, credentials.secretAccessKey);
      console.log('\n🎉 配置完成！');
      console.log('\n📚 下一步:');
      console.log('  1. 重启开发服务器: pnpm dev');
      console.log('  2. 测试视频生成功能');
    } else {
      console.log('\n请手动更新 .env.local:');
      console.log(`STORAGE_ACCESS_KEY=${credentials.accessKeyId}`);
      console.log(`STORAGE_SECRET_KEY=${credentials.secretAccessKey}`);
    }

  } catch (error) {
    console.error('\n❌ 创建失败:', error.message);
    console.log('\n💡 可能的原因:');
    console.log('  1. API Token 权限不足（需要 Account > R2 > Edit）');
    console.log('  2. API Token 已过期');
    console.log('  3. Account ID 不正确');
    console.log('\n🔄 请检查后重试，或手动在 Dashboard 创建:');
    console.log(`   https://dash.cloudflare.com/${ACCOUNT_ID}/r2/api-tokens`);
  }

  rl.close();
}

main().catch(console.error);
