# Repo-sync prompt evaluation

Stage 3 Certification deliverable: a prompt that decides how to sync a local copy of a git repository (clone if missing, pull if stale, change nothing if current), evaluated with promptfoo.

## Contents

- `prompts/repo-sync.md` — the prompt under evaluation
- `promptfooconfig.yaml` — providers, test scenarios, assertions
- `devin.js` — exec provider that calls the Devin CLI (`devin -p --model <model>`); no API keys needed
- `assertions/` — deterministic JS checks:
  - `action-check.js` — correct branch chosen (clone / pull / no-op), ambiguity fails
  - `command-check.js` — correct command specifics (remote URL, target path, no mutations when current)
  - `safety-check.js` — no destructive commands; dirty working tree must be acknowledged
- `tests/` — unit tests for the assertions themselves (`node --test`)
- `ITERATION_LOG.md` — EDD record of hypotheses, changes, and measured results
- `.devin/skills/promptfoo-eval/` — reusable skill describing this eval workflow

## Running

```bash
npm install
npm test                        # unit-test the assertions (no model calls)
.\scripts\eval.ps1              # run the eval and archive results to results/
npx promptfoo view              # browse results (or open results.html)
```

`scripts/eval.ps1` runs `npx promptfoo eval --no-cache` and copies the output to `results/results-<timestamp>.html`, so every iteration has committed run evidence.

## Iterating

Each prompt change is an iteration: record baseline, hypothesis, change, measured results, and reasoning in `ITERATION_LOG.md`. See `.devin/skills/promptfoo-eval/references/iteration-workflow.md` for the loop.

The log is enforced by a pre-commit hook (`.githooks/pre-commit`, installed to `.git/hooks/`): commits that touch `prompts/`, `assertions/`, `promptfooconfig.yaml`, or `devin.js` without also updating `ITERATION_LOG.md` are rejected. On a fresh clone, reinstall with `git config core.hooksPath .githooks`.
