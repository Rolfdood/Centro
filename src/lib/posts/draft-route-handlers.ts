import { Prisma, type SocialAccount } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";

import type { getAuthenticatedUser } from "@/lib/auth";
import {
  toPostDetailDto,
  type PostWithRelations,
} from "@/lib/posts";
import { validationErrorSchema } from "@/lib/validations/common";
import {
  saveDraftSchema,
  type MediaInput,
} from "@/lib/validations/post";
import { postDetailResponseSchema } from "@/types";

type DraftTarget = {
  accountId: string;
  platform: SocialAccount["platform"];
  adaptedText: string;
  status: "DRAFT";
};

type SaveDraftInput = {
  userId: string;
  baseText: string;
  idempotencyKey: string;
  targets: DraftTarget[];
  media: MediaInput[];
};

export interface DraftRouteDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  findPostByIdempotencyKey: (key: string) => Promise<PostWithRelations | null>;
  findAccounts: (userId: string, accountIds: string[]) => Promise<SocialAccount[]>;
  createDraft: (input: SaveDraftInput) => Promise<PostWithRelations>;
  updateDraft: (id: string, input: SaveDraftInput) => Promise<PostWithRelations>;
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function invalidRequestResponse(
  error: string,
  errors?: Record<string, string[]>,
): NextResponse {
  const parsed = validationErrorSchema.safeParse({
    error,
    ...(errors ? { fieldErrors: errors } : {}),
  });

  return NextResponse.json(
    parsed.success ? parsed.data : { error: "Invalid request." },
    { status: 400 },
  );
}

function conflictResponse(): NextResponse {
  return NextResponse.json(
    { error: "Unable to save this draft." },
    { status: 409 },
  );
}

export function createDraftRouteHandler(dependencies: DraftRouteDependencies) {
  return async (request: Request): Promise<NextResponse> => {
    const authentication = await dependencies.getAuthenticatedUser();
    if (!authentication.ok) {
      return unauthorizedResponse();
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return invalidRequestResponse("Invalid request.");
    }

    const input = saveDraftSchema.safeParse(body);
    if (!input.success) {
      return invalidRequestResponse("Invalid request.", fieldErrors(input.error));
    }

    try {
      const existing = await dependencies.findPostByIdempotencyKey(
        input.data.idempotencyKey,
      );
      if (existing) {
        if (existing.userId !== authentication.userId) {
          return conflictResponse();
        }

        if (existing.status !== "DRAFT") {
          return NextResponse.json(
            postDetailResponseSchema.parse({ post: toPostDetailDto(existing) }),
          );
        }
      }

      const accountIds = input.data.targets.map((target) => target.accountId);
      const accounts = await dependencies.findAccounts(
        authentication.userId,
        accountIds,
      );
      if (accounts.length !== accountIds.length) {
        return invalidRequestResponse(
          "One or more selected accounts are unavailable.",
        );
      }

      const accountsById = new Map(
        accounts.map((account) => [account.id, account]),
      );
      const draftInput: SaveDraftInput = {
        userId: authentication.userId,
        baseText: input.data.baseText,
        idempotencyKey: input.data.idempotencyKey,
        targets: input.data.targets.map((target) => {
          const account = accountsById.get(target.accountId);
          if (!account) {
            throw new Error("Selected account was not loaded.");
          }

          return {
            accountId: account.id,
            platform: account.platform,
            adaptedText: target.adaptedText,
            status: "DRAFT",
          };
        }),
        media: input.data.media,
      };
      const draft = existing
        ? await dependencies.updateDraft(existing.id, draftInput)
        : await dependencies.createDraft(draftInput);

      return NextResponse.json(
        postDetailResponseSchema.parse({ post: toPostDetailDto(draft) }),
        { status: existing ? 200 : 201 },
      );
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        try {
          const existing = await dependencies.findPostByIdempotencyKey(
            input.data.idempotencyKey,
          );
          if (existing?.userId !== authentication.userId) {
            return conflictResponse();
          }

          if (existing?.status === "DRAFT") {
            const accounts = await dependencies.findAccounts(
              authentication.userId,
              input.data.targets.map((target) => target.accountId),
            );
            const accountsById = new Map(
              accounts.map((account) => [account.id, account]),
            );
            const draft = await dependencies.updateDraft(existing.id, {
              userId: authentication.userId,
              baseText: input.data.baseText,
              idempotencyKey: input.data.idempotencyKey,
              targets: input.data.targets.map((target) => {
                const account = accountsById.get(target.accountId);
                if (!account) {
                  throw new Error("Selected account was not loaded.");
                }

                return {
                  accountId: account.id,
                  platform: account.platform,
                  adaptedText: target.adaptedText,
                  status: "DRAFT",
                };
              }),
              media: input.data.media,
            });
            return NextResponse.json(
              postDetailResponseSchema.parse({ post: toPostDetailDto(draft) }),
            );
          }
        } catch (lookupError) {
          console.error("Unable to load concurrent draft save.", lookupError);
        }

        return conflictResponse();
      }

      console.error("Unable to save draft.", error);
      return NextResponse.json(
        { error: "Unable to save draft." },
        { status: 500 },
      );
    }
  };
}
