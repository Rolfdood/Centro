import { NextResponse } from "next/server";
import type { getAuthenticatedUser } from "@/lib/auth";
import { getConstraints, validatePost } from "@/lib/platforms/constraints";
import type { AIProvider } from "@/lib/ai/provider";
import { aiAdaptRequestSchema, aiAdaptResponseSchema } from "@/lib/validations/ai";

export interface AiAdaptRouteDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  provider: AIProvider;
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function invalidResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}

export function createAiAdaptRouteHandler(
  dependencies: AiAdaptRouteDependencies,
) {
  return async (request: Request): Promise<NextResponse> => {
    const authentication = await dependencies.getAuthenticatedUser();
    if (!authentication.ok) return unauthorizedResponse();

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidResponse();
    }

    const parsed = aiAdaptRequestSchema.safeParse(body);
    if (!parsed.success) return invalidResponse();

    try {
      const variants = await Promise.all(parsed.data.platforms.map(async (platform) => {
        const constraints = getConstraints(platform);
        const text = await dependencies.provider.adapt({
          baseText: parsed.data.baseText,
          platform,
          tone: parsed.data.tone,
          media: parsed.data.media,
          constraints,
        });
        const validation = validatePost(platform, text, [
          ...(parsed.data.media.hasImages ? [{ type: "IMAGE" as const }] : []),
          ...(parsed.data.media.hasVideo ? [{ type: "VIDEO" as const }] : []),
        ]);

        return {
          platform,
          text,
          valid: validation.valid,
          errors: validation.errors,
        };
      }));

      return NextResponse.json(aiAdaptResponseSchema.parse({
        variants,
        model: dependencies.provider.model,
      }));
    } catch (error) {
      console.error("Unable to adapt post with AI.", error);
      return NextResponse.json({ error: "AI adaptation failed." }, { status: 502 });
    }
  };
}
