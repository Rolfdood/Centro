"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, FileText, Plus, X } from "lucide-react";

import { PostHistoryRow } from "@/components/features/posts/PostHistoryRow";
import { Button, buttonVariants } from "@/components/ui/button";
import { usePosts } from "@/lib/api";
import { cn } from "@/lib/utils";
import type { PostListItemDto } from "@/types";

const PAGE_SIZE = 10;

const FILTERS = [
  { id: "ALL", label: "All" },
  { id: "PUBLISHED", label: "Published" },
  { id: "SCHEDULED", label: "Scheduled" },
  { id: "FAILED", label: "Failed" },
] as const;

type PostFilter = (typeof FILTERS)[number]["id"];

function matchesFilter(post: PostListItemDto, filter: PostFilter): boolean {
  if (filter === "ALL") return true;
  if (filter === "FAILED") {
    return post.status === "FAILED" || post.status === "PARTIALLY_FAILED";
  }
  return post.status === filter;
}

function getPostDate(post: PostListItemDto): string {
  return post.scheduledAt ?? post.createdAt;
}

function formatPostDate(date: string, timezone: string): string {
  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: timezone,
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  } catch {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: "UTC",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(new Date(date));
  }
}

function EmptyPosts({ filtered }: { filtered: boolean }) {
  return (
    <div className="flex min-h-72 flex-col items-center justify-center px-6 py-12 text-center">
      <span className="mb-4 flex size-11 items-center justify-center rounded-full border border-border bg-muted/50">
        <FileText className="size-5 text-muted-foreground" />
      </span>
      <h2 className="text-lg font-semibold">
        {filtered ? "No matching posts" : "No posts yet"}
      </h2>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        {filtered
          ? "Try another filter to see more of your post history."
          : "Create your first post to publish across your connected platforms."}
      </p>
      {!filtered ? (
        <Link href="/compose" className={cn(buttonVariants(), "mt-5 gap-2")}>
          <Plus className="size-4" />
          Create First Post
        </Link>
      ) : null}
    </div>
  );
}

function LoadingPosts() {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-card" aria-busy="true">
      <div className="hidden border-b border-border bg-muted/30 px-4 py-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_6rem_8.5rem_10rem] md:gap-4">
        <span className="size-2" />
        <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Post content</span>
        <span className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Platforms</span>
        <span className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
        <span className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
      </div>
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-4 border-b border-border px-4 py-5 last:border-b-0">
          <span className="size-2 animate-pulse rounded-full bg-muted" />
          <span className="h-4 w-2/3 animate-pulse rounded bg-muted" />
        </div>
      ))}
    </div>
  );
}

interface PostHistoryTableProps {
  timezone: string;
}

export function PostHistoryTable({ timezone }: PostHistoryTableProps) {
  const { data: posts = [], error, isLoading } = usePosts();
  const [activeFilter, setActiveFilter] = useState<PostFilter>("ALL");
  const [page, setPage] = useState(1);
  const [retryMessage, setRetryMessage] = useState<string | null>(null);

  const filteredPosts = useMemo(
    () => posts.filter((post) => matchesFilter(post, activeFilter)),
    [activeFilter, posts],
  );
  const pageCount = Math.max(1, Math.ceil(filteredPosts.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const pagePosts = filteredPosts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  useEffect(() => {
    if (!retryMessage) return;

    const timeout = window.setTimeout(() => setRetryMessage(null), 5000);
    return () => window.clearTimeout(timeout);
  }, [retryMessage]);

  function handleFilterChange(filter: PostFilter) {
    setActiveFilter(filter);
    setPage(1);
  }

  function handleRetry(_postId: string) {
    setRetryMessage("Retry is not available yet. Please try again later.");
  }

  if (isLoading) return <LoadingPosts />;

  if (error instanceof Error) {
    return (
      <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-5" role="alert">
        <h2 className="font-medium text-foreground">Couldn’t load post history</h2>
        <p className="mt-1 text-sm text-muted-foreground">{error.message}</p>
      </div>
    );
  }

  return (
    <section aria-label="Post history">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex w-full gap-1 overflow-x-auto rounded-lg border border-border bg-card p-1 sm:w-auto" role="tablist" aria-label="Post filters">
          {FILTERS.map((filter) => {
            const count = posts.filter((post) => matchesFilter(post, filter.id)).length;
            const isActive = activeFilter === filter.id;

            return (
              <button
                key={filter.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                className={cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors",
                  isActive
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                  filter.id === "FAILED" && !isActive ? "hover:text-destructive" : "",
                )}
                onClick={() => handleFilterChange(filter.id)}
              >
                {filter.label}
                <span className="ml-1 font-mono text-xs text-muted-foreground">{count}</span>
              </button>
            );
          })}
        </div>

        <Link
          href="/compose"
          className={cn(buttonVariants({ size: "sm" }), "gap-2 self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          Compose
        </Link>
      </div>

      {retryMessage ? (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-md border border-amber-400/20 bg-amber-400/10 px-3 py-2 text-sm text-amber-200"
          role="status"
        >
          <p>{retryMessage}</p>
          <Button
            type="button"
            variant="ghost"
            size="icon-xs"
            className="shrink-0 text-amber-200 hover:bg-amber-400/10 hover:text-amber-100"
            aria-label="Dismiss retry notice"
            onClick={() => setRetryMessage(null)}
          >
            <X className="size-3.5" />
          </Button>
        </div>
      ) : null}

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {pagePosts.length > 0 ? (
          <>
            <div className="hidden border-b border-border bg-muted/30 px-4 py-3 md:grid md:grid-cols-[auto_minmax(0,1fr)_6rem_8.5rem_10rem] md:gap-4">
              <span className="size-2" />
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Post content</span>
              <span className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Platforms</span>
              <span className="text-center text-xs font-medium uppercase tracking-wider text-muted-foreground">Status</span>
              <span className="text-right text-xs font-medium uppercase tracking-wider text-muted-foreground">Date</span>
            </div>
            <div className="divide-y divide-border">
              {pagePosts.map((post) => (
                <PostHistoryRow
                  key={post.id}
                  post={post}
                  dateLabel={formatPostDate(getPostDate(post), timezone)}
                  onRetry={handleRetry}
                />
              ))}
            </div>
          </>
        ) : (
          <EmptyPosts filtered={activeFilter !== "ALL"} />
        )}
      </div>

      {filteredPosts.length > PAGE_SIZE ? (
        <nav className="mt-4 flex items-center justify-center gap-3" aria-label="Post history pagination">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Previous page"
            disabled={currentPage === 1}
            onClick={() => setPage((current) => Math.max(1, current - 1))}
          >
            <ChevronLeft />
          </Button>
          <span className="font-mono text-xs text-muted-foreground">{currentPage} / {pageCount}</span>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label="Next page"
            disabled={currentPage === pageCount}
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
          >
            <ChevronRight />
          </Button>
        </nav>
      ) : null}
    </section>
  );
}
