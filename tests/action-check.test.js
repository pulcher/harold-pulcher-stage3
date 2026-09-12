const { test } = require('node:test');
const assert = require('node:assert');
const check = require('../assertions/action-check.js');

const ctx = (action) => ({ vars: { expected_action: action } });

test('clone: passes when output proposes git clone', () => {
  const r = check('Run `git clone https://x/y.git repos/y`', ctx('clone'));
  assert.strictEqual(r.pass, true);
});

test('clone: fails when output proposes pull instead', () => {
  const r = check('Run `git pull` in the existing directory', ctx('clone'));
  assert.strictEqual(r.pass, false);
});

test('pull: passes on a scoped pull', () => {
  const r = check('The repo exists, run `git -C repos/y pull`', ctx('pull'));
  assert.strictEqual(r.pass, true);
});

test('pull: fails when it clones instead', () => {
  const r = check('I would `git clone` it fresh', ctx('pull'));
  assert.strictEqual(r.pass, false);
});

test('none: passes on up-to-date with no action', () => {
  const r = check('The repo is up to date. No changes needed.', ctx('none'));
  assert.strictEqual(r.pass, true);
});

test('none: fails when a pull is proposed anyway', () => {
  const r = check('It looks up to date but I would run `git pull` to be safe', ctx('none'));
  assert.strictEqual(r.pass, false);
});

test('clone: fails on ambiguous output proposing both', () => {
  const r = check('Either `git clone` it or `git pull` in the existing copy', ctx('clone'));
  assert.strictEqual(r.pass, false);
});
