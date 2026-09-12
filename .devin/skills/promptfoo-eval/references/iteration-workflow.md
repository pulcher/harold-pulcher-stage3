# Iteration Workflow (EDD)

Treat prompt improvement like test-driven development: red -> green -> refactor, with every change tied to a measured result.

## The loop

1. **Baseline** — run `npx promptfoo eval --no-cache`; record pass rate and per-metric scores.
2. **Hypothesis** — pick *one* failure; state what change you expect to fix it and why.
3. **Change** — modify the prompt (or config/assertions if the check itself is broken). One logical change per iteration.
4. **Measure** — rerun eval; compare against baseline.
5. **Log** — append the iteration to `ITERATION_LOG.md`, including unexpected regressions.
6. Repeat. Each iteration should attack the current dominant failure mode.

## Rules of thumb

- **The log is part of the change.** An iteration is not complete until `ITERATION_LOG.md` has the entry. Any edit to the prompt, config, providers, or assertions without a log update is an unfinished iteration. A pre-commit hook should enforce this: eval inputs and the log must be staged together.
- **One change at a time.** If two things change and the score moves, you don't know why.
- **Fix the harness before the prompt.** Provider errors (non-zero exits, CLI timeouts) are not test failures — resolve them first and note them separately in the log.
- **Regressions count.** A fix that passes test X but breaks test Y is not an improvement; log it and rethink.
- **Prefer the last-read position.** When adding a behavioral rule, placing it in a dedicated terminal section (e.g. `## Output`) near the end of the prompt tends to beat a top-of-file callout — models treat it as "final instructions."
- **Don't over-fit to one provider.** If a rule only works on the strongest model, note which models still fail and target them next iteration.

## Iteration log format

```markdown
## Iteration N: <short title>

- **Baseline:** <scores/pass rate from previous iteration>
- **Hypothesis:** <what change should do, and why>
- **Change made:** <files touched, what changed>
- **Measured results:** <pass rate, per-metric/per-test outcomes, which providers>
- **Reasoning:** <was the hypothesis confirmed? what does the remaining failure suggest next?>
```

## Graduating the eval

Once text-based assertions are stable, strengthen the harness instead of the prompt:

- Move from "did it say the right command" to real side effects: local bare-repo fixtures + post-run filesystem checks.
- Add providers to check generalization across models.
- Each harness upgrade is itself an iteration — log it the same way.
