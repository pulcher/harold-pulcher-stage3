#!/usr/bin/env node
// Devin CLI provider for promptfoo.
//
// promptfoo calls this script as:
//   node devin.js <prompt> <options-json> <context-json>
//
// Two modes, auto-detected from the prompt argument:
// - Provider mode: plain-text prompt -> run devin single-turn and print the response
// - Grader mode: prompt is a JSON chat array [{role, content}, ...] (sent by
//   llm-rubric) -> concatenate messages into a single prompt
//
// The model is taken from options.config.model, falling back to a default.

const { spawnSync } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const DEFAULT_MODEL = 'claude-sonnet-5';
const prompt = process.argv[2];
const options = process.argv[3];

function resolveModel() {
  try {
    return JSON.parse(options)?.config?.model || DEFAULT_MODEL;
  } catch {
    return DEFAULT_MODEL;
  }
}

function resolveText(rawPrompt) {
  try {
    const messages = JSON.parse(rawPrompt);
    if (Array.isArray(messages) && messages.length > 0 && messages[0].role) {
      return messages.map(m => m.content).join('\n\n');
    }
  } catch {
    // plain text prompt
  }
  return rawPrompt;
}

// Run in an empty temp dir so the agent has no real repo to inspect —
// the scenario's Local state must be authoritative.
const workDir = fs.mkdtempSync(path.join(os.tmpdir(), 'promptfoo-devin-'));

const result = spawnSync(
  'devin',
  ['-p', '--permission-mode', 'auto', '--model', resolveModel(), '--', resolveText(prompt)],
  { encoding: 'utf8', cwd: workDir }
);

if (result.error) {
  console.error(result.error.message);
  process.exit(1);
}
if (result.status !== 0) {
  console.error(result.stderr || result.stdout);
  process.exit(result.status || 1);
}
console.log(result.stdout);
