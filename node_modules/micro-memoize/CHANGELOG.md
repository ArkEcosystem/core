# micro-memoize CHANGELOG

## 2.1.2

- Fix issue where `isMatchingKey` was not being used with promise updater
- Remove requirement of `Object.assign` existing globally
- Add common use-case static handlers for up to 3 arguments, falling back to pre-existing dynamic handlers for more (faster comparison / argument cloning)

## 2.1.1

- Upgrade to babel 7
- Add `"sideEffects": false` for better tree-shaking with webpack

## 2.1.0

- Add ESM support for NodeJS with separate [`.mjs` extension](https://nodejs.org/api/esm.html) exports

## 2.0.4

- Fix issue with recursive calls to memoized function created discrepancy between `keys` and `values` in cache

## 2.0.3

- More TypeScript typings (thanks again [@rtorr](https://github.com/rtorr))

## 2.0.2

- Fix TypeScript typings (thanks [@rtorr](https://github.com/rtorr))

## 2.0.1

- Fix TypeScript typings (thanks [@Crecket](https://github.com/Crecket))

## 2.0.0

- Add [`isMatchingKey`](#ismatchingkey) method to provide match test on entire key vs iterative equality

**BREAKING CHANGES**

- The return value from `transformKey` must be an `Array` (would previously coalesce it for you)

**NEW FEATURES**

- `isMatchingKey` will matching on entire key vs `isEqual`, which does an iterative comparison of arguments in order
- Add `size` property to `cache`

## 1.8.1

- Fix `getKeyIndex` being passed as `memoize` for promises

## 1.8.0

- Include the memoized function itself as the third parameter to `onCacheAdd`, `onCacheChange`, and `onCacheHit` firings

## 1.7.0

- Fire `onCacheHit` and `onCacheChange` when promise functions successfully resolve

## 1.6.3

- Replace native `slice` usages with `cloneArray` utility

## 1.6.2

- Convert `dist` files to be built using [`rollup`](https://github.com/rollup/rollup) instead of webpack

## 1.6.1

- Optimize `slice` calls for key storage (performance)

## 1.6.0

- Add [`onCacheAdd`](README.md#oncacheadd) option
- Pass through unused properties in `options` for higher-order memoization library usage

## 1.5.0

- Add [`onCacheHit`](README.md#oncachehit) option

## 1.4.0

- Add `options` as second parameter to `onCacheChanged`

## 1.3.2

- Make additional properties (`cache`, `cacheSnapshot`, `isMemoized`, `options`) configurable for higher-order memoization library usage

## 1.3.1

- Only reorder keys when matching cache entry is not first key

## 1.3.0

- Add [`onCacheChange`](README.md#oncachechange) option

## 1.2.0

- Add [`isPromise`](README.md#ispromise) option
- Add typings for Flowtype and TypeScript

## 1.1.0

- Add [`transformKey`](README.md#transformkey) option

## 1.0.1

- Delay argument-to-key generation until stored as new cache value (speed improvement of ~35%)

## 1.0.0

- Initial release
