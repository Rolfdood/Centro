import type { AiAdaptInput } from "@/lib/ai/provider";

export function buildAdaptPostPrompt(input: AiAdaptInput): string {
  const mediaRules = [
    input.constraints.requiresImage ? "An image is required." : "",
    input.constraints.requiresVideo ? "A video is required." : "",
  ].filter(Boolean).join(" ");

  return [
    `Adapt this social post for ${input.platform}.`,
    `Keep it at or below ${input.constraints.maxChars} characters.`,
    `Use a ${input.tone} tone.`,
    mediaRules,
    "Return only the final post text with no quotation marks or commentary.",
    `Base post: ${input.baseText}`,
  ].filter(Boolean).join("\n");
}
