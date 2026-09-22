# Builder Code vs. Claude Code — Scoping the Build

---

## 0. The headline

**Do it in Builder Code wherever Builder Code is genuinely the better tool — which is more of this build than I'd assumed — but don't start there.**

The blocker is documented, and it's specific: Builder Code's own best-practices page says *"Without real-life code for the AI to analyze, it can't understand how your components should be used,"* and gives an explicit ❌ example of what not to ask it: *"Build me a complete e-commerce website."* **An empty repo is Builder Code's weakest case, and your repo is empty.**

So:

1. **Claude Code lays the foundation** — app shell, token pipeline, 3 exemplar components, `AGENTS.md`, `.builder/rules`, validation command. ~4 days.
2. **Builder Code takes over the component surface area** and everything demo-time. This is its sweet spot and it's the part you'll keep doing forever.
3. **Claude Code keeps the infrastructure** — seed scripts, the analytics generator, CI, the reset pipeline. Builder Code can't do these: `curl` and `npx` are blocked by default, there's no interactive shell, no scheduled jobs, no GitHub Actions execution, and **no Vercel integration at all.**

There's a second reason to use Builder Code here beyond efficiency: **you're an SE demoing Builder, and the Fusion + Publish workflow is itself one of your strongest demo beats** — see §5. Building this demo in it means you can actually run that beat live.

---

## 1. What the blueprint changes in the plan

Four corrections from the Fusion + Publish Workflow Blueprint. I've applied all four to docs 01 and 03.

### 1.1 Hybrid space — use it ✅

I was wrong to hedge. The blueprint is explicit: *"Hybrid space — a single space that contains both Fusion and Publish capabilities. **Recommended for new customers.**"* Your screenshot confirms it (InsureCo Demo). The space-type doc not defining it is a docs gap, not a product gap.

**Create `Fieldnote` as a Hybrid space.** It's the recommended configuration, it's what you'd tell a new customer to do, and it means your demo environment matches the advice you give.

### 1.2 The build order inverts — content first

The blueprint's **Starting State A (new customer)** is exactly your situation, and it runs:

1. Create a hybrid space
2. **Create content in Publish** — *"Stand up the initial models, entries, and symbols. This does not need to be complete — just enough to give Fusion a starting point."*
3. Connect Builder Code to the repo
4. **Run the sub-agent setup flow** — *"scaffolds the codebase for the customer's framework and wires up the models, pages, and component registry to match the content in Publish."*

My plan had it backwards: app first (Phases 1–2), then models and content (Phase 3). **Flip it.** Models and a content skeleton come first, because they're what the sub-agent reads to scaffold against.

This doesn't conflict with §0 — it sharpens it. The sub-agent wants *content* to scaffold from; best practices want *code examples* to generate against. So the sequence is: content skeleton → Claude Code builds a real app shell with 3 exemplar components → Builder Code has both and is at its strongest.

### 1.3 Builder Code Preview for Publish — a demo beat I missed entirely

This is the biggest thing in the blueprint and it wasn't in my plan at all. You can **point a content entry's preview source at an unmerged Builder Code branch**, so a work-in-progress component appears in the Publish Visual Editor before it ships.

Config path: Content entry → **"Preview with a Builder Code branch"** near the entry's URL → select Code Space → Project → branch. The component then appears under **Custom Components** in the toolbar, and branch changes show up immediately.

⚠️ **Two documented warnings, and they matter on a live call:**
- **Use a dedicated test entry, never a production entry.** If someone publishes an entry pointed at an unmerged branch, the live site renders content the editor was showing but the code can't support.
- **Don't publish any entry using a previewed component until that component is merged and deployed.** After the PR merges, switch the entry's preview back to the production URL and re-verify. That's the gate.

Why this is a Tier-1 beat: it answers, directly, the quote in your own blueprint from a real content marketer — *"We need a custom component change. Talk to engineering. They'll do it. It'll take a couple of weeks."* That's Jabil's stated #1 priority, SiteOne's *"~90% of content requires some code knowledge,"* and Lifeplus's locked-properties ask, all in one workflow. Full script beat in §5.

### 1.4 MCP model writes are a production hazard

From the blueprint's own enhancement stack: *"The MCP makes direct content model updates. This has to happen in a lower environment or it will break production immediately."*

So when Claude Code uses the CMS MCP to create and modify models — which is most of Phase 3 — **point it at a lower environment, not `main`.** Build models in `dev`, verify, then push up. This is listed as an open product gap ("Support for Publish Environments"), so treat it as a live sharp edge, not a solved workflow.

