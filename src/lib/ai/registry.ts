import { createGroqProvider } from "@/lib/ai/groq";
import type { AIProvider } from "@/lib/ai/provider";

export function defaultAiProvider(): AIProvider {
  return createGroqProvider();
}
