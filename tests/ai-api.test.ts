import assert from "node:assert/strict";
import { createAiAdaptRouteHandler } from "../src/lib/ai/route-handlers";
import type { AiAdaptInput } from "../src/lib/ai/provider";
import { createOpenAiProvider } from "../src/lib/ai/openai";
import { getConstraints } from "../src/lib/platforms/constraints";
import { aiAdaptResponseSchema } from "../src/lib/validations/ai";

async function run(): Promise<void> {
  const handler = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: {
      model: "mock",
      adapt: async ({ platform }: AiAdaptInput) => `${platform} variant`,
    },
  });

  const response = await handler(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      baseText: "Launch day is here",
      platforms: ["X", "LINKEDIN"],
      tone: "professional",
      media: { hasImages: false, hasVideo: false },
    }),
  }));

  assert.equal(response.status, 200);
  assert.equal(aiAdaptResponseSchema.safeParse(await response.json()).success, true);

  const invalidOutput = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: { model: "mock", adapt: async () => "x".repeat(281) },
  });
  const invalidResponse = await invalidOutput(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
  }));
  const invalidPayload = aiAdaptResponseSchema.parse(await invalidResponse.json());
  assert.equal(invalidPayload.variants[0].valid, false);

  const providerFailure = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: { model: "mock", adapt: async () => { throw new Error("provider detail"); } },
  });
  const originalConsoleError = console.error;
  console.error = () => undefined;
  let failedResponse: Response;
  try {
    failedResponse = await providerFailure(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
    }));
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failedResponse.status, 502);
  assert.deepEqual(await failedResponse.json(), { error: "AI adaptation failed." });

  const empty = await handler(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "", platforms: ["X"] }),
  }));
  assert.equal(empty.status, 400);

  const unauthenticated = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: false as const }),
    provider: { model: "mock", adapt: async () => "unused" },
  });
  assert.equal((await unauthenticated(new Request("http://localhost"))).status, 401);

  const fallback = createOpenAiProvider({ apiKey: "", model: "mock" });
  const fallbackText = await fallback.adapt({
    baseText: "Hello", platform: "X", tone: "professional",
    media: { hasImages: false, hasVideo: false }, constraints: getConstraints("X"),
  });
  assert.equal(fallbackText, "X: Hello");

  console.log("AI API tests passed.");
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
