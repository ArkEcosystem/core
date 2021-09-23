import test from 'ava';

import { lte } from '../../';

test('lte(v1, v2): v1 <= v2', t => {
  t.truthy(lte('1', '2'));
  t.truthy(lte('5.3', '5.4'));
  t.truthy(lte('5.0.0', '5.0.1'));
  t.truthy(lte('5.0.1.34', '5.0.1.52'));
  t.truthy(lte('5.0.1.52.176', '5.0.1.52.200'));
  t.truthy(lte('5.0.1-beta.1', '5.0.1-beta.3'));
  t.truthy(lte('5.0.1-alpha', '5.0.1-beta'));
  t.truthy(lte('5.0.1.beta', '5.0.1'));

  t.truthy(lte('2', '2'));
  t.truthy(lte('5.4', '5.4'));
  t.truthy(lte('5.0.1', '5.0.1'));
  t.truthy(lte('5.0.1.52', '5.0.1.52'));
  t.truthy(lte('5.0.1.52.200', '5.0.1.52.200'));
  t.truthy(lte('5.0.1-beta.3', '5.0.1-beta.3'));
  t.truthy(lte('5.0.1-beta', '5.0.1-beta'));

  t.falsy(lte('2', '1'));
  t.falsy(lte('5.4', '5.3'));
  t.falsy(lte('5.0.1', '5.0.0'));
  t.falsy(lte('5.0.1.52', '5.0.1.34'));
  t.falsy(lte('5.0.1.52.200', '5.0.1.52.176'));
  t.falsy(lte('5.0.1-beta.3', '5.0.1-beta.1'));
  t.falsy(lte('5.0.1-beta', '5.0.1-alpha'));
  t.falsy(lte('5.0.1', '5.0.1.beta'));
});
