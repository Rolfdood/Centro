import { randomUUID } from "crypto";
import { Prisma, type SocialAccount } from "@prisma/client";
import { NextResponse } from "next/server";
import { requireAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { connectAccountSchema } from "@/lib/validations/account";
import { validationErrorSchema } from "@/lib/validations/post";
import {
  accountListResponseSchema,
  accountResponseSchema,
  socialAccountDtoSchema,
} from "@/types";

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function invalidRequestResponse(): NextResponse {
  return NextResponse.json(
    validationErrorSchema.parse({ error: "Invalid request." }),
    { status: 400 },
  );
}

function toSocialAccountDto(account: SocialAccount) {
  return socialAccountDtoSchema.parse({
    id: account.id,
    platform: account.platform,
    handle: account.handle,
    status: account.status,
  });
}

export async function GET(): Promise<NextResponse> {
  const authentication = await requireAuthenticatedUser();
  if (!authentication.ok) {
    return unauthorizedResponse();
  }

  try {
    const accounts = await db.socialAccount.findMany({
      where: { userId: authentication.userId },
      orderBy: [{ platform: "asc" }, { handle: "asc" }],
    });

    return NextResponse.json(
      accountListResponseSchema.parse({
        accounts: accounts.map(toSocialAccountDto),
      }),
    );
  } catch {
    return NextResponse.json(
      { error: "Unable to load accounts." },
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
    return invalidRequestResponse();
  }

  const input = connectAccountSchema.safeParse(body);
  if (!input.success) {
    return invalidRequestResponse();
  }

  try {
    const account = await db.socialAccount.create({
      data: {
        userId: authentication.userId,
        platform: input.data.platform,
        handle: input.data.handle,
        accessToken: `mock_${randomUUID()}`,
        status: "ACTIVE",
      },
    });

    return NextResponse.json(
      accountResponseSchema.parse({ account: toSocialAccountDto(account) }),
      { status: 201 },
    );
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return NextResponse.json(
        { error: "This account is already connected." },
        { status: 409 },
      );
    }

    return NextResponse.json(
      { error: "Unable to connect account." },
      { status: 500 },
    );
  }
}
