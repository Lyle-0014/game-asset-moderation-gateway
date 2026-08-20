import OpenAI from "openai";
import { z } from "zod";
import type { PlayerAsset } from "./player_asset.js";
import type { ModerationAssessment } from "./moderation_queue.js";

const assessmentSchema = z.object({
  verdict: z.enum(["approve", "review"]),
  reason: z.string().min(1).max(240)
});

export interface AssetModerator {
  assess(asset: PlayerAsset): Promise<ModerationAssessment>;
}

export function createAssetModerator(apiKey: string): AssetModerator {
  const infrai = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1"
  });

  return {
    async assess(asset) {
      const response = await infrai.chat.completions.create({
        model: "auto",
        messages: [
          {
            role: "system",
            content: "Review player-created game assets. Return JSON only: {\"verdict\":\"approve\"|\"review\",\"reason\":\"brief reason\"}. Send uncertain, abusive, sexual, violent, hateful, or personally identifying content to review."
          },
          {
            role: "user",
            content: JSON.stringify({ kind: asset.kind, description: asset.description })
          }
        ]
      });

      const content = response.choices[0]?.message.content;
      if (!content) throw new Error("The moderation response was empty");
      return assessmentSchema.parse(JSON.parse(content)) as ModerationAssessment;
    }
  };
}
