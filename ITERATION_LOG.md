# Iteration Log

Evaluation-Driven Development log for the repo-sync prompt (`prompts/repo-sync.md`), evaluated by `promptfooconfig.yaml` via the Devin CLI exec provider (`devin.js`).

## Summary

| # | Change | Providers | Result |
|---|--------|-----------|--------|
| 1 | Build prompt + harness (v1 minimal prompt) | Claude Sonnet 5 | 2/4 (50%) |
| 2 | Swap provider to SWE-2 High | SWE-2 High | 2/4 (50%) |
| 3 | Add Claude Haiku 4.5 as second provider | SWE-2 High + Haiku 4.5 | 3/8 (37.5%) |
| 4 | v2 prompt: explicit actions, executable commands, no-op branch | SWE-2 High + Haiku 4.5 | 5/8 (62.5%) |
| 5 | Harness fix: sandbox provider cwd (temp dir) | SWE-2 High + Haiku 4.5 | 8/8 (100%) |
| 6 | Prompt rule: Local state is authoritative | SWE-2 High + Haiku 4.5 | 8/8 (100%) |
| 7 | Add eval.ps1 wrapper archiving runs to results/ | SWE-2 High + Haiku 4.5 | 8/8 (100%) |

## Iteration 1: Build the prompt and evaluation harness

- **Baseline:** No prompt, no eval harness.
- **Hypothesis:** A minimal prompt plus three automated criteria (Action, Commands, Safety) provides a measurable baseline for a repository-sync task with three branches: missing -> clone, stale -> pull, current -> no-op.
- **Change made:** Created:
  - `prompts/repo-sync.md` — deliberately minimal v1 prompt (states the standard folder, the repo, and the local state; asks for a plan and commands)
  - `devin.js` — exec provider wrapping `devin -p --model <model>` (provider + grader modes)
  - `promptfooconfig.yaml` — 4 scenarios (missing, stale, current, dirty tree), Safety applied via `defaultTest`
  - `assertions/action-check.js` — correct branch chosen, ambiguity/conflicting actions fail
  - `assertions/command-check.js` — correct command specifics (URL, target path, no mutations when up to date)
  - `assertions/safety-check.js` — no destructive commands; dirty tree must be acknowledged
  - `tests/*.test.js` — unit tests for the assertions
- **Measured results:**
  - Assertion unit tests: 19/19 pass (`npm test`).
  - First model eval (`npx promptfoo eval --no-cache`, Claude Sonnet 5 via devin.js): **2/4 passed (50%)**.
    - PASS: missing repo -> clone (Action 1.0, Commands 1.0, Safety 1.0).
    - PASS: stale repo -> pull (model scoped commands with `cd C:/repos/widgets`, `git fetch`, `git pull --ff...`).
    - FAIL: up-to-date repo -> no-op. The model said "nothing strictly needs to change" but then proposed verification commands anyway ("to be safe and thorough, I'd still verify freshness"), which tripped the no-mutation rule.
    - FAIL: dirty tree. The model opened with a caveat about tool execution being restricted in the session before proposing its plan — the unprompted session commentary pushed the answer off-spec.
- **Reasoning:** The v1 prompt is intentionally under-specified — it doesn't say what to do for each state, how to handle a dirty tree, or what output shape to use. The two failures show the default behaviors that emerge: (1) the model treats "verify freshness" as free extra work when the correct answer is "change nothing," and (2) it narrates session limitations instead of answering the question as posed. Both are addressable with explicit instruction in the prompt.

## Iteration 2: Swap provider to SWE-2 High

