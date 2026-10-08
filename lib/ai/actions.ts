"use server";

import { requireUser } from "@/lib/auth/session";
import { getThoughtAnalyst } from "@/lib/ai";
import { checkAiRateLimit } from "@/lib/ai/rate-limit";
import { AnalystError, type ThoughtAnalysisResult } from "@/lib/ai/types";
import { analyzeRequestSchema } from "@/lib/validations/ai";
import type { ActionResult } from "@/types";

/**
 * Runs the configured analyst on one thought and returns the structured result.
 *
 * Nothing is written to the database here. The browser gets suggestions, the
 * user edits them, and only their own applied version is saved with the thought.
 * That is why this is a plain action rather than part of createThought.
 */
export async function analyzeThought(input: unknown): Promise<ActionResult<ThoughtAnalysisResult>> {
  const user = await requireUser();

  const parsed = analyzeRequestSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      message: parsed.error.issues[0]?.message ?? "Write a little more of the thought first.",
    };
  }

  const limit = checkAiRateLimit(user.id);
  if (!limit.allowed) {
    return {
      ok: false,
      message: `That is a lot of analyses at once. Try again in about ${limit.retryAfterSeconds} seconds.`,
    };
  }

  const analyst = getThoughtAnalyst();

  try {
    const analysis = await analyst.analyze(parsed.data);
    return {
      ok: true,
      data: { analysis, provider: analyst.id, providerLabel: analyst.label },
    };
  } catch (caught) {
    if (caught instanceof AnalystError) {
      console.error("[ai] Analysis failed:", caught.message);
      return { ok: false, message: caught.userMessage };
    }
    console.error("[ai] Unexpected analysis failure:", caught);
    return { ok: false, message: "Something went wrong running the analysis. You can carry on without it." };
  }
}
