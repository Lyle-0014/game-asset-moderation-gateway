import assert from "node:assert/strict";
import test from "node:test";
import type { PlayerAsset } from "../src/player_asset.js";
import { routeModeratedAsset } from "../src/moderation_queue.js";

const asset: PlayerAsset = {
  id: "asset-17",
  eventId: "summer-cup",
  playerId: "player-42",
  kind: "emblem",
  description: "A smiling sun above a pixel-art mountain",
  submittedAt: "2026-08-13T09:00:00.000Z"
};

test("an uncertain asset enters the human moderation queue", () => {
  const result = routeModeratedAsset(asset, {
    verdict: "review",
    reason: "The description needs a human decision"
  });

  assert.equal(result.state, "queued_for_review");
  assert.equal(result.asset.eventId, "summer-cup");
});

test("an approved asset is published to the live event", () => {
  const result = routeModeratedAsset(asset, {
    verdict: "approve",
    reason: "Suitable for the event"
  });

  assert.equal(result.state, "published");
});
