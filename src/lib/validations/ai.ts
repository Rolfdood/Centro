import { z } from "zod";

import { PLATFORMS } from "@/lib/platforms/constraints";

export const COMPOSER_TONES = [
  "PROFESSIONAL",
  "CASUAL",
  "PLAYFUL",
  "BOLD",
] as const;

export const adaptPostRequestSchema = z.object({
  baseText: z.string().trim().min(1),
  platforms: z.array(z.enum(PLATFORMS)).min(1),
  tone: z.enum(COMPOSER_TONES),
  media: z.object({
    hasImages: z.boolean(),
    hasVideo: z.boolean(),
  }),
});

export type AdaptPostRequest = z.infer<typeof adaptPostRequestSchema>;
