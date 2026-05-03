import type { Locale } from "@/config/i18n-config";

export const metadata = {
    title: "Terms of Service - ReelKey",
    description: "Terms of Service for ReelKey",
};

export default async function TermsPage({
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
                        <h1>服务条款</h1>
                        <p className="lead">生效日期：2026年5月3日</p>

                        <h2>1. 接受条款</h2>
                        <p>
                            欢迎使用 ReelKey（"我们"、"本平台"）。访问或使用我们的网站和服务，即表示您同意受本服务条款（"条款"）的约束。如果您不同意本条款的任何部分，请勿使用本服务。
                        </p>

                        <h2>2. 服务描述</h2>
                        <p>
                            ReelKey 是一个 BYOK（自带 API Key）AI 视频生成工作台。您使用自己的 fal.ai API Key，通过本平台界面生成视频内容。ReelKey 提供界面、生成记录和云端存储功能；AI 计算费用由 fal.ai 直接向您的 fal.ai 账户收取，与 ReelKey 无关。
                        </p>
                        <p>
                            我们努力提供稳定的服务，但不保证 AI 生成结果始终符合您的预期，亦不对第三方 AI 提供商的服务质量或可用性承担责任。
                        </p>

                        <h2>3. 许可证与终身访问</h2>
                        <p>
                            购买 ReelKey 终身许可证后，您获得一项个人、不可转让、永久有效的许可，可访问并使用 ReelKey 平台的全部功能，包括未来的功能更新。具体说明如下：
                        </p>
                        <ul>
                            <li><strong>"终身"的含义：</strong>许可证永久有效，无需续费，不设到期日。</li>
                            <li><strong>许可证覆盖范围：</strong>仅覆盖 ReelKey 平台访问权，不包含 fal.ai 的 API 使用费用。</li>
                            <li><strong>服务终止通知：</strong>如果我们决定终止服务，将提前至少 30 天通知，并为近期购买用户提供合理退款。</li>
                            <li><strong>许可证限制：</strong>许可证仅供您个人使用，不得转售、分享或用于商业再分发。</li>
                        </ul>

                        <h2>4. 用户账户</h2>
                        <p>
                            使用部分功能需要注册账户。您负责维护账户信息的保密性，并对该账户下的所有活动负责。请提供准确、完整的注册信息。如发现账户未经授权使用，请立即联系我们。
                        </p>

                        <h2>5. API Key 与第三方服务</h2>
                        <p>
                            使用本服务需要您提供 fal.ai 的 API Key。您理解并同意：
                        </p>
                        <ul>
                            <li>您的 API Key 仅存储在您自己的浏览器本地（localStorage），<strong>不会传输至或存储于 ReelKey 的服务器</strong>。</li>
                            <li>通过您的 API Key 产生的所有 AI 生成费用，由 fal.ai 直接向您的 fal.ai 账户收取，与 ReelKey 无关。</li>
                            <li>本地设备上存储的 Key 数据由您自行负责保管。</li>
                            <li>第三方服务（fal.ai）的可用性、性能和定价由 fal.ai 控制，我们对此不承担责任。</li>
                            <li>您必须遵守 fal.ai 的服务条款和使用政策。</li>
                        </ul>

                        <h2>6. 退款政策</h2>
                        <p>
                            我们为终身许可证提供 <strong>14 天无理由退款</strong>保障。如果 ReelKey 无法按描述正常运行，或您出于任何原因不满意，请在购买后 14 天内发送邮件至 <a href="mailto:support@reelkey.app">support@reelkey.app</a>，我们将全额退款，无需说明理由。
                        </p>
                        <p>
                            14 天后，所有购买均视为最终完成，不再受理退款申请。fal.ai 向您收取的 API 使用费用不在 ReelKey 退款范围内。
                        </p>

                        <h2>7. 使用规范</h2>
                        <p>您同意不使用本服务：</p>
                        <ul>
                            <li>生成违法、有害、威胁、骚扰、诽谤、淫秽或其他违反我们<a href="/acceptable-use">《可接受使用政策》</a>的内容。</li>
                            <li>侵犯任何人的知识产权或其他合法权利。</li>
                            <li>干扰或破坏服务的正常运行。</li>
                            <li>尝试未经授权访问服务或相关系统。</li>
                            <li>规避或绕过技术限制措施。</li>
                        </ul>

                        <h2>8. 知识产权</h2>
                        <p>
                            您保留对上传至本平台的所有原始内容（提示词、图片等）的所有权。对于通过本平台生成的视频内容，在您遵守本条款的前提下，您拥有对该内容的使用、复制和分发权利。ReelKey 平台本身的软件、设计和商标归 ReelKey 所有。
                        </p>

                        <h2>9. 免责声明</h2>
                        <p>
                            本服务按"现状"和"可用"基础提供，不附带任何形式的明示或暗示保证。我们不保证服务将不间断、及时、安全或无错误，亦不对 AI 生成内容的准确性或适用性作出保证。
                        </p>

                        <h2>10. 责任限制</h2>
                        <p>
                            在法律允许的最大范围内，ReelKey 对任何间接、偶然、特殊、后果性或惩罚性损害不承担责任，包括但不限于利润损失、数据丢失或业务中断。我们的全部累计责任不超过您在事件发生前 12 个月内向我们实际支付的费用总额。
                        </p>

                        <h2>11. 条款变更</h2>
                        <p>
                            我们保留修改本条款的权利。重大变更将在生效前通过服务内通知或电子邮件告知您。变更后继续使用服务即表示您接受修改后的条款。
                        </p>

                        <h2>12. 联系我们</h2>
                        <p>
                            如对本条款有任何疑问，请联系：<a href="mailto:support@reelkey.app">support@reelkey.app</a>
                        </p>
                    </>
                ) : (
                    <>
                        <h1>Terms of Service</h1>
                        <p className="lead">Effective Date: May 3, 2026</p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            Welcome to ReelKey ("we," "our," or "us"). By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to any part of these Terms, please do not use our services.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            ReelKey is a BYOK (Bring Your Own Key) AI video generation workspace. You connect your own fal.ai API key and use our interface to generate video content. ReelKey provides the interface, generation history, and cloud storage features. AI generation costs are billed by fal.ai directly to your own fal.ai account and are entirely separate from ReelKey.
                        </p>
                        <p>
                            We strive to provide a reliable service but do not guarantee that AI-generated results will always meet your expectations, nor do we take responsibility for the availability, performance, or pricing of third-party AI providers.
                        </p>

                        <h2>3. License and Lifetime Access</h2>
                        <p>
                            Upon purchasing a ReelKey Lifetime license, you are granted a personal, non-transferable, perpetual license to access and use all features of the ReelKey platform, including future feature updates. Important details:
                        </p>
                        <ul>
                            <li><strong>What "Lifetime" means:</strong> Your license is valid indefinitely with no expiration date and no renewal required.</li>
                            <li><strong>What the license covers:</strong> Access to the ReelKey platform only. It does not include fal.ai API usage costs, which are billed separately by fal.ai.</li>
                            <li><strong>Service discontinuation:</strong> In the unlikely event that ReelKey discontinues service, we will provide at least 30 days' advance notice and offer a reasonable refund for recent purchases.</li>
                            <li><strong>License restrictions:</strong> The license is for your personal use only and may not be resold, shared, or used for commercial redistribution.</li>
                        </ul>

                        <h2>4. User Accounts</h2>
                        <p>
                            To access certain features, you need to register for an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Please provide accurate and complete registration information. If you become aware of any unauthorized use of your account, contact us immediately.
                        </p>

                        <h2>5. API Keys and Third-Party Services</h2>
                        <p>
                            Using this Service requires you to provide your fal.ai API key. You understand and agree that:
                        </p>
                        <ul>
                            <li>Your API key is stored solely in your own browser's localStorage and is <strong>never transmitted to or stored on ReelKey's servers</strong>.</li>
                            <li>All AI generation costs incurred through your API key are billed by fal.ai directly to your fal.ai account and are entirely unrelated to ReelKey.</li>
                            <li>Data stored locally on your device is your sole responsibility to maintain and secure.</li>
                            <li>The availability, performance, and pricing of fal.ai's services are controlled by fal.ai, and we are not responsible for them.</li>
                            <li>You must comply with fal.ai's terms of service and usage policies.</li>
                        </ul>

                        <h2>6. Refund Policy</h2>
                        <p>
                            We offer a <strong>14-day money-back guarantee</strong> on the Lifetime license. If ReelKey does not work as described or you are not satisfied for any reason, contact us at <a href="mailto:support@reelkey.app">support@reelkey.app</a> within 14 days of your purchase date and we will issue a full refund — no questions asked.
                        </p>
                        <p>
                            After 14 days, all purchases are final. fal.ai API usage costs charged to your fal.ai account are not eligible for refund through ReelKey.
                        </p>

                        <h2>7. Acceptable Use</h2>
                        <p>You agree not to use the Service to:</p>
                        <ul>
                            <li>Generate content that is illegal, harmful, threatening, harassing, defamatory, obscene, or otherwise in violation of our <a href="/acceptable-use">Acceptable Use Policy</a>.</li>
                            <li>Infringe upon the intellectual property or other legal rights of any person or entity.</li>
                            <li>Interfere with or disrupt the normal operation of the Service.</li>
                            <li>Attempt to gain unauthorized access to the Service or its related systems.</li>
                            <li>Circumvent or bypass any technical restrictions or security measures.</li>
                        </ul>

                        <h2>8. Intellectual Property</h2>
                        <p>
                            You retain ownership of all original content you upload to the platform (prompts, images, etc.). For video content generated using the platform, you own the right to use, reproduce, and distribute such content, provided you comply with these Terms. The ReelKey platform software, design, and trademarks are owned by ReelKey.
                        </p>

                        <h2>9. Disclaimer of Warranties</h2>
                        <p>
                            The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without any warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free, nor do we make any warranty regarding the accuracy or suitability of AI-generated content.
                        </p>

                        <h2>10. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, ReelKey shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data loss, or business interruption. Our total cumulative liability for all claims shall not exceed the amount of fees actually paid by you to ReelKey in the twelve (12) months preceding the event giving rise to the claim.
                        </p>

                        <h2>11. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms. Material changes will be communicated to you via an in-service notice or email before they take effect. Your continued use of the Service after notification constitutes your acceptance of the modified Terms.
                        </p>

                        <h2>12. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: <a href="mailto:support@reelkey.app">support@reelkey.app</a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
