import { z } from "zod";

export const postTargetInputSchema = z.object({
  accountId: z.string().trim().min(1, "Account is required"),
  adaptedText: z.string().trim().min(1, "Adapted text cannot be empty").optional(),
});

export const createPostSchema = z
  .object({
    idempotencyKey: z.string().uuid("Idempotency key must be a UUID"),
    baseText: z.string().trim().min(1, "Base text is required"),
    targets: z.array(postTargetInputSchema).min(1, "Select at least one account"),
  })
  .superRefine((data, context) => {
    const accountIds = new Set<string>();

    data.targets.forEach((target, index) => {
      if (accountIds.has(target.accountId)) {
        context.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Each account can only be selected once",
          path: ["targets", index, "accountId"],
        });
      }

      accountIds.add(target.accountId);
    });
  });

export const validationErrorSchema = z.object({
  error: z.string(),
  fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
});

export type PostTargetInput = z.infer<typeof postTargetInputSchema>;
export type CreatePostInput = z.infer<typeof createPostSchema>;
export type ValidationErrorResponse = z.infer<typeof validationErrorSchema>;
