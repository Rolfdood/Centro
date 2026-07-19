import { type PlatformConstraints } from "./types";

export const PLATFORMS = ["X", "FACEBOOK", "INSTAGRAM", "TIKTOK", "LINKEDIN"] as const;

export type Platform = (typeof PLATFORMS)[number];

export interface MediaValidationInput {
  type: "IMAGE" | "VIDEO";
  mimeType?: string;
  sizeBytes?: number;
}

const BYTES_PER_MB = 1024 * 1024;

export const PLATFORM_CONSTRAINTS: Record<Platform, PlatformConstraints> = {
  X: {
    maxChars: 280,
    maxImages: 4,
    requiresImage: false,
    requiresVideo: false,
    maxVideoSeconds: 140,
    maxFileSizeMB: 512,
    supportedMediaTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
    ],
  },
  FACEBOOK: {
    maxChars: 63206,
    maxImages: Infinity,
    requiresImage: false,
    requiresVideo: false,
    maxVideoSeconds: 240,
    maxFileSizeMB: 4096,
    supportedMediaTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
    ],
  },
  INSTAGRAM: {
    maxChars: 2200,
    maxImages: 10,
    requiresImage: true,
    requiresVideo: false,
    maxVideoSeconds: 60,
    maxFileSizeMB: 4096,
    supportedMediaTypes: ["image/jpeg", "image/png", "video/mp4"],
  },
  TIKTOK: {
    maxChars: 2200,
    maxImages: 0,
    requiresImage: false,
    requiresVideo: true,
    maxVideoSeconds: 600,
    maxFileSizeMB: 512,
    supportedMediaTypes: ["video/mp4"],
  },
  LINKEDIN: {
    maxChars: 3000,
    maxImages: 9,
    requiresImage: false,
    requiresVideo: false,
    maxVideoSeconds: 600,
    maxFileSizeMB: 512,
    supportedMediaTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "video/mp4",
    ],
  },
};

export interface PlatformOnboardingDetails {
  name: string;
  description: string;
  color: string;
}

export const PLATFORM_ONBOARDING_DETAILS: Record<Platform, PlatformOnboardingDetails> = {
  X: {
    name: "X (Twitter)",
    description: `Text posts, ${PLATFORM_CONSTRAINTS.X.maxChars} chars`,
    color: "#ffffff",
  },
  FACEBOOK: {
    name: "Facebook",
    description: "Pages & Groups",
    color: "#1877f2",
  },
  INSTAGRAM: {
    name: "Instagram",
    description: "Reels & Carousels",
    color: "#e1306c",
  },
  TIKTOK: {
    name: "TikTok",
    description: "Short-form video",
    color: "#25f4ee",
  },
  LINKEDIN: {
    name: "LinkedIn",
    description: "Professional network",
    color: "#0a66c2",
  },
};

export function getConstraints(platform: Platform): PlatformConstraints {
  return PLATFORM_CONSTRAINTS[platform];
}

export function validateTextLength(
  platform: Platform,
  text: string,
): { valid: boolean; error?: string } {
  const { maxChars } = getConstraints(platform);
  if (text.length > maxChars) {
    const over = text.length - maxChars;
    return {
      valid: false,
      error: `Over ${maxChars} character limit by ${over}`,
    };
  }
  return { valid: true };
}

export function validateMedia(
  platform: Platform,
  media: MediaValidationInput[],
): { valid: boolean; errors: string[] } {
  const constraints = getConstraints(platform);
  const errors: string[] = [];

  const images = media.filter((m) => m.type === "IMAGE");
  const videos = media.filter((m) => m.type === "VIDEO");

  if (constraints.requiresImage && images.length === 0) {
    errors.push(`${platform} requires an image`);
  }

  if (constraints.requiresVideo && videos.length === 0) {
    errors.push(`${platform} requires a video`);
  }

  if (images.length > constraints.maxImages) {
    errors.push(
      `Maximum ${constraints.maxImages} image${constraints.maxImages === 1 ? "" : "s"} allowed on ${platform}`,
    );
  }

  if (constraints.maxImages === 0 && images.length > 0) {
    errors.push(`${platform} does not support images`);
  }

  for (const item of media) {
    if (
      item.mimeType &&
      !constraints.supportedMediaTypes.includes(item.mimeType)
    ) {
      errors.push(
        `${platform} does not support ${item.mimeType}`,
      );
    }

    if (
      item.sizeBytes !== undefined &&
      item.sizeBytes > constraints.maxFileSizeMB * BYTES_PER_MB
    ) {
      errors.push(
        `File exceeds ${platform} size limit of ${constraints.maxFileSizeMB} MB`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validatePost(
  platform: Platform,
  text: string,
  media?: MediaValidationInput[],
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const textResult = validateTextLength(platform, text);
  if (!textResult.valid && textResult.error) {
    errors.push(textResult.error);
  }

  if (media && media.length > 0) {
    const mediaResult = validateMedia(platform, media);
    errors.push(...mediaResult.errors);
  } else {
    const constraints = getConstraints(platform);
    if (constraints.requiresImage) {
      errors.push(`${platform} requires an image`);
    }
    if (constraints.requiresVideo) {
      errors.push(`${platform} requires a video`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
