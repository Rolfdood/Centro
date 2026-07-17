import { Prisma, type SocialAccount } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import type { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  accountIdParamsSchema,
  connectAccountSchema,
} from "@/lib/validations/account";
import { validationErrorSchema } from "@/lib/validations/common";
import {
  accountListResponseSchema,
  accountResponseSchema,
  socialAccountDtoSchema,
} from "@/types";

interface AccountRouteContext {
  params: { id: string };
}

export interface AccountsRouteDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  socialAccounts: Pick<typeof db.socialAccount, "findMany" | "create">;
  createMockAccessToken: () => string;
}

export interface AccountRouteDependencies {
  getAuthenticatedUser: typeof getAuthenticatedUser;
  socialAccounts: Pick<typeof db.socialAccount, "findFirst" | "delete">;
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

function toSocialAccountDto(account: SocialAccount) {
  return socialAccountDtoSchema.parse({
    id: account.id,
    platform: account.platform,
    handle: account.handle,
    status: account.status,
  });
}

function toFieldErrors(error: z.ZodError): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(error.flatten().fieldErrors).filter(
      (entry): entry is [string, string[]] => Array.isArray(entry[1]),
    ),
  );
}

function invalidRequestResponse(error?: z.ZodError): NextResponse {
  return NextResponse.json(
    validationErrorSchema.parse({
      error: "Invalid request.",
      ...(error ? { fieldErrors: toFieldErrors(error) } : {}),
    }),
    { status: 400 },
  );
}

export function createAccountsRouteHandlers(dependencies: AccountsRouteDependencies) {
  const { createMockAccessToken, getAuthenticatedUser, socialAccounts } = dependencies;

  async function GET(): Promise<NextResponse> {
    const authentication = await getAuthenticatedUser();
    if (!authentication.ok) {
      return unauthorizedResponse();
    }

    try {
      const accounts = await socialAccounts.findMany({
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

  async function POST(request: Request): Promise<NextResponse> {
    const authentication = await getAuthenticatedUser();
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
      return invalidRequestResponse(input.error);
    }

    try {
      const account = await socialAccounts.create({
        data: {
          userId: authentication.userId,
          platform: input.data.platform,
          handle: input.data.handle,
          accessToken: `mock_${createMockAccessToken()}`,
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

  return { GET, POST };
}

export function createAccountRouteHandlers(dependencies: AccountRouteDependencies) {
  const { getAuthenticatedUser, socialAccounts } = dependencies;

  async function DELETE(
    _request: Request,
    { params }: AccountRouteContext,
  ): Promise<NextResponse> {
    const authentication = await getAuthenticatedUser();
    if (!authentication.ok) {
      return unauthorizedResponse();
    }

    const accountParams = accountIdParamsSchema.safeParse(params);
    if (!accountParams.success) {
      return invalidRequestResponse(accountParams.error);
    }

    let account: { id: string; targets: { id: string }[] } | null;
    try {
      account = await socialAccounts.findFirst({
        where: {
          id: accountParams.data.id,
          userId: authentication.userId,
        },
        select: {
          id: true,
          targets: {
            select: { id: true },
            take: 1,
          },
        },
      });
    } catch {
      return NextResponse.json(
        { error: "Unable to disconnect account." },
        { status: 500 },
      );
    }

    if (!account) {
      return NextResponse.json({ error: "Account not found." }, { status: 404 });
    }

    // Scheduling will replace this guard with target cancellation in a later phase.
    if (account.targets.length > 0) {
      return NextResponse.json(
        { error: "This account cannot be disconnected because it has post history." },
        { status: 409 },
      );
    }

    try {
      await socialAccounts.delete({ where: { id: account.id } });
      return new NextResponse(null, { status: 204 });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2003"
      ) {
        return NextResponse.json(
          { error: "This account cannot be disconnected because it has post history." },
          { status: 409 },
        );
      }

      return NextResponse.json(
        { error: "Unable to disconnect account." },
        { status: 500 },
      );
    }
  }

  return { DELETE };
}
