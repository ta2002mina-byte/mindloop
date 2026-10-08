import { ANALYST_SYSTEM_PROMPT, buildAnalystUserPrompt } from "@/lib/ai/prompt";
import { extractJsonObject, parseAnalysis } from "@/lib/ai/schema";
import { AnalystError, type ThoughtAnalysis, type ThoughtAnalyst, type ThoughtAnalystInput } from "@/lib/ai/types";

export interface OpenAiAnalystConfig {
  apiKey: string;
  /** Any OpenAI-compatible chat completions host, so a different vendor or a local model works too. */
  baseUrl: string;
  model: string;
  timeoutMs: number;
}

interface ChatCompletionResponse {
  choices?: { message?: { content?: string | null } }[];
  error?: { message?: string };
}

/**
 * Talks to an OpenAI-compatible /chat/completions endpoint.
 *
 * This file is the only place in the app that knows a vendor exists. Swapping in
 * another provider means adding a sibling class and one line in lib/ai/index.ts;
 * no component or Server Action changes.
 *
 * The key is read from a server-only environment variable and never leaves the
 * server: the browser calls a Server Action, which calls this.
 */
export class OpenAiThoughtAnalyst implements ThoughtAnalyst {
  readonly id = "openai" as const;
  readonly label: string;

  private readonly config: OpenAiAnalystConfig;

  constructor(config: OpenAiAnalystConfig) {
    this.config = config;
    this.label = config.model;
  }

  async analyze(input: ThoughtAnalystInput): Promise<ThoughtAnalysis> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);

    let response: Response;
    try {
      response = await fetch(`${this.config.baseUrl.replace(/\/+$/, "")}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          model: this.config.model,
          // Low temperature: this is a structuring task, not a creative one.
          temperature: 0.3,
          max_tokens: 900,
          response_format: { type: "json_object" },
          messages: [
            { role: "system", content: ANALYST_SYSTEM_PROMPT },
            { role: "user", content: buildAnalystUserPrompt(input) },
          ],
        }),
        signal: controller.signal,
        cache: "no-store",
      });
    } catch (caught) {
      const aborted = caught instanceof Error && caught.name === "AbortError";
      throw new AnalystError(
        aborted
          ? "The AI analysis took too long. Try again, or carry on filling the steps yourself."
          : "We couldn't reach the AI service. Check your connection, or carry on without it.",
        caught,
      );
    } finally {
      clearTimeout(timer);
    }

    if (!response.ok) {
      // The body may carry a vendor message; it is logged but never shown raw.
      let detail = "";
      try {
        const body = (await response.json()) as ChatCompletionResponse;
        detail = body.error?.message ?? "";
      } catch {
        detail = await response.text().catch(() => "");
      }
      console.error(`[ai] Provider returned ${response.status}:`, detail.slice(0, 300));

      if (response.status === 401 || response.status === 403) {
        throw new AnalystError("The AI key was rejected. Check the server configuration.");
      }
      if (response.status === 429) {
        throw new AnalystError("The AI service is rate limiting us. Wait a moment and try again.");
      }
      throw new AnalystError("The AI service had a problem. Try again, or carry on without it.");
    }

    const body = (await response.json().catch(() => null)) as ChatCompletionResponse | null;
    const content = body?.choices?.[0]?.message?.content ?? "";
    if (!content.trim()) {
      throw new AnalystError("The AI service sent an empty reply. Try again, or carry on without it.");
    }

    const parsed = extractJsonObject(content);
    if (parsed === null) {
      console.error("[ai] Could not parse provider JSON:", content.slice(0, 300));
      throw new AnalystError("The AI reply wasn't in the expected format. Try again, or carry on without it.");
    }

    // parseAnalysis trims, caps and drops anything malformed before the UI sees it.
    return parseAnalysis(parsed);
  }
}
