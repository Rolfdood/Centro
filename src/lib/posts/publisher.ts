import type { MediaAsset, PostStatus, SocialAccount, TargetStatus } from "@prisma/client";
import { getPlatformAdapter } from "@/lib/platforms/registry";
import type { Platform } from "@/lib/platforms/constraints";
import type { PublishResult, SocialPlatformAdapter } from "@/lib/platforms/types";
import { postWithRelationsInclude, type PostWithRelations } from "@/lib/posts";

const publishInclude = {
  targets: {
    include: { account: true },
    orderBy: { id: "asc" },
  },
  media: { orderBy: { order: "asc" } },
} as const;

type PublishablePost = {
  id: string;
  userId: string;
  idempotencyKey: string;
  targets: Array<{
    id: string;
    accountId: string;
    platform: Platform;
    adaptedText: string;
    status: TargetStatus;
    attempts: number;
    account: SocialAccount;
  }>;
  media: MediaAsset[];
};

export interface PublisherDependencies {
  findPost: (postId: string, userId: string) => Promise<PublishablePost | null>;
  loadResult: (postId: string, userId: string) => Promise<PostWithRelations | null>;
  updatePostStatus: (postId: string, status: PostStatus) => Promise<void>;
  markTargetPublishing: (targetId: string) => Promise<void>;
  markTargetPublished: (targetId: string, publishedUrl: string, publishedAt: Date) => Promise<void>;
  markTargetFailed: (targetId: string, error: string, attempts: number) => Promise<void>;
  markAccountReconnectRequired: (accountId: string) => Promise<void>;
  getAdapter?: (platform: Platform) => SocialPlatformAdapter;
  now?: () => Date;
}

export function derivePostStatus(targets: ReadonlyArray<{ status: TargetStatus }>): PostStatus {
  if (targets.some((target) => target.status === "PUBLISHING")) return "PUBLISHING";
  if (targets.length > 0 && targets.every((target) => target.status === "PUBLISHED")) return "PUBLISHED";
  if (targets.length > 0 && targets.every((target) => target.status === "FAILED")) return "FAILED";
  if (targets.some((target) => target.status === "PUBLISHED") && targets.some((target) => target.status === "FAILED")) {
    return "PARTIALLY_FAILED";
  }
  return "DRAFT";
}

function safeError(result: Extract<PublishResult, { ok: false }>): string {
  if (result.authExpired) return "Reconnect your account to publish this target.";
  return result.error.trim().slice(0, 500) || "Unable to publish this target.";
}

export function createPublisher(dependencies: PublisherDependencies) {
  return async function publishPost(postId: string, userId: string): Promise<PostWithRelations | null> {
    const post = await dependencies.findPost(postId, userId);
    if (!post) return null;

    const pendingTargets = post.targets.filter((target) => target.status === "DRAFT");
    if (pendingTargets.length === 0) {
      await dependencies.updatePostStatus(post.id, derivePostStatus(post.targets));
      return dependencies.loadResult(post.id, userId);
    }

    await dependencies.updatePostStatus(post.id, "PUBLISHING");
    const getAdapter = dependencies.getAdapter ?? getPlatformAdapter;
    const now = dependencies.now ?? (() => new Date());

    for (const target of pendingTargets) {
      await dependencies.markTargetPublishing(target.id);
      const adapter = getAdapter(target.platform);

      try {
        const auth = await adapter.checkAuth(target.account);
        if (!auth.active) {
          await dependencies.markAccountReconnectRequired(target.accountId);
          await dependencies.markTargetFailed(target.id, `Reconnect your ${target.platform} account to publish this target.`, target.attempts + 1);
          continue;
        }

        const result = await adapter.publishPost({
          targetId: target.id,
          idempotencyKey: post.idempotencyKey,
          text: target.adaptedText,
          media: post.media,
          account: target.account,
        });

        if (result.ok) {
          await dependencies.markTargetPublished(target.id, result.publishedUrl, now());
        } else {
          if (result.authExpired) await dependencies.markAccountReconnectRequired(target.accountId);
          await dependencies.markTargetFailed(target.id, safeError(result), target.attempts + 1);
        }
      } catch (error) {
        console.error("Unable to publish target.", error);
        await dependencies.markTargetFailed(target.id, "Unable to publish this target.", target.attempts + 1);
      }
    }

    const updated = await dependencies.findPost(post.id, userId);
    if (!updated) return null;
    await dependencies.updatePostStatus(post.id, derivePostStatus(updated.targets));
    return dependencies.loadResult(post.id, userId);
  };
}

export const publishPostForUser = createPublisher({
  findPost: async (postId, userId) => {
    const { db } = await import("@/lib/db");
    return db.post.findFirst({ where: { id: postId, userId }, include: publishInclude });
  },
  loadResult: async (postId, userId) => {
    const { db } = await import("@/lib/db");
    return db.post.findFirst({ where: { id: postId, userId }, include: postWithRelationsInclude });
  },
  updatePostStatus: async (postId, status) => { const { db } = await import("@/lib/db"); await db.post.update({ where: { id: postId }, data: { status } }); },
  markTargetPublishing: async (targetId) => { const { db } = await import("@/lib/db"); await db.postTarget.update({ where: { id: targetId }, data: { status: "PUBLISHING", attempts: { increment: 1 } } }); },
  markTargetPublished: async (targetId, publishedUrl, publishedAt) => { const { db } = await import("@/lib/db"); await db.postTarget.update({ where: { id: targetId }, data: { status: "PUBLISHED", publishedUrl, publishedAt, error: null } }); },
  markTargetFailed: async (targetId, error) => { const { db } = await import("@/lib/db"); await db.postTarget.update({ where: { id: targetId }, data: { status: "FAILED", error } }); },
  markAccountReconnectRequired: async (accountId) => { const { db } = await import("@/lib/db"); await db.socialAccount.update({ where: { id: accountId }, data: { status: "RECONNECT_REQUIRED" } }); },
});
