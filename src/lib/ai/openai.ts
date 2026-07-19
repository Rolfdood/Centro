import { z } from "zod";
import type { AIProvider, AiAdaptInput } from "@/lib/ai/provider";
import { buildAdaptPostPrompt } from "@/lib/ai/prompts/adaptPost";

const openAiResponseSchema = z.object({
  choices: z.array(z.object({
    message: z.object({ content: z.string() }),
  })).min(1),
});

function mockAdaptation(input: AiAdaptInput): string {
  const prefix = `${input.platform}: `;
  const available = Math.max(0, input.constraints.maxChars - prefix.length);
  return `${prefix}${input.baseText.slice(0, available)}`.trim();
}

function timeoutSignal(): AbortSignal {
  return AbortSignal.timeout(30_000);
}

export function createOpenAiProvider(
  options: { apiKey?: string; model?: string; fetcher?: typeof fetch } = {},
): AIProvider {
  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  const model = options.model ?? process.env.AI_MODEL ?? "gpt-4o-mini";
  const fetcher = options.fetcher ?? fetch;

  return {
    model,
    async adapt(input: AiAdaptInput): Promise<string> {
      if (!apiKey) return mockAdaptation(input);

      const response = await fetcher("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        signal: timeoutSignal(),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          messages: [{ role: "user", content: buildAdaptPostPrompt(input) }],
        }),
      });

      if (!response.ok) throw new Error("AI provider request failed.");
      const parsed = openAiResponseSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("AI provider returned an invalid response.");
      return parsed.data.choices[0].message.content.trim();
    },
  };
}

export function defaultAiProvider(): AIProvider {
  return createOpenAiProvider();
}
