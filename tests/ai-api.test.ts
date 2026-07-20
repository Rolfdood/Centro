import assert from "node:assert/strict";
import {
  createAiAdaptRouteHandler,
  getAiDailyLimit,
  type AiGenerationInput,
  type AiQuotaReservation,
} from "../src/lib/ai/route-handlers";
import type { AiAdaptInput } from "../src/lib/ai/provider";
import { createOpenAiProvider } from "../src/lib/ai/openai";
import { getConstraints } from "../src/lib/platforms/constraints";
import { aiAdaptResponseSchema } from "../src/lib/validations/ai";

function reserveInMemory(generations: AiGenerationInput[]) {
  return async (input: {
    limit: number;
    generations: AiGenerationInput[];
  }): Promise<AiQuotaReservation> => {
    const used = generations.length;
    const remaining = Math.max(0, input.limit - used);
    if (input.generations.length > remaining) {
      return {
        allowed: false,
        quota: { used, limit: input.limit, remaining },
      };
    }

    generations.push(...input.generations);
    const updatedUsed = used + input.generations.length;
    return {
      allowed: true,
      quota: {
        used: updatedUsed,
        limit: input.limit,
        remaining: input.limit - updatedUsed,
      },
    };
  };
}

async function reserveAvailable(input: {
  limit: number;
  generations: AiGenerationInput[];
}): Promise<AiQuotaReservation> {
  return {
    allowed: true,
    quota: {
      used: input.generations.length,
      limit: input.limit,
      remaining: input.limit - input.generations.length,
    },
  };
}

async function run(): Promise<void> {
  const generations: AiGenerationInput[] = [];
  const handler = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: {
      model: "mock",
      adapt: async ({ platform }: AiAdaptInput) => `${platform} variant`,
    },
    countGenerationsSince: async () => generations.length,
    reserveGenerations: reserveInMemory(generations),
  });

  const response = await handler.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      baseText: "Launch day is here",
      platforms: ["X", "LINKEDIN"],
      tone: "professional",
      media: { hasImages: false, hasVideo: false },
    }),
  }));

  assert.equal(response.status, 200);
  const responsePayload = aiAdaptResponseSchema.parse(await response.json());
  assert.equal(responsePayload.quota.remaining, 18);
  assert.equal(generations.length, 2);
  assert.deepEqual(
    generations.map((generation) => generation.platform),
    ["X", "LINKEDIN"],
  );
  assert.match(generations[0]?.prompt ?? "", /Adapt this social post for X/);

  const partialMedia = await handler.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({
      baseText: "Launch day is here",
      platforms: ["INSTAGRAM"],
      media: { hasImages: true },
    }),
  }));
  assert.equal(partialMedia.status, 200);

  const invalidOutput = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: { model: "mock", adapt: async () => "x".repeat(281) },
    countGenerationsSince: async () => 0,
    reserveGenerations: reserveAvailable,
  });
  const invalidResponse = await invalidOutput.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
  }));
  const invalidPayload = aiAdaptResponseSchema.parse(await invalidResponse.json());
  assert.equal(invalidPayload.variants[0].valid, false);

  const providerFailure = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: { model: "mock", adapt: async () => { throw new Error("provider detail"); } },
    countGenerationsSince: async () => 0,
    reserveGenerations: reserveAvailable,
  });
  const originalConsoleError = console.error;
  console.error = () => undefined;
  let failedResponse: Response;
  try {
    failedResponse = await providerFailure.POST(new Request("http://localhost", {
      method: "POST",
      body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
    }));
  } finally {
    console.error = originalConsoleError;
  }
  assert.equal(failedResponse.status, 502);
  assert.deepEqual(await failedResponse.json(), { error: "AI adaptation failed." });

  const empty = await handler.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "", platforms: ["X"] }),
  }));
  assert.equal(empty.status, 400);

  const unauthenticated = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: false as const }),
    provider: { model: "mock", adapt: async () => "unused" },
    countGenerationsSince: async () => 0,
    reserveGenerations: reserveAvailable,
  });
  assert.equal((await unauthenticated.POST(new Request("http://localhost"))).status, 401);
  assert.equal((await unauthenticated.GET()).status, 401);

  let usedGenerations = 19;
  const limitedHandler = createAiAdaptRouteHandler({
    getAuthenticatedUser: async () => ({ ok: true, userId: "user-1" }),
    provider: { model: "mock", adapt: async () => "adapted" },
    countGenerationsSince: async () => usedGenerations,
    reserveGenerations: async ({ limit, generations: created }) => {
      const remaining = Math.max(0, limit - usedGenerations);
      if (created.length > remaining) {
        return {
          allowed: false,
          quota: { used: usedGenerations, limit, remaining },
        };
      }

      usedGenerations += created.length;
      return {
        allowed: true,
        quota: {
          used: usedGenerations,
          limit,
          remaining: limit - usedGenerations,
        },
      };
    },
  });
  const atLimit = await limitedHandler.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
  }));
  assert.equal(atLimit.status, 200);
  assert.equal(usedGenerations, 20);

  const overLimit = await limitedHandler.POST(new Request("http://localhost", {
    method: "POST",
    body: JSON.stringify({ baseText: "Hello", platforms: ["X"] }),
  }));
  assert.equal(overLimit.status, 429);
  assert.deepEqual(await overLimit.json(), {
    error: "Daily AI adaptation limit reached. Try again later.",
  });

  assert.equal(getAiDailyLimit(undefined), 20);
  assert.equal(getAiDailyLimit("3"), 3);
  assert.equal(getAiDailyLimit("invalid"), 20);

  const quota = await limitedHandler.GET();
  assert.equal(quota.status, 200);
  assert.deepEqual(await quota.json(), {
    quota: { used: 20, limit: 20, remaining: 0 },
  });

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
