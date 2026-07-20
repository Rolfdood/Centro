import { NextResponse } from "next/server";
import type { getAuthenticatedUser } from "@/lib/auth";
import { buildAdaptPostPrompt } from "@/lib/ai/prompts/adaptPost";
import { getConstraints, type Platform, validatePost } from "@/lib/platforms/constraints";
import type { AIProvider, AiAdaptInput } from "@/lib/ai/provider";
import {
  aiAdaptationQuotaResponseSchema,
  aiAdaptRequestSchema,
  aiAdaptResponseSchema,
  type AiAdaptationQuota,
} from "@/lib/validations/ai";

const AI_DAILY_LIMIT_DEFAULT = 20;
const DAY_IN_MS = 24 * 60 * 60 * 1000;

export interface AiGenerationInput {
  userId: string;
  platform: Platform;
  prompt: string;
  output: string;
  model: string;
}

export interface AiAdaptRouteDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  provider: AIProvider;
  countGenerationsSince: (userId: string, since: Date) => Promise<number>;
  createGenerations: (generations: AiGenerationInput[]) => Promise<unknown>;
  getDailyLimit?: () => number;
  now?: () => Date;
}

export function getAiDailyLimit(value = process.env.AI_DAILY_LIMIT): number {
  if (!value) return AI_DAILY_LIMIT_DEFAULT;

  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0
    ? parsed
    : AI_DAILY_LIMIT_DEFAULT;
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function invalidResponse(): NextResponse {
  return NextResponse.json({ error: "Invalid request." }, { status: 400 });
}

function quotaExceededResponse(): NextResponse {
  return NextResponse.json(
    { error: "Daily AI adaptation limit reached. Try again later." },
    { status: 429 },
  );
}

function quotaFor(
  used: number,
  limit: number,
): AiAdaptationQuota {
  return {
    used,
    limit,
    remaining: Math.max(0, limit - used),
  };
}

export function createAiAdaptRouteHandler(
  dependencies: AiAdaptRouteDependencies,
) {
  const getQuota = async (userId: string): Promise<AiAdaptationQuota> => {
    const now = (dependencies.now ?? (() => new Date()))();
    const used = await dependencies.countGenerationsSince(
      userId,
      new Date(now.getTime() - DAY_IN_MS),
    );
    const limit = (dependencies.getDailyLimit ?? getAiDailyLimit)();
    return quotaFor(used, limit);
  };

  async function GET(): Promise<NextResponse> {
    const authentication = await dependencies.getAuthenticatedUser();
    if (!authentication.ok) return unauthorizedResponse();

    try {
      return NextResponse.json(
        aiAdaptationQuotaResponseSchema.parse({
          quota: await getQuota(authentication.userId),
        }),
      );
    } catch (error) {
      console.error("Unable to load AI adaptation quota.", error);
      return NextResponse.json(
        { error: "Unable to load AI adaptation quota." },
        { status: 500 },
      );
    }
  }

  async function POST(request: Request): Promise<NextResponse> {
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
      const quota = await getQuota(authentication.userId);
      const requestedGenerations = parsed.data.platforms.length;
      if (quota.used + requestedGenerations > quota.limit) {
        return quotaExceededResponse();
      }

      const generatedVariants = await Promise.all(parsed.data.platforms.map(async (platform) => {
        const input: AiAdaptInput = {
          baseText: parsed.data.baseText,
          platform,
          tone: parsed.data.tone,
          media: parsed.data.media,
          constraints: getConstraints(platform),
        };
        const text = await dependencies.provider.adapt(input);
        const validation = validatePost(platform, text, [
          ...(parsed.data.media.hasImages ? [{ type: "IMAGE" as const }] : []),
          ...(parsed.data.media.hasVideo ? [{ type: "VIDEO" as const }] : []),
        ]);

        return {
          platform,
          text,
          valid: validation.valid,
          errors: validation.errors,
          prompt: buildAdaptPostPrompt(input),
        };
      }));

      await dependencies.createGenerations(
        generatedVariants.map(({ platform, text, prompt }) => ({
          userId: authentication.userId,
          platform,
          prompt,
          output: text,
          model: dependencies.provider.model,
        })),
      );

      return NextResponse.json(aiAdaptResponseSchema.parse({
        variants: generatedVariants.map(({ prompt: _prompt, ...variant }) => variant),
        model: dependencies.provider.model,
        quota: quotaFor(
          quota.used + requestedGenerations,
          quota.limit,
        ),
      }));
    } catch (error) {
      console.error("Unable to adapt post with AI.", error);
      return NextResponse.json({ error: "AI adaptation failed." }, { status: 502 });
    }
  }

  return { GET, POST };
}
