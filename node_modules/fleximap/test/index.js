var assert = require('assert');
var FlexiMap = require('../index.js').FlexiMap;

var flexiMap = new FlexiMap();
flexiMap.set('keyA', {arr: [], obj: {}});

assert(JSON.stringify(flexiMap.get(['keyA', 'arr'])) === '[]');
assert(JSON.stringify(flexiMap.get(['keyA', 'obj'])) === '{}');

flexiMap.add(['keyB1', 'keyB2', 'keyB3'], 123);

assert(JSON.stringify(flexiMap.get(['keyB1', 'keyB2'])) === JSON.stringify({keyB3: [123]}));

var arr = [];
arr[5] = 'Hello world';

flexiMap.set(['keyC1', 'keyC2'], arr);
var result = flexiMap.get(['keyC1', 'keyC2']);

assert(JSON.stringify(result) === JSON.stringify({5: 'Hello world'}), 'Sparse Array should be cast to Object');

flexiMap.set(['itemsA', 0], 'hello');
flexiMap.set(['itemsA', 2], 'world');
flexiMap.remove(['itemsA', 0]);
assert(JSON.stringify(flexiMap.get('itemsA')) === JSON.stringify({2: 'world'}));

flexiMap.set(['itemsB', 0], 'a');
flexiMap.set(['itemsB', 1], 'b');
flexiMap.set(['itemsB', 2], 'c');
var splicedItemsB = flexiMap.splice(['itemsB'], 1, 1);
assert(JSON.stringify(flexiMap.get('itemsB')) === JSON.stringify({0: 'a', 1: 'c'}));
assert(JSON.stringify(splicedItemsB) === JSON.stringify(['b']));

flexiMap.splice(['itemsB'], 1, 0, 'b2');
assert(JSON.stringify(flexiMap.get('itemsB')) === JSON.stringify({0: 'a', 1: 'b2', 2: 'c'}));

flexiMap.splice(['itemsB'], 1, 1, 'b3');
assert(JSON.stringify(flexiMap.get('itemsB')) === JSON.stringify({0: 'a', 1: 'b3', 2: 'c'}));

var splicedItemsBB = flexiMap.splice(['itemsB'], 1, 2, 'b4');
assert(JSON.stringify(flexiMap.get('itemsB')) === JSON.stringify({0: 'a', 1: 'b4'}));
assert(JSON.stringify(splicedItemsBB) === JSON.stringify(['b3', 'c']));

flexiMap.set(['itemsC', 'a'], 'A');
flexiMap.set(['itemsC', 'b'], 'B');
flexiMap.set(['itemsC', 'c'], 'C');
flexiMap.splice(['itemsC'], 1, 0, 'zero');
flexiMap.splice(['itemsC'], 1, 0, 'two');
flexiMap.splice(['itemsC'], 1, 0, 'one');
assert(JSON.stringify(flexiMap.get('itemsC')) === JSON.stringify({0: 'zero', 1: 'one', 2: 'two', a: 'A', b: 'B', c: 'C'}));

var splicedItemsD = flexiMap.splice(['itemsD'], 1, 0);
assert(JSON.stringify(splicedItemsD) === '[]');

flexiMap.set('myArray', [0, 1, 2, 3, 4, 5]);
var arrayRange = flexiMap.getRange('myArray', 1, 4);
assert(JSON.stringify(arrayRange) === JSON.stringify([1, 2, 3]));
var removedArrayRange = flexiMap.removeRange('myArray', 1, 4);
assert(JSON.stringify(removedArrayRange) === JSON.stringify([1, 2, 3]));
var arrayAfterRangeRemoved = flexiMap.get('myArray');
assert(JSON.stringify(arrayAfterRangeRemoved) === JSON.stringify([0, 4, 5]));

console.log('All tests passed!');
