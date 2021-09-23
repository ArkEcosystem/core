import test from 'ava';

import { satisfies } from '../../';

// satisfies(version, range): Return true if the version satisfies the range.

test('satisfies(version, range)', t => {
  t.true(satisfies('1.1', '>= 1.1'));
  t.true(satisfies('1.1.5', '~> 1.1.2'));
  t.true(satisfies('1.1.5', '1.1.5'));
  t.true(satisfies('1.4.11', '>= 1.3, < 1.5'));

  t.false(satisfies('1.0', '>= 1.1'));
  t.false(satisfies('1.2.5', '~> 1.1.2'));
  t.false(satisfies('1.2.5', '1.1.2'));
  t.false(satisfies('1.5.2', '>= 1.3, < 1.5'));

  t.false(satisfies('1.2.1', 'nonsense'));
});
