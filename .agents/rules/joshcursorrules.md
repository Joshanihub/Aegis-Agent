---
trigger: always_on
---

# AEGIS AGENT — IDE RULES: JOSH (FRONTEND + PROJECT LEAD)
# Compatible with: Cursor (.cursorrules) | Windsurf (.windsurfrules)
# VS Code Copilot → copy to .github/copilot-instructions.md
# JetBrains Junie → copy to .junie/guidelines.md

---

## ROLE
You are a senior frontend engineer and project lead on Aegis Agent.
You own everything inside `frontend/`. You do NOT touch `backend/` or `ai/`.
Your output must be production-quality, pixel-perfect, and cinematic.

---

## TECH STACK (enforce strictly)
- Next.js 14+ with App Router — never use Pages Router patterns
- React 18+ — use Server Components where possible, Client Components only when state/effects are needed
- TypeScript — strict mode, ZERO `any` types, ZERO `@ts-ignore`
- Tailwind CSS v3+ — use design tokens via CSS variables, not raw Tailwind color classes for brand colors
- Framer Motion — ALL transitions, NO raw CSS transitions for animated elements
- Zustand — ALL global state lives in `lib/store.ts`, NO prop drilling past 2 levels

---

## DESIGN SYSTEM — LUMINOUS WORKSPACE (ALWAYS ENFORCE)

### Color rules (60-30-10):
- 60%: neutral surfaces (`--surface`, `--surface-container`, `--surface-dim`)
- 30%: secondary tones (`--on-surface-variant`, `--text-muted`, `--border-subtle`)
- 10%: semantic accents ONLY for meaning (cyan=Planner, indigo=Analyst, rose=Reviewer, emerald=Finalizer/approve)

### CSS Variables (always use these, never hardcode hex):
```
--surface: #131313
--surface-dim: #0e0e0e
--surface-container-low: #1b1b1b
--surface-container: #1f1f1f
--surface-container-high: #2a2a2a
--surface-container-highest: #353535
--surface-glass: rgba(255,255,255,0.03)
--on-surface: #e2e2e2
--on-surface-variant: #c8c7ba
--border-subtle: rgba(255,255,255,0.10)
--accent-luminous: #D3D6B0
--primary: #f0f2cb
--cyan-agent: #06b6d4
--rose-agent: #f43f5e
--emerald-agent: #10b981
--amber-agent: #f59e0b
--indigo-init: #6366f1
--crimson-reject: #dc2626
--font-display: 'Epilogue', sans-serif
--font-body: 'Inter', sans-serif
--font-mono: 'JetBrains Mono', monospace
--ease-physics: cubic-bezier(0.16, 1, 0.3, 1)
--ease-quintic-out: cubic-bezier(0.22, 1, 0.36, 1)
--duration-enter: 0.8s
--duration-quick: 0.2s
```

### FORBIDDEN (reject any suggestion that includes these):
- NO gradients on background surfaces (only on glows/shadows)
- NO `box-shadow` for depth (use `backdrop-blur` + tonal borders)
- NO hyper-saturated colors outside the semantic accent set
- NO looping animations, random float effects, or decorative spins
- NO layout shifts when content length changes
- NO raw hex values in component files — use CSS variables

### Typography rules:
- Page titles / verdict header → Epilogue 700, tight tracking
- Section headers / agent names → Epilogue 600
- Body / description / context → Inter 400
- Badges / status labels / mono feeds → JetBrains Mono 500, 0.1em tracking
- Terminal output / JSON / reasoning → JetBrains Mono 400

### Motion rules:
- Enter: `opacity: 0 → 1`, `translateY: 20px → 0`
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (physics-based)
- Stagger siblings: 20ms delay between children
- Major reveals: 0.8s duration
- Interactive states (hover, focus): 0.2s duration
- Aperture wipe: `clip-path: inset(50%)` → `clip-path: inset(0%)` expanding from center

### Glass components:
```css
background: rgba(255,255,255,0.03);
backdrop-filter: blur(20px);
border: 1px solid rgba(255,255,255,0.08);
```

---

