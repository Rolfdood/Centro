import assert from "node:assert/strict";
import { Prisma, type SocialAccount } from "@prisma/client";
import {
  createAccountsRouteHandlers,
  type AccountsRouteDependencies,
} from "../src/lib/accounts/route-handlers";
import {
  createAccountRouteHandlers,
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

  const disconnectDependencies: AccountRouteDependencies = {
    getAuthenticatedUser: authenticatedUser(),
    socialAccounts: {
      findFirst: async ({ where }: { where: { id: string } }) => {
        if (where.id === missingAccountId) {
          return null;
        }

        return {
          id: where.id,
          targets:
            where.id === accountWithTargetsId ? [{ id: "target-1" }] : [],
        };
      },
      delete: async ({ where }: { where: { id: string } }) =>
        createSocialAccount(where.id, "@centro"),
    } as unknown as AccountRouteDependencies["socialAccounts"],
  };
  const disconnectHandlers = createAccountRouteHandlers(disconnectDependencies);

  const missingResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: missingAccountId },
  });
  assert.equal(missingResponse.status, 404);

  const targetResponse = await disconnectHandlers.DELETE(new Request("http://localhost"), {
    params: { id: accountWithTargetsId },
  });
  assert.equal(targetResponse.status, 409);

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
