"use client";

import { CalendarClock, Send } from "lucide-react";

import { Button } from "@/components/ui/button";

interface PublishFooterProps {
  selectedCount: number;
}

export function PublishFooter({ selectedCount }: PublishFooterProps) {
  const hasSelectedPlatforms = selectedCount > 0;

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
        </div>
        <div className="flex w-full gap-2 sm:w-auto">
          <Button
            type="button"
            variant="outline"
            className="flex-1 sm:flex-none"
            disabled
            title="Scheduling is coming soon"
          >
            <CalendarClock className="mr-2" />
            Schedule
          </Button>
          <Button
            type="button"
            className="flex-1 sm:flex-none"
            disabled={!hasSelectedPlatforms}
            title={
              hasSelectedPlatforms
                ? "Publishing will be enabled in the next composer step"
                : "Select at least one platform first"
            }
          >
            <Send className="mr-2" />
            Publish now
          </Button>
        </div>
      </div>
    </footer>
  );
}
