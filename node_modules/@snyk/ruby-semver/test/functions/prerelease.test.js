import test from 'ava';

import { prerelease } from '../../';

// prerelease(v): Returns an array of prerelease components, or null if none
// exist. Example: prerelease('1.2.3-alpha.1') -> ['alpha', 1]

test('prerelease(v)', t => {
  t.deepEqual(prerelease('1.2.3.alpha.1'), ['alpha', 1]);
  t.deepEqual(prerelease('1.2.3.alpha.1.2'), ['alpha', 1, 2]);
  t.deepEqual(prerelease('1.2.3-1'), ['pre', 1]);
  t.deepEqual(prerelease('1.2.3-1.2'), ['pre', 1, 2]);

  t.is(prerelease('1'), null);
  t.is(prerelease('1.2'), null);
  t.is(prerelease('1.2.3'), null);
  t.is(prerelease('1.2.3.4'), null);
  t.is(prerelease('1.2.3.4.5'), null);

  t.is(prerelease('nonsense'), null);
  t.is(prerelease(''), null);
  t.is(prerelease(), null);
  t.is(prerelease(null), null);
});
