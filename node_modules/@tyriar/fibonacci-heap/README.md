# ts-fibonacci-heap

[![Build Status](https://api.travis-ci.org/gwtw/ts-fibonacci-heap.svg?branch=master)](http://travis-ci.org/gwtw/ts-fibonacci-heap)
[![Coverage Status](https://coveralls.io/repos/github/gwtw/ts-fibonacci-heap/badge.svg?branch=master)](https://coveralls.io/github/gwtw/ts-fibonacci-heap?branch=master)

A TypeScript implementation of the [Fibonacci heap](http://www.growingwiththeweb.com/data-structures/fibonacci-heap/overview/) data structure.

Note that the primary purpose of this library is education but it should work in a production environment as well. It's certainly not as performant as it could be as it optimises for readability, abstraction and safety over raw performance.

![](http://www.growingwiththeweb.com/images/data-structures/fibonacci-heap/fibonacci-heap.svg)

## Features

- 100% test coverage
- Supports all common heap operations
- Store keys with optional associated values
- Optional custom compare function that can utilize both key and value to give full control over the order of the data

## Install

```bash
npm install --save @tyriar/fibonacci-heap
```

## Usage

See the [typings file](./typings/fibonacci-heap.d.ts) for the full API.

```typescript
// Import npm module
import { FibonacciHeap } from '@tyriar/fibonacci-heap';

// Construct FibonacciHeap
const heap = new FibonacciHeap<number, any>();
// Insert keys only
heap.insert(3);
heap.insert(7);
// Insert keys and values
heap.insert(8, {foo: 'bar'});
heap.insert(1, {foo: 'baz'});

// Extract all nodes in order
while (!heap.isEmpty()) {
  const node = heap.extractMinimum();
  console.log('key: ' + node.key + ', value: ' + node.value);
}
// > key: 1, value: [object Object]
// > key: 3, value: undefined
// > key: 7, value: undefined
// > key: 8, value: [object Object]

// Construct custom compare FibonacciHeap
const heap2 = new FibonacciHeap<string, string>(function (a, b) {
  return (a.key + a.value).localeCompare(b.key + b.value);
});
heap2.insert('2', 'B');
heap2.insert('1', 'a');
heap2.insert('1', 'A');
heap2.insert('2', 'b');

// Extract all nodes in order
while (!heap2.isEmpty()) {
  const node = heap2.extractMinimum();
  console.log('key: ' + node.key + ', value: ' + node.value);
}
// > key: 1, value: a
// > key: 1, value: A
// > key: 2, value: b
// > key: 2, value: B
```

## Operation time complexity

| Operation      | Complexity |
| -------------- | ---------- |
| clear          | Θ(1)\*     |
| decreaseKey    | Θ(1)\*     |
| delete         | O(log n)\* |
| extractMinimum | O(log n)\* |
| findMinimum    | Θ(1)       |
| insert         | Θ(1)       |
| isEmpty        | Θ(1)       |
| size           | Θ(n)       |
| union          | Θ(1)       |

\* amortized
