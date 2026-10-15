# Meeting Follow-up Assistant

After a client call, this tool reads the meeting transcript, compares it to the plan you already agreed on,
and hands you a tidy summary to review — what was decided, what was only *requested*, who owns what, and a
ready-to-edit follow-up email. **It never changes your files and never sends anything.** You stay in charge.

*Built for Cloudasta's Founders AI Associate assignment (Task 3).*

- **Open the app:** https://meeting-followup-assistant.vercel.app
- **Source code:** https://github.com/dheerajyer2418/meeting-followup-assistant

---

## Try it in 30 seconds

1. Open the app. A short **guided tour** starts automatically and points at exactly what to click (you can
   replay it anytime with the **Take the tour** button).
2. Click **Load Orion sample** — this fills in an example plan and meeting transcript for a fictional client.
3. Click **Analyze**. In a few seconds you get the review.

That's it. Everything else is just reading the result and deciding what to keep.

## What you get back

- **Decisions** that were confirmed in the meeting.
- **Requested changes** that are *not* approved yet — kept clearly separate from the decisions.
- **Action items**, each with an owner and a deadline. If the meeting never said who owns it or when it's
  due, it honestly says **"not stated"** instead of guessing.
- **Conflicts** — anything in the meeting that clashes with the approved plan.
- A **follow-up email draft** you can copy and edit.

Every point comes with the exact quote it's based on, labeled **Approved Plan** or **Transcript**. Click any
label to see that line highlighted in the original — so you can double-check it in one click.

## The part that matters: you're always in control

- **Nothing is sent.** The email is only a draft on your screen.
- **Nothing is saved until you approve it.** You can edit any suggestion first, then click **Approve & save**.
  Saved items go into a simple record kept in your own browser.
- **Requests never become decisions on their own.** In the example, the plan says launch **October 20**; the
  client asks to move it to **October 18** but needs sign-off — so the tool keeps October 20 as the approved
  date and lists October 18 as a pending request. That's the whole point.
- **It double-checks itself.** Every quote is checked against the original documents. If the AI makes one up
  or paraphrases, it gets flagged **"⚠ not found in source"** so you catch it.

## If something looks off

- **"Approved Project Plan is required" / "Meeting Transcript is required."** One of the two boxes is empty.
  Add text to both and click Analyze again.
- **A red "AI request failed" message.** The AI service was busy or unreachable. Just click Analyze again.
  Importantly, the tool shows the real error — **it never fakes a result to cover a problem.**
- **Your saved items disappeared.** The record lives in *this* browser only. A different browser, device, or
  a private/incognito window starts fresh. That's expected for a demo.

## A quick note on "memory"

You can save **corrections** (e.g., "always name the sponsor as the approver"). These are just notes that get
added to the instructions next time — a visible, reversible reminder. **The AI is not retrained or
permanently changed**; delete the note and it's gone. It's saved context, nothing more.

## Good to know (limits)

- It's a demo: saved items live in your browser, there's no login, and it doesn't connect to Gmail, Drive,
  or a calendar.
- The AI is helpful but not perfect — which is exactly why **you approve everything before it's saved.**

## Where this could go next (Gemini Enterprise)

Right now you paste the plan and transcript in by hand. Inside **Gemini Enterprise**, the same idea would:

- **Pull the documents automatically** from Drive, Meet, and Gmail instead of pasting — and cite the real
  source files.
- **Live as a reusable "Skill"** so anyone on the team can run it the same way.
- **Respect permissions** so each person only sees what they're allowed to, with the same
  approve-before-save safety.

---

### For developers

Next.js + TypeScript, calling Google Gemini from the server (your API key never reaches the browser). No
database — saved items use the browser's local storage. To run it yourself:

1. `npm install`
2. Create a file named `.env.local` with one line: `GEMINI_API_KEY=your_key` (free key at
   https://aistudio.google.com/apikey)
3. `npm run dev`, then open http://localhost:3000

Real prompts, AI responses, and test screenshots from actual runs are in the `evidence/` folder.
