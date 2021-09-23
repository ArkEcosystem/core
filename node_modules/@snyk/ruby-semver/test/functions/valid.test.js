import test from 'ava';

import { valid } from '../../';

// valid(v): Return the parsed version, or null if it's not valid.

test('valid(v)', t => {
  t.is(valid('1'), '1');
  t.is(valid('1.1'), '1.1');
  t.is(valid('1.1.2'), '1.1.2');
  t.is(valid('1.1.2.3'), '1.1.2.3');
  t.is(valid('1.1.2-4'), '1.1.2.pre.4');
  t.is(valid('1.1.2.pre.4'), '1.1.2.pre.4');

  t.is(valid('nonsense'), null);
  t.is(valid(''), null);
  t.is(valid(null), null);
  t.is(valid(), null);
});
