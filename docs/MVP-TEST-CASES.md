# ReelKey MVP 全流程测试用例

最后更新：2026-05-08

## 测试范围

本测试清单覆盖 MVP 主链路。Creem BYOK 买断支付已完成真实链路验证：真实
`checkout.completed` webhook 可写入 `byok_entitlements` 并授予 lifetime access。

## 前置条件

- 本地或预发环境可访问 ReelKey。
- 测试账号 A：免费用户，无 lifetime access。
- 测试账号 B：买断用户，`byok_entitlements` 有有效 lifetime access。
- 浏览器 localStorage 可清空和重新写入 fal.ai API Key。
- fal.ai 测试 Key 至少准备三种：有效 Key、无效 Key、余额不足或低余额 Key（如可用）。
- R2 环境变量已配置，Bucket Public URL 和 CORS 可访问。

## P0 用例

| ID | 场景 | 步骤 | 预期 |
| --- | --- | --- | --- |
| RK-MVP-001 | 首次进入生成页无 Key | 清空 localStorage，登录免费用户，打开 `/zh/text-to-video`，点击生成 | 弹出 fal.ai Key 弹框；不会创建生成任务 |
| RK-MVP-002 | 保存有效 Key | 在 Key 弹框输入有效 fal.ai Key 并保存 | 弹框关闭；Key 只写入 localStorage；刷新后仍显示已连接状态 |
| RK-MVP-003 | 保存无效 Key | 输入无效 fal.ai Key 并保存 | 校验失败；提示 Key 无效；不会写入有效状态 |
| RK-MVP-004 | 免费用户可用模型 | 免费用户打开生成页模型下拉 | 全部模型可见；免费模型可选；付费模型带 PRO 标记 |
| RK-MVP-005 | 免费用户点付费模型 | 免费用户选择付费模型 | 打开买断弹框；关闭后模型选择恢复到原免费模型 |
| RK-MVP-006 | 买断用户可用模型 | 买断用户打开生成页模型下拉并选择付费模型 | 可直接选择付费模型；不弹买断弹框 |
| RK-MVP-007 | 免费用户每月 5 次限制 | 免费用户用有效 Key 完成或发起 5 次生成后，再提交第 6 次 | 后端返回 `FREE_MONTHLY_LIMIT_REACHED`；前端打开买断弹框；不会创建第 6 个有效生成任务 |
| RK-MVP-008 | 文生视频生成 | 用 Kling 2.5 或 Wan 2.5 提交文本 prompt | 任务进入生成中；轮询正常；完成后历史列表出现视频 |
| RK-MVP-009 | 图生视频生成 | 上传图片并提交图生视频 | 图片上传成功；请求带 image URL；完成后历史列表出现视频 |
| RK-MVP-010 | 首尾帧生成入口 | 从 landing 和 tool page 分别进入首尾帧生成 | 两处入口一致；生成页有首帧/尾帧上传控件；未上传必填图时不能提交 |
| RK-MVP-011 | 模型参数动态变化 | 切换 3 个不同模型 | 画面比例、时长、分辨率、音频等控件按模型能力变化；不支持的参数不展示或不可选 |
| RK-MVP-012 | fal.ai Key 失效恢复 | 任务生成中时把 localStorage Key 换成无效 Key，触发状态刷新，再保存有效 Key | 弹 Key 弹框；视频不被标记失败；保存有效 Key 后继续轮询原任务 |
| RK-MVP-013 | 免费用户存储策略 | 免费用户生成完成后检查视频记录 | `video_url` 使用 fal.ai 原始 URL；`parameters.storage.status=provider_temporary`；不上传 R2 |
| RK-MVP-014 | 买断用户 R2 存储 | 买断用户生成完成后检查视频记录和播放 | `video_url` 为 R2 URL；`original_video_url` 为 fal.ai URL；`parameters.storage.status=uploaded`；视频可播放 |
| RK-MVP-015 | R2 上传失败兜底 | 临时配置错误 R2 或模拟 upload 失败，买断用户生成完成 | 视频仍为 COMPLETED；`video_url` 回退 fal.ai URL；`parameters.storage.status=upload_failed`；页面可播放或显示原始 URL |
| RK-MVP-016 | 成本显示来源 | 查看 API 用量页 | 已完成视频展示费用；有实际成本时标记“实际”，否则标记“估算”；失败任务为未计费 |
| RK-MVP-017 | 失败任务不计费 | 使用余额不足 Key 或故意触发 provider 失败 | 视频标记失败；API 用量页显示未计费；免费次数不因失败记录被消耗 |
| RK-MVP-018 | 我的创作性能 | 从 landing 头像菜单进入我的创作，再切换筛选 | 首屏加载有骨架或旧数据占位；筛选体感即时；无明显白屏 |
| RK-MVP-019 | 页面跳转性能 | landing、生成页、我的创作之间来回跳转 | 跳转不出现长时间空白；无 hydration error；控制台无新增错误 |
| RK-MVP-020 | 移动端主流程 | 手机视口打开 landing、生成页、我的创作 | 布局不遮挡；主要按钮可点击；弹框完整展示并可关闭 |

## 支付通过后补测

| ID | 场景 | 步骤 | 预期 |
| --- | --- | --- | --- |
| RK-PAY-001 | 早鸟买断 checkout | 免费用户点击 $29 买断入口 | 打开 Creem checkout；产品、价格、用户 reference 正确 |
| RK-PAY-002 | Webhook 授权 | 完成真实测试支付并等待 webhook | `byok_entitlements` 写入有效记录；用户刷新后变为买断状态 |
| RK-PAY-003 | 买断权益即时生效 | 支付成功后回到生成页 | 可选择全部模型；无限次生成；完成视频上传 R2 |
| RK-PAY-004 | 重复 webhook | 重放同一 Creem 事件 | 不重复写入或产生错误授权；日志显示幂等处理 |

支付验证备注：

- Creem Dashboard 的 **Send test event** 只能验证 webhook 连通和签名；测试事件可能没有真实 product ID 和 `metadata.referenceId`，不能证明授权落库。
- 完整支付验收必须使用真实 checkout，或在 Creem Dashboard 重放真实 `checkout.completed` 事件。
- 有效授权记录应包含 `user_id`、`status = active`、lifetime product ID、`order_id`、`checkout_id` 和 metadata 里的 `referenceId`。

## 暂不测或后续版本

- 多模型同 prompt 并行对比生成。
- 免费用户 7 天历史强限制。
- 历史搜索、批量删除、批量下载。
- 跨设备 API Key 同步。
