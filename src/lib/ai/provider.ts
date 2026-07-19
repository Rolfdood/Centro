import type { Platform } from "@/lib/platforms/constraints";
import type { PlatformConstraints } from "@/lib/platforms/types";
import type { AiTone } from "@/lib/validations/ai";

export interface AiAdaptInput {
  baseText: string;
  platform: Platform;
  tone: AiTone;
  media: { hasImages: boolean; hasVideo: boolean };
  constraints: PlatformConstraints;
}

export interface AIProvider {
  readonly model: string;
  adapt(input: AiAdaptInput): Promise<string>;
}
