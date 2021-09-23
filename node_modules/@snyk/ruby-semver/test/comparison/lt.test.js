import test from 'ava';

import { lt } from '../../';

test('lt(v1, v2): v1 < v2', t => {
  t.truthy(lt('1', '2'));
  t.truthy(lt('5.3', '5.4'));
  t.truthy(lt('5.0.0', '5.0.1'));
  t.truthy(lt('5.0.1.34', '5.0.1.52'));
  t.truthy(lt('5.0.1.52.176', '5.0.1.52.200'));
  t.truthy(lt('5.0.1-beta.1', '5.0.1-beta.3'));
  t.truthy(lt('5.0.1-alpha', '5.0.1-beta'));
  t.truthy(lt('5.0.1.beta', '5.0.1'));

  t.falsy(lt('2', '2'));
  t.falsy(lt('5.4', '5.4'));
  t.falsy(lt('5.0.1', '5.0.1'));
  t.falsy(lt('5.0.1.52', '5.0.1.52'));
  t.falsy(lt('5.0.1.52.200', '5.0.1.52.200'));
  t.falsy(lt('5.0.1-beta.3', '5.0.1-beta.3'));
  t.falsy(lt('5.0.1-beta', '5.0.1-beta'));

  t.falsy(lt('2', '1'));
  t.falsy(lt('5.4', '5.3'));
  t.falsy(lt('5.0.1', '5.0.0'));
  t.falsy(lt('5.0.1.52', '5.0.1.34'));
  t.falsy(lt('5.0.1.52.200', '5.0.1.52.176'));
  t.falsy(lt('5.0.1-beta.3', '5.0.1-beta.1'));
  t.falsy(lt('5.0.1-beta', '5.0.1-alpha'));
  t.falsy(lt('5.0.1', '5.0.1.beta'));
});