---

## 2. The capability boundary

Verified against Builder Code docs, Sept 2026.

### Builder Code does well

| Capability | Detail |
|---|---|
| **Container per branch** | Real dev server, configurable Node version, memory 1–16 GB, dependency install script |
| **Branches → PRs** | Direct commits / draft PRs / PRs, auto-push, "Sync from GitHub," custom branch naming, `@builder-bot` on the PR triggers more agent work |
| **Validation command** | Runs your typecheck + tests **after every agent task**. This is the only documented mechanism that makes it self-correcting — **set it day one** |
| **Browser automation agent** | Natural-language end-to-end tests after each prompt (burns extra credits) |
| **Quality review** | AI PR reviewer with configurable model and instructions (Team/Enterprise) |
| **Content sub-agent** | Install the Content SDK, migrate components/tokens/branding, build + **auto-register** components |
| **Design System Intelligence** | Indexes components, icons and tokens; `@`-tag them inline in chat. ⚠️ *"For the highest level of design and code fidelity, a repository connection is required"* — without it you get visual fidelity only |
| **Preview for Publish** | §1.3 |
| **Skills** | `.builder/skills/<name>/SKILL.md`, invoked by name. Custom skills fully supported |
| **Env vars** | Paste a whole `.env`; secret masking; separate build/production sets |
| **File tree + editor** | Real editing, syntax highlighting, error detection |

### Builder Code can't, or isn't documented to

| Gap | Impact on this build |
|---|---|
| **`curl` and `npx` blocked by default** | Project Settings → Agent → "Enforce default command restrictions" is **on**. Turn it off if you want the agent scripting against APIs |
| **No interactive shell for you** | Terminal output is view-only. No poking at things by hand |
| **No scheduled/background jobs** | The analytics generator and calendar roll-forward can't live here |
| **No GitHub Actions execution** | It can write the YAML; it can't run or validate it |
| **No Vercel integration** | Integrations are Netlify, Neon, Prisma, Supabase, Sanity, Contentful, Linear, Jira, Zapier, Slack. **Vercel is absent.** Your hosting and cron stay outside |
| **Weak on empty repos** | *"Without real-life code for the AI to analyze, it can't understand how your components should be used"* |
| **Don't one-shot apps** | Explicit ❌: *"Build me a complete e-commerce website."* Section by section |
| **Branch staleness** | Documented at length. Small chunks, PR immediately |
| **Rule context limits** | `.builderrules` and each `.mdc` ≤ 200 lines / 6,000 chars; combined always-on ≤ 500 lines; max 3–5 `alwaysApply: true`. Over that you get *"rule fatigue"* and it ignores you |

### Credits

**500 per user/month on Pro/Team**, rollover to 2×. Documented burn: a Figma component ≈ 16, a feature from a 124 KB PRD ≈ 37, an admin dashboard ≈ 20.

Rough math for this build: 12 components + iteration ≈ 250–350 credits, plus sub-agent setup and migration runs. **You'll likely want a top-up in month one.** Output tokens, large attachments, browser automation and quality review burn fastest. Cache hits make iterating on the *same branch* much cheaper than starting fresh — so don't open a new branch per tweak.

---

## 3. The split, phase by phase

