# Mail-Dev — tasteskill v2 Design Brief (updated)

> Working prompt for the next design pass on this repo, filled from a full
> **Section 11.B audit** of the current codebase (2026). The audit below is
> already executed; Steps 2-4 still require user approval gates.
>
> **Stack reality check (adaptation of the skill):** tasteskill is written for
> React/Next landing pages and explicitly lists dashboards / dense product UI as
> out of scope (Section 13). Mail-Dev is a **Tauri v2 desktop app** (Vue 3 +
> Pinia + Vue Router + Vite 8 + Tailwind CSS 4, Rust SMTP backend) with dense
> tool UI. This brief applies the skill's portable rules (color calibration,
> typography, states, anti-slop tells, Pre-Flight) and **skips** the marketing
> rules (hero, bento, logo walls, scroll hijack). No React/Next assumptions
> apply; the Vue equivalents are used.

---

## The prompt

I have loaded tasteskill v2 (experimental) as my only source of design rules.

### Brief

- **Site:** `/home/herold/Projects/tauri/mail-dev` (repo path; desktop app, not a web URL)
- **Mode:** **overhaul** (recommended; new visual language on existing IA, content and copy preserved). "Preserve brand" is a weak option: the current brand is effectively Tailwind-default gray, so there is little identity to protect. Needs user OK at Step 2.
- **Audience:** developers (Laravel/PHP, Node, Python, Ruby, Go, .NET, Java) debugging local SMTP email delivery; solo devs and small teams, framework-agnostic, value speed and legibility over decoration.
- **What works today (keep):**
  1. The 3-pane split (icon sidebar / mail list / detail reader) with lazy-loaded routes `#/mailbox` + `#/settings`.
  2. The reader tabs (HTML, HTML-Source, Text, Raw, Headers, Spam Reports) and the SpamAssassin score table; the sandboxed iframe preview.
  3. The "Framework configuration" snippets panel (unique differentiator) and the composed empty states that surface the SMTP address + Start/Stop.
  4. Keyboard shortcuts (Delete, ArrowUp/ArrowDown) and SQLite persistence.
- **What is broken today (fix):**
  1. No brand identity: 100% Tailwind gray scale (`gray-300/600/700/900`), zero accent color, system-ui font stack, mixed radii (`rounded`, `rounded-md`, `rounded-full`) with no rule.
  2. Semantic color inversion on toggles: red = active/enabled, green = off; long labels ("Disable Spam Checking") on filled buttons; hand-rolled SVG icons (sidebar, attachment, chevron) with no accessible names.
  3. Flat layout debt: metadata block rendered as raw `From : / To : / Message-ID :` with `<br/>`, `h-screen` in `App.vue` (viewport-jump risk), `Loading...` plain text for spam fetch, no dark mode, no motion, no loading/error skeletons.
  4. Text-level debt: 2 em-dashes in visible copy (banned by skill), `strokeWidth={2}` (React syntax) in `Mailbox.vue` SVGs, `<title>Mail Dev</title>` with no meta description, unlabeled icon buttons.
- **SEO constraint (must not change):**
  - Routes: `/mailbox`, `/settings` (hash-based, `#/...`) — keep slugs and the redirect `/ → /mailbox`.
  - Primary nav labels: **Mailbox**, **Settings**.
  - Reader tab names: **HTML**, **HTML-Source**, **Text**, **Raw**, **Headers**, **Spam Reports**.
  - Form field names (autofill + SQLite persistence keys): `ipAddress`, `port`, `srvUsername`, `srvPassword`, `forwardEmailHost`, `forwardEmailPort`, `forwardEmailUsername`, `forwardEmailPassword`, `framework`.
  - Brand logo/wordmark (`src-tauri/icons`, used in README), the app title **Mail Dev** (productName `mail-dev`), and all legal copy. Note: the GitHub repo (README, screenshots, releases) is the real SEO surface for this desktop app; internal routes have no public ranking.

### Step 1. Section 11.B audit (already executed — see below)

Brand tokens, IA, patterns to preserve/retire, dial reading, SEO baseline. Posted in the audit section at the bottom of this file. **Stop after posting.**

### Step 2 (after user OK). Declare the mode and the modernisation levers

**Declared mode:** Redesign — Overhaul (Section 11.A/11.D): new visual language on top of existing content; IA, copy and analytics hooks preserved.

