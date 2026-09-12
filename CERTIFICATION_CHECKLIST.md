# Stage 3 Certification Checklist

Self-audit of this submission against the three required artifacts.

## Artifact 1: The Prompt — `prompts/repo-sync.md`

- [x] Structured prompting: `## Input` / `## Task` / `## Output` sections
- [x] Deliberate instruction design: explicit action per local state, executable-command requirement, no-op branch, environment-isolation rule
- [x] Load-bearing: every instruction maps to at least one assertion — `## Task` bullets → Action; command requirements → Commands; "never discard local work" → Safety; `## Output` rules → all three

## Artifact 2: The Evaluations — `promptfooconfig.yaml` + `assertions/`

- [x] ≥3 distinct criteria: **Action** (correct branch), **Commands** (executable specifics), **Safety** (no destructive ops, dirty-tree acknowledgment) — each can fail independently
- [x] Substantive checks: deterministic JS assertions with their own unit tests (`npm test`, 19/19)
- [x] Capable of 95%+: currently 8/8 (100%) across both providers
- [x] Mid-tier models: Claude Haiku 4.5 and SWE-2 High via the Devin CLI — no API keys or frontier models required
- [x] Clear thresholds: binary 1.0/0.0 per metric, per-scenario `expected_action` vars

## Artifact 3: The Log — `ITERATION_LOG.md`

- [x] 6 iterations, each with baseline / hypothesis / change / measured results / reasoning
- [x] Chronological cause-and-effect: 50% → 37.5% → 62.5% → 100%, including a diagnosed harness flaw (agentic provider inspecting the real filesystem)
- [x] Committed run evidence: `results.html` (latest) and `results/` archive via `scripts/eval.ps1`

## Process discipline

- Pre-commit hook (`.githooks/pre-commit`, installed to `.git/hooks/`) rejects commits that change eval inputs (`prompts/`, `assertions/`, `promptfooconfig.yaml`, `devin.js`) without updating `ITERATION_LOG.md`. On a fresh clone: `git config core.hooksPath .githooks`.
- Reusable skill documenting the workflow: `.devin/skills/promptfoo-eval/` (also installed globally at `~/.config/devin/skills/`).

## Submission

- [ ] Zip as `firstName-lastName-stage3.zip`
- [ ] Upload to the Stage 3 Certification Requests form
