"use client";

import { useState, type ReactNode } from "react";
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
import { useAdaptPost } from "@/lib/api";
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
  const [pendingRegeneration, setPendingRegeneration] =
    useState<ComposerVariant | null>(null);
  const [generatingAccountIds, setGeneratingAccountIds] = useState<
    ReadonlySet<string>
  >(new Set());
  const [hasAdaptationError, setHasAdaptationError] = useState(false);
  const canAdapt =
    baseText.trim().length > 0 && variants.length > 0 && !adaptPost.isPending;

  async function adaptVariants(variantsToAdapt: ComposerVariant[]) {
    if (!baseText.trim() || variantsToAdapt.length === 0) {
      return;
    }

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

      for (const variant of variantsToAdapt) {
        const generatedVariant = result.variants.find(
          (candidate) => candidate.platform === variant.platform,
        );

        if (generatedVariant) {
          onGenerated(variant.accountId, generatedVariant.adaptedText);
        }
      }
    } catch {
      setHasAdaptationError(true);
    } finally {
      setGeneratingAccountIds(new Set());
    }
  }

  function requestRegeneration(variant: ComposerVariant) {
    if (adaptPost.isPending) {
      return;
    }

    if (variant.isManuallyEdited) {
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
          <Button
            type="button"
            onClick={() => void adaptVariants(variants)}
            disabled={!canAdapt}
            aria-describedby="ai-adaptation-help"
            className="w-full sm:w-auto"
          >
            {adaptPost.isPending ? (
              <LoaderCircle className="mr-2 animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles className="mr-2" aria-hidden="true" />
            )}
            {adaptPost.isPending ? "Adapting with AI" : "Adapt with AI"}
          </Button>
        </div>

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