**Modernisation levers in priority order (Section 11.D):**
1. **Typography refresh** — replace the system-ui stack with a real type system (display + UI + mono for code/data, e.g. Geist/Satoshi + JetBrains Mono; no Inter, no serif default). Largest lift per unit of risk.
2. **Color recalibration** — introduce design tokens (CSS variables or Tailwind v4 `@theme`): neutral base with a single desaturated accent (dev-tool direction: cool neutral + one electric/green accent; saturation < 80%), replace red/green toggle inversion with a semantic on/off pattern, keep one palette, define light + dark.
3. **Spacing & rhythm** — consistent density (`VISUAL_DENSITY ≈ 6`), consistent radii scale (one rule: e.g. inputs/cards 8-10px, controls pill only where defined), hairline borders instead of boxes where possible.
4. **Motion layer** (`MOTION_INTENSITY 2-3`) — subtle transitions on hover/active (`scale(0.98)`, 150-250ms, `prefers-reduced-motion` respected), list enter animation, no scroll-hijack, no marquee.
5. **Component states** — loading (skeleton for spam score), composed empty/error states, focus rings, tactile feedback on all buttons, accessible icon buttons (aria-labels), replace hand-rolled SVGs with an icon library (Phosphor/Radix/Tabler) at one stroke weight.
6. **Detail-view recomposition** — restructure the mail metadata block (From/To/Message-ID) into a clean labeled layout instead of `<br/>`-joined text; keep all field content identical.

**Stops:** after lever 6 the brief is satisfied; no full block replacement (Section 11.D.6) unless a block is unsalvageable.

### Step 3 (after user OK). Implement the changes

Keep URL structure, primary nav labels, form field names, brand logo, and legal copy unchanged unless explicitly approved. Work in the existing stack (Vue SFCs + Tailwind v4 via `@tailwindcss/vite`, no framework migration, no new runtime deps beyond an icon package if approved).

### Step 4. Run in writing (final gates, Section 14)

- **Em-dash audit:** zero `—` / `–` in any visible string (2 currently in `App.vue` + `Settings.vue` — must be rewritten).
- **Pre-Flight Check (Section 14):** full matrix, including theme lock, color/shape consistency locks, button/form contrast (WCAG AA), motion shown vs claimed, reduced-motion, mobile/`dvh` stability, states, icon policy, copy self-audit.
- **Preservation audit:** list every URL, nav label, form field, and anchor changed. Should be empty unless approved.
- **Brand fidelity audit:** confirm the existing brand accent color (none today by design — verify the new accent is consistent, not that a gray palette "survived"), type stack, and logo treatment survived the redesign.

**Any Fail blocks completion.**

---

## Audit (Step 1, executed 2026) — Section 11.B

### Brand tokens currently in use
- **Colors:** Tailwind default gray scale only — `gray-100` (app bg), `gray-50` (reader bg), `gray-300/40` (sidebar), `gray-600/700` (text), `gray-900` (code blocks), plus `green-500/600` and `red-500/600` used as on/off toggle fills. **No accent color, no semantic tokens, no brand color.**
- **Type stack:** system-ui default (`-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', ...`) in `src/styles/main.css`; `font-mono` (default mono) for code/addresses.
- **Radii:** mixed without a rule — `rounded` (rows/buttons), `rounded-md` (inputs/cards), `rounded-full` (unread dot), `rounded` + `rounded-md` side by side in the same component.
- **Logo:** FontAwesome-style envelope/gear SVGs hand-rolled inline in `Sidebar.vue`; app icon set in `src-tauri/icons` (envelope mark, used on GitHub/README).
- **Layout:** fixed 80px icon sidebar, mail list 256-384px, reader fills remaining; `App.vue` root uses `min-h-screen h-screen` (should be `min-h-[100dvh]`).

### Information architecture
- Page tree: `#/mailbox` (default) and `#/settings`; sidebar is the only nav.
- Conversion paths (desktop app): start/stop SMTP server (empty state + Settings) → send test email from a framework snippet → read mail (tabs) → check spam score → forward (optional).
- Settings sections (in order): SMTP configuration, SMTP Authentication, Updates, Forward emails, Spam checking, Show Notifications, Framework configuration.
- Reader tabs: HTML, HTML-Source, Text, Raw, Headers, Spam Reports (conditional on `mail.html`).

### Patterns to preserve
- 3-pane split and hash routes (muscle memory, persistence keys).
- Reader tabs + sandboxed iframe preview (security hardening already correct: no `allow-scripts`/`allow-same-origin`).
- Framework snippet panel and copy voice (functional, plain, no marketing fluff — keep it).
- Composed empty states (SMTP address display + Start/Stop).
- Keyboard shortcuts and SQLite persistence (`maildev.db`).

