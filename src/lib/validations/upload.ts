import { z } from "zod";

export const uploadResponseSchema = z.object({
  media: z.object({
    url: z.string().url(),
    type: z.enum(["IMAGE", "VIDEO"]),
    mimeType: z.string().min(1),
    sizeBytes: z.number().int().nonnegative(),
  }).strict(),
}).strict();

export type UploadResponse = z.infer<typeof uploadResponseSchema>;
