# Config Basics

A `promptfooconfig.yaml` binds four things together: a description, prompts, providers, and tests.

## Minimal shape

```yaml
description: <what is being evaluated>

prompts:
  - "./prompts/<task>.md"      # file-based prompt; {{vars}} are substituted per test

providers:
  - id: 'exec: node ./devin.js'
    label: 'Human-readable name'
    config:
      model: 'model-name'       # passed to the exec script via its options arg

tests:
  - description: <scenario name>
    vars:
      some_var: <value>
    assert:
      - type: javascript
        value: file://./assertions/<check>.js
        metric: <MetricName>

outputPath: results.html
```

## Prompts

- Prefer `file://` / relative-path prompt files over inline strings: the prompt is the artifact under evaluation, so it must be a standalone, versioned file.
- Use `{{var}}` placeholders for anything a test scenario injects (dates, repo state, rosters, etc.).
- Keep exactly one prompt per config while iterating — evaluating prompt A vs prompt B is fine for A/B, but for EDD you want one artifact evolving across logged iterations.

## Providers

### exec: providers (no API keys needed)

`exec: <command>` runs a local command per test. promptfoo calls it as:

```
<command> <prompt> <options-json> <context-json>
```

The script must print the model's response to stdout and exit 0. Non-zero exit = eval error (not a test failure). A devin.js-style provider shells out to a CLI:

```js
const { spawnSync } = require('child_process');
const prompt = process.argv[2];
const options = process.argv[3];

let model = 'default-model';
try { model = JSON.parse(options)?.config?.model ?? model; } catch {}

const result = spawnSync('devin', ['-p', '--permission-mode', 'auto', '--model', model, '--', prompt],
  { encoding: 'utf8' });
if (result.error || result.status !== 0) {
  console.error(result.stderr || result.error?.message);
  process.exit(result.status || 1);
}
console.log(result.stdout);
```

Also handle **grader mode**: when promptfoo needs a model to grade (`llm-rubric`), it sends the prompt as a JSON chat array `[{role, content}, ...]`. Detect `JSON.parse(prompt)` producing an array with `role` fields, concatenate system+user content, and return the grading output the same way.

### Cloud providers

`openai:<model>`, `anthropic:messages:<model>`, etc. require the matching `*_API_KEY` env var. Useful for cross-model comparison; not required for a working eval.

## Tests and vars

- Each test is a *scenario*: inject the input state via `vars`, encode the expected outcome in `assert`.
- Cover every branch of the prompt's decision space: for a repo-sync prompt that means "missing -> clone", "stale -> pull", "current -> no-op", plus edge cases (dirty tree, detached HEAD, wrong remote).
- Put scenario-specific expectations in `vars` (e.g. `expected_action: clone`) so assertions read expectations from `context.vars` instead of hardcoding.

## defaultTest

`defaultTest.assert` applies to every test — use it for criteria that are universal (e.g. output format). Keep scenario-specific assertions on the individual tests.

## Useful flags

- `npx promptfoo eval --no-cache` — never trust a cached model response during iteration
- `npx promptfoo view` — interactive results browser
- `outputPath: results.html` in config — exports a shareable results file automatically
