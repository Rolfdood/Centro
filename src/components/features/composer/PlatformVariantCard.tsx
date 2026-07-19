"use client";

import { Bot, PencilLine, RefreshCw } from "lucide-react";

import { PlatformIcon } from "@/components/features/accounts/PlatformIcon";
import { Button } from "@/components/ui/button";
import { getConstraints, type Platform } from "@/lib/platforms/constraints";
import { cn } from "@/lib/utils";
import type { ComposerMedia, ComposerVariant } from "@/stores/composerStore";

interface PlatformVariantCardProps {
  variant: ComposerVariant;
  media: ComposerMedia[];
  errors: string[];
  onChange: (value: string) => void;
}

function mediaRequirement(platform: Platform): string | null {
  const constraints = getConstraints(platform);

  if (constraints.requiresImage) {
    return `${platform === "INSTAGRAM" ? "Instagram" : platform} requires an image`;
  }

  if (constraints.requiresVideo) {
    return `${platform === "TIKTOK" ? "TikTok" : platform} requires a video`;
  }

  return null;
}

export function PlatformVariantCard({
  variant,
  media,
  errors,
  onChange,
}: PlatformVariantCardProps) {
  const constraints = getConstraints(variant.platform);
  const requirement = mediaRequirement(variant.platform);
  const hasRequiredMedia = requirement
    ? variant.platform === "INSTAGRAM"
      ? media.some((item) => item.type === "IMAGE")
      : media.some((item) => item.type === "VIDEO")
    : true;
  const charactersRemaining = constraints.maxChars - variant.adaptedText.length;
  const isOverLimit = charactersRemaining < 0;

  return (
    <article
      id={`variant-${variant.accountId}`}
      className={cn(
        "scroll-mt-6 rounded-lg border bg-card p-4 sm:p-5",
        errors.length > 0 ? "border-destructive/70" : "border-border",
      )}
      aria-labelledby={`variant-heading-${variant.accountId}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <PlatformIcon platform={variant.platform} className="size-8 text-[10px]" />
          <div className="min-w-0">
            <h2
              id={`variant-heading-${variant.accountId}`}
              className="text-sm font-medium text-foreground"
            >
              {variant.platform === "X" ? "X (Twitter)" : variant.platform}
            </h2>
            <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Platform variant
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {variant.isAiGenerated ? (
            <span className="inline-flex items-center gap-1 rounded bg-secondary px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
              <Bot className="size-3" />
              AI
            </span>
          ) : null}
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            disabled
            title="AI regeneration is coming soon"
            aria-label={`Regenerate ${variant.platform} variant with AI (coming soon)`}
          >
            <RefreshCw />
          </Button>
        </div>
      </div>

      <textarea
        value={variant.adaptedText}
        onChange={(event) => onChange(event.target.value)}
        aria-label={`${variant.platform} post text`}
        aria-describedby={`variant-count-${variant.accountId} variant-errors-${variant.accountId}`}
        aria-invalid={errors.length > 0}
        className="mt-4 min-h-32 w-full resize-y rounded-md border border-input bg-background px-3 py-2.5 text-sm leading-6 text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
        placeholder={`Write your ${variant.platform} post...`}
      />

      <div className="mt-2 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs">
        <span
          id={`variant-count-${variant.accountId}`}
          className={cn(
            "font-mono tabular-nums",
            isOverLimit ? "text-destructive" : "text-muted-foreground",
          )}
        >
          {isOverLimit
            ? `${Math.abs(charactersRemaining)} over ${constraints.maxChars}`
            : `${variant.adaptedText.length} / ${constraints.maxChars}`}
        </span>
        {requirement ? (
          <span
            className={cn(
              "inline-flex items-center gap-1",
              hasRequiredMedia ? "text-emerald-400" : "text-muted-foreground",
            )}
          >
            <PencilLine className="size-3" />
            {requirement}{hasRequiredMedia ? " ✓" : ""}
          </span>
        ) : null}
      </div>

      {errors.length > 0 ? (
        <ul
          id={`variant-errors-${variant.accountId}`}
          className="mt-3 space-y-1 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive"
          aria-live="polite"
        >
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      ) : (
        <p id={`variant-errors-${variant.accountId}`} className="sr-only">
          This platform variant is valid.
        </p>
      )}
    </article>
  );
}
