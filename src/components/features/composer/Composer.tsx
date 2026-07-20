"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { useAccounts, useCreatePost, usePublishPost } from "@/lib/api";
import { validatePost } from "@/lib/platforms/constraints";
import { useComposerStore } from "@/stores/composerStore";

import { AiAdaptPanel } from "./AiAdaptPanel";
import { BaseTextArea } from "./BaseTextArea";
import { MediaUploader } from "./MediaUploader";
import { PlatformSelector } from "./PlatformSelector";
import { PlatformVariantCard } from "./PlatformVariantCard";
import { PublishFooter } from "./PublishFooter";
import { Skeleton } from "@/components/ui/skeleton";

export function Composer() {
  const router = useRouter();
  const { data: accounts = [], isLoading, isError } = useAccounts();
  const createPost = useCreatePost();
  const publishPost = usePublishPost();
  const [publishError, setPublishError] = useState<string | null>(null);
  const [isPublishSubmitted, setIsPublishSubmitted] = useState(false);
  const publishRequestedRef = useRef(false);
  const baseText = useComposerStore((state) => state.baseText);
  const selectedAccountIds = useComposerStore(
    (state) => state.selectedAccountIds,
  );
  const setBaseText = useComposerStore((state) => state.setBaseText);
  const variants = useComposerStore((state) => state.variants);
  const media = useComposerStore((state) => state.media);
  const tone = useComposerStore((state) => state.tone);
  const idempotencyKey = useComposerStore((state) => state.idempotencyKey);
  const selectAccount = useComposerStore((state) => state.selectAccount);
  const deselectAccount = useComposerStore((state) => state.deselectAccount);
  const setVariantText = useComposerStore((state) => state.setVariantText);
  const setAiVariant = useComposerStore((state) => state.setAiVariant);
  const setMedia = useComposerStore((state) => state.setMedia);
  const setTone = useComposerStore((state) => state.setTone);
  const beginNewDraft = useComposerStore((state) => state.beginNewDraft);
  const { selectedVariants, validations, variantsAreValid, firstInvalidAccountId } =
    useMemo(() => {
      const selectedVariants = selectedAccountIds.flatMap((accountId) => {
        const variant = variants[accountId];
        return variant ? [variant] : [];
      });
      const validations = new Map(
        selectedVariants.map((variant) => [
          variant.accountId,
          validatePost(variant.platform, variant.adaptedText, media),
        ]),
      );
      const firstInvalidAccountId = selectedVariants.find(
        (variant) => !validations.get(variant.accountId)?.valid,
      )?.accountId;

      return {
        selectedVariants,
        validations,
        variantsAreValid: selectedVariants.every(
          (variant) => validations.get(variant.accountId)?.valid,
        ),
        firstInvalidAccountId,
      };
    }, [media, selectedAccountIds, variants]);
  const scrollToFirstInvalidVariant = useCallback(() => {
    if (!firstInvalidAccountId) {
      return;
    }

    const card = document.getElementById(`variant-${firstInvalidAccountId}`);
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
    card?.querySelector<HTMLTextAreaElement>("textarea")?.focus({
      preventScroll: true,
    });
  }, [firstInvalidAccountId]);
  const isPublishing =
    isPublishSubmitted || createPost.isPending || publishPost.isPending;
  const handlePublish = useCallback(async () => {
    if (publishRequestedRef.current) {
      return;
    }

    if (!variantsAreValid || selectedVariants.length === 0) {
      scrollToFirstInvalidVariant();
      return;
    }

    setPublishError(null);
    publishRequestedRef.current = true;
    setIsPublishSubmitted(true);

    try {
      const post = await createPost.mutateAsync({
        idempotencyKey,
        baseText,
        targets: selectedVariants.map((variant) => ({
          accountId: variant.accountId,
          adaptedText: variant.adaptedText,
        })),
        media: media.map((asset, index) => ({
          url: asset.url,
          type: asset.type,
          sizeBytes: asset.sizeBytes,
          width: asset.width ?? null,
          height: asset.height ?? null,
          order: index,
        })),
        scheduledAt: null,
      });
      await publishPost.mutateAsync({ postId: post.id });

      beginNewDraft();
      router.push("/dashboard");
    } catch {
      publishRequestedRef.current = false;
      setIsPublishSubmitted(false);
      setPublishError(
        "We couldn’t publish this post. Please review your draft and try again.",
      );
    }
  }, [
    baseText,
    beginNewDraft,
    createPost,
    idempotencyKey,
    media,
    publishPost,
    router,
    scrollToFirstInvalidVariant,
    selectedVariants,
    variantsAreValid,
  ]);

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col pb-4">
      <div className="space-y-6">
        {isLoading ? (
          <section aria-label="Loading accounts" className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <div className="flex gap-2">
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-36" />
            </div>
          </section>
        ) : isError ? (
          <section
            aria-labelledby="platform-load-error-heading"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4"
          >
            <h2
              id="platform-load-error-heading"
              className="font-medium text-foreground"
            >
              Unable to load connected accounts
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Refresh the page and try again before publishing.
            </p>
          </section>
        ) : (
          <PlatformSelector
            accounts={accounts}
            selectedAccountIds={selectedAccountIds}
            onSelect={selectAccount}
            onDeselect={deselectAccount}
          />
        )}

        <BaseTextArea value={baseText} onChange={setBaseText} />

        <MediaUploader media={media} onChange={setMedia} />

        <AiAdaptPanel
          baseText={baseText}
          variants={selectedVariants}
          media={media}
          tone={tone}
          onToneChange={setTone}
          onGenerated={setAiVariant}
        >
          {({ generatingAccountIds, onRegenerate }) =>
            selectedVariants.length > 0 ? (
              <section className="space-y-4" aria-label="Platform variations">
                {selectedVariants.map((variant) => (
                  <PlatformVariantCard
                    key={variant.accountId}
                    variant={variant}
                    media={media}
                    errors={validations.get(variant.accountId)?.errors ?? []}
                    isGenerating={generatingAccountIds.has(variant.accountId)}
                    onChange={(adaptedText) =>
                      setVariantText(variant.accountId, adaptedText)
                    }
                    onRegenerate={() => onRegenerate(variant)}
                  />
                ))}
              </section>
            ) : (
              <section className="rounded-lg border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
                Select a connected platform to create a tailored post variation.
              </section>
            )
          }
        </AiAdaptPanel>
      </div>

      <PublishFooter
        selectedCount={selectedAccountIds.length}
        isValid={variantsAreValid}
        isPublishing={isPublishing}
        publishError={publishError}
        onInvalidAttempt={scrollToFirstInvalidVariant}
        onPublish={handlePublish}
      />
    </div>
  );
}
