# Iteration Log

Evaluation-Driven Development log for the repo-sync prompt (`prompts/repo-sync.md`), evaluated by `promptfooconfig.yaml` via the Devin CLI exec provider (`devin.js`).

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
