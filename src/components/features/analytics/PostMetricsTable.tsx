import { PLATFORM_ONBOARDING_DETAILS, type Platform } from "@/lib/platforms/constraints";

export interface DemoPostMetric {
  id: string;
  excerpt: string;
  platform: Platform;
  impressions?: number;
  likes?: number;
  engagement?: number;
  engagementLabel?: "Comments" | "Retweets" | "Shares";
  lastSynced?: string;
  isStale?: boolean;
  isPublished: boolean;
}

interface PostMetricsTableProps {
  rows: DemoPostMetric[];
}

function formatMetric(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

export function PostMetricsTable({ rows }: PostMetricsTableProps) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border bg-card">
      <table className="w-full min-w-[770px] border-collapse text-left text-sm">
        <thead className="border-b border-border bg-background/60">
          <tr>
            <th className="w-[34%] px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Post excerpt
            </th>
            <th className="w-40 px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </th>
            <th className="px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Impressions
            </th>
            <th className="px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Likes
            </th>
            <th className="px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Comments / retweets / shares
            </th>
            <th className="w-36 px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Last synced
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td
                className="px-4 py-10 text-center font-mono text-xs text-muted-foreground"
                colSpan={6}
              >
                No metrics available.
              </td>
            </tr>
          ) : rows.map((row) => {
            const platform = PLATFORM_ONBOARDING_DETAILS[row.platform];

            return (
              <tr key={row.id} className="border-b border-border last:border-b-0 hover:bg-accent/40">
                <td className="max-w-0 px-4 py-3.5 text-foreground">
                  <p className="truncate">{row.excerpt}</p>
                </td>
                <td className="px-4 py-3.5">
                  <span className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    {platform.name}
                  </span>
                </td>
                {row.isPublished ? (
                  <>
                    <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      {formatMetric(row.impressions ?? 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      {formatMetric(row.likes ?? 0)}
                    </td>
                    <td className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      <span className="sr-only">{row.engagementLabel ?? "Engagement"}: </span>
                      {formatMetric(row.engagement ?? 0)}
                    </td>
                  </>
                ) : (
                  <td className="px-4 py-3.5 font-mono text-xs italic text-muted-foreground" colSpan={3}>
                    Not published yet
                  </td>
                )}
                <td className="px-4 py-3.5">
                  {row.lastSynced ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {row.isStale ? (
                        <span className="rounded border border-amber-400/30 bg-amber-400/10 px-1 py-0.5 text-[10px] font-medium uppercase text-amber-300">
                          Stale
                        </span>
                      ) : null}
                      {row.lastSynced}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
