import assert from "node:assert/strict";
import {
  buildUsageSummary,
  formatProviderCost,
  getUsageCostDisplay,
} from "./usage-summary";
import type { Video } from "./types/dashboard";

const baseVideo: Video = {
  uuid: "vid_test",
  userId: "user_test",
  prompt: "A test prompt",
  model: "kling-2.5-turbo",
  provider: "falai",
  status: "completed",
  videoUrl: null,
  thumbnailUrl: null,
  duration: 5,
  aspectRatio: "16:9",
  parameters: {},
  creditsUsed: 35,
  errorMessage: null,
  createdAt: new Date("2026-05-01T00:00:00Z"),
  updatedAt: new Date("2026-05-01T00:00:00Z"),
};

const actualCostVideo: Video = {
  ...baseVideo,
  uuid: "vid_actual_cost",
  duration: 10,
  creditsUsed: 70,
  parameters: {
    providerCost: {
      actualCents: 63,
      estimatedCents: 70,
      source: "actual",
    },
  },
};

const videos: Video[] = [
  baseVideo,
  {
    ...baseVideo,
    uuid: "vid_completed_uppercase",
    status: "COMPLETED" as Video["status"],
    duration: 10,
    creditsUsed: 35,
  },
  {
    ...baseVideo,
    uuid: "vid_failed",
    status: "FAILED" as Video["status"],
    creditsUsed: 35,
  },
  {
    ...baseVideo,
    uuid: "vid_generating",
    status: "GENERATING" as Video["status"],
    creditsUsed: 35,
  },
  actualCostVideo,
];

const summary = buildUsageSummary(videos);

assert.equal(summary.total, 5);
assert.equal(summary.completed, 3);
assert.equal(summary.failed, 1);
assert.equal(summary.processing, 1);
assert.equal(summary.billableVideos.length, 3);
assert.equal(summary.estimatedCostCents, 168);
assert.equal(formatProviderCost(35), "$0.35");
assert.equal(formatProviderCost(70), "$0.70");
assert.equal(formatProviderCost(0), "$0.00");

assert.deepEqual(getUsageCostDisplay(videos[1]), {
  label: "$0.70",
  state: "billed",
  source: "estimated",
});
assert.deepEqual(getUsageCostDisplay(videos[2]), {
  label: "Not billed",
  state: "not_billed",
});
assert.deepEqual(getUsageCostDisplay(videos[3]), {
  label: "Pending",
  state: "pending",
});
assert.deepEqual(getUsageCostDisplay(actualCostVideo), {
  label: "$0.63",
  state: "billed",
  source: "actual",
});
