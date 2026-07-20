import assert from "node:assert/strict";
import { Prisma, type SocialAccount } from "@prisma/client";
import {
  createAccountsRouteHandlers,
  type AccountsRouteDependencies,
} from "../src/lib/accounts/route-handlers";
import {
  createAccountRouteHandlers,
  createDisconnectAccountForUser,
  type AccountRouteDependencies,
} from "../src/lib/accounts/route-handlers";

const userId = "user-1";
const missingAccountId = "cly8kq9f10000abcd12345678";
const accountWithTargetsId = "cly8kq9f10001abcd12345678";
const removableAccountId = "cly8kq9f10002abcd12345678";

function authenticatedUser() {
  return async () => ({ ok: true as const, userId });
}

function createSocialAccount(id: string, handle: string): SocialAccount {
  return {
    id,
    userId,
    platform: "X",
    handle,
    accessToken: "mock-token",
    status: "ACTIVE",
  };
}

async function run(): Promise<void> {
  const accounts = [
    createSocialAccount("cly8kq9f10003abcd12345678", "@other"),
  ];
  const accountDependencies: AccountsRouteDependencies = {
    getAuthenticatedUser: authenticatedUser(),
    socialAccounts: {
      findMany: async ({ where }: { where: { userId: string } }) =>
        accounts.filter((account) => account.userId === where.userId),
      create: async ({
        data,
      }: {
        data: Pick<SocialAccount, "userId" | "platform" | "handle" | "accessToken" | "status">;
      }) => {
        if (
          accounts.some(
            (account) =>
              account.userId === data.userId &&
              account.platform === data.platform &&
              account.handle === data.handle,
          )
        ) {
          throw new Prisma.PrismaClientKnownRequestError("Duplicate account", {
            code: "P2002",
            clientVersion: "test",
          });
        }

        const account = { id: removableAccountId, ...data };
        accounts.push(account);
        return account;
      },
    } as unknown as AccountsRouteDependencies["socialAccounts"],
    createMockAccessToken: () => "generated-token",
  };
  const accountHandlers = createAccountsRouteHandlers(accountDependencies);

  const unauthenticatedHandlers = createAccountsRouteHandlers({
    ...accountDependencies,
    getAuthenticatedUser: async () => ({ ok: false as const }),
  });
  assert.equal((await unauthenticatedHandlers.GET()).status, 401);
  assert.equal((await unauthenticatedHandlers.POST(new Request("http://localhost"))).status, 401);

  const createResponse = await accountHandlers.POST(
    new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ platform: "X", handle: "@centro" }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(createResponse.status, 201);
  assert.deepEqual(await createResponse.json(), {
    account: {
      id: removableAccountId,
      platform: "X",
      handle: "@centro",
      status: "ACTIVE",
      scheduledTargetCount: 0,
    },
  });

  const listResponse = await accountHandlers.GET();
  assert.equal(listResponse.status, 200);
  assert.equal((await listResponse.json()).accounts.length, 2);

  const duplicateResponse = await accountHandlers.POST(
    new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ platform: "X", handle: "@centro" }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(duplicateResponse.status, 409);

  const invalidResponse = await accountHandlers.POST(
    new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ platform: "INVALID", handle: "" }),
      headers: { "content-type": "application/json" },
    }),
  );
  assert.equal(invalidResponse.status, 400);
  assert.ok((await invalidResponse.json()).fieldErrors.platform);

  let cancellation: { status: string; error: string } | null = null;
  let accountDeleted = false;
  const postStatuses: string[] = [];
  const disconnectScheduledAccount = createDisconnectAccountForUser({
    transact: async (operation) =>
      operation({
        socialAccount: {
          findFirst: async () => ({
            id: accountWithTargetsId,
            targets: [{ postId: "post-scheduled", status: "SCHEDULED" }],
          }),
          delete: async () => {
            accountDeleted = true;
          },
        },
        postTarget: {
          updateMany: async ({ data }: { data: { status: string; error: string } }) => {
            cancellation = data;
          },
          deleteMany: async () => ({ count: 1 }),
          findMany: async () => [],
        },
        post: {
          update: async ({ data }: { data: { status: string } }) => {
            postStatuses.push(data.status);
          },
        },
      } as unknown as Parameters<typeof operation>[0]),
  });
  assert.deepEqual(
    await disconnectScheduledAccount(accountWithTargetsId, userId),
    { scheduledTargetCount: 1 },
  );
  assert.deepEqual(cancellation, {
    status: "CANCELLED",
    error: "Cancelled because its account was disconnected.",
  });
  assert.equal(accountDeleted, true);
  assert.deepEqual(postStatuses, ["FAILED"]);

  const disconnectedAccountIds: string[] = [];
  const disconnectDependencies: AccountRouteDependencies = {
    getAuthenticatedUser: authenticatedUser(),
    disconnectAccount: async (accountId) => {
      disconnectedAccountIds.push(accountId);
      if (accountId === missingAccountId) return null;

      return {
        scheduledTargetCount: accountId === accountWithTargetsId ? 1 : 0,
      };
    },
  };
  const disconnectHandlers = createAccountRouteHandlers(disconnectDependencies);

  const unauthenticatedDisconnectHandlers = createAccountRouteHandlers({
    ...disconnectDependencies,
    getAuthenticatedUser: async () => ({ ok: false as const }),
  });
  assert.equal(
    (
      await unauthenticatedDisconnectHandlers.DELETE(new Request("http://localhost"), {
        params: { id: removableAccountId },
      })
    ).status,
    401,
  );

  const missingResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: missingAccountId },
  });
  assert.equal(missingResponse.status, 404);

  const scheduledTargetResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: accountWithTargetsId },
  });
  assert.equal(scheduledTargetResponse.status, 204);
  assert.deepEqual(disconnectedAccountIds, [missingAccountId, accountWithTargetsId]);

  const deleteResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: removableAccountId },
  });
  assert.equal(deleteResponse.status, 204);

  const invalidIdResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: "not-a-cuid" },
  });
  assert.equal(invalidIdResponse.status, 400);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