| Phase | Tool | Why |
|---|---|---|
| **0 — Space + entitlements** | **Builder Code** (UI) | Create the Hybrid space, environments, roles. Pure config. |
| **0 — Spikes** | **Claude Code** | Undocumented API behavior, posting test events, waiting 30 min, re-querying. Needs a shell. |
| **3a — Models + content skeleton** ⬅️ *moved earlier* | **Claude Code + CMS MCP** | 14 models, a handful of entries. Scripted and repeatable — and it's what the sub-agent scaffolds against. ⚠️ Point at a lower environment (§1.4) |
| **1 — Foundation** | **Claude Code** | Next 15 + `@builder.io/sdk-react`, **the token pipeline**, fonts, ISR, `<Content>` wrapper. The token three-way binding is the exact thing the last build got wrong; verify it locally. |
| **2a — 3 exemplar components** | **Claude Code** | `Hero`, `Section`, `ProductCard` — built to the plan's standard (`{...attributes}`, static lookup maps, guardrails). **These are the examples Builder Code learns from.** |
| **2b — Handoff artifacts** | **Claude Code** | `AGENTS.md`, `.builder/rules/*.mdc`, validation command, `.builder/skills/`. See §4 — this is what makes Builder Code good. |
| **2c — Remaining 9 components** | **🟢 Builder Code** | Its sweet spot, with three exemplars to pattern-match. The sub-agent auto-registers them with Content. |
| **3b — Bulk content seed** | **Claude Code + MCP** | 48 products, 26 articles, 14 stores, 9 disclosures. Volume work, fan out subagents. |
| **4 — Surfaces** | **🟢 Builder Code** → Content VE | Page assembly. Genuinely better here — visual iteration with a live preview. |
| **5 — Data sources** | Split | **Claude Code**: API Data Source, DummyJSON snapshot, static fallbacks. **Builder Code**: connector-bound components (*"make this available in Publish, populated from the product model"*). |
| **6 — Targeting + localization** | **Claude Code** | RTL, locale groups, fetch params, the `[object Object]` trap. Plumbing, not UI. |
| **6.5 — SEO + AEO** | Split | **Claude Code**: sitemap route, JSON-LD, `generateMetadata`, the MCP audit agent. **Builder Code**: author it as a `.builder/skills/` skill so it's reusable and demoable. |
| **7 — Analytics** | **Claude Code** | Instrumentation audit, event generator, Playwright, cron. **Builder Code can't schedule anything.** |
| **8 — Governance, scheduling, environments** | **Builder UI** | Config, not code. |
| **9 — Reset pipeline + CI** | **Claude Code** | GitHub Actions, Vercel Cron, snapshot/restore scripts. All outside Builder Code's reach. |
| **Ongoing — demo-time iteration** | **🟢 Builder Code** | A prospect asks for a component you don't have → build it on a branch, preview it in the entry, ship it. This is the point. |

**Net:** roughly **60% Claude Code, 30% Builder Code, 10% Builder UI config** by effort — but the Builder Code 30% is the part you'll still be using in six months, and it's the part that doubles as a demo.

---

## 4. The handoff — what Claude Code must leave behind

Builder Code is only as good as what it finds in the repo. Four artifacts, all built in Phase 2b, and they're the difference between it being excellent and it being frustrating.

**1. `AGENTS.md`** (under 500 lines) — the stack, the model schema, the token namespace, and the non-negotiables from the plan.

**2. `.builder/rules/*.mdc`** — ⚠️ respect the limits: each file ≤ 200 lines / 6,000 chars, combined always-on ≤ 500 lines, **max 3–5 files with `alwaysApply: true`.** Over that you get documented "rule fatigue" and it starts ignoring them. Suggested split:

```
.builder/rules/
  components.mdc      alwaysApply: true   # {...attributes}, no interpolated
                                          # Tailwind, DOMPurify, static lookup maps
  tokens.mdc          alwaysApply: true   # --fn-* namespace only, never raw hex
  builder-registry.mdc alwaysApply: true  # single registry, client-side, unconditional
                                          # insert menus, requiredPermissions
  content-models.mdc  alwaysApply: false  # the 14 models and their fields
```

**3. Validation command** — Project Settings → Setup → Validation command:
```
npm run typecheck && npm run test
```
This runs **after every agent task**. It's the single highest-value setting in Builder Code and the only documented thing that makes it self-correcting. Set it before the first prompt.

**4. Three exemplar components** — `Hero`, `Section`, `ProductCard`, written exactly to standard. Builder Code pattern-matches off real code far more reliably than off instructions.

**Also worth doing:** Project Settings → Agent → turn **off** "Enforce default command restrictions" if you want the agent able to run `npx` and `curl`. It's on by default and will silently block things.

---

## 5. The demo beats this unlocks

Three new beats, and the first one is strong enough to restructure around.

### 5.1 "Your engineering team is busy" — the Preview for Publish loop ⭐⭐

**The setup:** a marketer needs a component that doesn't exist. Today that's a ticket and a two-week wait.

**The beat, live, end to end in about four minutes:**

1. In the Content editor, show there's no component for what you need.
2. Open a Builder Code branch: *"Build a countdown banner for our Members Week sale. Make the end date and headline configurable."*
3. Then: *"Make this available in Publish. Bind the products to the product model."* — the sub-agent registers it automatically.
4. Back in Content, on a **dedicated test entry**, switch preview to that branch. The component appears in the toolbar.
5. Drag it in. It works. Configure it. **It has not been merged or deployed.**
6. Tag a developer for review → PR → normal pipeline.
7. After merge, switch preview back to production, verify, publish.

**Why it lands:** it's the exact pain in your own blueprint, quoted from a real customer — *"We need a custom component change. Talk to engineering. They'll do it. It'll take a couple of weeks."* And it's a real workflow with a real safety gate, not a demo trick. Say the safety part out loud; platform teams are listening for whether you've thought about it.

