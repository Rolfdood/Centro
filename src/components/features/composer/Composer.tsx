"use client";

import { useCallback, useMemo } from "react";

import { useAccounts } from "@/lib/api";
import { validatePost } from "@/lib/platforms/constraints";
import { useComposerStore } from "@/stores/composerStore";

import { BaseTextArea } from "./BaseTextArea";
import { MediaUploader } from "./MediaUploader";
import { PlatformSelector } from "./PlatformSelector";
import { PlatformVariantCard } from "./PlatformVariantCard";
import { PublishFooter } from "./PublishFooter";
import { ToneSelector } from "./ToneSelector";

export function Composer() {
  const { data: accounts = [], isLoading, isError } = useAccounts();
  const baseText = useComposerStore((state) => state.baseText);
  const selectedAccountIds = useComposerStore(
    (state) => state.selectedAccountIds,
  );
  const setBaseText = useComposerStore((state) => state.setBaseText);
  const variants = useComposerStore((state) => state.variants);
  const media = useComposerStore((state) => state.media);
  const tone = useComposerStore((state) => state.tone);
  const selectAccount = useComposerStore((state) => state.selectAccount);
  const deselectAccount = useComposerStore((state) => state.deselectAccount);
  const setVariantText = useComposerStore((state) => state.setVariantText);
  const setMedia = useComposerStore((state) => state.setMedia);
  const setTone = useComposerStore((state) => state.setTone);
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

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col pb-4">
      <div className="space-y-6">
        {isLoading ? (
          <section aria-label="Loading accounts" className="space-y-2">
            <div className="h-3 w-20 animate-pulse rounded bg-muted" />
            <div className="flex gap-2">
              <div className="h-9 w-32 animate-pulse rounded-md bg-muted" />
              <div className="h-9 w-36 animate-pulse rounded-md bg-muted" />
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-mono text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Platform variations
          </h2>
          <ToneSelector value={tone} onChange={setTone} />
        </div>

        <MediaUploader media={media} onChange={setMedia} />

        {selectedVariants.length > 0 ? (
          <section className="space-y-4" aria-label="Platform variations">
            {selectedVariants.map((variant) => (
              <PlatformVariantCard
                key={variant.accountId}
                variant={variant}
                media={media}
                errors={validations.get(variant.accountId)?.errors ?? []}
                onChange={(adaptedText) =>
                  setVariantText(variant.accountId, adaptedText)
                }
              />
            ))}
          </section>
        ) : (
          <section className="rounded-lg border border-dashed border-border bg-card/50 p-5 text-sm text-muted-foreground">
            Select a connected platform to create a tailored post variation.
          </section>
        )}
      </div>

      <PublishFooter
        selectedCount={selectedAccountIds.length}
        isValid={variantsAreValid}
        onInvalidAttempt={scrollToFirstInvalidVariant}
      />
    </div>
  );
}
