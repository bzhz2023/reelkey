import assert from "node:assert/strict";

import {
  buildPromptWithImageReferenceNotes,
  findActiveImageReferenceRange,
  getImageReferenceLabel,
  insertImageReferenceLabel,
} from "./image-prompt-references";

assert.equal(getImageReferenceLabel(0, "zh"), "@图1");
assert.equal(getImageReferenceLabel(1, "en"), "@Image 2");

assert.deepEqual(findActiveImageReferenceRange("让 @", 3), {
  start: 2,
  end: 3,
});

assert.deepEqual(findActiveImageReferenceRange("让 @图", 4), {
  start: 2,
  end: 4,
});

assert.equal(findActiveImageReferenceRange("让 @图1 运动", 7), null);

assert.deepEqual(
  insertImageReferenceLabel({
    prompt: "让 @ 往前走",
    selectionStart: 3,
    selectionEnd: 3,
    label: "@图1",
  }),
  {
    prompt: "让 @图1 往前走",
    cursorPosition: 5,
  },
);

assert.deepEqual(
  insertImageReferenceLabel({
    prompt: "Use @Imas background",
    selectionStart: 9,
    selectionEnd: 9,
    label: "@Image 2",
  }),
  {
    prompt: "Use @Image 2 background",
    cursorPosition: 12,
  },
);

assert.equal(
  buildPromptWithImageReferenceNotes({
    prompt: "让 @图1 看向 @图2",
    imageCount: 3,
    locale: "zh",
  }),
  "图片引用说明：@图1 指第 1 张上传图片；@图2 指第 2 张上传图片。\n\n让 @图1 看向 @图2",
);

assert.equal(
  buildPromptWithImageReferenceNotes({
    prompt: "Use @Image 1 as the subject",
    imageCount: 2,
    locale: "en",
  }),
  "Image reference notes: @Image 1 refers to uploaded image 1.\n\nUse @Image 1 as the subject",
);