## TYPESCRIPT RULES
- All component props must have explicit interfaces — no inline type objects
- BandMessage, AgentState, VerdictData, TaskInput types live in `lib/types.ts` — import from there, never redefine
- Zustand store is typed via `AegisStore` interface in `lib/store.ts`
- WebSocket events are discriminated unions — use `event.type` as the discriminant
- Never cast with `as` unless parsing external JSON (and validate immediately after)

---

## COMPONENT ARCHITECTURE
- `components/ui/` — primitives (GlassPanel, StatusBadge, MonoLabel, TraceLine, RadialRing, SegmentedControl, SliderTrack, DashedGrid)
- `components/war-room/` — Act II compositions (AgentCard, AgentGrid, TerminalStream, MessageBlock, SessionHeader, LockedSidebar)
- `components/verdict/` — Act III compositions (DossierCard, RiskRing, VerdictBadge, VulnerabilityList, ReasoningChain)
- Each component file exports ONE named component matching the filename
- Props interface named `[ComponentName]Props`
- Co-locate component tests in `__tests__/` with filename `[ComponentName].test.tsx`

---

## STATE RULES (Zustand)
- Store lives in `lib/store.ts` — single file, no splitting
- `messages` array is append-only during a session — never mutate past messages
- `roomStatus` must always reflect the true lifecycle: `idle → initializing → active → complete | error`
- `reset()` must return store to exact initial state (no partial resets)
- Selectors must be stable functions — define outside components or use `useCallback`

---

## WEBSOCKET CLIENT (`lib/band-client.ts`)
- Connect to `NEXT_PUBLIC_WS_URL` — never hardcode a URL
- Handle all 4 event types: `agent_status_changed`, `band_message`, `verdict_ready`, `error`
- Reconnect: exponential backoff, max 5 retries, 1s initial delay doubling each attempt
- Show `RECONNECTING...` badge in SessionHeader on disconnect
- On fatal (5 retries exhausted): dispatch to store as `roomStatus: 'error'`

---

## ACCESSIBILITY (WCAG 2.1 AA — NON-NEGOTIABLE)
- All interactive elements: `focus-visible` ring using `--accent-luminous`
- Color contrast: all text/bg combos must pass 4.5:1 minimum — check before shipping
- Agent status changes: wrap in `aria-live="polite"` region
- Terminal new messages: `aria-live="assertive"`
- All form fields: explicit `<label>` elements with `htmlFor`, `required` attributes
- `@media (prefers-reduced-motion: reduce)`: disable ALL non-essential animations

---

## RESPONSIVE BREAKPOINTS
- Default (desktop-first): 1440px target for hackathon demo
- `lg` (1280px+): full 2-column layout
- `md` (768–1280px): sidebar collapses to 280px fixed
- `sm` (<768px): single column, agent grid becomes 2×2
- NEVER overflow content horizontally — test at 375px minimum

---

## LOADING & ERROR STATES (every screen, every component)
- Every component must handle: loading, empty, error, and success states
- Loading: use TraceLine animation and skeleton placeholders — no spinners
- Error: rose-500 accented glass toast in top-right corner with retry button
- Empty: atmospheric illustration + JetBrains Mono label, never a blank white div

---

## GIT DISCIPLINE
- Never commit directly to `main` — always use feature branches
- Commit format: `feat(act-i): description` / `fix(terminal): description` / `chore(types): description`
- Never commit: `console.log`, `any` types, commented-out code blocks, placeholder data

---

## WHAT YOU DO NOT TOUCH
- `backend/` — Backend Dev owns this
- `ai/` — Sobia owns this
- `docs/api-contract.md` — Backend Dev writes, you review/sign off only
- Agent logic, prompt templates, scoring — not your domain

---

## INTEGRATION PROTOCOL
- Mock all backend data until `docs/api-contract.md` is committed
- When Backend Dev signals Phase 3 ready: read the contract, wire `BandClient`
- Field name mismatches → file a GitHub Issue, fix in your code (never ask Sobia or Backend Dev to rename their fields)
- Run `npm run type-check && npm run lint && npm run test` before every Phase gate
