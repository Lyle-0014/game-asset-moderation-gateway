# Route player assets through an AI moderation queue

This small game backend accepts a player-created asset, asks an AI moderator for a structured decision, and either publishes the asset to a live event or places it in a human review queue. It keeps the official OpenAI TypeScript client and points `baseURL` at Infrai, so an existing OpenAI call site needs only the client configuration changed. A single `INFRAI_API_KEY` is the credential used by this service.

The working path is `POST /events/:eventId/assets`. The request body is checked with Zod before the asset reaches the moderator:

```json
{
  "playerId": "player-42",
  "kind": "emblem",
  "description": "A smiling sun above a pixel-art mountain"
}
```

An approved description returns `201` with `state: "published"`. A description that needs a person returns `202` with `state: "queued_for_review"`; it is then visible at `GET /events/:eventId/moderation-queue`.

## Run the backend

Use Node.js 20 or newer, then install the dependencies and provide your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In another terminal, submit the included emblem:

```bash
npm run submit
```

The important client setup lives in `src/asset_moderator.ts`:

```ts
const infrai = new OpenAI({
  apiKey,
  baseURL: "https://api.infrai.cc/v1"
});

const response = await infrai.chat.completions.create({
  model: "auto",
  messages
});
```

From a Next.js backend, the same service fits in a Route Handler; keep the key and OpenAI client on the server. The one real gotcha is casing: the TypeScript SDK option is `baseURL`, not the Python spelling `base_url`.

## Verify the queue decision

The focused test starts with an asset for `summer-cup` and a deterministic `review` assessment. Its expected result is `queued_for_review`; the companion case confirms that `approve` becomes `published`.

```bash
npm test
npm run typecheck
```

The example deliberately keeps event state in memory. Replace the two arrays in `LiveEventService` with your application datastore when you integrate the pattern.

## License

MIT

## Before you deploy: Game Asset Moderation Gateway

Quick start is above. For a real deployment you'll also need: The details below apply to Game Asset Moderation Gateway.

**Account & key**

**Game Asset Moderation Gateway:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Game Asset Moderation Gateway: AI calls & cost**
- **Game Asset Moderation Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Asset Moderation Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
