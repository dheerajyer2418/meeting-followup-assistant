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

## Run your own version

This is a Next.js + TypeScript app that calls Google Gemini from the server, so your API key never reaches
the browser. There's no database — saved items use the browser's own storage. Here's everything you need to
get it running on your computer, start to finish.

### 1. Install the tools you need (one time)

- **Node.js 18.18 or newer** (this includes `npm`). Download it from https://nodejs.org — pick the "LTS"
  version. To check it worked, open a terminal and run `node -v`; you should see a version number.
- **Git** (optional, only if you want to clone the code). Download from https://git-scm.com.

### 2. Get the code

Either way is fine:

- **With Git:**
  ```
  git clone https://github.com/dheerajyer2418/meeting-followup-assistant.git
  cd meeting-followup-assistant
  ```
- **Without Git:** on the GitHub page, click the green **Code** button → **Download ZIP**, unzip it, then
  open a terminal in that folder.

### 3. Install the project's dependencies

From inside the project folder, run:

```
npm install
```

This downloads the libraries the app needs. It only has to be done once (and again if the code updates).

### 4. Get a free Google Gemini API key

1. Go to https://aistudio.google.com/apikey and sign in with a Google account.
2. Click **Create API key** and copy the key it gives you.

Keep this key private — treat it like a password.

### 5. Add your key to the project

In the project folder, create a file named exactly **`.env.local`** with this single line (paste your real
key in place of `your_key_here`):

```
GEMINI_API_KEY=your_key_here
```

There's a template file called `.env.local.example` you can copy and rename if that's easier. This file is
ignored by Git on purpose, so your key never gets uploaded.

### 6. Start the app

```
npm run dev
```

When it says it's ready, open **http://localhost:3000** in your browser. Click **Load Orion sample →
Analyze** to try it. To stop the app, press **Ctrl + C** in the terminal.

### 7. (Optional) Run the production build

To run it the way it runs when deployed:

```
npm run build
npm start
```

### 8. (Optional) Put it online yourself

The easiest host is **Vercel**:

1. Create a free account at https://vercel.com and install its tool: `npm install -g vercel`.
2. From the project folder, run `vercel` and follow the prompts.
3. In your project on the Vercel dashboard, go to **Settings → Environment Variables** and add
   `GEMINI_API_KEY` with your key, then redeploy. (This keeps the key on the server, never in the browser.)

### If setup goes wrong

- **`node` or `npm` "not recognized."** Node.js isn't installed or the terminal was open before you
  installed it — install Node, then close and reopen the terminal.
- **`npm install` fails.** Check your internet connection and that you're inside the project folder (you
  should see a `package.json` file there), then try again.
- **The app loads but Analyze says the key is missing.** Double-check the file is named `.env.local`
  (not `.env.local.txt`), the line reads `GEMINI_API_KEY=...`, and you **restarted** `npm run dev` after
  creating it.
- **"AI request failed."** The key may be wrong or out of quota, or the AI service was briefly busy. Try
  again; if it persists, create a fresh key.

---

Real prompts, AI responses, and test screenshots from actual runs are saved in the `evidence/` folder if you
want to see examples of the output.
