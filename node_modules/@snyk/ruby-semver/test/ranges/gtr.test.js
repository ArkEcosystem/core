import test from 'ava';

import { gtr } from '../../';

// Not implemented as we don't use it.

// gtr(version, range): Return true if version is greater than all the versions
// possible in the range.

test('gtr(version, range): not implemented', t => {
  t.throws(() => gtr('1.1.2', '> 0.2, < 2.3'), 'Not implemented');
});
