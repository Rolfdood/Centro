import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { accountIdParamsSchema } from "@/lib/validations/account";
import { validationErrorSchema } from "@/lib/validations/common";

interface AccountRouteContext {
  params: { id: string };
}

function unauthorizedResponse(): NextResponse {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(
  _request: Request,
  { params }: AccountRouteContext,
): Promise<NextResponse> {
  const authentication = await getAuthenticatedUser();
  if (!authentication.ok) {
    return unauthorizedResponse();
  }

  const accountParams = accountIdParamsSchema.safeParse(params);
  if (!accountParams.success) {
    return NextResponse.json(
      validationErrorSchema.parse({ error: "Invalid request." }),
      { status: 400 },
    );
  }

  let account: { id: string; targets: { id: string }[] } | null;
  try {
    account = await db.socialAccount.findFirst({
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

  if (account.targets.length > 0) {
    return NextResponse.json(
      { error: "This account cannot be disconnected because it has post history." },
      { status: 409 },
    );
  }

  try {
    await db.socialAccount.delete({ where: { id: account.id } });
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
