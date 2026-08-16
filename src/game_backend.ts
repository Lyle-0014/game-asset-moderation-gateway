import express from "express";
import { ZodError } from "zod";
import OpenAI from "openai";
import { createAssetModerator } from "./asset_moderator.js";
import { LiveEventService } from "./live_event_service.js";
import { playerAssetRequest } from "./player_asset.js";

const apiKey = process.env.INFRAI_API_KEY;
if (!apiKey) throw new Error("Set INFRAI_API_KEY before starting the game backend");

const service = new LiveEventService(createAssetModerator(apiKey));
const app = express();
app.use(express.json());

app.post("/events/:eventId/assets", async (req, res, next) => {
  try {
    const result = await service.submit(req.params.eventId, playerAssetRequest.parse(req.body));
    res.status(result.state === "published" ? 201 : 202).json(result);
  } catch (error) {
    next(error);
  }
});

app.get("/events/:eventId/moderation-queue", (req, res) => {
  res.json(service.reviewQueue.filter((item) => item.asset.eventId === req.params.eventId));
});

app.use((error: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: "Invalid player asset", issues: error.issues });
    return;
  }
  if (error instanceof OpenAI.APIError) {
    const status = error.status && error.status < 500 ? error.status : 502;
    res.status(status).json({ error: error.message });
    return;
  }
  res.status(500).json({ error: "Could not moderate the player asset" });
});

const port = Number(process.env.PORT ?? 3000);
app.listen(port, () => console.log(`Game backend listening on http://localhost:${port}`));
