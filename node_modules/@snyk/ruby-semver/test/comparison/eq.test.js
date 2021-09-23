import test from 'ava';

import { eq } from '../../';

test('eq(v1, v2): v1 == v2', t => {
  t.truthy(eq('2', '2'));
  t.truthy(eq('2', '2.0'));
  t.truthy(eq('5.4', '5.4'));
  t.truthy(eq('5.4', '5.4.0'));
  t.truthy(eq('5.0.1', '5.0.1'));
  t.truthy(eq('5.0.1', '5.0.1.0'));
  t.truthy(eq('5.0.1.52', '5.0.1.52'));
  t.truthy(eq('5.0.1.52.200', '5.0.1.52.200'));
  t.truthy(eq('5.0.1-beta.3', '5.0.1-beta.3'));
  t.truthy(eq('5.0.1-beta', '5.0.1-beta'));

  t.falsy(eq('2', '1'));
  t.falsy(eq('5.4', '5.3'));
  t.falsy(eq('5.0.1', '5.0.0'));
  t.falsy(eq('5.0.1.52', '5.0.1.34'));
  t.falsy(eq('5.0.1.52.200', '5.0.1.52.176'));
  t.falsy(eq('5.0.1-beta.3', '5.0.1-beta.1'));
  t.falsy(eq('5.0.1-beta', '5.0.1-alpha'));
});
