import test from 'ava';

import { minor } from '../../';

// minor(v): Return the minor version number.

test('minor(v)', t => {
  t.is(minor('1'), null);
  t.is(minor('1.2'), 2);
  t.is(minor('1.2.3'), 2);
  t.is(minor('1.2.3.4'), 2);
  t.is(minor('1.2.3.4.5'), 2);
  t.is(minor('1.2.3-123'), 2);
  t.is(minor('1.2.3.alpha.4'), 2);
  t.is(minor('1.0'), 0);
  t.is(minor('1.0.0'), 0);
});
