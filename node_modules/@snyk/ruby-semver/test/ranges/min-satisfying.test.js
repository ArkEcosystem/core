import test from 'ava';

import { minSatisfying } from '../../';

// minSatisfying(versions, range): Return the lowest version in the list that
// satisfies the range, or null if none of them do.

test('minSatisfying(versions, range)', t => {
  t.is(minSatisfying(['1.2.3', '1.2.4'], '~> 1.2'), '1.2.3');
  t.is(minSatisfying(['1.2.4', '1.2.3'], '~> 1.2'), '1.2.3');
  t.is(minSatisfying(['1.2.3', '1.2.4', '1.2.5'], '~> 1.2, >= 1.2.4'), '1.2.4');
  t.is(minSatisfying(['1.2.3', '1.2.4', '1.2.5', '1.2.6'], '~>1.2.3'), '1.2.3');
  t.is(minSatisfying(['1.1.0', '1.2.0', '1.2.1', '1.3.0', '2.0.0b1', '2.0.0b2',
    '2.0.0b3', '2.0.0', '2.1.0'], '~> 2.0.0'), '2.0.0');

  t.is(minSatisfying(['1.2.3', '1.2.4'], '> 3.2'), null);
});


