import { randomUUID } from "node:crypto";
import type { AssetModerator } from "./asset_moderator.js";
import type { PlayerAssetRequest } from "./player_asset.js";
import { routeModeratedAsset, type ModerationResult } from "./moderation_queue.js";

export class LiveEventService {
  readonly published: ModerationResult[] = [];
  readonly reviewQueue: ModerationResult[] = [];
  private readonly moderator: AssetModerator;

  constructor(moderator: AssetModerator) {
    this.moderator = moderator;
  }

  async submit(eventId: string, request: PlayerAssetRequest): Promise<ModerationResult> {
    const asset = {
      ...request,
      id: randomUUID(),
      eventId,
      submittedAt: new Date().toISOString()
    };
    const result = routeModeratedAsset(asset, await this.moderator.assess(asset));
    (result.state === "published" ? this.published : this.reviewQueue).push(result);
    return result;
  }
}
