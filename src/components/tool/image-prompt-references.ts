export type PromptReferenceLocale = "en" | "zh";

export interface PromptReferenceRange {
  start: number;
  end: number;
}

export function getImageReferenceLabel(
  index: number,
  locale: PromptReferenceLocale,
) {
  return locale === "zh" ? `@图${index + 1}` : `@Image ${index + 1}`;
}

export function findActiveImageReferenceRange(
  prompt: string,
  cursorPosition: number,
): PromptReferenceRange | null {
  const beforeCursor = prompt.slice(0, cursorPosition);
  const match = /(^|\s)(@[^\s@]*)$/.exec(beforeCursor);
  if (!match) return null;

  const token = match[2];
  const start = beforeCursor.length - token.length;
  return { start, end: cursorPosition };
}

export function insertImageReferenceLabel({
  prompt,
  selectionStart,
  selectionEnd,
  label,
}: {
  prompt: string;
  selectionStart: number;
  selectionEnd: number;
  label: string;
}) {
  const activeRange = findActiveImageReferenceRange(prompt, selectionStart);
  const start = activeRange?.start ?? selectionStart;
  const end = Math.max(activeRange?.end ?? selectionEnd, selectionEnd);
  const needsSpace = prompt[end] && !/\s/.test(prompt[end]);
  const insertedText = `${label}${needsSpace ? " " : ""}`;
  const nextPrompt =
    prompt.slice(0, start) + insertedText + prompt.slice(end);

  return {
    prompt: nextPrompt,
    cursorPosition: start + insertedText.length,
  };
}

export function buildPromptWithImageReferenceNotes({
  prompt,
  imageCount,
  locale,
}: {
  prompt: string;
  imageCount: number;
  locale: PromptReferenceLocale;
}) {
  const referencedIndexes = Array.from({ length: imageCount }, (_, index) => {
    const label = getImageReferenceLabel(index, locale);
    return prompt.includes(label) ? index : null;
  }).filter((index): index is number => index !== null);

  if (referencedIndexes.length === 0) return prompt;

  const notes =
    locale === "zh"
      ? `图片引用说明：${referencedIndexes
          .map((index) => `${getImageReferenceLabel(index, locale)} 指第 ${index + 1} 张上传图片`)
          .join("；")}。`
      : `Image reference notes: ${referencedIndexes
          .map((index) => `${getImageReferenceLabel(index, locale)} refers to uploaded image ${index + 1}`)
          .join("; ")}.`;

  return `${notes}\n\n${prompt}`;
}
