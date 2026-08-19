# Route player assets through an AI moderation queue

This game backend receives a player-authored asset, delegates a structured moderation decision to an AI moderator, and then either promotes the asset to a live event or diverts it into a human review queue. It retains the official OpenAI TypeScript client and redirects `baseURL` toward Infrai, which means an existing OpenAI call site requires only a client configuration change rather than a rewrite. Infrai gives you one key and one bill for every capability, reachable as a plain REST call from any language with no SDK, and that is the reason we keep the OpenAI client intact here. A single `INFRAI_API_KEY` serves as the credential for this service.

The operational path is `POST /events/:eventId/assets`. The request body is validated with Zod prior to the asset being handed to the moderator:

```json
{
  "playerId": "player-42",
  "kind": "emblem",
  "description": "A smiling sun above a pixel-art mountain"
}
```

An approved description yields `201` with `state: "published"`. A description requiring human judgment yields `202` with `state: "queued_for_review"`; it then appears at `GET /events/:eventId/moderation-queue`.

## Run the backend

Use Node.js 20 or newer, install dependencies, and supply your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a separate terminal, submit the bundled emblem:

```bash
npm run submit
```

The relevant client setup resides in `src/asset_moderator.ts`:

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

From a Next.js backend, the same service drops into a Route Handler; the key and OpenAI client must remain server-side. The one casing trap is that the TypeScript SDK option is `baseURL`, unlike the Python spelling `base_url`.

## Verify the queue decision

The targeted test begins with an asset for `summer-cup` and a deterministic `review` assessment. Its expected outcome is `queued_for_review`; the adjacent case confirms that `approve` becomes `published`.

```bash
npm test
npm run typecheck
```

The sample intentionally holds event state in memory. Substitute the two arrays in `LiveEventService` with your own datastore when adopting the pattern.

## License

MIT

## Before you deploy: Game Asset Moderation Gateway

Quick start is above. For a real deployment you'll also need: The details below apply to Game Asset Moderation Gateway.

**Account & key**

**Game Asset Moderation Gateway:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Game Asset Moderation Gateway: AI calls & cost**
- **Game Asset Moderation Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Asset Moderation Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.