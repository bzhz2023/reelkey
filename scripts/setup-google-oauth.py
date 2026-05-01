#!/usr/bin/env python3
"""
自动配置 Google OAuth 客户端
使用 Google Cloud API 创建 OAuth 同意屏幕和客户端凭据
"""

import subprocess
import json
import sys

def get_access_token():
    """获取 gcloud access token"""
    result = subprocess.run(
        ['gcloud', 'auth', 'print-access-token'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"错误: 无法获取 access token\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def get_project_number(project_id):
    """获取项目编号"""
    result = subprocess.run(
        ['gcloud', 'projects', 'describe', project_id, '--format=value(projectNumber)'],
        capture_output=True,
        text=True
    )
    if result.returncode != 0:
        print(f"错误: 无法获取项目编号\n{result.stderr}")
        sys.exit(1)
    return result.stdout.strip()

def main():
    project_id = "reelkey-1777630710"

    print("🚀 开始配置 Google OAuth...")
    print(f"📦 项目 ID: {project_id}")

    # 获取凭据
    token = get_access_token()
    project_num = get_project_number(project_id)

    print(f"📊 项目编号: {project_num}")
    print("\n⚠️  注意: Google OAuth 同意屏幕必须首次在网页端配置")
    print(f"🌐 请访问: https://console.cloud.google.com/apis/credentials/consent?project={project_id}")
    print("\n配置步骤:")
    print("1. 用户类型: 选择 '外部'")
    print("2. 应用名称: Reelkey")
    print("3. 用户支持电子邮件: bzfree2003@gmail.com")
    print("4. 授权域名: localhost (开发阶段)")
    print("5. 作用域: userinfo.email, userinfo.profile, openid")
    print("6. 测试用户: bzfree2003@gmail.com")
    print("\n完成后，运行以下命令创建 OAuth 客户端:")
    print(f"gcloud alpha iap oauth-clients create projects/{project_num}/brands/{project_num} --display_name='Reelkey Web'")

if __name__ == "__main__":
    main()
