import { buildPrompt } from "@/lib/prompt";
import { isAnalysisResult, normalizeAnalysis, type Correction } from "@/lib/types";
import { postProcess } from "@/lib/postprocess";

export const runtime = "nodejs";

// Gemini Interactions API (the generateContent endpoint was retired for new users in 2026).
const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/interactions";
// Tried in order; first model that returns a completion wins. Higher-quality models first,
// falling back to lite models that stay available under load. Overloaded models (503) /
// rate-limited models (429) are retried across two passes before giving up.
const MODELS = ["gemini-3.5-flash", "gemini-flash-lite-latest", "gemini-3.5-flash-lite"];
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

type Attempt = { ok: true; text: string; model: string } | { ok: false; status: number; message: string };

async function callModel(model: string, prompt: string, key: string): Promise<Attempt> {
  const response = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": key },
    body: JSON.stringify({
      model,
      input: prompt,
      response_format: { type: "text", mime_type: "application/json" },
    }),
    signal: AbortSignal.timeout(90_000),
    cache: "no-store",
  });
  if (response.status !== 200) {
    let message = response.statusText;
    try {
      const err = await response.json();
      message = err?.error?.message ?? err?.error?.code ?? message;
    } catch {
      /* non-JSON error body */
    }
    return { ok: false, status: response.status, message };
  }
  const payload = await response.json();
  // Extract text from the model_output step(s); ignore "thought" steps.
  const text = (payload.steps ?? [])
    .filter((step: { type?: string }) => step?.type === "model_output")
    .flatMap((step: { content?: { text?: unknown; type?: string }[] }) => step.content ?? [])
    .filter((part: { text?: unknown; type?: string }) => part?.type === "text" && typeof part.text === "string")
    .map((part: { text: string }) => part.text)
    .join("");
  return { ok: true, text, model: payload.model ?? model };
}

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Request body must be valid JSON with plan and transcript fields." }, { status: 400 });
  }
  if (!body || typeof body.plan !== "string" || !body.plan.trim()) {
    return Response.json({ error: "Approved Project Plan (plan) is required." }, { status: 400 });
  }
  if (typeof body.transcript !== "string" || !body.transcript.trim()) {
    return Response.json({ error: "Meeting Transcript (transcript) is required." }, { status: 400 });
  }
  if (body.corrections !== undefined && (!Array.isArray(body.corrections) ||
    !body.corrections.every((item: unknown) => typeof item === "object" && item !== null &&
      "note" in item && typeof item.note === "string" &&
      (!("scope" in item) || typeof item.scope === "string")))) {
    return Response.json({ error: "corrections must be an array of notes with an optional scope." }, { status: 400 });
  }
  const key = process.env.GEMINI_API_KEY;
  if (!key?.trim()) {
    return Response.json({ error: "Server is not configured with a GEMINI_API_KEY. Add it to .env.local and restart." }, { status: 503 });
  }
  const corrections: Correction[] = body.corrections ?? [];
  const prompt = buildPrompt(body.plan, body.transcript, corrections);
  // Never return upstream text that could echo the credential.
  const redact = (text: string) => text.split(key).join("[REDACTED]");

  let last = "no model attempted";
  try {
    for (let pass = 0; pass < 2; pass++) {
      for (const model of MODELS) {
        let attempt: Attempt;
        try {
          attempt = await callModel(model, prompt, key);
        } catch (error) {
          last = `${model}: ${error instanceof Error ? error.message : "network error"}`;
          continue;
        }
        if (!attempt.ok) {
          last = `${model}: ${attempt.status} ${attempt.message}`;
          // 503 (overloaded) and 429 (rate limited) are transient — try the next model / pass.
          // Other statuses (400/404) are model-specific — skip to the next model.
          continue;
        }
        let parsed: unknown;
        try {
          parsed = JSON.parse(attempt.text);
        } catch {
          // Genuinely broken / truncated JSON is transient — try the next model/pass rather than failing.
          last = `${model}: model returned invalid JSON`;
          continue;
        }
        // Repair common flash-lite schema drift into the exact shape instead of rejecting good content.
        const result = normalizeAnalysis(parsed);
        if (!result || !isAnalysisResult(result)) {
          last = `${model}: response was not a usable review object`;
          continue;
        }
        // Ground each quote against the sources and drop near-duplicate actions before returning.
        const processed = postProcess(result, body.plan, body.transcript);
        return Response.json({
          result: processed,
          evidence: { prompt, rawResponse: attempt.text, model: attempt.model, at: new Date().toISOString() },
        });
      }
      await sleep(1500);
    }
    return Response.json({ error: `AI request failed after retries: ${redact(last)}` }, { status: 502 });
  } catch (error) {
    return Response.json({ error: `AI request failed: ${redact(error instanceof Error ? error.message : "Unknown error")}` }, { status: 502 });
  }
}