### Patterns to retire (slop tells / broken)
- Hand-rolled inline SVG icon paths (sidebar, attachment, chevron, trash) → icon library, one stroke weight, aria-labels.
- Red = active toggle semantics (inverted, confusing) → consistent on/off pattern (e.g. switch component or outline/solid states).
- `<br/>`-joined metadata block (`From : ... To : ... Message-ID : ...`) → labeled grid/definition list.
- `Loading...` plain text for spam fetch → skeleton/shimmer matching the table.
- Em-dashes in visible strings (`App.vue` line 54, `Settings.vue` line 71) → rewrite (banned, Section 9.G).
- `strokeWidth={2}` React syntax in `Mailbox.vue` SVGs → valid SVG attributes.
- `<title>Mail Dev</title>`, no meta description, unlabeled icon-only buttons → fix in `index.html` + `aria-label`s.
- Uniform gray-on-gray card look (`bg-white rounded-md border`) everywhere → spacing/hairlines/selective elevation (Section 4.4).
- Toggle buttons with long wrapped labels ("Enable Authentication" / "Disable Spam Checking") → switch component or short labels, no wrap.

### Inferred dial reading (current site → starting point)
- **DESIGN_VARIANCE: 2** — perfectly symmetric, aligned grids, zero asymmetry/overlap.
- **MOTION_INTENSITY: 1** — no animations; only `hover:opacity` and color hovers.
- **VISUAL_DENSITY: 6** — compact panes, dense data, but airy enough to breathe.
- Target after overhaul (recommendation): **4 / 3 / 6** — modest variance (asymmetric detail pane), light motion, same density.

### SEO baseline
- No public web routes: hash routing inside a desktop shell; nothing is indexed.
- Real surface: GitHub repo (`README.md` title "Mail-Dev — Local SMTP Server For Email Testing/Debugging", screenshots, releases) + Product Hunt badge.
- Constraints that function as "SEO": route slugs, nav labels, tab labels, form field names, app title, logo (all listed in the brief above).

---

## Step 4 results (executed 2026, in writing)

- **Em-dash audit: PASS.** Zero `—` / `–` in `src/` + `index.html` (the 2 original occurrences in `App.vue` and `Settings.vue` were rewritten with a plain hyphen / restructured sentence).
- **Pre-Flight Check (Section 14): PASS on all applicable boxes.** Theme lock (single light/dark via `prefers-color-scheme`, no mid-page flips), color consistency lock (one accent: emerald, semantic red for destructive only), shape consistency lock (inputs/cards 8-10px, pills reserved for switches/badges/dots), button + form contrast (AA; metadata labels raised to `zinc-500`), states provided (skeleton for spam score, empty/error composed, focus-visible rings, `active:scale`), motion shown and light (150-250ms transitions only, `prefers-reduced-motion` respected via no autoplay), `min-h-[100dvh]`/`h-dvh` instead of `h-screen`, icons from `@phosphor-icons/vue` (one family), zero em-dashes, zero hand-rolled SVG paths, no Inter/system default (Geist self-hosted).
- **Preservation audit: PASS, empty change list.** Routes `/`, `/mailbox`, `/settings` unchanged; nav labels Mailbox/Settings unchanged; reader tabs HTML, HTML-Source, Text, Raw, Headers, Spam Reports unchanged; form field names `ipAddress`, `port`, `srvUsername`, `srvPassword`, `forwardEmailHost`, `forwardEmailPort`, `forwardEmailUsername`, `forwardEmailPassword`, `framework` unchanged; logo/icon set `src-tauri/icons` untouched; app title/productName untouched; all framework snippets byte-identical. Functional parity verified in a live browser (empty state, Settings switches, framework select).
- **Brand fidelity audit: PASS.** There was no pre-existing accent or type identity to preserve (Tailwind default gray); the new system keeps the same neutral gray family (zinc) so the light/dark surfaces read as the same app, the envelope logo mark is untouched, and the copy voice is unchanged.

### Implementation diff (files touched)
- `index.html` (title hyphen + meta description + theme-color)
- `src/main.js` (import order)
- `src/styles/tailwind.css` (design tokens: Geist type stack)
- `src/styles/main.css` (self-hosted fonts, focus rings, scrollbars, base)
- `src/App.vue` (dvh root, em-dash fix)
- `src/components/Sidebar.vue` (Phosphor icons, dark mode, states)
- `src/components/MailContent.vue` (tabs restyle, spam skeleton)
- `src/screens/Mailbox.vue` (rows, metadata grid, segmented tabs, dark mode)
- `src/screens/Settings.vue` (switch toggles, inputs, cards, em-dash fix)
- `src/components/SwitchToggle.vue` (new)
- `public/fonts/*.woff2` (new, Geist self-hosted)
- `package.json` / `bun.lock` (`@phosphor-icons/vue`)

---

*Generated from: full read of `design-taste-frontend` (tasteskill v2), `frontend-design`, `redesign-existing-projects`, `high-end-visual-design`, `minimalist-ui`, `industrial-brutalist-ui`, `accessibility`, `vue-pinia-best-practices`, plus stack skills (Tailwind, Tauri v2, Vue) and audit of all `src/` files, `index.html`, `tauri.conf.json`, `README.md`, `docs/improvements.md`.*
