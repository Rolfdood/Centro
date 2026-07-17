import assert from "node:assert/strict";
import type { SocialAccount } from "@prisma/client";
import {
  createPostsRouteHandlers,
  type PostsRouteDependencies,
} from "../src/lib/posts/route-handlers";
import type { PostWithRelations } from "../src/lib/posts";

const userId = "user-1";
const key = "123e4567-e89b-12d3-a456-426614174000";

const account: SocialAccount = {
  id: "account-1",
  userId,
  platform: "X",
  handle: "@centro",
  accessToken: "mock-token",
  status: "ACTIVE",
};

function postFixture(ownerId: string, idempotencyKey: string): PostWithRelations {
  return {
    id: "post-1",
    userId: ownerId,
    baseText: "Hello from Centro",
    status: "DRAFT",
    scheduledAt: null,
    idempotencyKey,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    media: [],
    targets: [{
      id: "target-1",
      postId: "post-1",
      accountId: account.id,
      platform: "X",
      adaptedText: "Hello from Centro",
      status: "DRAFT",
      scheduledAt: null,
      publishedAt: null,
      publishedUrl: null,
      error: null,
      attempts: 0,
      account,
    }],
  } as PostWithRelations;
}

function request(idempotencyKey = key): Request {
  return new Request("http://localhost/api/posts", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      idempotencyKey,
      baseText: "Hello from Centro",
      targets: [{ accountId: account.id }],
    }),
  });
}

async function run(): Promise<void> {
  const posts = new Map<string, PostWithRelations>();
  const dependencies: PostsRouteDependencies = {
    getAuthenticatedUser: async () => ({ ok: true, userId }),
    findPostByIdempotencyKey: async (idempotencyKey) =>
      posts.get(idempotencyKey) ?? null,
    findPostsByUser: async () => [],
    findActiveAccounts: async () => [account],
    createPost: async (input) => {
      const post = postFixture(input.userId, input.idempotencyKey);
      posts.set(input.idempotencyKey, post);
      return post;
    },
  };
  const handlers = createPostsRouteHandlers(dependencies);

  const created = await handlers.POST(request());
  assert.equal(created.status, 201);
  assert.equal((await created.json()).post.id, "post-1");

  const repeated = await handlers.POST(request());
  assert.equal(repeated.status, 200);
  assert.equal((await repeated.json()).post.id, "post-1");

  posts.set(
    "123e4567-e89b-12d3-a456-426614174001",
    postFixture("user-2", "123e4567-e89b-12d3-a456-426614174001"),
  );
  const foreign = await handlers.POST(request("123e4567-e89b-12d3-a456-426614174001"));
  assert.equal(foreign.status, 409);
}

void run().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
