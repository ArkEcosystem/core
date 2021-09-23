import test from 'ava';

import { major } from '../../';

// major(v): Return the major version number.

test('major(v)', t => {
  t.is(major('1'), 1);
  t.is(major('1.2'), 1);
  t.is(major('1.2.3'), 1);
  t.is(major('1.2.3.4'), 1);
  t.is(major('1.2.3.4.5'), 1);
  t.is(major('1.2.3-123'), 1);
  t.is(major('1.2.3.alpha.4'), 1);
  t.is(major('0.0.1'), 0);
});
