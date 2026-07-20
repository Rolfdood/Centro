import { getAuthenticatedUser } from "@/lib/auth";
import { defaultAiProvider } from "@/lib/ai/openai";
import { createAiAdaptRouteHandler } from "@/lib/ai/route-handlers";
import { db } from "@/lib/db";

const handlers = createAiAdaptRouteHandler({
  getAuthenticatedUser,
  provider: defaultAiProvider(),
  countGenerationsSince: (userId, since) =>
    db.aiGeneration.count({
      where: { userId, createdAt: { gte: since } },
    }),
  createGenerations: (generations) =>
    db.aiGeneration.createMany({ data: generations }),
});

export const { GET, POST } = handlers;
