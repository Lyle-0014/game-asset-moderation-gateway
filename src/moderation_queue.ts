import type { PlayerAsset } from "./player_asset.js";

export const moderationVerdict = {
  approve: "approve",
  review: "review"
} as const;

export type ModerationVerdict = keyof typeof moderationVerdict;

export type ModerationAssessment = {
  verdict: ModerationVerdict;
  reason: string;
};

export type ModerationResult = ModerationAssessment & {
  asset: PlayerAsset;
  state: "published" | "queued_for_review";
};

export function routeModeratedAsset(
  asset: PlayerAsset,
  assessment: ModerationAssessment
): ModerationResult {
  return {
    asset,
    ...assessment,
    state: assessment.verdict === "approve" ? "published" : "queued_for_review"
  };
}
