"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import type { Platform } from "@/lib/platforms/constraints";
import { COMPOSER_TONES } from "@/lib/validations/ai";

export type ComposerTone = (typeof COMPOSER_TONES)[number];

export { COMPOSER_TONES };

export interface ComposerMedia {
  id: string;
  url: string;
  type: "IMAGE" | "VIDEO";
  sizeBytes: number;
  mimeType?: string;
  width?: number | null;
  height?: number | null;
}

export interface ComposerVariant {
  accountId: string;
  platform: Platform;
  adaptedText: string;
  isManuallyEdited: boolean;
  isAiGenerated: boolean;
}

export interface ComposerAccountSelection {
  id: string;
  platform: Platform;
}

export function requiresAiRegenerationConfirmation(
  variant: ComposerVariant,
): boolean {
  return variant.isManuallyEdited;
}

interface ComposerDraftState {
  idempotencyKey: string;
  baseText: string;
  selectedAccountIds: string[];
  variants: Record<string, ComposerVariant>;
  media: ComposerMedia[];
  tone: ComposerTone;
}

interface ComposerStore extends ComposerDraftState {
  beginNewDraft: () => void;
  setBaseText: (baseText: string) => void;
  selectAccount: (account: ComposerAccountSelection) => void;
  deselectAccount: (accountId: string) => void;
  setVariantText: (accountId: string, adaptedText: string) => void;
  setAiVariant: (accountId: string, adaptedText: string) => void;
  setMedia: (media: ComposerMedia[]) => void;
  setTone: (tone: ComposerTone) => void;
}

function createIdempotencyKey(): string {
  return crypto.randomUUID();
}

function createInitialDraft(): ComposerDraftState {
  return {
    idempotencyKey: createIdempotencyKey(),
    baseText: "",
    selectedAccountIds: [],
    variants: {},
    media: [],
    tone: "professional",
  };
}

export const useComposerStore = create<ComposerStore>()(
  persist(
    (set) => ({
      ...createInitialDraft(),
      beginNewDraft: () => set(createInitialDraft()),
      setBaseText: (baseText) =>
        set((state) => ({
          baseText,
          variants: Object.fromEntries(
            Object.entries(state.variants).map(([accountId, variant]) => [
              accountId,
              variant.isManuallyEdited
                ? variant
                : {
                    ...variant,
                    adaptedText: baseText,
                    isAiGenerated: false,
                  },
            ]),
          ),
        })),
      selectAccount: (account) =>
        set((state) => {
          if (state.selectedAccountIds.includes(account.id)) {
            return state;
          }

          return {
            selectedAccountIds: [...state.selectedAccountIds, account.id],
            variants: {
              ...state.variants,
              [account.id]: {
                accountId: account.id,
                platform: account.platform,
                adaptedText: state.baseText,
                isManuallyEdited: false,
                isAiGenerated: false,
              },
            },
          };
        }),
      deselectAccount: (accountId) =>
        set((state) => {
          const { [accountId]: _removedVariant, ...remainingVariants } =
            state.variants;

          return {
            selectedAccountIds: state.selectedAccountIds.filter(
              (id) => id !== accountId,
            ),
            variants: remainingVariants,
          };
        }),
      setVariantText: (accountId, adaptedText) =>
        set((state) => {
          const variant = state.variants[accountId];
          if (!variant) {
            return state;
          }

          return {
            variants: {
              ...state.variants,
              [accountId]: {
                ...variant,
                adaptedText,
                isManuallyEdited: true,
                isAiGenerated: false,
              },
            },
          };
        }),
      setAiVariant: (accountId, adaptedText) =>
        set((state) => {
          const variant = state.variants[accountId];
          if (!variant) {
            return state;
          }

          return {
            variants: {
              ...state.variants,
              [accountId]: {
                ...variant,
                adaptedText,
                isManuallyEdited: false,
                isAiGenerated: true,
              },
            },
          };
        }),
      setMedia: (media) => set({ media }),
      setTone: (tone) => set({ tone }),
    }),
    {
      name: "centro-composer",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        idempotencyKey: state.idempotencyKey,
        baseText: state.baseText,
        selectedAccountIds: state.selectedAccountIds,
        variants: state.variants,
        media: state.media,
        tone: state.tone,
      }),
    },
  ),
);
