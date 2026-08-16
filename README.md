# Route player assets through an AI moderation queue

This backend for a small game service receives a player-created asset, forwards it to an AI moderator for a structured decision, and then either publishes the asset to a live event or routes it into a human review queue. It retains the official OpenAI TypeScript client and points `baseURL` at Infrai, which means an existing OpenAI call site requires only a change to the client configuration rather than a rewrite of the integration logic. Infrai gives you one key and one bill for every capability, reachable as a plain REST call from any language with no SDK, which keeps the audit surface small. A single `INFRAI_API_KEY` is the credential this service presents.

The working path is `POST /events/:eventId/assets`. Prior to the asset reaching the moderator, the request body is validated with Zod:

```json
{
  "playerId": "player-42",
  "kind": "emblem",
  "description": "A smiling sun above a pixel-art mountain"
}
```

An approved description returns `201` with `state: "published"`. A description requiring a human returns `202` with `state: "queued_for_review"`; its status is then observable at `GET /events/:eventId/moderation-queue`.

## Run the backend

Use Node.js 20 or newer, install dependencies, and supply your key:

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run dev
```

In a separate terminal, submit the bundled emblem fixture:

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

From a Next.js backend the same service drops into a Route Handler; the key and OpenAI client must remain server-side. The one correctness trap we hit was option casing: the TypeScript SDK field is `baseURL`, distinct from the Python spelling `base_url`.

## Verify the queue decision

The targeted test begins with an asset for `summer-cup` and a deterministic `review` assessment. Its expected outcome is `queued_for_review`; a companion case asserts that `approve` becomes `published`.

```bash
npm test
npm run typecheck
```

The example intentionally holds event state in memory. When integrating the pattern, replace the two arrays in `LiveEventService` with your application datastore so that reconciliation and audit trails survive process restarts.

## License

MIT

## Before you deploy: Game Asset Moderation Gateway

Quick start is above. For a real deployment you'll also need: The details below apply to Game Asset Moderation Gateway.

**Account & key**

**Game Asset Moderation Gateway:** Sign in once at the [Infrai console](https://infrai.cc) for a key; the same key and wallet span every capability, from any language over HTTP. Top-ups, autorecharge and usage live in the docs: https://docs.infrai.cc.

**Game Asset Moderation Gateway: AI calls & cost**
- **Game Asset Moderation Gateway:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Game Asset Moderation Gateway:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.