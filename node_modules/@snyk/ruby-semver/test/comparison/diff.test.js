import test from 'ava';

const semver = require('../../');
const diff = semver.diff;

// Not implemented as we don't use it.

// diff(v1, v2): Returns difference between two versions by the release type
// (major, premajor, minor, preminor, patch, prepatch, or prerelease), or null
// if the versions are the same.

test('diff(v1, v2): same versions', t => {
  t.is(diff('1', '1'), null);
  t.is(diff('1.1', '1.1'), null);
  t.is(diff('1.1.2', '1.1.2'), null);
  t.is(diff('1.1.1.1', '1.1.1.1'), null);
  t.is(diff('1.0.0.alpha.1', '1.0.0.alpha.1'), null);
  t.is(diff('1.1.2-1', '1.1.2.pre.1'), null);
  t.is(diff('1.1.2.pre.1', '1.1.2-1'), null);
  t.is(diff('2', '2.0'), null);
  t.is(diff('2.0', '2'), null);
  t.is(diff('2', '2.0.0'), null);
  t.is(diff('2.0.0', '2'), null);
  t.is(diff('2', '2.0.0.0'), null);
  t.is(diff('2.0.0.0', '2'), null);
});

test('diff(v1, v2): major versions', t => {
  t.is(diff('1', '3'), 'major');
  t.is(diff('1.1', '3.1'), 'major');
  t.is(diff('1.1.2', '3.0.0'), 'major');
  t.is(diff('1.1.2', '2.0.0'), 'major');
  t.is(diff('1.1.1.1', '2.0.0'), 'major');
});

test('diff(v1, v2): minor versions', t => {
  t.is(diff('1.1', '1.2'), 'minor');
  t.is(diff('1.1.2', '1.2.1.1'), 'minor');
  t.is(diff('1.1.2', '1.2.0'), 'minor');
  t.is(diff('1.1.2.1', '1.2.0'), 'minor');
  t.is(diff('1.1.2.1', '1.2.0.1'), 'minor');
});

test('diff(v1, v2): patch versions', t => {
  t.is(diff('1.1.2', '1.1.3'), 'patch');
  t.is(diff('1.1.2', '1.1.2.1'), 'patch');
  t.is(diff('1.1.2.1', '1.1.3'), 'patch');
  t.is(diff('1.1.2.1', '1.1.3.2.1'), 'patch');
  t.is(diff('1.1.2.1', '1.1.2.1.1.1.2'), 'patch');
  t.is(diff('1.1.2.1.1.1.1', '1.1.2.1.1.1.2'), 'patch');
});

test('diff(v1, v2): premajor versions', t => {
  t.is(diff('1.0.0.alpha.1', '2.0.0'), 'premajor');
});

test('diff(v1, v2): preminor versions', t => {
  t.is(diff('1.1.2.alpha.1', '1.2.0'), 'preminor');
});

test('diff(v1, v2): prepatch versions', t => {
  t.is(diff('1.1.2.alpha.1', '1.1.3'), 'prepatch');
  t.is(diff('1.1.2.3.alpha.1', '1.1.2.alpha.2'), 'prepatch');
  t.is(diff('1.1.2.3.alpha.1', '1.1.2.4.alpha.2'), 'prepatch');
  t.is(diff('1.1.2.alpha.1', '1.1.2.1'), 'prepatch');
});

test('diff(v1, v2): prerelease versions', t => {
  t.is(diff('1.1.2.alpha.1', '1.1.2.alpha.2'), 'prerelease');
  t.is(diff('1.1.2.3.alpha.1', '1.1.2.3.alpha.2'), 'prerelease');
  t.is(diff('1.alpha.1', '1'), 'prerelease');
});
