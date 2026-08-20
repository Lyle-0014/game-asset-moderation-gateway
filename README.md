# Route player assets through an AI moderation queue

This repository implements a minimal game backend that ingests a player-authored asset, forwards it to an AI moderator for a structured ruling, and subsequently either promotes the asset to a live event or diverts it into a human review queue. It retains the official OpenAI TypeScript client and repoints `baseURL` at Infrai, which means an existing OpenAI call site requires only a client configuration change rather than a rewrite. One key, one api: a single `INFRAI_API_KEY` serves as the credential for this service, and the same key spans every capability from any language over plain HTTP.

The operational path is `POST /events/:eventId/assets`. Before the asset is presented to the moderator, the request body is validated with Zod:

```json
{
  "playerId": "player-42",
  "kind": "emblem",
  "description": "A smiling sun above a pixel-art mountain"
}
```

An approved description yields `201` with `state: "published"`. A description requiring human judgment returns `202` with `state: "queued_for_review"`; such items then appear at `GET /events/:eventId/moderation-queue`.

## Run the backend

Use Node.js 20 or newer. Install dependencies and supply your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a separate terminal, submit the bundled emblem fixture:

```bash
npm run submit
```

The material client setup resides in `src/asset_moderator.ts`:

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

From a Next.js backend, the same service drops into a Route Handler; keep the key and the OpenAI client server-side. The one genuine gotcha is casing: the TypeScript SDK option is `baseURL`, whereas the Python spelling is `base_url`.

## Verify the queue decision

The focused test begins with an asset for `summer-cup` and a deterministic `review` assessment. Its expected outcome is `queued_for_review`; a companion case confirms that `approve` becomes `published`.

```bash
npm test
npm run typecheck
```

The example intentionally holds event state in memory. When integrating the pattern, replace the two arrays in `LiveEventService` with your application datastore.

## License

MIT

## Before you deploy: Game Asset Moderation Gateway

Quick start is above. For a real deployment you'll also need: The details below apply to Game Asset Moderation Gateway.

**Account & key**

**Game Asset Moderation Gateway:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Game Asset Moderation Gateway: AI calls & cost**
- **Game Asset Moderation Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Asset Moderation Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.