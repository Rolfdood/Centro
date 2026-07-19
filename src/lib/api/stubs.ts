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

export type AdaptPostInput = AdaptPostRequest;
export type AdaptPostResult = z.infer<typeof adaptPostResultSchema>;

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

export function useAdaptPost() {
  return useMutation({ mutationFn: adaptPost });
}
