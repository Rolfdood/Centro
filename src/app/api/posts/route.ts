import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { toPostDetailDto, toPostListItemDto, postWithRelationsInclude } from "@/lib/posts";
import { validateTextLength } from "@/lib/platforms/constraints";
import { createPostSchema, validationErrorSchema } from "@/lib/validations/post";
import { postDetailResponseSchema, postListResponseSchema } from "@/types";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function invalidRequestResponse(
  error: string,
  fieldErrors?: Record<string, string[]>,
): NextResponse {
  return NextResponse.json(
    validationErrorSchema.parse({ error, fieldErrors }),
    { status: 400 },
  );
}

function conflictResponse(): NextResponse {
  return NextResponse.json(
    { error: "Unable to create post with this idempotency key." },
    { status: 409 },
  );
}

async function findPostByIdempotencyKey(idempotencyKey: string) {
  return db.post.findUnique({
    where: { idempotencyKey },
    include: postWithRelationsInclude,
  });
}

export async function GET(): Promise<NextResponse> {
  const authentication = await requireAuthenticatedUser();
  if (!authentication.ok) {
    return unauthorizedResponse();
  }

  try {
    const posts = await db.post.findMany({
      where: { userId: authentication.userId },
      include: postWithRelationsInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(
      postListResponseSchema.parse({
        posts: posts.map(toPostListItemDto),
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load posts." },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<NextResponse> {
  const authentication = await requireAuthenticatedUser();
  if (!authentication.ok) {
    return unauthorizedResponse();
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return invalidRequestResponse("Invalid request.");
  }

  const input = createPostSchema.safeParse(body);
  if (!input.success) {
    return invalidRequestResponse("Invalid request.");
  }

  try {
    const existingPost = await findPostByIdempotencyKey(input.data.idempotencyKey);
    if (existingPost) {
      if (existingPost.userId !== authentication.userId) {
        return conflictResponse();
      }

      return NextResponse.json(
        postDetailResponseSchema.parse({ post: toPostDetailDto(existingPost) }),
      );
    }

    const requestedAccountIds = input.data.targets.map((target) => target.accountId);
    const accounts = await db.socialAccount.findMany({
      where: {
        id: { in: requestedAccountIds },
        userId: authentication.userId,
        status: "ACTIVE",
      },
    });

    if (accounts.length !== requestedAccountIds.length) {
      return invalidRequestResponse("One or more selected accounts are unavailable.");
    }

    const accountsById = new Map(accounts.map((account) => [account.id, account]));
    const fieldErrors: Record<string, string[]> = {};
    const targets = input.data.targets.map((target, index) => {
      const account = accountsById.get(target.accountId);
      const adaptedText = target.adaptedText ?? input.data.baseText;

      if (!account) {
        throw new Error("Selected account was not loaded.");
      }

      const validation = validateTextLength(account.platform, adaptedText);
      if (!validation.valid && validation.error) {
        fieldErrors[`targets.${index}.adaptedText`] = [validation.error];
      }

      return {
        accountId: account.id,
        platform: account.platform,
        adaptedText,
        status: "DRAFT" as const,
      };
    });

    if (Object.keys(fieldErrors).length > 0) {
      return invalidRequestResponse("Invalid post content.", fieldErrors);
    }

    const post = await db.$transaction((transaction) =>
      transaction.post.create({
        data: {
          userId: authentication.userId,
          baseText: input.data.baseText,
          status: "DRAFT",
          idempotencyKey: input.data.idempotencyKey,
          targets: {
            create: targets,
          },
        },
        include: postWithRelationsInclude,
      }),
    );

    return NextResponse.json(
      postDetailResponseSchema.parse({ post: toPostDetailDto(post) }),
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      try {
        const existingPost = await findPostByIdempotencyKey(input.data.idempotencyKey);
        if (existingPost?.userId === authentication.userId) {
          return NextResponse.json(
            postDetailResponseSchema.parse({ post: toPostDetailDto(existingPost) }),
          );
        }
      } catch {
        return NextResponse.json(
          { error: "Unable to create post." },
          { status: 500 },
        );
      }

      return conflictResponse();
    }

    return NextResponse.json(
      { error: "Unable to create post." },
      { status: 500 },
    );
  }
}
