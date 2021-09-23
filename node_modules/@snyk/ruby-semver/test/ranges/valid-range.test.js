import test from 'ava';

import { validRange } from '../../';

// validRange(range): Return the valid range or null if it's not valid

test('validRange(range)', t => {
  t.is(validRange('1.1'), '= 1.1');
  t.is(validRange('~> 1.1'), '< 2, >= 1.1');
  t.is(validRange('~> 1.1.0'), '< 1.2, >= 1.1.0');
  t.is(validRange('~> 1.1.1.0'), '< 1.1.2, >= 1.1.1.0');
  t.is(validRange('~> 1.1.1.beta.1'), '< 1.2, >= 1.1.1.beta.1');
  t.is(validRange('> 2.1, < 2.4'), '< 2.4, > 2.1');

  t.is(validRange(''), '>= 0');
  t.is(validRange(), null);
  t.is(validRange('nonsense'), null);
});
