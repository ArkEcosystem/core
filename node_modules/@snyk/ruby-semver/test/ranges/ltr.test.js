import test from 'ava';

import { ltr } from '../../';

// Not implemented as we don't use it.

// ltr(version, range): Return true if version is less than all the versions
// possible in the range.

test('ltr(version, range): not implemented', t => {
  t.throws(() => ltr('1.1.2', '> 0.2, < 2.3'), 'Not implemented');
});
