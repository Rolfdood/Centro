import type { ComposerVariant } from "@/stores/composerStore";

interface AiAdaptationTargetInput {
  variants: ComposerVariant[];
  requestedVariant: ComposerVariant;
  sharedCaption: boolean;
}

export function getRequestedAiGenerationCount(
  variants: ComposerVariant[],
  sharedCaption: boolean,
): number {
  if (variants.length === 0) {
    return 0;
  }

  if (sharedCaption) {
    return 1;
  }

  return new Set(variants.map((variant) => variant.platform)).size;
}

export function getAiAdaptationTargets({
  variants,
  requestedVariant,
  sharedCaption,
}: AiAdaptationTargetInput): ComposerVariant[] {
  return sharedCaption ? variants : [requestedVariant];
}

export function getEditedAiRegenerationCount(
  variants: ComposerVariant[],
): number {
  return variants.filter((variant) => variant.isManuallyEdited).length;
}
