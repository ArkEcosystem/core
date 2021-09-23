import test from 'ava';

import { cmp } from '../../';

// cmp(v1, comparator, v2): Pass in a comparison string, and it'll call the
// corresponding function above. "===" and "!==" do simple string comparison,
// but are included for completeness.
// Throws if an invalid comparison string is provided.

test('cmp(v1, ">", v2)', t => {
  t.truthy(cmp('2', '>', '1'));
  t.falsy(cmp('2', '>', '2'));
  t.falsy(cmp('1', '>', '2'));
});

test('cmp(v1, ">=", v2)', t => {
  t.truthy(cmp('2', '>=', '1'));
  t.truthy(cmp('2', '>=', '2'));
  t.falsy(cmp('1', '>=', '2'));
});

test('cmp(v1, "<", v2)', t => {
  t.truthy(cmp('1', '<', '2'));
  t.falsy(cmp('2', '<', '2'));
  t.falsy(cmp('2', '<', '1'));
});

test('cmp(v1, "<=", v2)', t => {
  t.truthy(cmp('1', '<=', '2'));
  t.truthy(cmp('2', '<=', '2'));
  t.falsy(cmp('2', '<=', '1'));
});

test('cmp(v1, "==", v2)', t => {
  t.truthy(cmp('2', '==', '2'));
  t.truthy(cmp('2', '==', '2.0'));
  t.falsy(cmp('2', '==', '1'));
});

test('cmp(v1, "!=", v2)', t => {
  t.truthy(cmp('2', '!=', '1'));
  t.falsy(cmp('2', '!=', '2'));
  t.falsy(cmp('2', '!=', '2.0'));
});

test('cmp(v1, "===", v2)', t => {
  t.truthy(cmp('2', '===', '2'));
  t.falsy(cmp('2', '===', '1'));
  t.falsy(cmp('2', '===', '2.0'));
});

test('cmp(v1, "!==", v2)', t => {
  t.falsy(cmp('2', '!==', '2'));
  t.truthy(cmp('2', '!==', '2.0'));
  t.truthy(cmp('2', '!==', '1'));
});

test('cmp(v1, "nonsense", v2)', t => {
  t.throws(() => cmp('2', 'nonsense', '2'), 'Invalid comparator: nonsense');
  t.throws(() => cmp('2', '!====', '2'), 'Invalid comparator: !====');
  t.throws(() => cmp('2', '>broken', '2'), 'Invalid comparator: >broken');
});