**Where it goes in the script:** replaces or absorbs the Figma beat in §1.6. It's better — no Figma dependency, and internal Slack has flagged Figma as a risk (*"boxing us out from the MCP direct route"*).

### 5.2 "Scaffold a whole new property" — the sub-agent setup flow ⭐

The blueprint's other customer quote, from a VP: *"We have a request from a business org to create a new site and hand it off to them to edit going forward."*

Keep a **disposable repo and a scratch Hybrid space** where you can run *"Install Builder Content into this web application"* live. The sub-agent scaffolds the codebase for the framework and wires models, pages and the registry to match existing content.

This is worth building purely as a demo asset, separate from the main build. Multi-property companies (Polyconcept, Al Tayer, Jabil, Lenovo) feel this one immediately.

### 5.3 "Migrate from Contentful" — now with a real mechanism

§10.4 of the plan hedged this because there's no documented content-migration product. The sub-agent narrows the gap: it migrates *components, tokens and branding*, and the docs explicitly suggest naming the source CMS — *"If you're migrating from a specific CMS (e.g. Contentful, AEM, WordPress), mention it — the sub-agent will use that context to map content models and component structures more accurately."*

Still be precise: **the sub-agent migrates the code layer, not your content entries.** Entry migration is a script you write. But *"migrate my existing site to work with Builder Content"* against a Contentful-shaped app is a real, runnable demo — and given the Salesforce acquisition is actively moving deals, it's worth the build.

---

## 6. Changes to the Claude Code kickoff prompt

Doc 06's prompt still works. Four edits:

**Add after "Start here":**
```
This build is split with Builder Code (Builder's own agentic coding product). You own
the foundation and the infrastructure; Builder Code owns component surface area and
demo-time iteration. See docs/plan/07-builder-code-vs-claude-code.md for the boundary.

Your Phase 2 deliverable is not 12 components — it's THREE exemplar components plus
the handoff artifacts (AGENTS.md, .builder/rules/*.mdc, validation scripts) that let
Builder Code build the other nine correctly. Treat those artifacts as a primary
deliverable, not documentation.
```

**Change the build order:**
```
Content models come FIRST, before the app. Builder's own Fusion+Publish blueprint has
new customers stand up models and a content skeleton, then scaffold the codebase to
match. Do checklist Phase 3a (models + a few entries per model) before Phase 1.

When creating or modifying models over the MCP, target a LOWER ENVIRONMENT, not main.
Direct model updates via MCP against production can break the live site immediately.
```

**Add to non-negotiables:**
```
- The 3 exemplar components are reference implementations. Builder Code will
  pattern-match off them. Anything sloppy there propagates nine more times.
- .builder/rules files: each under 200 lines / 6,000 chars, combined always-on under
  500 lines, max 3-5 with alwaysApply: true. Builder documents "rule fatigue" past
  that — the agent starts ignoring them.
```

**Add to "How to work":**
```
- npm run typecheck and npm run test must exist and pass. Builder Code runs them as
  its validation command after every agent task, so they're load-bearing for the
  other half of this build.
```

---

## 7. Revised sequence

```
Week 1  │ Hybrid space + environments + entitlements        Builder UI
        │ Phase 0 spikes                                    Claude Code
        │ 14 models + content skeleton (lower env)          Claude Code + MCP
        │ App foundation + token pipeline                   Claude Code
        │
Week 2  │ 3 exemplar components                             Claude Code
        │ AGENTS.md, .builder/rules, validation command     Claude Code
        │ Connect Builder Code to the repo                  Builder UI
        │ ── HANDOFF ──
        │ Remaining 9 components                            🟢 Builder Code
        │ Bulk content seed (48 products, 26 articles)      Claude Code + MCP
        │ Event generator — START EARLY, needs runway       Claude Code
        │
Week 3  │ Four surfaces                                     🟢 Builder Code
        │ Data sources + fallbacks                          Claude Code
        │ Targeting + localization + RTL                    Claude Code
        │ Analytics instrumentation audit                   Claude Code
        │
Week 4  │ SEO + AEO (+ the audit skill)                     Split
        │ Governance, workflows, calendar                   Builder UI
        │ Reset pipeline + CI                               Claude Code
        │ Preview-for-Publish beat rehearsal                🟢 Builder Code
        │ Disposable scaffold-demo repo                     🟢 Builder Code
```

Still ~30 working days of effort. The Builder Code portion mostly *replaces* Claude Code time rather than adding to it — and it leaves you with a workflow you'll use every week, not just during the build.
