import test from 'ava';

import { compare } from '../../';

// compare(v1, v2): Return 0 if v1 == v2, or 1 if v1 is greater, or -1 if v2 is
// greater. Sorts in ascending order if passed to Array.sort().

test('compare(v1, v2): 0 if v1 == v2', t => {
  t.is(compare('1', '1'), 0);
  t.is(compare('1.1', '1.1'), 0);
  t.is(compare('1.1.0', '1.1.0'), 0);
  t.is(compare('1.1.0.1', '1.1.0.1'), 0);
  t.is(compare('1.1.0.1-alpha', '1.1.0.1-alpha'), 0);
  t.is(compare('1.1.0.1-alpha.2', '1.1.0.1-alpha.2'), 0);
});

test('compare(v1, v2): 1 if v1 > v2', t => {
  t.is(compare('2', '1'), 1);
  t.is(compare('1.2', '1.1'), 1);
  t.is(compare('1.1.1', '1.1.0'), 1);
  t.is(compare('1.1.0.2', '1.1.0.1'), 1);
  t.is(compare('1.1.0.1-beta', '1.1.0.1-alpha'), 1);
  t.is(compare('1.1.0.1-alpha.3', '1.1.0.1-alpha.2'), 1);
});

test('compare(v1, v2): -1 if v1 < v2', t => {
  t.is(compare('1', '2'), -1);
  t.is(compare('1.1', '1.2'), -1);
  t.is(compare('1.1.0', '1.1.1'), -1);
  t.is(compare('1.1.0.1', '1.1.0.2'), -1);
  t.is(compare('1.1.0.1-alpha', '1.1.0.1-beta'), -1);
  t.is(compare('1.1.0.1-alpha.2', '1.1.0.1-alpha.3'), -1);
});
