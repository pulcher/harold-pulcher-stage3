---
name: promptfoo-eval
description: Scaffold and iterate on promptfoo evaluations for prompts. Use when creating a promptfooconfig.yaml, writing prompt files, defining assertions, or running an evaluation-driven prompt improvement loop.
---

# Promptfoo Eval Skill

Use this skill when the task involves evaluating or improving a prompt with promptfoo: scaffolding a `promptfooconfig.yaml`, writing test scenarios, defining assertions, or iterating on a prompt based on measured results.

## When to Run

- Setting up a new promptfoo eval in a repository
- Writing or refactoring the prompt under evaluation
- Choosing and implementing pass/fail criteria (assertions)
- Running `promptfoo eval` and interpreting results
- Practicing Evaluation-Driven Development (EDD): baseline -> hypothesis -> change -> measure -> log

## Mental Model

```
prompts x providers x tests  =  matrix of outputs
              |
              v
       assertions score each output
              |
              v
   iteration log records cause and effect
```

- **Prompt under test**: keep it in its own file (e.g. `prompts/<task>.md`) so every change is diff-able and each version can be tied to a measured result.
- **Providers**: how the prompt is executed. `exec:` providers let promptfoo call local CLIs (e.g. `devin`) without API keys.
- **Tests**: scenario inputs (`vars`) plus the assertions that define correct behavior for that scenario.
- **Assertions**: at least 3 *distinct* criteria measuring different dimensions (e.g. decision correctness, command correctness, safety) — not three phrasings of the same check.

## Reference Map

Read the file that matches the current task; read all three when scaffolding a new eval from scratch.

| File | Covers |
|------|--------|
| `references/config-basics.md` | `promptfooconfig.yaml` anatomy: prompts, providers (incl. `exec:` CLI providers), tests, vars, defaultTest |
| `references/assertions.md` | Picking distinct criteria, deterministic JS file assertions vs `llm-rubric`, unit-testing assertions |
| `references/iteration-workflow.md` | The EDD loop, how to run evals, and the iteration log format |

## Quick Decision Guide

- **New eval?** Read `references/config-basics.md`, then `references/assertions.md`.
- **Baseline already exists?** Read `references/iteration-workflow.md` before changing the prompt.
- **Which assertions?** Pick criteria that would each fail independently — see `references/assertions.md`.
- **Eval errors, not failures?** Check provider wiring first (the exec script, CLI flags, quoting) before touching the prompt.
