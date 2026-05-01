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
                        <p className="lead">生效日期：2026年2月8日</p>

                        <h2>1. 接受条款</h2>
                        <p>
                            欢迎使用 ReelKey（"我们"、"我们的"或"本平台"）。访问或使用我们的网站和服务，即表示您同意受这些服务条款（"条款"）的约束。如果您不同意这些条款的任何部分，您就没有权利使用我们的服务。
                        </p>

                        <h2>2. 服务描述</h2>
                        <p>
                            ReelKey 是一个 AI 驱动的视频生成平台，允许用户使用自己的 API 密钥通过文本、图片等输入生成视频内容。您需要自行获取并管理第三方 AI 服务的 API 密钥，我们仅作为技术接口帮助您调用这些服务。我们努力提供高质量的服务，但不保证生成的视频总是完全符合您的期望。
                        </p>

                        <h2>3. 用户账户</h2>
                        <p>
                            为了使用某些功能，您可能需要注册账户。您负责维护账户信息的保密性，并对该账户下的所有活动负责。您必须提供准确、完整的信息。
                        </p>

                        <h2>4. API 密钥与第三方服务</h2>
                        <p>
                            使用本服务需要您提供第三方 AI 服务提供商（如 Runway、Kling 等）的 API 密钥。您理解并同意：
                        </p>
                        <ul>
                            <li>您对自己的 API 密钥的安全性和使用负全部责任。</li>
                            <li>通过您的 API 密钥产生的所有费用由您直接向第三方服务提供商支付，与 ReelKey 无关。</li>
                            <li>我们会加密存储您的 API 密钥，但您应定期更换密钥以确保安全。</li>
                            <li>第三方服务的可用性、性能和定价由相应服务提供商控制，我们不对此承担责任。</li>
                            <li>您必须遵守第三方服务提供商的服务条款和使用政策。</li>
                        </ul>

                        <h2>5. 使用规范</h2>
                        <p>您同意不使用本服务从事以下行为：</p>
                        <ul>
                            <li>生成非法、有害、威胁、辱骂、骚扰、诽谤、淫秽或其他令人反感的内容。</li>
                            <li>侵犯任何人的知识产权或其他权利。</li>
                            <li>干扰或破坏服务的完整性或性能。</li>
                            <li>试图未经授权访问服务或其相关系统或网络。</li>
                        </ul>

                        <h2>6. 知识产权</h2>
                        <p>
                            根据本条款，您保留对您上传到本平台的内容的所有权。对于使用本平台生成的视频内容，在您遵守本条款的前提下，我们授予您使用、复制和分发这些内容的权利。
                        </p>

                        <h2>7. 免责声明</h2>
                        <p>
                            本服务按"现状"和"可用"基础提供，不附带任何形式的明示或暗示保证。我们不保证服务将不间断、及时、安全或无错误。
                        </p>

                        <h2>8. 责任限制</h2>
                        <p>
                            在法律允许的最大范围内，ReelKey 不对任何间接、偶然、特殊、后果性或惩罚性损害承担责任，包括但不限于利润损失、数据丢失或商誉受损。
                        </p>

                        <h2>9. 条款变更</h2>
                        <p>
                            我们要保留随时修改这些条款的权利。修改后的条款将在发布到网站后生效。您在变更后继续使用服务即表示您接受修改后的条款。
                        </p>

                        <h2>10. 联系我们</h2>
                        <p>
                            如果您对这些条款有任何疑问，请联系我们：support@reelkey.app
                        </p>
                    </>
                ) : (
                    <>
                        <h1>Terms of Service</h1>
                        <p className="lead">Effective Date: February 8, 2026</p>

                        <h2>1. Acceptance of Terms</h2>
                        <p>
                            Welcome to ReelKey ("we," "our," or "us"). By accessing or using our website and services, you agree to be bound by these Terms of Service ("Terms"). If you do not agree to any part of these Terms, you do not have permission to access the Service.
                        </p>

                        <h2>2. Description of Service</h2>
                        <p>
                            ReelKey is an AI-powered video generation platform that allows users to create video content from text, images, and other inputs using their own API keys. You are responsible for obtaining and managing API keys from third-party AI service providers. We serve only as a technical interface to help you call these services. We strive to provide high-quality services but do not guarantee that generated videos will always meet your exact expectations.
                        </p>

                        <h2>3. User Accounts</h2>
                        <p>
                            To access certain features, you may need to register for an account. You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You must provide accurate and complete information.
                        </p>

                        <h2>4. API Keys and Third-Party Services</h2>
                        <p>
                            Using this Service requires you to provide API keys from third-party AI service providers (such as Runway, Kling, etc.). You understand and agree that:
                        </p>
                        <ul>
                            <li>You are solely responsible for the security and use of your API keys.</li>
                            <li>All costs incurred through your API keys are paid directly by you to the third-party service providers and are not related to ReelKey.</li>
                            <li>We encrypt and store your API keys, but you should regularly rotate your keys to ensure security.</li>
                            <li>The availability, performance, and pricing of third-party services are controlled by the respective service providers, and we are not responsible for them.</li>
                            <li>You must comply with the terms of service and usage policies of third-party service providers.</li>
                        </ul>

                        <h2>5. Usage Guidelines</h2>
                        <p>You agree not to use the Service to:</p>
                        <ul>
                            <li>Generate content that is illegal, harmful, threatening, abusive, harassing, defamatory, obscene, or otherwise objectionable.</li>
                            <li>Infringe upon the intellectual property or other rights of any person or entity.</li>
                            <li>Interfere with or disrupt the integrity or performance of the Service.</li>
                            <li>Attempt to gain unauthorized access to the Service or its related systems or networks.</li>
                        </ul>

                        <h2>6. Intellectual Property</h2>
                        <p>
                            Subject to these Terms, you retain ownership of the content you upload to the platform. For video content generated using the platform, we grant you the right to use, reproduce, and distribute such content, provided you comply with these Terms.
                        </p>

                        <h2>7. Disclaimer of Warranties</h2>
                        <p>
                            The Service is provided on an "AS IS" and "AS AVAILABLE" basis, without any warranties of any kind, express or implied. We do not warrant that the Service will be uninterrupted, timely, secure, or error-free.
                        </p>

                        <h2>8. Limitation of Liability</h2>
                        <p>
                            To the maximum extent permitted by law, ReelKey shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill.
                        </p>

                        <h2>9. Changes to Terms</h2>
                        <p>
                            We reserve the right to modify these Terms at any time. Modified terms will become effective upon posting to the website. Your continued use of the Service after changes constitutes your acceptance of the modified Terms.
                        </p>

                        <h2>10. Contact Us</h2>
                        <p>
                            If you have any questions about these Terms, please contact us at: support@reelkey.app
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
