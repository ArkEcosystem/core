import test from 'ava';

import { gte } from '../../';

test('gte(v1, v2): v1 >= v2', t => {
  t.truthy(gte('2', '1'));
  t.truthy(gte('5.4', '5.3'));
  t.truthy(gte('5.0.1', '5.0.0'));
  t.truthy(gte('5.0.1.52', '5.0.1.34'));
  t.truthy(gte('5.0.1.52.200', '5.0.1.52.176'));
  t.truthy(gte('5.0.1-beta.3', '5.0.1-beta.1'));
  t.truthy(gte('5.0.1-beta', '5.0.1-alpha'));
  t.truthy(gte('5.0.1', '5.0.1.beta'));

  t.truthy(gte('2', '2'));
  t.truthy(gte('5.4', '5.4'));
  t.truthy(gte('5.0.1', '5.0.1'));
  t.truthy(gte('5.0.1.52', '5.0.1.52'));
  t.truthy(gte('5.0.1.52.200', '5.0.1.52.200'));
  t.truthy(gte('5.0.1-beta.3', '5.0.1-beta.3'));
  t.truthy(gte('5.0.1-beta', '5.0.1-beta'));

  t.falsy(gte('1', '2'));
  t.falsy(gte('5.3', '5.4'));
  t.falsy(gte('5.0.0', '5.0.1'));
  t.falsy(gte('5.0.1.34', '5.0.1.52'));
  t.falsy(gte('5.0.1.52.176', '5.0.1.52.200'));
  t.falsy(gte('5.0.1-beta.1', '5.0.1-beta.3'));
  t.falsy(gte('5.0.1-alpha', '5.0.1-beta'));
  t.falsy(gte('5.0.1.beta', '5.0.1'));
});
