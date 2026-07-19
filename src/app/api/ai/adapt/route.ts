import { getAuthenticatedUser } from "@/lib/auth";
import { defaultAiProvider } from "@/lib/ai/openai";
import { createAiAdaptRouteHandler } from "@/lib/ai/route-handlers";

export const POST = createAiAdaptRouteHandler({
  getAuthenticatedUser,
  provider: defaultAiProvider(),
});
