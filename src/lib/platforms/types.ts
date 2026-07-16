export interface PlatformConstraints {
  maxChars: number;
  maxImages: number;
  requiresImage: boolean;
  requiresVideo: boolean;
  maxVideoSeconds: number;
  maxFileSizeMB: number;
  supportedMediaTypes: string[];
}
