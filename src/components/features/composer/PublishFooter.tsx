"use client";

import { CalendarClock, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PublishFooterProps {
  selectedCount: number;
  isValid: boolean;
  onInvalidAttempt: () => void;
}

export function PublishFooter({
  selectedCount,
  isValid,
  onInvalidAttempt,
}: PublishFooterProps) {
  const hasSelectedPlatforms = selectedCount > 0;
  const canPublish = hasSelectedPlatforms && isValid;

  return (
    <footer className="sticky bottom-0 z-10 -mx-4 mt-6 border-t border-border bg-background/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6">
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="font-mono text-xs text-muted-foreground">Unsaved draft</p>
          {!hasSelectedPlatforms ? (
            <p className="mt-0.5 text-xs text-muted-foreground">
              Select at least one platform to continue.
            </p>
          ) : null}
          {hasSelectedPlatforms && !isValid ? (
            <div className="mt-0.5 flex items-center gap-2 text-xs text-destructive">
              <p>
              Fix the highlighted platform variants to continue.
              </p>
              <button
                type="button"
                onClick={onInvalidAttempt}
                className="underline underline-offset-2 hover:text-destructive/80"
              >
                Review errors
              </button>
            </div>
          ) : null}
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <span
            className="flex-1 sm:flex-none"
            onClick={() => {
              if (!canPublish && hasSelectedPlatforms) {
                onInvalidAttempt();
              }
            }}
          >
            <Button
              type="button"
              variant="outline"
              className="w-full sm:w-auto"
              disabled={!canPublish}
              title={canPublish ? "Scheduling is coming soon" : "Fix validation errors before scheduling"}
            >
              <CalendarClock className="mr-2" />
              Schedule
            </Button>
          </span>
          <span
            className="flex-1 sm:flex-none"
            onClick={() => {
              if (!canPublish && hasSelectedPlatforms) {
                onInvalidAttempt();
              }
            }}
          >
            <Button
              type="button"
              className="w-full sm:w-auto"
              disabled={!canPublish}
              title={
                canPublish
                  ? "Publishing will be enabled in the next composer step"
                  : hasSelectedPlatforms
                    ? "Fix validation errors before publishing"
                    : "Select at least one platform first"
              }
            >
              <Send className="mr-2" />
              Publish now
            </Button>
          </span>
        </div>
      </div>
    </footer>
  );
}
