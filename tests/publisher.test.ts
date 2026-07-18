import assert from "node:assert/strict";
import type { MediaAsset, PostStatus, SocialAccount, TargetStatus } from "@prisma/client";
import { createPublisher, derivePostStatus } from "@/lib/posts/publisher";
import type { PostWithRelations } from "@/lib/posts";
import type { Platform } from "@/lib/platforms/constraints";
import type { PublishInput, SocialPlatformAdapter } from "@/lib/platforms/types";

type Target = {
  id: string;
  accountId: string;
  platform: Platform;
  adaptedText: string;
  status: TargetStatus;
  attempts: number;
  account: SocialAccount;
};

function account(id: string, platform: Platform): SocialAccount {
  return { id, userId: "user-1", platform, handle: `@${id}`, accessToken: "token", status: "ACTIVE" };
}

function fixture(): { post: { id: string; userId: string; idempotencyKey: string; targets: Target[]; media: MediaAsset[] }; result: PostWithRelations } {
  const targets: Target[] = [
    { id: "target-x", accountId: "account-x", platform: "X", adaptedText: "hello", status: "DRAFT", attempts: 0, account: account("account-x", "X") },
    { id: "target-linkedin", accountId: "account-linkedin", platform: "LINKEDIN", adaptedText: "hello", status: "DRAFT", attempts: 0, account: account("account-linkedin", "LINKEDIN") },
  ];
  const post = { id: "post-1", userId: "user-1", idempotencyKey: "key-1", targets, media: [] };
  return { post, result: post as unknown as PostWithRelations };
}

function adapter(platform: Platform, publish: SocialPlatformAdapter["publishPost"]): SocialPlatformAdapter {
  return {
    platform,
    getConstraints: () => ({ maxChars: 280, maxImages: 4, requiresImage: false, requiresVideo: false, maxVideoSeconds: 0, maxFileSizeMB: 10, supportedMediaTypes: [] }),
    validatePost: (_input: PublishInput) => ({ valid: true, errors: [] }),
    publishPost: publish,
    checkAuth: async () => ({ active: true }),
    fetchAnalytics: async () => ({ impressions: 0, likes: 0, comments: 0, shares: 0 }),
  };
}

function service(fixturePost: ReturnType<typeof fixture>["post"], adapters: Record<Platform, SocialPlatformAdapter>) {
  const statuses: PostStatus[] = [];
  const calls: string[] = [];
  const dependencies = {
    findPost: async () => fixturePost,
    loadResult: async () => fixturePost as unknown as PostWithRelations,
    updatePostStatus: async (_id: string, status: PostStatus) => { statuses.push(status); },
    markTargetPublishing: async (id: string) => { calls.push(`publishing:${id}`); },
    markTargetPublished: async (id: string) => { calls.push(`published:${id}`); fixturePost.targets.find((target) => target.id === id)!.status = "PUBLISHED"; },
    markTargetFailed: async (id: string) => { calls.push(`failed:${id}`); fixturePost.targets.find((target) => target.id === id)!.status = "FAILED"; },
    markAccountReconnectRequired: async () => undefined,
    getAdapter: (platform: Platform) => adapters[platform],
  };
  return { publish: createPublisher(dependencies), statuses, calls };
}

async function run(): Promise<void> {
  assert.equal(derivePostStatus([{ status: "PUBLISHED" }, { status: "FAILED" }]), "PARTIALLY_FAILED");
  assert.equal(derivePostStatus([{ status: "FAILED" }, { status: "FAILED" }]), "FAILED");

  const success = fixture();
  const successful = adapter("X", async () => ({ ok: true, publishedUrl: "https://mock.local/x" }));
  const successfulLinkedIn = adapter("LINKEDIN", async () => ({ ok: true, publishedUrl: "https://mock.local/linkedin" }));
  const first = service(success.post, { X: successful, FACEBOOK: successful, INSTAGRAM: successful, TIKTOK: successful, LINKEDIN: successfulLinkedIn });
  await first.publish("post-1", "user-1");
  assert.deepEqual(first.calls.filter((call) => call.startsWith("published:")), ["published:target-x", "published:target-linkedin"]);
  assert.equal(first.statuses.at(-1), "PUBLISHED");

  const partial = fixture();
  const failing = adapter("LINKEDIN", async () => ({ ok: false, error: "provider rejected", retryable: false }));
  const second = service(partial.post, { X: successful, FACEBOOK: successful, INSTAGRAM: successful, TIKTOK: successful, LINKEDIN: failing });
  await second.publish("post-1", "user-1");
  assert.equal(second.statuses.at(-1), "PARTIALLY_FAILED");

  const repeated = second.calls.length;
  await second.publish("post-1", "user-1");
  assert.equal(second.calls.length, repeated);
  console.log("Publisher tests passed.");
}

void run();
