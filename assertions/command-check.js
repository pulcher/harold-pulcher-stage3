// Command check: are the proposed commands technically correct?
// Uses context.vars: expected_action, repo_url, repo_dir, repo_name

module.exports = (output, context) => {
  const { expected_action, repo_url, repo_dir, repo_name } = context.vars;
  const target = `${repo_dir}/${repo_name}`;
  const normalized = output.replace(/\r\n/g, '\n');

  if (expected_action === 'clone') {
    if (!/git\s+clone/i.test(normalized)) {
      return { pass: false, score: 0, reason: 'no `git clone` command proposed' };
    }
    if (!normalized.includes(repo_url)) {
      return { pass: false, score: 0, reason: `clone command missing remote URL ${repo_url}` };
    }
    if (!normalized.includes(repo_name)) {
      return { pass: false, score: 0, reason: `clone target missing repo name ${repo_name}` };
    }
    return { pass: true, score: 1, reason: 'correct clone command with remote and target path' };
  }

  if (expected_action === 'pull') {
    if (!/git\s+(-C\s+\S+\s+)?pull/i.test(normalized)) {
      return { pass: false, score: 0, reason: 'no `git pull` command proposed' };
    }
    // Must target the existing repo: `git -C <path> pull` or `cd <path>` before pulling
    const scopedPull = new RegExp(`git\\s+-C\\s+["']?${escapeRe(target)}["']?\\s+pull`, 'i').test(normalized);
    const cdInto = new RegExp(`cd\\s+["']?${escapeRe(target)}`, 'i').test(normalized);
    const mentionsPath = normalized.includes(target) || normalized.includes(repo_name);
    if (!(scopedPull || cdInto || mentionsPath)) {
      return { pass: false, score: 0, reason: `pull not scoped to existing repo at ${target}` };
    }
    return { pass: true, score: 1, reason: 'correct pull command targeting the existing repo' };
  }

  if (expected_action === 'none') {
    // Up-to-date repo: no mutating git commands should be proposed
    const mutating = /git\s+(clone|pull|fetch|merge|rebase|checkout|reset|clean)\b/i.test(normalized);
    if (mutating) {
      return { pass: false, score: 0, reason: 'mutating git command proposed for an up-to-date repo' };
    }
    return { pass: true, score: 1, reason: 'no commands proposed, as expected' };
  }

  return { pass: false, score: 0, reason: `unknown expected_action: ${expected_action}` };
};

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\\/]/g, '\\$&');
}
