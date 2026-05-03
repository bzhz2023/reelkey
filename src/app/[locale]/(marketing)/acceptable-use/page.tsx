import type { Locale } from "@/config/i18n-config";
import { buildAlternates } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}) {
  const { locale } = await params;
  const alternates = buildAlternates("/acceptable-use", locale);

  return {
    title: "Acceptable Use Policy - ReelKey",
    description: "ReelKey Acceptable Use Policy — rules for safe and lawful use of our AI video generation service.",
    alternates: {
      canonical: alternates.canonical,
      languages: alternates.languages,
    },
  };
}

export default async function AcceptableUsePage({
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
                        <h1>可接受使用政策</h1>
                        <p className="lead">生效日期：2026年5月3日</p>

                        <p>
                            本可接受使用政策（"AUP"）规定了使用 ReelKey 服务时允许和禁止的行为。使用本服务即表示您同意遵守本政策。违反本政策可能导致账户暂停或终止。
                        </p>

                        <h2>1. 禁止生成的内容</h2>
                        <p>您不得使用 ReelKey 生成以下内容：</p>

                        <h3>1.1 违法内容</h3>
                        <ul>
                            <li>违反任何适用法律法规的内容。</li>
                            <li>儿童性剥削或虐待材料（CSAM）——绝对禁止，将立即举报至相关执法机构。</li>
                            <li>侵犯版权、商标或其他知识产权的内容。</li>
                            <li>诽谤、侮辱或其他违反名誉权法律的内容。</li>
                        </ul>

                        <h3>1.2 NSFW 与成人内容</h3>
                        <ul>
                            <li><strong>明确禁止任何色情、性暗示或成人性行为内容。</strong></li>
                            <li>裸露或性描述内容。</li>
                            <li>以性方式展示真实或虚构人物的内容。</li>
                        </ul>

                        <h3>1.3 有害与危险内容</h3>
                        <ul>
                            <li>宣扬、美化或指导暴力行为、自残或自杀的内容。</li>
                            <li>恐怖主义、极端主义或仇恨煽动内容。</li>
                            <li>针对个人或群体的骚扰、威胁或恐吓内容。</li>
                            <li>基于种族、民族、宗教、性别、性取向、残疾或其他受保护特征的仇恨言论。</li>
                        </ul>

                        <h3>1.4 Deepfake 与欺骗性内容</h3>
                        <ul>
                            <li>未经本人同意，将真实人物的面部或声音合成于视频中（deepfake）。</li>
                            <li>冒充真实人物或机构，意图欺骗或误导的内容。</li>
                            <li>旨在传播虚假信息或操纵公众舆论的内容。</li>
                        </ul>

                        <h3>1.5 其他禁止内容</h3>
                        <ul>
                            <li>侵犯他人隐私权的内容。</li>
                            <li>用于欺诈、网络钓鱼或其他网络犯罪的内容。</li>
                            <li>对动物造成伤害或虐待的内容。</li>
                        </ul>

                        <h2>2. 禁止的使用行为</h2>
                        <ul>
                            <li>通过自动化手段批量生成内容以规避使用限制。</li>
                            <li>将 ReelKey 的访问权限转售或分享给未授权的第三方。</li>
                            <li>干扰、破坏或对服务基础设施进行攻击。</li>
                            <li>尝试逆向工程本平台。</li>
                        </ul>

                        <h2>3. 内容审核</h2>
                        <p>
                            ReelKey 对用户提交的文本提示词进行内容审核，以检测违反本政策的请求。违规请求将被拒绝，多次违规将导致账户暂停。
                        </p>

                        <h2>4. 举报违规</h2>
                        <p>
                            如果您发现违反本政策的内容或行为，请联系 <a href="mailto:support@reelkey.app">support@reelkey.app</a> 举报。
                        </p>

                        <h2>5. 执行措施</h2>
                        <p>违反本政策可能导致：</p>
                        <ul>
                            <li>警告通知。</li>
                            <li>暂停账户访问权限。</li>
                            <li>永久终止账户（严重违规不予退款）。</li>
                            <li>向执法机构举报（适用于违法内容）。</li>
                        </ul>

                        <h2>6. 政策更新</h2>
                        <p>
                            我们可能会根据需要更新本政策。重大变更将通过服务内通知告知。
                        </p>

                        <h2>7. 联系我们</h2>
                        <p>
                            如有疑问，请联系：<a href="mailto:support@reelkey.app">support@reelkey.app</a>
                        </p>
                    </>
                ) : (
                    <>
                        <h1>Acceptable Use Policy</h1>
                        <p className="lead">Effective Date: May 3, 2026</p>

                        <p>
                            This Acceptable Use Policy ("AUP") defines what is and is not permitted when using ReelKey's services. By using our service, you agree to comply with this policy. Violations may result in account suspension or termination.
                        </p>

                        <h2>1. Prohibited Content</h2>
                        <p>You may not use ReelKey to generate the following content:</p>

                        <h3>1.1 Illegal Content</h3>
                        <ul>
                            <li>Content that violates any applicable laws or regulations.</li>
                            <li>Child sexual abuse material (CSAM) — absolutely prohibited and will be immediately reported to law enforcement.</li>
                            <li>Content that infringes copyrights, trademarks, or other intellectual property rights.</li>
                            <li>Defamatory or libelous content.</li>
                        </ul>

                        <h3>1.2 NSFW and Adult Content</h3>
                        <ul>
                            <li><strong>Any pornographic, sexually explicit, or adult sexual content is strictly prohibited.</strong></li>
                            <li>Nudity or sexual depictions of any kind.</li>
                            <li>Content that depicts real or fictional persons in a sexual manner.</li>
                        </ul>

                        <h3>1.3 Harmful and Dangerous Content</h3>
                        <ul>
                            <li>Content that promotes, glorifies, or instructs violence, self-harm, or suicide.</li>
                            <li>Terrorist, extremist, or hate-inciting content.</li>
                            <li>Content that harasses, threatens, or intimidates individuals or groups.</li>
                            <li>Hate speech targeting race, ethnicity, religion, gender, sexual orientation, disability, or other protected characteristics.</li>
                        </ul>

                        <h3>1.4 Deepfakes and Deceptive Content</h3>
                        <ul>
                            <li>Deepfakes — placing a real person's face or voice into video without their consent.</li>
                            <li>Content impersonating real people or organizations with intent to deceive.</li>
                            <li>Disinformation or content designed to manipulate public opinion through deception.</li>
                        </ul>

                        <h3>1.5 Other Prohibited Content</h3>
                        <ul>
                            <li>Content that violates the privacy rights of others.</li>
                            <li>Content intended for fraud, phishing, or other cybercrime.</li>
                            <li>Content depicting harm or cruelty to animals.</li>
                        </ul>

                        <h2>2. Prohibited Behaviors</h2>
                        <ul>
                            <li>Using automation to bulk-generate content in ways that circumvent usage limits.</li>
                            <li>Reselling or sharing ReelKey access with unauthorized third parties.</li>
                            <li>Interfering with, disrupting, or attacking the service infrastructure.</li>
                            <li>Attempting to reverse-engineer the platform.</li>
                        </ul>

                        <h2>3. Content Moderation</h2>
                        <p>
                            ReelKey screens user-submitted text prompts to detect requests that violate this policy. Non-compliant requests will be rejected. Repeated violations will result in account suspension.
                        </p>

                        <h2>4. Reporting Violations</h2>
                        <p>
                            If you observe content or behavior that violates this policy, please report it to <a href="mailto:support@reelkey.app">support@reelkey.app</a>.
                        </p>

                        <h2>5. Enforcement</h2>
                        <p>Violations of this policy may result in:</p>
                        <ul>
                            <li>A warning notice.</li>
                            <li>Temporary suspension of account access.</li>
                            <li>Permanent account termination (with no refund for serious violations).</li>
                            <li>Reporting to law enforcement (for illegal content).</li>
                        </ul>

                        <h2>6. Policy Updates</h2>
                        <p>
                            We may update this policy as needed. Material changes will be communicated via an in-service notice.
                        </p>

                        <h2>7. Contact Us</h2>
                        <p>
                            Questions? Contact us at: <a href="mailto:support@reelkey.app">support@reelkey.app</a>
                        </p>
                    </>
                )}
            </div>
        </div>
    );
}
