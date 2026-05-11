export type PromptReferenceLocale = "en" | "zh";

export interface PromptReferenceRange {
  start: number;
  end: number;
}

export interface AssetReferenceNote {
  label: string;
  kind: "image" | "subject";
  name?: string;
  imageIndexes: number[];
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

function formatZhIndexes(indexes: number[]) {
  return indexes.join("、");
}

function formatEnIndexes(indexes: number[]) {
  if (indexes.length <= 1) return `${indexes[0] ?? ""}`;
  if (indexes.length === 2) return `${indexes[0]} and ${indexes[1]}`;
  return `${indexes.slice(0, -1).join(", ")}, and ${indexes[indexes.length - 1]}`;
}

export function buildPromptWithAssetReferenceNotes({
  prompt,
  references,
  locale,
}: {
  prompt: string;
  references: AssetReferenceNote[];
  locale: PromptReferenceLocale;
}) {
  const activeReferences = references.filter((reference) =>
    prompt.includes(reference.label),
  );

  if (activeReferences.length === 0) return prompt;

  const notes = activeReferences.map((reference) => {
    if (locale === "zh") {
      if (reference.kind === "subject") {
        const name = reference.name || reference.label.replace(/^@/, "");
        return `${reference.label} 是${name}，由第 ${formatZhIndexes(reference.imageIndexes)} 张上传图片共同描述`;
      }
      return `${reference.label} 指第 ${reference.imageIndexes[0]} 张上传图片`;
    }

    if (reference.kind === "subject") {
      const name = reference.name || reference.label.replace(/^@/, "");
      return `${reference.label} is ${name}, described by uploaded images ${formatEnIndexes(reference.imageIndexes)}`;
    }
    return `${reference.label} refers to uploaded image ${reference.imageIndexes[0]}`;
  });

  const prefix = locale === "zh" ? "引用说明：" : "Reference notes: ";
  const separator = locale === "zh" ? "；" : "; ";
  const suffix = locale === "zh" ? "。" : ".";

  return `${prefix}${notes.join(separator)}${suffix}\n\n${prompt}`;
}
