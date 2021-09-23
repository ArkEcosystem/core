import test from 'ava';

import { inc } from '../../';

// Not implemented as we don't use it.

// inc(v, release): Return the version incremented by the release type (major, premajor, minor, preminor, patch, prepatch, or prerelease), or null if it's not valid
//  - premajor in one call will bump the version up to the next major version and down to a prerelease of that major version. preminor, and prepatch work the same way.
//  - If called from a non-prerelease version, the prerelease will work the same as prepatch. It increments the patch version, then makes a prerelease. If the input version is already a prerelease it simply increments it.

test('inc(v, release): not implemented', t => {
  t.throws(() => inc('1.1.0', 'major'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'premajor'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'minor'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'preminor'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'patch'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'prepatch'), 'Not implemented');
  t.throws(() => inc('1.1.0', 'prerelease'), 'Not implemented');
});
