"use client";

import { useRef, useState, type ReactNode } from "react";
import { LoaderCircle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAiAdaptationQuota, useAdaptPost } from "@/lib/api";
import { requiresAiRegenerationConfirmation } from "@/stores/composerStore";
import type {
  ComposerMedia,
  ComposerTone,
  ComposerVariant,
} from "@/stores/composerStore";

import { ToneSelector } from "./ToneSelector";

interface AiAdaptPanelProps {
  baseText: string;
  variants: ComposerVariant[];
  media: ComposerMedia[];
  tone: ComposerTone;
  onToneChange: (tone: ComposerTone) => void;
  onGenerated: (accountId: string, adaptedText: string) => void;
  children: (controls: AiAdaptPanelControls) => ReactNode;
}

export interface AiAdaptPanelControls {
  generatingAccountIds: ReadonlySet<string>;
  onRegenerate: (variant: ComposerVariant) => void;
}

export function AiAdaptPanel({
  baseText,
  variants,
  media,
  tone,
  onToneChange,
  onGenerated,
  children,
}: AiAdaptPanelProps) {
  const adaptPost = useAdaptPost();
  const aiQuota = useAiAdaptationQuota();
  const adaptingRef = useRef(false);
  const [pendingRegeneration, setPendingRegeneration] =
    useState<ComposerVariant | null>(null);
  const [generatingAccountIds, setGeneratingAccountIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [hasAdaptationError, setHasAdaptationError] = useState(false);
  const [latestQuota, setLatestQuota] = useState<{
    limit: number;
    remaining: number;
  } | null>(null);
  const quota = latestQuota ?? aiQuota.data?.quota;
  const quotaReached = quota?.remaining === 0;
  const requestedGenerationCount = new Set(
    variants.map((variant) => variant.platform),
  ).size;
  const quotaCannotAdapt =
    quota !== undefined && quota.remaining < requestedGenerationCount;
  const canAdapt =
    baseText.trim().length > 0 &&
    variants.length > 0 &&
    !adaptPost.isPending &&
    !adaptingRef.current &&
    !aiQuota.isLoading &&
    !aiQuota.isError &&
    !quotaCannotAdapt;

  async function adaptVariants(variantsToAdapt: ComposerVariant[]) {
    if (
      !baseText.trim() ||
      variantsToAdapt.length === 0 ||
      adaptingRef.current
    ) {
      return;
    }

    adaptingRef.current = true;
    setHasAdaptationError(false);
    setGeneratingAccountIds(
      new Set(variantsToAdapt.map((variant) => variant.accountId)),
    );

    try {
      const result = await adaptPost.mutateAsync({
        baseText,
        platforms: Array.from(
          new Set(variantsToAdapt.map((variant) => variant.platform)),
        ),
        tone,
        media: {
          hasImages: media.some((item) => item.type === "IMAGE"),
          hasVideo: media.some((item) => item.type === "VIDEO"),
        },
      });
      setLatestQuota({
        limit: result.quota.limit,
        remaining: result.quota.remaining,
      });

      const generatedByPlatform = new Map(
        result.variants.map((variant) => [variant.platform, variant]),
      );
      const hasCompleteResponse = variantsToAdapt.every((variant) =>
        generatedByPlatform.has(variant.platform),
      );

      if (!hasCompleteResponse) {
        throw new Error("Incomplete AI adaptation response");
      }

      for (const variant of variantsToAdapt) {
        const generatedVariant = generatedByPlatform.get(variant.platform);
        if (!generatedVariant) {
          continue;
        }

        onGenerated(variant.accountId, generatedVariant.text);
      }
    } catch {
      setHasAdaptationError(true);
      void aiQuota.refetch();
    } finally {
      adaptingRef.current = false;
      setGeneratingAccountIds(new Set());
    }
  }

  function requestRegeneration(variant: ComposerVariant) {
    if (adaptPost.isPending || adaptingRef.current || quotaReached) {
      return;
    }

    if (requiresAiRegenerationConfirmation(variant)) {
      setPendingRegeneration(variant);
      return;
    }

    void adaptVariants([variant]);
  }

  function confirmRegeneration() {
    if (!pendingRegeneration) {
      return;
    }

    const variant = pendingRegeneration;
    setPendingRegeneration(null);
    void adaptVariants([variant]);
  }

  return (
    <>
      <section
        aria-labelledby="ai-adaptation-heading"
        className="rounded-lg border border-border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2
              id="ai-adaptation-heading"
              className="text-sm font-medium text-foreground"
            >
              AI adaptation
            </h2>
            <p
              id="ai-adaptation-help"
              className="mt-1 text-xs text-muted-foreground"
            >
              Generate platform-native drafts for review. AI suggestions are
              never published automatically.
            </p>
          </div>
          <ToneSelector value={tone} onChange={onToneChange} />
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">
            {variants.length > 0
              ? `Generate suggestions for ${variants.length} selected ${variants.length === 1 ? "platform" : "platforms"}.`
              : "Select a platform to generate a suggestion."}
          </p>
          <div className="w-full space-y-1 sm:w-auto sm:text-right">
            <Button
              type="button"
              onClick={() => void adaptVariants(variants)}
              disabled={!canAdapt}
              aria-describedby="ai-adaptation-help"
              title={
                quotaCannotAdapt
                  ? quotaReached
                    ? "Daily AI adaptation limit reached. Try again later."
                    : "There are not enough AI adaptations remaining for the selected platforms."
                  : undefined
              }
              className="w-full sm:w-auto"
            >
              {adaptPost.isPending ? (
                <LoaderCircle className="mr-2 animate-spin" aria-hidden="true" />
              ) : (
                <Sparkles className="mr-2" aria-hidden="true" />
              )}
              {adaptPost.isPending ? "Adapting with AI" : "Adapt with AI"}
            </Button>
            {quota ? (
              <p className="text-xs text-muted-foreground">
                {quota.remaining}/{quota.limit} today
              </p>
            ) : null}
          </div>
        </div>

        {quotaCannotAdapt ? (
          <p className="mt-3 text-sm text-muted-foreground" role="status">
            {quotaReached
              ? "Daily AI adaptation limit reached. Try again later."
              : "There are not enough AI adaptations remaining for the selected platforms."}
          </p>
        ) : null}

        {aiQuota.isError ? (
          <p className="mt-3 text-sm text-destructive" role="alert">
            Unable to check AI availability. Refresh and try again.
          </p>
        ) : null}

        {hasAdaptationError ? (
          <div
            className="mt-3 flex flex-wrap items-center justify-between gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
            role="alert"
          >
            <span>AI adaptation failed. Try again.</span>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => void adaptVariants(variants)}
              disabled={!canAdapt}
            >
              Retry
            </Button>
          </div>
        ) : null}
      </section>

      {children({ generatingAccountIds, onRegenerate: requestRegeneration })}

      <Dialog
        open={pendingRegeneration !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRegeneration(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Replace your edits?</DialogTitle>
            <DialogDescription>
              Regenerating this variant will replace the edits you made with a
              new AI suggestion.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPendingRegeneration(null)}
            >
              Keep edits
            </Button>
            <Button type="button" onClick={confirmRegeneration}>
              Replace with AI
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
