"use client";

import { useCallback, useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { ORION_PLAN, ORION_TRANSCRIPT } from "@/lib/sample";
import { isAnalysisResult, type AnalysisResponse, type AnalysisResult, type Correction, type DemoRecord, type Item, type RecordUpdate } from "@/lib/types";

type TourStep = { sel: string | null; title: string; body: string; on: "click" | "next" | "done" };

const TOUR: TourStep[] = [
  { sel: '[data-tour="load-sample"]', title: "Welcome 👋", body: "Let’s take a quick tour. First, click “Load Orion sample” to drop in an example plan and meeting transcript.", on: "click" },
  { sel: '[data-tour="analyze"]', title: "Analyze with real AI", body: "Now click Analyze. A real Google Gemini model compares the plan against the transcript — your API key never leaves the server.", on: "click" },
  { sel: ".citation .chip-src", title: "Every claim is cited", body: "Each finding carries a quote and its source. Click a source chip to see that exact quote highlighted in the original document.", on: "click" },
  { sel: '[data-tour="source-close"]', title: "Straight from the source", body: "There’s the passage, highlighted in place. This is how you catch a wrong answer fast. Click Close to continue.", on: "click" },
  { sel: "nav.tabs", title: "Explore the packet", body: "Results are organized into tabs — Decisions, Action items, Conflicts, Record updates and more. Each shows what the meeting changed.", on: "next" },
  { sel: '[data-tour="tab-updates"]', title: "Review & approve", body: "Open Record updates — this is where you edit what the AI proposes before anything is saved.", on: "click" },
  { sel: '[data-tour="approve"]', title: "You stay in control", body: "Edit any value, tick the ones you trust, and approve. It saves to a local demo record in your browser — nothing is ever emailed.", on: "next" },
  { sel: null, title: "You’re all set ✨", body: "That’s the loop: analyze, verify against the sources, edit, approve. Explore freely — you can reopen this tour anytime from “Take the tour.”", on: "done" },
];

const TABS = [
  { id: "decisions", label: "Decisions" },
  { id: "actions", label: "Action items" },
  { id: "conflicts", label: "Conflicts & questions" },
  { id: "updates", label: "Record updates" },
  { id: "email", label: "Email draft" },
  { id: "corrections", label: "Corrections" },
  { id: "evidence", label: "Evidence" },
] as const;

type Locate = (source: string, quote: string) => void;

function Verified({ verified }: { verified?: boolean }) {
  if (verified === false) return <span className="tag-warn" title="This quote was not found in the source text">⚠ not found in source</span>;
  if (verified === true) return <span className="tag-ok" title="This quote was located in the source text">✓ in source</span>;
  return null;
}

function Quote({ quote, source, verified, onLocate }: { quote: string; source: string; verified?: boolean; onLocate?: Locate }) {
  return <div className="citation">
    {onLocate
      ? <button type="button" className="chip chip-src" title="Show this quote in the source" onClick={() => onLocate(source, quote)}>{source}</button>
      : <span className="chip">{source}</span>}
    <q>{quote}</q>
    <Verified verified={verified} />
  </div>;
}

function Items({ title, items, onLocate }: { title: string; items: Item[]; onLocate: Locate }) {
  return <section className="panel"><h2>{title}</h2>{items.length ? <ul className="item-list">{items.map((item, index) =>
    <li key={index}><p>{item.text}</p><Quote quote={item.quote} source={item.source} verified={item.verified} onLocate={onLocate} /></li>)}</ul> : <p className="muted">None identified.</p>}</section>;
}

function Field({ value }: { value: string }) {
  const v = value.trim() || "not stated";
  return v.toLowerCase() === "not stated" ? <span className="tag-none">not stated</span> : <>{v}</>;
}

const TIP_W = 332;

function Tour({ step, index, total, onNext, onSkip }: { step: TourStep; index: number; total: number; onNext: () => void; onSkip: () => void }) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    setRect(null);
    let raf = 0;
    let el: Element | null = null;
    let clickH: ((e: Event) => void) | null = null;
    let scrolled = false;
    const tick = () => {
      const found = step.sel ? document.querySelector(step.sel) : null;
      if (found) {
        if (found !== el) {
          if (el && clickH) el.removeEventListener("click", clickH);
          el = found;
          scrolled = false;
          if (step.on === "click") { clickH = () => window.setTimeout(onNext, 90); el.addEventListener("click", clickH, { once: true }); }
        }
        if (!scrolled) { el.scrollIntoView({ block: "center", behavior: "smooth" }); scrolled = true; }
        setRect(el.getBoundingClientRect());
      } else {
        setRect(null);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => { cancelAnimationFrame(raf); if (el && clickH) el.removeEventListener("click", clickH); };
  }, [step, onNext]);

  let tip: CSSProperties;
  let hole: CSSProperties | null = null;
  if (rect) {
    const pad = 8;
    hole = { top: rect.top - pad, left: rect.left - pad, width: rect.width + pad * 2, height: rect.height + pad * 2 };
    const left = Math.min(Math.max(rect.left, 16), (typeof window !== "undefined" ? window.innerWidth : 1440) - TIP_W - 16);
    const spaceBelow = (typeof window !== "undefined" ? window.innerHeight : 900) - rect.bottom;
    tip = spaceBelow > 230 ? { top: rect.bottom + 14, left } : { top: rect.top - 14, left, transform: "translateY(-100%)" };
  } else {
    tip = { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
  }
  const waiting = Boolean(step.sel) && !rect;

  return <div className="tour" aria-label="Walkthrough">
    {hole && <div className="tour-hole" style={hole} />}
    <div className="tour-tip" style={{ ...tip, width: TIP_W }} role="dialog" aria-modal="true">
      {waiting ? <p className="tour-waiting"><span className="spinner" /> One moment…</p> : <>
        <div className="tour-head"><span className="tour-step">{index + 1} / {total}</span><button className="tour-skip" onClick={onSkip}>Skip tour</button></div>
        <h3 className="tour-title">{step.title}</h3>
        <p className="tour-body">{step.body}</p>
        {step.on === "click"
          ? <p className="tour-hint">Click the highlighted control to continue →</p>
          : <div className="tour-actions"><button className="primary" onClick={onNext}>{step.on === "done" ? "Finish" : "Next"}</button></div>}
      </>}
    </div>
  </div>;
}

// Highlight the first case-insensitive occurrence of `quote` in `text`.
function highlight(text: string, quote: string): { nodes: ReactNode; found: boolean } {
  const q = quote.trim();
  const i = q ? text.toLowerCase().indexOf(q.toLowerCase()) : -1;
  if (i < 0) return { nodes: text, found: false };
  return {
    found: true,
    nodes: <>{text.slice(0, i)}<mark ref={(el) => el?.scrollIntoView({ block: "center" })}>{text.slice(i, i + q.length)}</mark>{text.slice(i + q.length)}</>,
  };
}

function toMarkdown(r: AnalysisResult, model: string): string {
  const q = (quote: string, source: string) => quote ? `\n  > “${quote}” — *${source}*` : "";
  const lines: string[] = [`# Review packet`, `_Generated by ${model}. Draft for human review — nothing sent._\n`];
  lines.push(`## Confirmed decisions`, ...(r.confirmedDecisions.length ? r.confirmedDecisions.map((i) => `- ${i.text}${q(i.quote, i.source)}`) : ["_None identified._"]), "");
  lines.push(`## Requested changes (not approved)`, ...(r.requestedChanges.length ? r.requestedChanges.map((i) => `- ${i.text}${q(i.quote, i.source)}`) : ["_None identified._"]), "");
  lines.push(`## Action items`, "", "| Action | Owner | Deadline |", "| --- | --- | --- |",
    ...(r.actionItems.length ? r.actionItems.map((a) => `| ${a.text} | ${a.owner.trim() || "not stated"} | ${a.deadline.trim() || "not stated"} |`) : ["| _None identified._ | | |"]), "");
  lines.push(`## Conflicts with approved plan`, ...(r.conflicts.length ? r.conflicts.flatMap((c) => [`- **${c.description}** — _${c.status}_`, `  - Plan: “${c.planSays}”`, `  - Transcript: “${c.transcriptSays}”`]) : ["_None identified._"]), "");
  lines.push(`## Open questions`, ...(r.openQuestions.length ? r.openQuestions.map((o) => `- ${o.question}${q(o.quote, o.source)}`) : ["_None identified._"]), "");
  lines.push(`## Proposed record updates`, ...(r.proposedRecordUpdates.length ? r.proposedRecordUpdates.map((u) => `- **${u.field}:** ${u.proposedValue}\n  _evidence: ${u.evidence}_`) : ["_None proposed._"]), "");
  lines.push(`## Follow-up email draft (DRAFT — not sent)`, "", `**Subject:** ${r.followUpEmail.subject}`, "", r.followUpEmail.body, "");
  return lines.join("\n");
}

function listDiff<T>(before: T[], after: T[], key: (t: T) => string) {
  const b = new Set(before.map(key)); const a = new Set(after.map(key));
  return { added: after.filter((x) => !b.has(key(x))), removed: before.filter((x) => !a.has(key(x))) };
}

export default function Home() {
  const [plan, setPlan] = useState("");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState<AnalysisResponse | null>(null);
  const [prevResult, setPrevResult] = useState<AnalysisResult | null>(null);
  const [showCompare, setShowCompare] = useState(false);
  const [updates, setUpdates] = useState<(RecordUpdate & { included: boolean })[]>([]);
  const [corrections, setCorrections] = useState<Correction[]>([]);
  const [record, setRecord] = useState<DemoRecord | null>(null);
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [storageError, setStorageError] = useState("");
  const [notice, setNotice] = useState("");
  const [view, setView] = useState<"input" | "results">("input");
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("decisions");
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [sourceView, setSourceView] = useState<{ source: string; quote: string } | null>(null);

  useEffect(() => {
    const failures: string[] = [];
    try {
      const saved: unknown = JSON.parse(localStorage.getItem("corrections") ?? "[]");
      if (!Array.isArray(saved) || !saved.every((item) => item && typeof item.note === "string" && typeof item.at === "string")) throw new Error();
      setCorrections(saved);
    } catch { failures.push("Saved corrections could not be read."); }
    try {
      const saved = JSON.parse(localStorage.getItem("demoRecord") ?? "null");
      if (saved !== null && (typeof saved.at !== "string" || !Array.isArray(saved.updates) ||
        !saved.updates.every((item: RecordUpdate) => item && typeof item.field === "string" && typeof item.proposedValue === "string" && typeof item.evidence === "string"))) throw new Error();
      setRecord(saved);
    } catch { failures.push("The saved demo record could not be read."); }
    try { if (!localStorage.getItem("onboardingSeen")) setTourStep(0); } catch { /* ignore */ }
    setStorageError(failures.join(" "));
    setReady(true);
  }, []);

  const markTourSeen = useCallback(() => { try { localStorage.setItem("onboardingSeen", "1"); } catch { /* ignore */ } }, []);
  const advanceTour = useCallback(() => setTourStep((s) => {
    if (s === null) return s;
    const next = s + 1;
    if (next >= TOUR.length) { markTourSeen(); return null; }
    return next;
  }), [markTourSeen]);
  const skipTour = useCallback(() => { markTourSeen(); setTourStep(null); }, [markTourSeen]);
  function startTour() { setSourceView(null); setView("input"); setTourStep(0); }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setSourceView(null);
      setTourStep((s) => { if (s !== null) markTourSeen(); return null; });
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [markTourSeen]);

  function resetResult() { setAnalysis(null); setUpdates([]); setError(""); setNotice(""); setView("input"); setPrevResult(null); setShowCompare(false); }

  function beginLoading() {
    setError(""); setNotice(""); setLoading(true);
    const steps = ["Reading both sources…", "Comparing against the approved plan…", "Separating requests from approved decisions…", "Checking owners and deadlines…", "Verifying quotes against the sources…", "Drafting the follow-up email…"];
    let step = 0; setLoadingMsg(steps[0]);
    return setInterval(() => { step = (step + 1) % steps.length; setLoadingMsg(steps[step]); }, 1800);
  }

  async function runAnalysis(): Promise<AnalysisResponse> {
    const response = await fetch("/api/analyze", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan, transcript, corrections }),
    });
    const data = await response.json();
    if (!response.ok) throw new Error(`${response.status}: ${data.error ?? "Analysis failed."}`);
    if (!isAnalysisResult(data.result) || !data.evidence ||
      !["prompt", "rawResponse", "model", "at"].every((key) => typeof data.evidence[key] === "string")) throw new Error("The server returned an invalid review packet.");
    return data as AnalysisResponse;
  }

  function applyAnalysis(data: AnalysisResponse) {
    setAnalysis(data);
    setUpdates(data.result.proposedRecordUpdates.map((update) => ({ ...update, included: true })));
  }

  async function analyze() {
    setAnalysis(null); setUpdates([]); setPrevResult(null); setShowCompare(false);
    const ticker = beginLoading();
    try {
      const data = await runAnalysis();
      applyAnalysis(data); setTab("decisions"); setView("results");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Analysis failed. Please try again."); }
    finally { clearInterval(ticker); setLoading(false); }
  }

  async function rerunCompare() {
    if (!analysis) return;
    const before = analysis.result;
    const ticker = beginLoading();
    try {
      const data = await runAnalysis();
      setPrevResult(before); applyAnalysis(data); setShowCompare(true); setTab("decisions");
      setNotice("Re-ran with your saved corrections. See “What changed” above.");
    } catch (failure) { setError(failure instanceof Error ? failure.message : "Re-run failed. Please try again."); }
    finally { clearInterval(ticker); setLoading(false); }
  }

  function saveRecord() {
    const selected = updates.filter((update) => update.included).map(({ field, proposedValue, evidence }) => ({ field, proposedValue, evidence }));
    if (!selected.length) return;
    const fields = new Map((record?.updates ?? []).map((update) => [update.field, update]));
    selected.forEach((update) => fields.set(update.field, update));
    const next: DemoRecord = { updates: [...fields.values()], at: new Date().toISOString() };
    try {
      localStorage.setItem("demoRecord", JSON.stringify(next));
      setRecord(next); setNotice(`${selected.length} update${selected.length === 1 ? "" : "s"} approved and saved to the demo record.`);
    } catch { setStorageError("Could not save the demo record. Browser storage may be disabled or full."); }
  }

  function copyEmail() {
    const email = analysis?.result.followUpEmail;
    if (!email) return;
    const text = `Subject: ${email.subject}\n\n${email.body}`;
    navigator.clipboard?.writeText(text).then(() => setNotice("Email draft copied to clipboard."), () => setStorageError("Could not copy to clipboard."));
  }

  function download(name: string, text: string, type: string) {
    const url = URL.createObjectURL(new Blob([text], { type }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${name}.`);
  }

  function saveCorrection() {
    if (!note.trim()) return;
    const next = [...corrections, { note: note.trim(), at: new Date().toISOString() }];
    try {
      localStorage.setItem("corrections", JSON.stringify(next));
      setCorrections(next); setNote(""); setNotice("Correction saved. It will be included in your next analysis.");
    } catch { setStorageError("Could not save the correction. Browser storage may be disabled or full."); }
  }

  const result = analysis?.result;
  const locate: Locate = (source, quote) => setSourceView({ source, quote });

  const sourceModal = sourceView ? (() => {
    const text = /plan/i.test(sourceView.source) ? plan : transcript;
    const { nodes, found } = highlight(text, sourceView.quote);
    return <div className="overlay" role="dialog" aria-modal="true" aria-label="Source" onClick={() => setSourceView(null)}>
      <div className="overlay-card source-modal" onClick={(event) => event.stopPropagation()}>
        <div className="section-heading"><h2 className="overlay-title">Source · {sourceView.source}</h2><button data-tour="source-close" className="quiet" onClick={() => setSourceView(null)}>Close</button></div>
        <p className="muted">{found ? "Highlighted where this quote appears in the original source." : "This exact quote was not found in the source — it may be paraphrased, which is why it is flagged."}</p>
        <pre className="source-text">{nodes}</pre>
      </div>
    </div>;
  })() : null;

  const helpBtn = <button className="tour-cta" onClick={startTour}>Take the tour</button>;

  return <main>
    {tourStep !== null && <Tour step={TOUR[tourStep]} index={tourStep} total={TOUR.length} onNext={advanceTour} onSkip={skipTour} />}
    {sourceModal}

    {view === "input" ? <>
      <header>
        <div className="topbar">
          <div className="eyebrow"><span className="status-dot" /> CLOUDASTA <span className="divider">/</span> REVIEW WORKSPACE</div>
          {helpBtn}
        </div>
        <h1>Meeting Follow-up Assistant</h1>
        <p className="subtitle">Compare a meeting transcript against an approved plan. Review, edit, approve — nothing is sent.</p>
      </header>

      <div className="input-grid">
        <div className="panel input-panel"><label htmlFor="plan"><span className="step">01</span> Approved Project Plan</label>
          <textarea id="plan" value={plan} disabled={loading} onChange={(event) => { setPlan(event.target.value); resetResult(); }} placeholder="Paste the approved plan, commitments, scope, and dates…" /></div>
        <div className="panel input-panel"><label htmlFor="transcript"><span className="step">02</span> Meeting Transcript</label>
          <textarea id="transcript" value={transcript} disabled={loading} onChange={(event) => { setTranscript(event.target.value); resetResult(); }} placeholder="Paste the meeting transcript, including requests and decisions…" /></div>
      </div>
      <div className="toolbar">
        <button data-tour="load-sample" disabled={loading} onClick={() => { setPlan(ORION_PLAN); setTranscript(ORION_TRANSCRIPT); resetResult(); }}>Load Orion sample</button>
        <button data-tour="analyze" className="primary" disabled={loading || !ready} onClick={analyze}>{loading ? "Analyzing…" : "Analyze"}</button>
        <button className="quiet" disabled={loading} onClick={() => { setPlan(""); setTranscript(""); resetResult(); }}>Clear</button>
        {analysis && !loading && <button className="quiet" onClick={() => setView("results")}>View last results →</button>}
        <span className="muted toolbar-note">{loading ? "Comparing sources with Gemini…" : "Evidence first. Human approval always."}</span>
      </div>
      {loading && <div className="loading" role="status"><span className="spinner" /><span className="loading-msg" key={loadingMsg}>{loadingMsg}</span></div>}
      {error && <div className="error" role="alert">{error}</div>}
      {storageError && <div className="error" role="alert">{storageError}</div>}
      {notice && <div className="notice" role="status">{notice}</div>}
    </> : result ? <>
      <header>
        <div className="resultbar">
          <button className="quiet" onClick={() => setView("input")}>← New analysis</button>
          <div className="eyebrow"><span className="status-dot" /> REVIEW PACKET <span className="divider">/</span> {analysis?.evidence.model}</div>
          {helpBtn}
        </div>
        <h1 className="results-h1">Review packet</h1>
        <div className="result-tools">
          <p className="subtitle">Generated from your sources. Click a source chip to see the quote in context. Nothing is saved or sent until you approve it.</p>
          <div className="export"><span className="muted">Export</span>
            <button className="quiet" onClick={() => analysis && download("review-packet.md", toMarkdown(result, analysis.evidence.model), "text/markdown")}>Markdown</button>
            <button className="quiet" onClick={() => download("review-packet.json", JSON.stringify(result, null, 2), "application/json")}>JSON</button>
          </div>
        </div>
      </header>

      {loading && <div className="loading" role="status"><span className="spinner" /><span className="loading-msg" key={loadingMsg}>{loadingMsg}</span></div>}
      {error && <div className="error" role="alert">{error}</div>}
      {storageError && <div className="error" role="alert">{storageError}</div>}
      {notice && <div className="notice" role="status">{notice}</div>}

      {showCompare && prevResult && <section className="panel compare">
        <div className="section-heading"><h2>What changed after your correction</h2><button className="quiet" onClick={() => setShowCompare(false)}>Dismiss</button></div>
        <p className="muted">Before = previous run · After = this run with your saved corrections applied. This is the saved-context memory loop — the model itself was not retrained. Note: the model also rephrases between runs, so some differences reflect wording rather than meaning.</p>
        {(() => {
          const dDec = listDiff(prevResult.confirmedDecisions, result.confirmedDecisions, (i) => i.text);
          const dReq = listDiff(prevResult.requestedChanges, result.requestedChanges, (i) => i.text);
          const dAct = listDiff(prevResult.actionItems, result.actionItems, (i) => i.text);
          const dQ = listDiff(prevResult.openQuestions, result.openQuestions, (i) => i.question);
          const updatesChanged = result.proposedRecordUpdates.filter((u) => {
            const prev = prevResult.proposedRecordUpdates.find((p) => p.field === u.field);
            return prev && prev.proposedValue !== u.proposedValue;
          });
          const blocks = [
            { label: "Confirmed decisions", added: dDec.added.map((i) => i.text), removed: dDec.removed.map((i) => i.text) },
            { label: "Requested changes", added: dReq.added.map((i) => i.text), removed: dReq.removed.map((i) => i.text) },
            { label: "Action items", added: dAct.added.map((i) => i.text), removed: dAct.removed.map((i) => i.text) },
            { label: "Open questions", added: dQ.added.map((i) => i.question), removed: dQ.removed.map((i) => i.question) },
          ].filter((b) => b.added.length || b.removed.length);
          if (!blocks.length && !updatesChanged.length) return <p className="muted">No differences in the extracted items. The correction may have affected phrasing or the email draft rather than the structured lists.</p>;
          return <div className="compare-grid">
            {blocks.map((b) => <div key={b.label} className="compare-block"><h3>{b.label}</h3>
              {b.added.map((t, i) => <p key={`a${i}`} className="diff-add">+ {t}</p>)}
              {b.removed.map((t, i) => <p key={`r${i}`} className="diff-rem">− {t}</p>)}
            </div>)}
            {updatesChanged.length > 0 && <div className="compare-block"><h3>Record update values</h3>
              {updatesChanged.map((u, i) => <p key={i} className="diff-add">~ {u.field} changed</p>)}
            </div>}
          </div>;
        })()}
      </section>}

      <nav className="tabs" role="tablist">
        {TABS.map((t) => {
          const count = t.id === "decisions" ? result.confirmedDecisions.length + result.requestedChanges.length
            : t.id === "actions" ? result.actionItems.length
            : t.id === "conflicts" ? result.conflicts.length + result.openQuestions.length
            : t.id === "updates" ? updates.length
            : t.id === "corrections" ? corrections.length
            : null;
          return <button key={t.id} data-tour={`tab-${t.id}`} role="tab" aria-selected={tab === t.id} className={`tab${tab === t.id ? " active" : ""}`} onClick={() => setTab(t.id)}>
            {t.label}{count !== null ? <span className="tabcount">{count}</span> : null}
          </button>;
        })}
      </nav>

      <div className="tabpanel" role="tabpanel">
        {tab === "decisions" && <div className="input-grid">
          <Items title="Confirmed decisions" items={result.confirmedDecisions} onLocate={locate} />
          <Items title="Requested changes (not approved)" items={result.requestedChanges} onLocate={locate} />
        </div>}

        {tab === "actions" && <section className="panel"><h2>Action items</h2>{result.actionItems.length ? <div className="table-wrap"><table><thead><tr><th>Action</th><th>Owner</th><th>Deadline</th></tr></thead><tbody>
          {result.actionItems.map((item, index) => <tr key={index}><td>{item.text}<Quote quote={item.quote} source={item.source} verified={item.verified} onLocate={locate} /></td><td><Field value={item.owner} /></td><td><Field value={item.deadline} /></td></tr>)}
        </tbody></table></div> : <p className="muted">None identified.</p>}</section>}

        {tab === "conflicts" && <>
          <section className="panel"><h2>Conflicts with approved plan</h2>{result.conflicts.length ? result.conflicts.map((item, index) => <article className="conflict" key={index}>
            <div className="section-heading"><h3>{item.description}</h3><span className="chip">{item.status}</span></div>
            <Quote quote={item.planSays} source="Approved Plan" verified={item.planVerified} onLocate={locate} /><Quote quote={item.transcriptSays} source="Transcript" verified={item.transcriptVerified} onLocate={locate} />
          </article>) : <p className="muted">None identified.</p>}</section>
          <section className="panel"><h2>Open questions</h2>{result.openQuestions.length ? <ul className="item-list">{result.openQuestions.map((q, index) => <li key={index}><p>{q.question}</p>{q.quote ? <Quote quote={q.quote} source={q.source || "Transcript"} verified={q.verified} onLocate={locate} /> : null}</li>)}</ul> : <p className="muted">None identified.</p>}</section>
        </>}

        {tab === "updates" && <>
          <section className="panel"><h2>Proposed record updates</h2><p className="muted">Review and edit each value, then select the updates you approve. Saved only in this browser.</p>
            {updates.length ? updates.map((update, index) => <div className="update-row" key={index}>
              <input type="checkbox" aria-label={`Include ${update.field}`} checked={update.included} onChange={(event) => setUpdates((current) => current.map((row, i) => i === index ? { ...row, included: event.target.checked } : row))} />
              <div><label htmlFor={`update-${index}`}>{update.field}</label><textarea id={`update-${index}`} className="update-value" value={update.proposedValue} onChange={(event) => setUpdates((current) => current.map((row, i) => i === index ? { ...row, proposedValue: event.target.value } : row))} /><p className="citation"><span className="chip">evidence</span>{update.evidence}</p></div>
            </div>) : <p className="muted">No updates proposed.</p>}
            <button data-tour="approve" className="primary" disabled={!ready || !updates.some((update) => update.included)} onClick={saveRecord}>Approve &amp; save to demo record</button>
          </section>
          <section className="panel saved-record"><div className="section-heading"><h2>Saved demo record</h2><span className="chip">Local browser storage</span></div>
            {record ? <><p className="muted">Last saved: {new Date(record.at).toLocaleString()}</p><dl>{record.updates.map((update, index) => <div key={index}><dt>{update.field}</dt><dd>{update.proposedValue}<p className="citation">{update.evidence}</p></dd></div>)}</dl></> : <p className="muted">No approved updates saved yet.</p>}
          </section>
        </>}

        {tab === "email" && <section className="panel"><div className="section-heading"><h2>Follow-up email draft</h2><button className="quiet" onClick={copyEmail}>Copy draft</button></div>
          <p className="muted">Draft only — this app never sends email.</p>
          <label htmlFor="email-subject">Subject</label><input id="email-subject" value={result.followUpEmail.subject} readOnly />
          <label htmlFor="email-body">Body</label><textarea id="email-body" className="email-body" value={result.followUpEmail.body} readOnly />
        </section>}

        {tab === "corrections" && <section className="panel"><h2>Reviewer corrections</h2><p className="muted">Saved corrections are extra context added to future prompts — this is saved context, NOT model retraining.</p>
          <label htmlFor="correction">Guidance for future reviews</label><textarea id="correction" className="correction" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Record a correction or clarify how future reviews should handle a recurring issue…" />
          <div className="toolbar"><button disabled={!ready || !note.trim()} onClick={saveCorrection}>Save correction</button>
            <button className="primary" disabled={loading || !corrections.length} onClick={rerunCompare}>Re-run with corrections &amp; compare</button></div>
          {corrections.length ? <ul className="item-list corrections">{corrections.map((correction, index) => <li key={index}><p>{correction.note}</p><small className="muted">{correction.at && new Date(correction.at).toLocaleString()}</small></li>)}</ul> : <p className="muted">No corrections saved yet.</p>}
        </section>}

        {tab === "evidence" && <section className="panel evidence-open"><h2>Evidence</h2>
          <p className="muted">Exactly what was sent to and returned by the model — kept available so every result is auditable. Model: {analysis?.evidence.model} · {analysis ? new Date(analysis.evidence.at).toLocaleString() : ""}</p>
          <details className="evidence-block"><summary>Exact prompt sent to the model</summary><pre>{analysis?.evidence.prompt}</pre></details>
          <details className="evidence-block" open><summary>Raw model response (JSON)</summary><pre>{analysis?.evidence.rawResponse}</pre></details>
        </section>}
      </div>
    </> : null}

    <footer>Cloudasta · Meeting Follow-up Assistant <span>Local demo record · No email delivery</span></footer>
  </main>;
}
