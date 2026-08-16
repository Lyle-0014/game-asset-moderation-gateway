import { z } from "zod";

export const playerAssetRequest = z.object({
  playerId: z.string().min(1),
  kind: z.enum(["skin", "emblem", "level_name"]),
  description: z.string().min(3).max(500)
});

export type PlayerAssetRequest = z.infer<typeof playerAssetRequest>;

export type PlayerAsset = PlayerAssetRequest & {
  id: string;
  eventId: string;
  submittedAt: string;
};
