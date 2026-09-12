const { test } = require('node:test');
const assert = require('node:assert');
const check = require('../assertions/command-check.js');

const base = {
  repo_url: 'https://github.com/acme/widgets.git',
  repo_dir: 'C:/repos',
  repo_name: 'widgets',
};
const ctx = (action, extra = {}) => ({ vars: { ...base, expected_action: action, ...extra } });

test('clone: passes with url and target', () => {
  const r = check('Run: `git clone https://github.com/acme/widgets.git C:/repos/widgets`', ctx('clone'));
  assert.strictEqual(r.pass, true);
});

test('clone: fails without the remote url', () => {
  const r = check('Run: `git clone <remote> C:/repos/widgets`', ctx('clone'));
  assert.strictEqual(r.pass, false);
});

test('pull: passes with git -C', () => {
  const r = check('Run: `git -C C:/repos/widgets pull`', ctx('pull'));
  assert.strictEqual(r.pass, true);
});

test('pull: passes with cd into repo then pull', () => {
  const r = check('cd C:/repos/widgets\ngit pull', ctx('pull'));
  assert.strictEqual(r.pass, true);
});

test('pull: fails on bare pull with no path', () => {
  const r = check('Just run `git pull`', ctx('pull'));
  assert.strictEqual(r.pass, false);
});

test('none: passes with no commands', () => {
  const r = check('Already up to date. No action needed.', ctx('none'));
  assert.strictEqual(r.pass, true);
});

test('none: fails if a fetch is proposed', () => {
  const r = check('Up to date, but run `git fetch` anyway', ctx('none'));
  assert.strictEqual(r.pass, false);
});
