"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { MockConsentDialog } from "@/components/features/accounts/MockConsentDialog";
import type { Platform } from "@/lib/platforms/constraints";

interface PlatformOption {
  platform: Platform;
  name: string;
  description: string;
  dotClassName: string;
}

const PLATFORM_OPTIONS: PlatformOption[] = [
  {
    platform: "X",
    name: "X (Twitter)",
    description: "Text posts, 280 chars",
    dotClassName: "bg-white",
  },
  {
    platform: "FACEBOOK",
    name: "Facebook",
    description: "Pages & Groups",
    dotClassName: "bg-[#1877f2]",
  },
  {
    platform: "INSTAGRAM",
    name: "Instagram",
    description: "Reels & Carousels",
    dotClassName: "bg-[#e1306c]",
  },
  {
    platform: "TIKTOK",
    name: "TikTok",
    description: "Short-form video",
    dotClassName: "bg-[#25f4ee]",
  },
  {
    platform: "LINKEDIN",
    name: "LinkedIn",
    description: "Professional network",
    dotClassName: "bg-[#0a66c2]",
  },
];

export function OnboardingAccountList() {
  const router = useRouter();
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | null>(null);

  return (
    <>
      <div className="w-full divide-y divide-border rounded-lg border border-border bg-card px-4 sm:px-6">
        {PLATFORM_OPTIONS.map((option) => (
          <div
            key={option.platform}
            className="flex items-center justify-between gap-4 py-4"
          >
            <div className="flex min-w-0 items-center gap-4">
              <span
                className={`h-2 w-2 shrink-0 rounded-full ${option.dotClassName}`}
                aria-hidden="true"
              />
              <div className="min-w-0">
                <p className="font-medium text-foreground">{option.name}</p>
                <p className="font-mono text-xs text-muted-foreground">
                  {option.description}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedPlatform(option.platform)}
            >
              Connect
            </Button>
          </div>
        ))}
      </div>

      <MockConsentDialog
        platform={selectedPlatform}
        open={selectedPlatform !== null}
        onOpenChange={(open) => {
          if (!open) setSelectedPlatform(null);
        }}
        onConnected={() => router.replace("/dashboard")}
      />
    </>
  );
}
