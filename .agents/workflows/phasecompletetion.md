---
description: 
---

# AEGIS AGENT — WORKFLOW PROTOCOL

## Purpose

Use this as the team’s execution workflow. Each phase has a clear owner, required checks, and a completion gate. Do not announce completion until every check in that phase is green.

## Global Rules

* Follow the phase order.
* Do not start the next phase until prerequisites are met.
* Every check must pass before posting `PHASE [N] DONE ✓`.
* Keep secrets out of code and committed files.
* Match shared schemas and event names exactly across frontend, backend, and AI.

---

# PHASE 1 — FOUNDATION

## 1A. Josh — Frontend skeleton

**Goal:** Ship the Act I UI shell, validation, and design system tokens.

**Done when:**

* Frontend installs, type-checks, lints, and builds cleanly.
* Local dev server runs without errors.
* Act I loads with no blank screen or default styling.
* Design tokens, fonts, form fields, CTA, and right-column atmosphere all render correctly.
* Validation blocks empty or invalid input.
* Required shared components and state files exist.
* No `any` types, no `console.log`.

**Output:**
`Phase 1 DONE ✓ — Act I skeleton live. Design tokens applied. Form validates. Waiting on api-contract.md.`

## 1B. Backend Dev — API contract and Band service

**Goal:** Define the backend model, service layer, and contract consumed by the other teams.

**Done when:**

* Backend installs and starts cleanly.
* Health endpoint returns OK.
* Core models exist and import successfully.
* Band auth can create and close a room with real credentials.
* `docs/api-contract.md` is committed and contains REST, WebSocket, schemas, enums, and error format.
* Service methods exist for room lifecycle and message flow.
* No hardcoded keys, URLs, or secrets.
* Example env and config files are committed.

**Output:**
`Phase 1 DONE ✓ — Band auth working. Models and api-contract.md committed. Frontend and AI can now align to the contract.`

## 1C. Sobia — AI client and planner

**Goal:** Build the AI client layer and a working planner agent.

**Done when:**

* AI package imports cleanly.
* AI clients load from environment variables only.
* Planner agent is async and returns a valid BandMessage-compatible structure.
* Planner test passes with mock or real API.
* Output fields match the backend contract.
* No API keys in code.

**Output:**
`Phase 1 DONE ✓ — Planner agent working and tested. API clients implemented. Aligned to api-contract.md.`

---

# PHASE 2 — INTEGRATION

## 2A. Josh — War Room UI

**Prerequisite:** Backend `api-contract.md` is committed.

**Done when:**

* Frontend type-checks, lints, tests, and builds cleanly.
* War Room layout renders with mock session data.
* All four agent cards render with correct states and styles.
* Terminal stream shows the expected message format and animation.
* Session header and locked sidebar render correctly.
* Mobile layout works without overflow.
* All war-room components, tests, and WebSocket types exist.
* No `any` types.

**Output:**
`Phase 2 DONE ✓ — Full Act II War Room live with mock data. Types aligned to api-contract.md.`

## 2B. Backend Dev — Orchestrator and WebSocket stubs

**Goal:** Make the backend run the full stub workflow end-to-end.

**Done when:**

* Tests pass with adequate coverage.
* REST endpoints for create, status, verdict, and events work.
* WebSocket emits the correct event sequence.
* Base agent and stub agent files exist.
* Orchestrator handles the reviewer loop correctly.
* Event logging endpoint returns the session history.
* No secrets in committed files.

**Output:**
`Phase 2 DONE ✓ — Stub workflow runs end-to-end. WebSocket emits all required event types.`

## 2C. Sobia — Full 4-agent chain

**Goal:** Make planner, analyst, reviewer, and finalizer work as a chain.

**Done when:**

* AI tests pass.
* Each agent imports and runs cleanly.
* The chain test succeeds from planner to finalizer.
* Confidence, risk, and status outputs stay within expected ranges.
* Output schemas match the contract.
* No keys in code.

**Output:**
`Phase 2 DONE ✓ — Full 4-agent chain working. Ready for real integration.`

---

# PHASE 3 — REAL SIGNAL INTEGRATION

## 3A. Josh

* Replace mock data with real Band events.
* Confirm the UI reacts correctly to live status changes.
* Verify terminal, agent cards, and verdict states update in real time.

## 3B. Backend Dev

* Wire real Band message listeners into the orchestrator.
* Ensure room lifecycle, event logging, and verdict emission remain stable.
* Re-run end-to-end workflow tests with live services.

## 3C. Sobia

* Connect real AI outputs to the workflow.
* Confirm agent outputs remain valid under real prompts and live data.
* Validate fallback behavior when a model or API is unavailable.

**Phase 3 is done when:**

* Live workflow runs from create-room to final verdict.
* All agents produce valid outputs.
* Frontend, backend, and AI share the same schema and event contract.

---

# PHASE 4 — HARDENING AND RELEASE

## All Team Members

* Remove debug code and placeholder logic.
* Run the full test suite.
* Check accessibility, responsiveness, error states, and empty states.
* Review logs for noisy failures and schema drift.
* Confirm no secrets, no warnings, and no contract mismatches.
* Prepare release notes and handoff summary.

**Release gate:**

* Build passes.
* Tests pass.
* Contract is stable.
* Live workflow is reproducible.

---

# COMMITMENT FORMAT

After each phase, post only the approved completion message for that owner. Keep it short, factual, and tied to the exact checks that passed.

**Example:**
`Phase 1 DONE ✓ — Act I skeleton live. Design tokens applied. Form validates. Awaiting backend contract.`
