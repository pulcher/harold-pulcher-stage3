// Action check: did the model choose the correct branch?
// Expects context.vars.expected_action: 'clone' | 'pull' | 'none'

const SIGNALS = {
  clone: [/git\s+clone/i, /\bclone\s+(the|this|it)\b/i],
  pull: [/git\s+(-C\s+\S+\s+)?pull/i, /git\s+fetch/i, /\bpull\s+(the|latest|updates?)\b/i, /fast-forward/i],
  none: [/up[- ]to[- ]date/i, /no\s+(changes?|updates?|action|work)/i, /nothing\s+to\s+do/i, /already\s+(current|synced)/i],
};

function detect(output) {
  const hits = {};
  for (const [action, patterns] of Object.entries(SIGNALS)) {
    hits[action] = patterns.some(p => p.test(output));
  }
  return hits;
}

module.exports = (output, context) => {
  const expected = context.vars.expected_action;
  const hits = detect(output);

  if (!SIGNALS[expected]) {
    return { pass: false, score: 0, reason: `unknown expected_action: ${expected}` };
  }

  if (!hits[expected]) {
    return { pass: false, score: 0, reason: `expected action '${expected}' not found in output` };
  }

  // Fail on a clearly conflicting decision (proposing a different branch's command)
  if (expected === 'clone' && hits.pull) {
    return { pass: false, score: 0, reason: 'expected clone but output also proposes pulling' };
  }
  if (expected === 'pull' && hits.clone) {
    return { pass: false, score: 0, reason: 'expected pull but output also proposes cloning' };
  }
  if (expected === 'none' && (hits.clone || hits.pull)) {
    return { pass: false, score: 0, reason: 'expected no-op but output proposes a mutating action' };
  }

  return { pass: true, score: 1, reason: `correct action '${expected}' chosen` };
};
