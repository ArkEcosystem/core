# micro-memoize

A tiny, crazy [fast](#benchmarks) memoization library for the 95% use-case

## Table of contents

- [Summary](#summary)
- [Importing](#importing)
- [Usage](#usage)
- [Options](#options)
  - [isEqual](#isequal)
  - [isMatchingKey](#ismatchingkey)
  - [isPromise](#ispromise)
  - [maxSize](#maxsize)
  - [onCacheAdd](#oncacheadd)
  - [onCacheChange](#oncachechange)
  - [onCacheHit](#oncachehit)
  - [transformKey](#transformkey)
- [Additional properties](#additional-properties)
  - [cache](#cache)
  - [cacheSnapshot](#cachesnapshot)
  - [isMemoized](#ismemoized)
  - [options](#options)
- [Benchmarks](#benchmarks)
  - [Single parameter (primitive only)](#single-parameter-primitive-only)
  - [Single parameter (complex object)](#single-parameter-complex-object)
  - [Multiple parameters (primitives only)](#multiple-parameters-primitives-only)
  - [Multiple parameters (complex objects)](#multiple-parameters-complex-objects)
- [Browser support](#browser-support)
- [Node support](#node-support)
- [Development](#development)

## Summary

As the author of [`moize`](https://github.com/planttheidea/moize), I created a consistently fast memoization library, but `moize` has a lot of features to satisfy a large number of edge cases. `micro-memoize` is a simpler approach, focusing on the core feature set with a much smaller footprint (~1.1kB minified+gzipped). Stripping out these edge cases also allows `micro-memoize` to be faster across the board than `moize`.

## Importing

ESM in browsers:

```javascript
import memoize from "micro-memoize";
```

ESM in NodeJS:

```javascript
import memoize from "micro-memoize/mjs";
```

CommonJS:

```javascript
const memoize = require("micro-memoize").default;
```

## Usage

```javascript
// ES2015+
import memoize from "micro-memoize";

// CommonJS
const memoize = require("micro-memoize").default;

// old-school
const memoize = window.memoize;

const assembleToObject = (one, two) => {
  return { one, two };
};

const memoized = memoize(assembleToObject);

console.log(memoized("one", "two")); // {one: 'one', two: 'two'}
console.log(memoized("one", "two")); // pulled from cache, {one: 'one', two: 'two'}
```

## Options

#### isEqual

`function(object1: any, object2: any): boolean`, _defaults to `isSameValueZero`_

Custom method to compare equality of keys, determining whether to pull from cache or not, by comparing each argument in order.

Common use-cases:

- Deep equality comparison
- Limiting the arguments compared

```javascript
import { deepEqual } from "fast-equals";

const deepObject = object => {
  return {
    foo: object.foo,
    bar: object.bar
  };
};

const memoizedDeepObject = memoize(deepObject, { isEqual: deepEqual });

console.log(
  memoizedDeepObject({
    foo: {
      deep: "foo"
    },
    bar: {
      deep: "bar"
    },
    baz: {
      deep: "baz"
    }
  })
); // {foo: {deep: 'foo'}, bar: {deep: 'bar'}}

console.log(
  memoizedDeepObject({
    foo: {
      deep: "foo"
    },
    bar: {
      deep: "bar"
    },
    baz: {
      deep: "baz"
    }
  })
); // pulled from cache
```

**NOTE**: The default method tests for [SameValueZero](http://ecma-international.org/ecma-262/7.0/#sec-samevaluezero) equality, which is summarized as strictly equal while also considering `NaN` equal to `NaN`.

#### isMatchingKey

`function(object1: Array<any>, object2: Array<any>): boolean`

Custom method to compare equality of keys, determining whether to pull from cache or not, by comparing the entire key.

Common use-cases:

- Comparing the shape of the key
- Matching on values regardless of order
- Serialization of arguments

```javascript
import { deepEqual } from "fast-equals";

const deepObject = object => {
  return {
    foo: object.foo,
    bar: object.bar
  };
};

const memoizedShape = memoize(deepObject, {
  isMatchingKey(object1, object2) {
    return (
      object1.hasOwnProperty("foo") &&
      object2.hasOwnProperty("foo") &&
      object1.bar === object2.bar
    );
  }
});

console.log(
  memoizedShape({
    foo: "foo",
    bar: "bar",
    baz: "baz"
  })
); // {foo: {deep: 'foo'}, bar: {deep: 'bar'}}

console.log(
  memoizedShape({
    foo: "not foo",
    bar: "bar",
    baz: "baz"
  })
); // pulled from cache
```

#### isPromise

`boolean`, _defaults to `boolean`_

Identifies the value returned from the method as a `Promise`, which will result in one of two possible scenarios:

- If the promise is resolved, it will fire the `onCacheHit` and `onCacheChange` options
- If the promise is rejected, it will trigger auto-removal from cache

```javascript
const fn = async (one, two) => {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error({ one, two }));
    }, 500);
  });
};

const memoized = memoize(fn, { isPromise: true });

memoized("one", "two");

console.log(memoized.cacheSnapshot.keys); // [['one', 'two']]
console.log(memoized.cacheSnapshot.values); // [Promise]

setTimeout(() => {
  console.log(memoized.cacheSnapshot.keys); // []
  console.log(memoized.cacheSnapshot.values); // []
}, 1000);
```

**NOTE**: If you don't want rejections to auto-remove the entry from cache, set `isPromise` to `false` (or simply do not set it), but be aware this will also remove the cache listeners that fire on successful resolution.

#### maxSize

`number`, _defaults to `1`_

The number of values to store in cache, based on a [Least Recently Used](https://en.wikipedia.org/wiki/Cache_replacement_policies#Least_Recently_Used_.28LRU.29) basis. This operates the same as [`maxSize`](https://github.com/planttheidea/moize#maxsize) on `moize`, with the exception of the default being different.

```javascript
const manyPossibleArgs = (one, two) => {
  return [one, two];
};

const memoized = memoize(manyPossibleArgs, { maxSize: 3 });

console.log(memoized("one", "two")); // ['one', 'two']
console.log(memoized("two", "three")); // ['two', 'three']
console.log(memoized("three", "four")); // ['three', 'four']

console.log(memoized("one", "two")); // pulled from cache
console.log(memoized("two", "three")); // pulled from cache
console.log(memoized("three", "four")); // pulled from cache

console.log(memoized("four", "five")); // ['four', 'five'], drops ['one', 'two'] from cache
```

**NOTE**: The default for `micro-memoize` differs from the default implementation of `moize`. `moize` will store an infinite number of results unless restricted, whereas `micro-memoize` will only store the most recent result. In this way, the default implementation of `micro-memoize` operates more like [`moize.simple`](https://github.com/planttheidea/moize#moizesimple).

#### onCacheAdd

`function(cache: Cache, options: Options): void`, _defaults to noop_

Callback method that executes whenever the cache is added to. This is mainly to allow for higher-order caching managers that use `micro-memoize` to perform superset functionality on the `cache` object.

```javascript
const fn = (one, two) => {
  return [one, two];
};

const memoized = memoize(fn, {
  onCacheAdd(cache, options) {
    console.log("cache has been added to: ", cache);
    console.log("memoized method has the following options applied: ", options);
  }
});

memoized("foo", "bar"); // cache has been added to
memoized("foo", "bar");
memoized("foo", "bar");

memoized("bar", "foo"); // cache has been added to
memoized("bar", "foo");
memoized("bar", "foo");

memoized("foo", "bar");
memoized("foo", "bar");
memoized("foo", "bar");
```

**NOTE**: This method is not executed when the `cache` is manually manipulated, only when changed via calling the memoized method.

#### onCacheChange

`function(cache: Cache, options: Options): void`, _defaults to noop_

Callback method that executes whenever the cache is added to or the order is updated. This is mainly to allow for higher-order caching managers that use `micro-memoize` to perform superset functionality on the `cache` object.

```javascript
const fn = (one, two) => {
  return [one, two];
};

const memoized = memoize(fn, {
  onCacheChange(cache, options) {
    console.log("cache has changed: ", cache);
    console.log("memoized method has the following options applied: ", options);
  }
});

memoized("foo", "bar"); // cache has changed
memoized("foo", "bar");
memoized("foo", "bar");

memoized("bar", "foo"); // cache has changed
memoized("bar", "foo");
memoized("bar", "foo");

memoized("foo", "bar"); // cache has changed
memoized("foo", "bar");
memoized("foo", "bar");
```

**NOTE**: This method is not executed when the `cache` is manually manipulated, only when changed via calling the memoized method. When the execution of other cache listeners (`onCacheAdd`, `onCacheHit`) is applicable, this method will execute after those methods.

#### onCacheHit

`function(cache: Cache, options: Options): void`, _defaults to noop_

Callback method that executes whenever the cache is hit, whether the order is updated or not. This is mainly to allow for higher-order caching managers that use `micro-memoize` to perform superset functionality on the `cache` object.

```javascript
const fn = (one, two) => {
  return [one, two];
};

const memoized = memoize(fn, {
  maxSize: 2,
  onCacheHit(cache, options) {
    console.log("cache was hit: ", cache);
    console.log("memoized method has the following options applied: ", options);
  }
});

memoized("foo", "bar");
memoized("foo", "bar"); // cache was hit
memoized("foo", "bar"); // cache was hit

memoized("bar", "foo");
memoized("bar", "foo"); // cache was hit
memoized("bar", "foo"); // cache was hit

memoized("foo", "bar"); // cache was hit
memoized("foo", "bar"); // cache was hit
memoized("foo", "bar"); // cache was hit
```

**NOTE**: This method is not executed when the `cache` is manually manipulated, only when changed via calling the memoized method.

#### transformKey

`function(Array<any>): any`

A method that allows you transform the key that is used for caching, if you want to use something other than the pure arguments.

```javascript
const ignoreFunctionArgs = (one, two) => {
  return [one, two];
};

const memoized = memoize(ignoreFunctionArgs, {
  transformKey: JSON.stringify
});

console.log(memoized("one", () => {})); // ['one', () => {}]
console.log(memoized("one", () => {})); // pulled from cache, ['one', () => {}]
```

If your transformed keys require something other than `SameValueZero` equality, you can combine `transformKey` with [`isEqual`](#isequal) for completely custom key creation and comparison.

```javascript
const ignoreFunctionArgs = (one, two) => {
  return [one, two];
};

const memoized = memoize(ignoreFunctionArgs, {
  isEqual(key1, key2) {
    return key1.args === key2.args;
  },
  transformKey(args) {
    return {
      args: JSON.stringify(args)
    };
  }
});

console.log(memoized("one", () => {})); // ['one', () => {}]
console.log(memoized("one", () => {})); // pulled from cache, ['one', () => {}]
```

## Additional properties

#### cache

`Object`

The `cache` object that is used internally. The shape of this structure:

```javascript
{
  keys: Array<Array<any>>, // array of arg arrays
  values: Array<any> // array of values
}
```

The exposure of this object is to allow for manual manipulation of keys/values (injection, removal, expiration, etc).

```javascript
const method = (one, two) => {
  return { one, two };
};

const memoized = memoize(method);

memoized.cache.keys.push(["one", "two"]);
memoized.cache.values.push("cached");

console.log(memoized("one", "two")); // 'cached'
```

**HOTE**: `moize` offers a variety of convenience methods for this manual `cache` manipulation, and while `micro-memoize` allows all the same capabilities by exposing the `cache`, it does not provide any convenience methods.

#### cacheSnapshot

`Object`

This is identical to the `cache` object referenced above, but it is a deep clone created at request, which will provide a persistent snapshot of the values at that time. This is useful when tracking the cache changes over time, as the `cache` object is mutated internally for performance reasons.

#### isMemoized

`boolean`

Hard-coded to `true` when the function is memoized. This is useful for introspection, to identify if a method has been memoized or not.

#### options

`Object`

The [`options`](#options) passed when creating the memoized method.

## Benchmarks

All values provided are the number of operations per second (ops/sec) calculated by the [Benchmark suite](https://benchmarkjs.com/). Note that `underscore`, `lodash`, and `ramda` do not support mulitple-parameter memoization (which is where `micro-memoize` really shines), so they are not included in those benchmarks.

Benchmarks was performed on an i7 8-core Arch Linux laptop with 16GB of memory using NodeJS version `8.9.4`. The default configuration of each library was tested with a fibonacci calculation based on the following parameters:

- Single primitive = `35`
- Single object = `{number: 35}`
- Multiple primitives = `35, true`
- Multiple objects = `{number: 35}, {isComplete: true}`

#### Single parameter (primitive only)

This is usually what benchmarks target for ... its the least-likely use-case, but the easiest to optimize, often at the expense of more common use-cases.

|                   | Operations / second | Relative margin of error |
| ----------------- | ------------------- | ------------------------ |
| fast-memoize      | 219,525,943         | 0.56%                    |
| **micro-memoize** | **76,004,234**      | **1.12%**                |
| lodash            | 26,920,988          | 0.65%                    |
| underscore        | 24,126,335          | 0.73%                    |
| memoizee          | 16,575,237          | 0.74%                    |
| lru-memoize       | 8,016,237           | 1.58%                    |
| Addy Osmani       | 6,476,533           | 0.96%                    |
| memoizerific      | 5,511,233           | 0.78%                    |
| ramda             | 1,107,319           | 0.68%                    |

#### Single parameter (complex object)

This is what most memoization libraries target as the primary use-case, as it removes the complexities of multiple arguments but allows for usage with one to many values.

|                   | Operations / second | Relative margin of error |
| ----------------- | ------------------- | ------------------------ |
| **micro-memoize** | **60,533,096**      | **0.68%**                |
| memoizee          | 11,601,186          | 0.82%                    |
| lodash            | 8,017,634           | 0.77%                    |
| underscore        | 7,910,175           | 0.76%                    |
| lru-memoize       | 6,878,249           | 1.12%                    |
| memoizerific      | 4.377,062           | 0.74%                    |
| Addy Osmani       | 1,829,256           | 0.74%                    |
| fast-memoize      | 1,468,272           | 0.67%                    |
| ramda             | 213,118             | 0.84%                    |

#### Multiple parameters (primitives only)

This is a very common use-case for function calls, but can be more difficult to optimize because you need to account for multiple possibilities ... did the number of arguments change, are there default arguments, etc.

|                   | Operations / second | Relative margin of error |
| ----------------- | ------------------- | ------------------------ |
| **micro-memoize** | **49,690,821**      | **1.26%**                |
| memoizee          | 10,425,265          | 0.76%                    |
| lru-memoize       | 6,165,918           | 0.76%                    |
| memoizerific      | 4,587,050           | 0.72%                    |
| Addy Osmani       | 3,409,941           | 0.67%                    |
| fast-memoize      | 1,214,616           | 0.66%                    |

#### Multiple parameters (complex objects)

This is the most robust use-case, with the same complexities as multiple primitives but managing bulkier objects with additional edge scenarios (destructured with defaults, for example).

|                   | Operations / second | Relative margin of error |
| ----------------- | ------------------- | ------------------------ |
| **micro-memoize** | **47,300,339**      | **1.20%**                |
| memoizee          | 7,487,582           | 0.73%                    |
| lru-memoize       | 6,287,893           | 1.15%                    |
| memoizerific      | 3,537,690           | 0.75%                    |
| Addy Osmani       | 936,273             | 0.70%                    |
| fast-memoize      | 808,141             | 0.68%                    |

## Browser support

- Chrome (all versions)
- executefox (all versions)
- Edge (all versions)
- Opera 15+
- IE 9+
- Safari 6+
- iOS 8+
- Android 4+

## Node support

- 4+

## Development

Standard stuff, clone the repo and `npm install` dependencies. The npm scripts available:

- `build` => run webpack to build development `dist` file with NODE_ENV=development
- `build:minifed` => run webpack to build production `dist` file with NODE_ENV=production
- `dev` => run webpack dev server to run example app (playground!)
- `dist` => runs `build` and `build-minified`
- `lint` => run ESLint against all files in the `src` folder
- `prepublish` => runs `compile-for-publish`
- `prepublish:compile` => run `lint`, `test`, `transpile:es`, `transpile:lib`, `dist`
- `test` => run AVA test functions with `NODE_ENV=test`
- `test:coverage` => run `test` but with `nyc` for coverage checker
- `test:watch` => run `test`, but with persistent watcher
- `transpile:lib` => run babel against all files in `src` to create files in `lib`
- `transpile:es` => run babel against all files in `src` to create files in `es`, preserving ES2015 modules (for [`pkg.module`](https://github.com/rollup/rollup/wiki/pkg.module))
