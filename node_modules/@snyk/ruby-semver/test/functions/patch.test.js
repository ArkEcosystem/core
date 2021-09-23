import test from 'ava';

import { patch } from '../../';

// patch(v): Return the patch version number.

test('patch(v)', t => {
  t.is(patch('1'), null);
  t.is(patch('1.2'), null);
  t.is(patch('1.2.3'), 3);
  t.is(patch('1.2.3.4'), 3);
  t.is(patch('1.2.3.4.5'), 3);
  t.is(patch('1.2.3-123'), 3);
  t.is(patch('1.2.3.alpha.4'), 3);
  t.is(patch('1.0.0'), 0);
});
