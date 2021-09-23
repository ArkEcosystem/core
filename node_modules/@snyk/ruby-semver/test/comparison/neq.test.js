import test from 'ava';

import { neq } from '../../';

test('neq(v1, v2): v1 != v2', t => {
  t.truthy(neq('2', '1'));
  t.truthy(neq('5.4', '5.3'));
  t.truthy(neq('5.0.1', '5.0.0'));
  t.truthy(neq('5.0.1.52', '5.0.1.34'));
  t.truthy(neq('5.0.1.52.200', '5.0.1.52.176'));
  t.truthy(neq('5.0.1-beta.3', '5.0.1-beta.1'));
  t.truthy(neq('5.0.1-beta', '5.0.1-alpha'));

  t.falsy(neq('2', '2'));
  t.falsy(neq('2', '2.0'));
  t.falsy(neq('5.4', '5.4'));
  t.falsy(neq('5.4', '5.4.0'));
  t.falsy(neq('5.0.1', '5.0.1'));
  t.falsy(neq('5.0.1', '5.0.1.0'));
  t.falsy(neq('5.0.1.52', '5.0.1.52'));
  t.falsy(neq('5.0.1.52.200', '5.0.1.52.200'));
  t.falsy(neq('5.0.1-beta.3', '5.0.1-beta.3'));
  t.falsy(neq('5.0.1-beta', '5.0.1-beta'));
});
