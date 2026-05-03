import type { Locale } from "@/config/i18n-config";

export const metadata = {
    title: "Privacy Policy - ReelKey",
    description: "Privacy Policy for ReelKey",
};

export default async function PrivacyPage({
    params,
}: {
    params: Promise<{ locale: Locale }>;
}) {
    const { locale } = await params;

    return (
        <div className="container mx-auto max-w-4xl py-12 md:py-24">
            <div className="prose prose-gray dark:prose-invert max-w-none">
                {locale === "zh" ? (
                    <>
                        <h1>隐私政策</h1>
                        <p className="lead">生效日期：2026年5月3日</p>

                        <h2>1. 引言</h2>
                        <p>
                            ReelKey（"我们"）非常重视您的隐私。本隐私政策说明了当您使用我们的服务时，我们如何收集、使用、披露和保护您的信息。ReelKey 是一个 BYOK（自带 API Key）AI 视频生成工作台，您使用自己的 fal.ai API Key 直接向 AI 提供商发起请求，我们的服务器不存储您的密钥。
                        </p>

                        <h2>2. 我们收集的信息</h2>
                        <p>我们仅收集以下必要信息：</p>
                        <ul>
                            <li><strong>账户信息：</strong>当您通过 Google OAuth 注册时，我们收集您的电子邮件地址、用户名和头像。</li>
                            <li><strong>许可证信息：</strong>您的购买记录和许可证状态，用于验证您的访问权限。</li>
                            <li><strong>视频生成记录：</strong>您提交的文本提示词、选择的模型参数、生成的视频文件 URL 及生成时间。我们不收集视频的实际内容用于训练目的。</li>
                            <li><strong>使用数据：</strong>IP 地址、浏览器类型、访问时间等基本技术信息，用于安全防护和服务改进。</li>
                            <li><strong>支付信息：</strong>支付处理由 Creem（creem.io）完成。我们不存储您的信用卡号或支付凭据，仅接收 Creem 提供的购买确认和客户 ID。</li>
                        </ul>

                        <h2>3. API Key 的存储与使用</h2>
                        <p>
                            <strong>您的 fal.ai API Key 仅存储在您自己的浏览器 localStorage 中，从不传输到我们的服务器或数据库。</strong>
                        </p>
                        <p>具体机制如下：</p>
                        <ul>
                            <li>API Key 存储在您设备浏览器的 localStorage 中，由您本地保管。</li>
                            <li>当您发起视频生成时，您的浏览器将 Key 附加在请求头中发送到我们的代理接口。</li>
                            <li>我们的服务器仅在该单次请求的内存中使用此 Key 转发调用至 fal.ai，请求结束后立即丢弃，不做任何持久化存储。</li>
                            <li>我们的数据库中不存在任何 API Key 的记录。</li>
                            <li>您可以随时通过浏览器设置清除 localStorage 来删除本地存储的 Key。</li>
                        </ul>

                        <h2>4. 我们如何使用您的信息</h2>
                        <ul>
                            <li>提供、维护和改进我们的服务。</li>
                            <li>验证您的许可证状态并解锁相应功能。</li>
                            <li>将您生成的视频文件存储至云端（仅限付费用户的永久存储功能）。</li>
                            <li>向您发送服务通知和安全警报。</li>
                            <li>检测和防止欺诈及滥用行为。</li>
                        </ul>

                        <h2>5. 第三方服务</h2>
                        <p>我们不出售您的个人信息。为运营服务，我们使用以下第三方提供商：</p>
                        <ul>
                            <li><strong>fal.ai</strong>：AI 视频生成提供商。您的生成请求通过您自己的 API Key 直接发送至 fal.ai，fal.ai 的计费直接关联您的 fal.ai 账户，与 ReelKey 无关。请查阅 fal.ai 的隐私政策了解其数据处理方式。</li>
                            <li><strong>Cloudflare R2</strong>：视频文件云端存储（付费用户的永久存储功能）。</li>
                            <li><strong>Creem（creem.io）</strong>：支付处理和许可证管理。</li>
                            <li><strong>Google OAuth</strong>：账户登录认证。</li>
                            <li><strong>Vercel</strong>：网站托管和部署。</li>
                            <li><strong>Resend</strong>：事务性邮件发送（如购买确认邮件）。</li>
                        </ul>
                        <p>以上服务提供商仅在其提供服务所必要的范围内处理您的数据，我们要求其遵守适用的数据保护法律。</p>

                        <h2>6. 浏览器本地存储</h2>
                        <p>
                            我们使用浏览器 localStorage 在您的设备上本地存储您的 fal.ai API Key。此数据仅存在于您的设备上，ReelKey 的服务器无法访问。如果您清除浏览器数据或使用无痕模式，该 Key 将不再可用，您需要重新输入。
                        </p>

                        <h2>7. 数据安全</h2>
                        <p>
                            我们采取合理的技术和组织措施保护您的信息，包括 HTTPS 加密传输和访问控制。但任何互联网传输方式都无法保证 100% 安全，请您也妥善保管好自己的账户凭据。
                        </p>

                        <h2>8. 您的权利</h2>
                        <p>
                            根据适用法律（包括 GDPR 和美国各州隐私法律），您可能有权访问、更正、删除或导出我们持有的您的个人信息。请通过 privacy@reelkey.app 联系我们行使上述权利。
                        </p>

                        <h2>9. 儿童隐私</h2>
                        <p>
                            本服务不面向 13 岁以下（或您所在地区适用法律规定年龄以下）的儿童。如果我们发现收集了儿童的个人信息，我们将尽快删除。
                        </p>

                        <h2>10. 政策变更</h2>
                        <p>
                            我们可能会不时更新本隐私政策。如有重大变更，我们将通过服务内通知或电子邮件提前告知您。继续使用服务即表示您接受更新后的政策。
                        </p>

                        <h2>11. 联系我们</h2>
                        <p>
                            如对本隐私政策有任何疑问，请联系：<a href="mailto:privacy@reelkey.app">privacy@reelkey.app</a>
                        </p>
                    </>
                ) : (
                    <>
                        <h1>Privacy Policy</h1>
                        <p className="lead">Effective Date: May 3, 2026</p>

                        <h2>1. Introduction</h2>
                        <p>
                            ReelKey ("we" or "us") values your privacy. This Privacy Policy explains how we collect, use, disclose, and protect your information when you use our services. ReelKey is a BYOK (Bring Your Own Key) AI video generation workspace. You connect your own fal.ai API key, and all generation requests are billed directly to your fal.ai account — our servers do not store your key.
                        </p>

                        <h2>2. Information We Collect</h2>
                        <p>We collect only the following necessary information:</p>
                        <ul>
                            <li><strong>Account Information:</strong> When you register via Google OAuth, we collect your email address, username, and profile picture.</li>
                            <li><strong>License Information:</strong> Your purchase record and license status, used to verify your access entitlements.</li>
                            <li><strong>Video Generation Records:</strong> The text prompts you submit, model parameters you select, generated video file URLs, and generation timestamps. We do not use your video content for model training.</li>
                            <li><strong>Usage Data:</strong> IP address, browser type, and access times for security and service improvement purposes.</li>
                            <li><strong>Payment Information:</strong> Payment processing is handled entirely by Creem (creem.io). We do not store your credit card number or payment credentials. We receive only a purchase confirmation and customer ID from Creem.</li>
                        </ul>

                        <h2>3. Your API Key — How It Is Stored and Used</h2>
                        <p>
                            <strong>Your fal.ai API key is stored solely in your browser's localStorage. It is never transmitted to or stored on our servers or databases.</strong>
                        </p>
                        <p>Here is exactly how it works:</p>
                        <ul>
                            <li>Your API key is stored locally in your device's browser localStorage, under your own control.</li>
                            <li>When you start a video generation, your browser includes the key in the request header sent to our proxy endpoint.</li>
                            <li>Our server uses the key in-memory for that single request to forward the call to fal.ai, then immediately discards it. No persistent storage occurs.</li>
                            <li>Our database contains no record of your API key at any point.</li>
                            <li>You can delete the locally stored key at any time by clearing your browser's localStorage or using the key management panel in your account settings.</li>
                        </ul>

                        <h2>4. How We Use Your Information</h2>
                        <ul>
                            <li>To provide, maintain, and improve our services.</li>
                            <li>To verify your license status and unlock the corresponding features.</li>
                            <li>To store your generated video files in the cloud (permanent storage feature for paid users only).</li>
                            <li>To send you service notifications and security alerts.</li>
                            <li>To detect and prevent fraud and abuse.</li>
                        </ul>

                        <h2>5. Third-Party Services</h2>
                        <p>We do not sell your personal information. To operate our service, we use the following third-party providers:</p>
                        <ul>
                            <li><strong>fal.ai</strong>: AI video generation provider. Your generation requests are forwarded to fal.ai using your own API key. fal.ai bills costs directly to your fal.ai account, not to ReelKey. Please review fal.ai's privacy policy for details on how they handle your data.</li>
                            <li><strong>Cloudflare R2</strong>: Cloud storage for generated video files (permanent storage feature for paid users).</li>
                            <li><strong>Creem (creem.io)</strong>: Payment processing and license management.</li>
                            <li><strong>Google OAuth</strong>: Account authentication.</li>
                            <li><strong>Vercel</strong>: Website hosting and deployment.</li>
                            <li><strong>Resend</strong>: Transactional email delivery (e.g., purchase confirmation emails).</li>
                        </ul>
                        <p>Each provider processes your data only to the extent necessary to provide their service, and we require them to comply with applicable data protection laws.</p>

                        <h2>6. Browser Local Storage</h2>
                        <p>
                            We use your browser's localStorage to store your fal.ai API key locally on your device. This data exists only on your device — ReelKey's servers have no access to it. If you clear your browser data or use incognito mode, the key will no longer be available and you will need to re-enter it.
                        </p>

                        <h2>7. Data Security</h2>
                        <p>
                            We implement reasonable technical and organizational measures to protect your information, including HTTPS encryption and access controls. However, no internet transmission method is 100% secure. Please also take care to protect your own account credentials.
                        </p>

                        <h2>8. Your Rights</h2>
                        <p>
                            Depending on applicable laws (including GDPR and US state privacy laws), you may have the right to access, correct, delete, or export the personal information we hold about you. Please contact us at <a href="mailto:privacy@reelkey.app">privacy@reelkey.app</a> to exercise these rights.
                        </p>

                        <h2>9. Children's Privacy</h2>
                        <p>
                            Our services are not intended for children under 13 (or the applicable age in your jurisdiction). If we discover we have collected personal information from a child, we will delete it promptly.
                        </p>

                        <h2>10. Changes to This Policy</h2>
                        <p>
                            We may update this Privacy Policy from time to time. If we make material changes, we will notify you via an in-service notice or email before the changes take effect. Your continued use of the service after notification constitutes acceptance of the updated policy.
                        </p>

                        <h2>11. Contact Us</h2>
                        <p>
                            If you have any questions about this Privacy Policy, please contact us at: <a href="mailto:privacy@reelkey.app">privacy@reelkey.app</a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
