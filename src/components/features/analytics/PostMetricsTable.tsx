import { PLATFORM_ONBOARDING_DETAILS, type Platform } from "@/lib/platforms/constraints";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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
    <ScrollArea className="rounded-lg border border-border bg-card">
      <Table className="min-w-[770px] border-collapse text-left text-sm">
        <TableHeader className="border-b border-border bg-background/60">
          <TableRow>
            <TableHead className="h-auto w-[34%] px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Post excerpt
            </TableHead>
            <TableHead className="h-auto w-40 px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Platform
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Impressions
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Likes
            </TableHead>
            <TableHead className="h-auto px-4 py-3 text-right font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Comments / retweets / shares
            </TableHead>
            <TableHead className="h-auto w-36 px-4 py-3 font-mono text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Last synced
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell
                className="px-4 py-10 text-center font-mono text-xs text-muted-foreground"
                colSpan={6}
              >
                No metrics available.
              </TableCell>
            </TableRow>
          ) : rows.map((row) => {
            const platform = PLATFORM_ONBOARDING_DETAILS[row.platform];

            return (
              <TableRow key={row.id} className="border-border last:border-b-0 hover:bg-accent/40">
                <TableCell className="max-w-0 px-4 py-3.5 text-foreground">
                  <p className="truncate">{row.excerpt}</p>
                </TableCell>
                <TableCell className="px-4 py-3.5">
                  <span className="flex items-center gap-2 whitespace-nowrap font-mono text-xs text-muted-foreground">
                    <span
                      aria-hidden="true"
                      className="size-1.5 rounded-full"
                      style={{ backgroundColor: platform.color }}
                    />
                    {platform.name}
                  </span>
                </TableCell>
                {row.isPublished ? (
                  <>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      {formatMetric(row.impressions ?? 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      {formatMetric(row.likes ?? 0)}
                    </TableCell>
                    <TableCell className="px-4 py-3.5 text-right font-mono text-xs tabular-nums">
                      <span className="sr-only">{row.engagementLabel ?? "Engagement"}: </span>
                      {formatMetric(row.engagement ?? 0)}
                    </TableCell>
                  </>
                ) : (
                  <TableCell className="px-4 py-3.5 font-mono text-xs italic text-muted-foreground" colSpan={3}>
                    Not published yet
                  </TableCell>
                )}
                <TableCell className="px-4 py-3.5">
                  {row.lastSynced ? (
                    <span className="flex items-center gap-1.5 whitespace-nowrap font-mono text-[11px] text-muted-foreground">
                      {row.isStale ? (
                        <Badge className="border-amber-400/30 bg-amber-400/10 px-1 py-0.5 text-[10px] font-medium uppercase text-amber-300">Stale</Badge>
                      ) : null}
                      {row.lastSynced}
                    </span>
                  ) : (
                    <span className="font-mono text-[11px] text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </ScrollArea>
  );
}
