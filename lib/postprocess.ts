import type { AnalysisResult, ActionItem } from "./types";

// Normalize text for grounding comparisons: lowercase, unify quotes, collapse non-alphanumerics to spaces.
const norm = (s: string): string =>
  s.toLowerCase().replace(/[‘’“”]/g, "'").replace(/[^a-z0-9]+/g, " ").trim();

// A quote is "grounded" if its normalized form appears in either source document. We check both sources
// (not just the labeled one) so a mislabeled source does not produce a false "unverified" flag, and we
// also try the quote with a leading "Speaker:" label stripped, since models often re-attribute a line to
// the current speaker even when that exact prefix is not contiguous in the transcript.
function grounds(quote: string, haystacks: string[]): boolean {
  const candidates = [quote, quote.replace(/^\s*[A-Za-z][\w .'’-]{0,30}:\s*/, "")];
  return candidates.some((c) => {
    const q = norm(c);
    if (!q || q.length < 6) return true; // too short to meaningfully verify; don't flag
    return haystacks.some((h) => h.includes(q));
  });
}

const STOP = new Set(["the", "a", "an", "of", "to", "and", "for", "is", "are", "be", "will", "by", "as",
  "planned", "including", "any", "that", "this", "with", "on", "in", "before", "after", "we", "our", "it"]);

const tokens = (s: string): Set<string> =>
  new Set(norm(s).split(" ").filter((w) => w.length > 2 && !STOP.has(w)));

// Containment overlap: shared content words / size of the smaller set.
function containment(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / Math.min(a.size, b.size);
}

// Drop near-identical action items that share the same owner and deadline (e.g. the same commitment
// restated in both the plan and the transcript). Conservative: requires both high word overlap AND
// matching owner + deadline, so genuinely distinct actions are kept.
function dedupeActions(items: ActionItem[]): ActionItem[] {
  const kept: { item: ActionItem; toks: Set<string> }[] = [];
  for (const item of items) {
    const toks = tokens(item.text);
    const dup = kept.find((k) =>
      k.item.owner.trim().toLowerCase() === item.owner.trim().toLowerCase() &&
      k.item.deadline.trim().toLowerCase() === item.deadline.trim().toLowerCase() &&
      containment(k.toks, toks) >= 0.6);
    if (!dup) kept.push({ item, toks });
  }
  return kept.map((k) => k.item);
}

export function postProcess(result: AnalysisResult, plan: string, transcript: string): AnalysisResult {
  const sources = [norm(plan), norm(transcript)];
  const mark = <T extends { quote: string }>(item: T): T => ({ ...item, verified: grounds(item.quote, sources) });
  return {
    ...result,
    confirmedDecisions: result.confirmedDecisions.map(mark),
    requestedChanges: result.requestedChanges.map(mark),
    actionItems: dedupeActions(result.actionItems).map(mark),
    conflicts: result.conflicts.map((c) => ({
      ...c,
      planVerified: grounds(c.planSays, sources),
      transcriptVerified: grounds(c.transcriptSays, sources),
    })),
    openQuestions: result.openQuestions.map((q) => ({ ...q, verified: q.quote ? grounds(q.quote, sources) : true })),
  };
}