- **Baseline:** 2/4 passed (50%) on Claude Sonnet 5 — clone and pull pass; up-to-date and dirty-tree scenarios fail.
- **Hypothesis:** A different model may handle the two failing scenarios differently — either confirming the failures are prompt weaknesses (reproduced across models) or showing they're model-specific behavior.
- **Change made:** Changed the provider in `promptfooconfig.yaml` to `model: 'swe-2-high'` (label: SWE-2 High). No prompt or assertion changes.
- **Measured results:** SWE-2 High column of the combined run (`eval-d4P-2026-09-12T21:26:24`): **2/4 passed (50%)**.
  - PASS: stale repo -> pull (fast-forward plan, scoped commands); dirty tree -> pull (acknowledged uncommitted changes, proposed stash-then-pull).
  - FAIL: missing repo -> clone. The model described cloning ("this is a fresh clone, not a pull... clone the repo into it") but did not emit a literal `git clone <url> <path>` command, so Commands failed.
  - FAIL: up-to-date repo -> no-op. Same failure mode as Sonnet: "verify state first, then fetch and fast-forward pull" — proposed mutating commands despite up-to-date state.
- **Reasoning:** The no-op failure reproduces on a second model, strengthening the case that it is a prompt weakness, not a model quirk. The new clone failure suggests the prompt should require an explicit command line, not just a described plan.

## Iteration 3: Add Claude Haiku 4.5 as a second provider

- **Baseline:** Iteration 2 results on SWE-2 High (single provider): 2/4.
- **Hypothesis:** Running the same prompt against a smaller, faster model (Haiku 4.5) alongside SWE-2 High will show whether failures are prompt weaknesses (fail on both) or model-specific behavior.
- **Change made:** Added a second provider in `promptfooconfig.yaml`: `model: 'claude-haiku-4.5'` (label: Claude Haiku 4.5). No prompt or assertion changes. Eval now runs 4 tests x 2 providers = 8 outputs.
- **Measured results:** Combined run: **3/8 passed (37.5%)**, 0 errors.
  - Haiku 4.5 column: 1/4 — PASS on stale repo -> pull only. FAIL on clone (same missing `git clone` command issue as SWE-2), FAIL on no-op (proposed fetch/prune anyway), FAIL on dirty tree.
  - SWE-2 High column: 2/4 — as recorded in Iteration 2.
- **Reasoning:** Hypothesis confirmed on both axes. No-op fails on all three models tried (Sonnet 5, SWE-2 High, Haiku 4.5) — definitively a prompt weakness: the prompt never says "no action" is a valid answer or forbids extra commands. The clone failure is shared too — the prompt asks to "list the commands" but doesn't require an executable `git clone <url>` line. Dirty tree fails only on Haiku, consistent with a smaller model needing more explicit safety instruction. Next iteration should make the prompt explicit: a defined action per state, an executable command requirement, and a "change nothing" branch.

## Iteration 4: Make the v2 prompt explicit about actions, commands, and the no-op branch

- **Baseline:** 3/8 (37.5%) — clone and no-op fail on both providers; dirty tree fails on Haiku only.
- **Hypothesis:** Stating the required action for each local state, requiring executable commands (full URL and path), and explicitly making "change nothing, run no commands" the correct answer for an up-to-date repo will fix the shared clone and no-op failures. Adding "never discard local work" plus a no-session-commentary rule should fix Haiku's dirty-tree failure.
- **Change made:** Rewrote `prompts/repo-sync.md`: added a `## Task` section enumerating the three states with the required action and command form for each, and a `## Output` section requiring executable commands, forbidding commands in the up-to-date case, and banning session-limitation commentary.
- **Measured results:** `npx promptfoo eval --no-cache` (eval-iUg-2026-09-12T21:40:01): **5/8 passed (62.5%)**, 0 errors — up from 3/8.
  - SWE-2 High: **4/4** — every scenario passes with `**Action: <name>**` stated first and a correct command block (`git clone <url> <path>`, `git -C <path> pull`, stash-then-pull for the dirty tree, and a bare "already up to date; no action or commands are needed" for the no-op case).
  - Claude Haiku 4.5: **1/4** — PASS on the no-op case ("already up to date... no commands need to be run"). FAIL on clone, pull, and dirty tree — in all three it ignored the hypothetical scenario and answered about the *real* working repo: "the repository is already cloned at `C:\repos\harold-pulcher-stage3`", "currently up to date with the remote," citing a real commit hash. As an agentic CLI it inspected the actual environment rather than the described state.
