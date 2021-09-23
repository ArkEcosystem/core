import test from 'ava';

import { outside } from '../../';

// Not implemented as we don't use it.

// outside(version, range, hilo): Return true if the version is outside the
// bounds of the range in either the high or low direction. The hilo argument
// must be either the string '>' or '<'.

test('ltr(version, range): not implemented', t => {
  t.throws(() => outside('1.1.2', '> 0.2, < 2.3', '>'), 'Not implemented');
  t.throws(() => outside('1.1.2', '> 0.2, < 2.3', '<'), 'Not implemented');
});
