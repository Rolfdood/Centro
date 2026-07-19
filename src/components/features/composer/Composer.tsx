"use client";

import { useEffect } from "react";

import { useAccounts } from "@/lib/api";
import { useComposerStore } from "@/stores/composerStore";

import { BaseTextArea } from "./BaseTextArea";
import { PlatformSelector } from "./PlatformSelector";
import { PublishFooter } from "./PublishFooter";

export function Composer() {
  const { data: accounts = [], isLoading, isError } = useAccounts();
  const beginNewDraft = useComposerStore((state) => state.beginNewDraft);
  const baseText = useComposerStore((state) => state.baseText);
  const selectedAccountIds = useComposerStore(
    (state) => state.selectedAccountIds,
  );
  const setBaseText = useComposerStore((state) => state.setBaseText);
  const selectAccount = useComposerStore((state) => state.selectAccount);
  const deselectAccount = useComposerStore((state) => state.deselectAccount);

  useEffect(() => {
    beginNewDraft();
  }, [beginNewDraft]);

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
            aria-labelledby="platforms-heading"
            className="rounded-lg border border-destructive/40 bg-destructive/10 p-4"
          >
            <h2 id="platforms-heading" className="font-medium text-foreground">
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
      </div>

      <PublishFooter selectedCount={selectedAccountIds.length} />
    </div>
  );
}
