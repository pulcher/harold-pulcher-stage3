# Assertions

## Pick distinct criteria

Each criterion should be able to fail while the others pass. A good starter trio for an action-oriented prompt:

| Criterion | Question it answers | Example failure mode it alone catches |
|-----------|--------------------|---------------------------------------|
| Decision / Action | Did it pick the right branch? (clone vs pull vs no-op) | Model pulls when repo is missing |
| Correctness of detail | Are the specifics right? (commands, paths, flags, fields) | Right action, wrong remote URL |
| Safety / Restraint | Did it avoid doing harm? (no destructive ops, respects dirty state) | Suggests `reset --hard` on a dirty tree |

Avoid "variations of the same check" — e.g. `contains "git pull"` and `icontains "GIT PULL"` are one criterion, not two.

## Deterministic JS assertions

A `type: javascript` assertion file must `module.exports` a function returning `{ pass, score, reason }` (or a boolean/number). It receives `(output, context)` where `context.vars` holds the test's vars.

```js
module.exports = (output, context) => {
  const expected = context.vars.expected_action; // e.g. 'clone' | 'pull' | 'none'
  // ...inspect output text...
  return { pass: matched, score: matched ? 1 : 0, reason: `expected ${expected}` };
};
```

Guidelines:

- Match on *intent*, not exact wording — models phrase things differently. Normalize case, strip markdown/code fences before matching.
- Fail closed: if the output is ambiguous (mentions both pull and clone with no clear decision), fail rather than guess.
- Give a `metric:` name in the config so results show per-criterion scores.

## Unit-test the assertions

Assertions are code; test them with `node --test` before ever running a model. Feed each assertion hand-written sample outputs: a clear pass, a clear fail, and an ambiguous case. This separates "harness bugs" from "prompt bugs" in the iteration log.

## Model-graded checks (`llm-rubric`)

```yaml
- type: llm-rubric
  value: <grading instruction, e.g. "pass if the output proposes no destructive commands">
```

- Use for genuinely judgment-based criteria (clarity, completeness of reasoning) that resist string matching.
- Requires a grading provider — the `exec:` devin provider handles this via grader mode, or use a cloud provider.
- Prefer deterministic checks where possible: they're free, fast, reproducible, and their logic can be unit-tested.

## Thresholds

- Score assertions 1.0 / 0.0 (binary) unless partial credit is meaningful — binary scores make the iteration log's "measured results" unambiguous.
- A well-formed eval should reach ~100% when the prompt performs well; if a criterion can never fully pass, the criterion is wrong, not the prompt.
