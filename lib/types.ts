export type Item = { text: string; quote: string; source: "Approved Plan" | "Transcript"; verified?: boolean };
export type ActionItem = { text: string; owner: string; deadline: string; quote: string; source: string; verified?: boolean };
export type Conflict = { description: string; planSays: string; transcriptSays: string; status: string; planVerified?: boolean; transcriptVerified?: boolean };
export type OpenQuestion = { question: string; quote: string; source: string; verified?: boolean };
export type RecordUpdate = { field: string; proposedValue: string; evidence: string };
export type AnalysisResult = {
  confirmedDecisions: Item[];
  requestedChanges: Item[];
  actionItems: ActionItem[];
  conflicts: Conflict[];
  openQuestions: OpenQuestion[];
  proposedRecordUpdates: RecordUpdate[];
  followUpEmail: { subject: string; body: string };
};
export type Correction = { note: string; scope?: string; at?: string };
export type AnalysisResponse = {
  result: AnalysisResult;
  evidence: { prompt: string; rawResponse: string; model: string; at: string };
};
export type DemoRecord = { updates: RecordUpdate[]; at: string };

const object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);
const strings = (value: unknown, keys: string[]) =>
  object(value) && keys.every((key) => typeof value[key] === "string");
const source = (value: unknown) => object(value) &&
  (value.source === "Approved Plan" || value.source === "Transcript");

export function isAnalysisResult(value: unknown): value is AnalysisResult {
  if (!object(value)) return false;
  return ["confirmedDecisions", "requestedChanges"].every((key) =>
    Array.isArray(value[key]) && value[key].every((item) => strings(item, ["text", "quote", "source"]) && source(item))) &&
    Array.isArray(value.actionItems) && value.actionItems.every((item) => strings(item, ["text", "owner", "deadline", "quote", "source"]) && source(item)) &&
    Array.isArray(value.conflicts) && value.conflicts.every((item) => strings(item, ["description", "planSays", "transcriptSays", "status"])) &&
    Array.isArray(value.openQuestions) && value.openQuestions.every((item) => strings(item, ["question", "quote", "source"])) &&
    Array.isArray(value.proposedRecordUpdates) && value.proposedRecordUpdates.every((item) => strings(item, ["field", "proposedValue", "evidence"])) &&
    strings(value.followUpEmail, ["subject", "body"]);
}

// Flash-lite models return usable content but occasionally drift from the exact schema (object-shaped
// open questions, a source like "Transcript (Alex)", a missing owner field). Rather than reject a good
// review packet with a 502, repair the common deviations into the required shape. Returns null only when
// the top-level value is not an object at all.
const asString = (value: unknown, fallback = ""): string =>
  typeof value === "string" ? value :
  value == null ? fallback :
  typeof value === "object" ? JSON.stringify(value) : String(value);

const asSource = (value: unknown): "Approved Plan" | "Transcript" =>
  typeof value === "string" && /plan/i.test(value) ? "Approved Plan" : "Transcript";

// Turn a camelCase / snake_case identifier into a readable label ("launchDateStatus" -> "Launch date status").
const humanize = (value: string): string => {
  if (!value || /\s/.test(value)) return value;
  const spaced = value.replace(/_/g, " ").replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
};

const arr = (value: unknown): unknown[] => (Array.isArray(value) ? value : []);
const rec = (value: unknown): Record<string, unknown> => (object(value) ? value : {});

export function normalizeAnalysis(value: unknown): AnalysisResult | null {
  if (!object(value)) return null;
  const item = (x: unknown): Item => {
    const o = rec(x);
    return { text: asString(o.text), quote: asString(o.quote), source: asSource(o.source) };
  };
  const action = (x: unknown): ActionItem => {
    const o = rec(x);
    return {
      text: asString(o.text),
      owner: asString(o.owner, "not stated").trim() || "not stated",
      deadline: asString(o.deadline, "not stated").trim() || "not stated",
      quote: asString(o.quote),
      source: asSource(o.source),
    };
  };
  const conflict = (x: unknown): Conflict => {
    const o = rec(x);
    return {
      description: asString(o.description),
      planSays: asString(o.planSays),
      transcriptSays: asString(o.transcriptSays),
      status: asString(o.status, "Open request — not approved") || "Open request — not approved",
    };
  };
  const update = (x: unknown): RecordUpdate => {
    const o = rec(x);
    return { field: humanize(asString(o.field)), proposedValue: asString(o.proposedValue), evidence: asString(o.evidence) };
  };
  const question = (x: unknown): OpenQuestion => {
    if (typeof x === "string") return { question: x, quote: "", source: "" };
    const o = rec(x);
    const quote = asString(o.quote);
    return {
      question: asString(o.question ?? o.text ?? o.note ?? ""),
      quote,
      source: o.source ? asSource(o.source) : (quote ? "Transcript" : ""),
    };
  };
  const email = rec(value.followUpEmail);
  return {
    confirmedDecisions: arr(value.confirmedDecisions).map(item),
    requestedChanges: arr(value.requestedChanges).map(item),
    actionItems: arr(value.actionItems).map(action),
    conflicts: arr(value.conflicts).map(conflict),
    openQuestions: arr(value.openQuestions).map(question),
    proposedRecordUpdates: arr(value.proposedRecordUpdates).map(update),
    followUpEmail: { subject: asString(email.subject), body: asString(email.body) },
  };
}