- **Reasoning:** The explicit `## Task`/`## Output` structure fully resolved all four failures for SWE-2 High — hypothesis confirmed for instruction-following. Haiku's failures are a new failure class: not misreading the scenario but *substituting real environment state* for it (the devin CLI runs as an agent with tool access). The next iteration should instruct the model to treat `Local state` as authoritative and not inspect the environment — or the harness should run devin in a sandboxed cwd. If the latter is needed, that's a harness fix to note separately.

## Iteration 5: Sandbox the provider's working directory (harness fix)

- **Baseline:** 5/8 (62.5%) — Haiku fails clone/pull/dirty-tree by inspecting the real repo instead of the described scenario.
- **Hypothesis:** Spawning the devin CLI in an empty temp directory removes real-environment signal, forcing all models to answer from `Local state` alone. Should fix Haiku's three environment-substitution failures without changing the prompt.
- **Change made:** `devin.js` now creates `fs.mkdtempSync` temp dir and passes it as `cwd` to the `devin` spawn. No prompt, config, or assertion changes — this is a harness fix, not a prompt improvement.
- **Measured results:** `npx promptfoo eval --no-cache` (eval-Fod-2026-09-12T21:48:20): **8/8 passed (100%)**, 0 errors.
  - SWE-2 High: 4/4 (unchanged — still perfect).
  - Claude Haiku 4.5: **4/4**, up from 1/4. All three prior failures now answer from the described state: correct `git clone` for the missing repo, pull for the stale repo, stash-pull-restore for the dirty tree.
- **Reasoning:** Hypothesis fully confirmed — Haiku's failures were caused by real-environment access, not prompt ambiguity. Removing the real repo from its cwd eliminated the entire failure class with zero prompt changes. This is a harness/hygiene fix; it proves the eval was previously measuring "does the model inspect its environment" rather than "does it follow the scenario."

## Iteration 6: Add "Local state is authoritative" instruction (prompt fix)

- **Baseline:** 8/8 (100%) after the Iteration 5 sandbox fix.
- **Hypothesis:** An explicit prompt rule — treat `Local state` as authoritative, do not inspect the environment — makes the behavior independent of the harness sandbox, so it holds even if the provider ever runs in a directory containing a real repo. Should keep the eval at 100% and not regress anything.
- **Change made:** Added a closing rule to `## Output` in `prompts/repo-sync.md`: "Treat the `Local state` above as authoritative. Do not inspect the environment, run commands, or reason about any repository on the actual filesystem — answer from the described state only." No config or assertion changes.
- **Measured results:** `npx promptfoo eval --no-cache` (eval-kFc-2026-09-12T21:49:42): **8/8 passed (100%)**, 0 errors — no regressions on either provider.
- **Reasoning:** Hypothesis confirmed. The rule adds defense-in-depth: behavior now depends on explicit instruction, not only on the sandboxed cwd. Both layers are cheap and complementary — the sandbox guarantees clean signal, the instruction documents the contract inside the prompt artifact itself.

## Iteration 7: Archive each eval run (harness/tooling)

- **Baseline:** 8/8 (100%), but `results.html` is overwritten each run — earlier runs were unrecoverable, weakening the evidence behind the log.
- **Hypothesis:** A wrapper script that runs the eval and copies `results.html` to `results/results-<timestamp>.html` gives every iteration committed run evidence without changing eval behavior.
- **Change made:** Added `scripts/eval.ps1` (runs `npx promptfoo eval --no-cache`, archives output to `results/`, prints a log-update reminder). Updated README run instructions. No prompt, config, or assertion changes.
- **Measured results:** `.\scripts\eval.ps1` (eval-xCg-2026-09-12T22:06:09): **8/8 passed (100%)**, 0 errors — no behavioral change, as expected for a tooling-only iteration. Run archived to `results/results-20260912-170645.html`.
- **Reasoning:** Hypothesis confirmed — the wrapper is behavior-neutral and now produces committed per-run evidence. Combined with the pre-commit hook, the loop is self-enforcing: every eval run leaves an archived artifact, and every eval-input change requires a log entry.
