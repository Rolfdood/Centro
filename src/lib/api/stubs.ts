import { useMutation } from "@tanstack/react-query";
import { z } from "zod";

import { PLATFORMS } from "@/lib/platforms/constraints";
import {
  adaptPostRequestSchema,
  type AdaptPostRequest,
} from "@/lib/validations/ai";

const adaptPostResultSchema = z.object({
  source: z.literal("stub"),
  variants: z.array(
    z.object({
      platform: z.enum(PLATFORMS),
      adaptedText: z.string(),
    }),
  ),
});

const postActionInputSchema = z.object({
  postId: z.string().cuid(),
});

const postActionResultSchema = z.object({
  source: z.literal("stub"),
  postId: z.string().cuid(),
  available: z.literal(false),
});

export type AdaptPostInput = AdaptPostRequest;
export type AdaptPostResult = z.infer<typeof adaptPostResultSchema>;
export type PostActionInput = z.infer<typeof postActionInputSchema>;
export type PostActionResult = z.infer<typeof postActionResultSchema>;

async function adaptPost(input: AdaptPostInput): Promise<AdaptPostResult> {
  const parsed = adaptPostRequestSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("Please provide a draft and at least one platform.");
  }

  await new Promise<void>((resolve) => {
    setTimeout(resolve, 600);
  });

  return adaptPostResultSchema.parse({
    source: "stub",
    variants: parsed.data.platforms.map((platform) => ({
      platform,
      adaptedText: parsed.data.baseText,
    })),
  });
}

async function unavailablePostAction(
  input: PostActionInput,
): Promise<PostActionResult> {
  const parsed = postActionInputSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error("The selected post is invalid.");
  }

  return postActionResultSchema.parse({
    source: "stub",
    postId: parsed.data.postId,
    available: false,
  });
}

export function useAdaptPost() {
  return useMutation({ mutationFn: adaptPost });
}

export function usePublishPost() {
  return useMutation({ mutationFn: unavailablePostAction });
}

export function useRetryPost() {
  return useMutation({ mutationFn: unavailablePostAction });
}
