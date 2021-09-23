# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [1.1.8] - 2020-01-27

## Changed

-   Update dependencies

## Fixed

-   Add `type-fest` as dependency

## [1.1.7] - 2019-11-19

## Fixed

-   Add `deepmerge` as dependency

## [1.1.6] - 2019-10-25

## Changed

-   Better handling of falsy values for `get`

## [1.1.5] - 2019-10-25

## Changed

-   Better handling of falsy values for `has`

## [1.1.4] - 2019-10-25

## Added

-   Added `sortBy` method
-   Added `sortByDesc` method
-   Added `orderBy` method

## Fixed

-   Only treat `undefined` as a missing key for `has` checks

## [1.1.0] - 2019-10-14

## Breaking Changes

-   Drop VM support

## Added

-   Added `pluralize` method
-   Added `prettyTime` method
-   Added `randomBase64` method
-   Added `randomBits` method
-   Added `randomHex` method
-   Added `safeEqual` method

### Changed

-   Renamed `formatBytes` to `prettyBytes`
-   Renamed `random` to `randomNumber`

## [1.0.34] - 2019-10-14

## Changed

-   Add types to get, has and unset

## [1.0.31] - 2019-10-14

## Fixed

-   Handle timeouts for HTTP requests _(defaults to 1500ms)_

## [1.0.30] - 2019-10-14

## Added

-   Added `base64.decode` method
-   Added `base64.encode` method
-   Added `binary.decode` method
-   Added `binary.encode` method
-   Added `chars` method
-   Added `extension` method
-   Added `hex.decode` method
-   Added `hex.encode` method
-   Added `http.delete` method
-   Added `http.get` method
-   Added `http.patch` method
-   Added `http.post` method
-   Added `http.put` method
-   Added `intersection` method
-   Added `isBigInt` method
-   Added `isBuffer` method
-   Added `isError` method
-   Added `isNegative` method
-   Added `isNegativeZero` method
-   Added `isPositive` method
-   Added `isPositiveZero` method
-   Added `isPromise` method
-   Added `isURL` method
-   Added `isWeakSet` method
-   Added `semver.isEqual` method
-   Added `semver.isGreaterThan` method
-   Added `semver.isGreaterThanOrEqual` method
-   Added `semver.isLessThan` method
-   Added `semver.isLessThanOrEqual` method
-   Added `sleep` method

## [1.0.0] - 2019-10-10

## Changed

-   Export a `dotenv` object instead of a class

## [0.9.9] - 2019-10-10

### Added

-   Added `isWeakMap` method
-   Added `isArguments` method
-   Added `isDate` method
-   Added `getType` method
-   Added `isSyncFunction` methods
-   Added `isAsyncFunction` methods
-   Added `DotEnv` class
-   Added `expandTilde` method

## Changed

-   Improved type checking inside the node.js VM

## [0.9.1] - 2019-10-08

### Added

-   Added `find` method
-   Added `findIndex` method
-   Added `includes` method

## [0.8.8] - 2019-10-07

### Added

-   Added `protocols` method
-   Added `isGit` method
-   Added `isSSH` method
-   Added `parseGitUrl` method
-   Added `trimTrailingSlash` method

## [0.8.3] - 2019-10-03

### Added

-   Added `numberToHex` method
-   Added `BigNumber` class
-   Added `hashString` method

### Changed

-   Greatly improved the performance of various methods to be as fast or faster than lodash.

## [0.8.0] - 2019-09-29

### Added

-   Added `formatBytes` method
-   Added `formatNumber` method
-   Added `isBetween` method
-   Added `isEmptyArray` method
-   Added `isEmptyArray` method
-   Added `isEmptyMap` method
-   Added `isEmptyObject` method
-   Added `isFalse` method
-   Added `isGreaterThan` method
-   Added `isGreaterThanOrEqual` method
-   Added `isLessThan` method
-   Added `isLessThanOrEqual` method
-   Added `isMatch` method
-   Added `isNotBetween` method
-   Added `isNotEqual` method
-   Added `isRegExp` method
-   Added `isTrue` method

## [0.7.1] - 2019-09-24

### Fixed

-   Return default value from get if the object is empty

## [0.7.0] - 2019-09-24

### Added

-   Added `isEmptyArray` method
-   Added `isEmptyMap` method
-   Added `isEmptyObject` method
-   Added `isEmptyArray` method

## Changed

-   Return early in `get`, `set`, `has` and `unset` if the given object is empty

## [0.6.8] - 2019-09-23

### Added

-   Added `constantCase` method
-   Added `dotCase` method
-   Added `headerCase` method
-   Added `kebabBase` method
-   Added `numberArray` method
-   Added `pathCase` method
-   Added `startCase` method
-   Added `words` method

### Changed

-   Greatly improved the performance of various methods to be as fast or faster than lodash.

## [0.6.0] - 2019-09-20

### Added

-   Added `first` method
-   Added `firstMapEntry` method
-   Added `firstMapKey` method
-   Added `firstMapValue` method
-   Added `isMap` method
-   Added `isSet` method
-   Added `last` method
-   Added `lastMapEntry` method
-   Added `lastMapKey` method
-   Added `lastMapValue` method
-   Added `reverse` method
-   Added `toLower` method
-   Added `toUpper` method
-   Renamed `OrderedCappedMap` to `CappedMap` and made it mutable

### Changed

-   Greatly improved the performance of various methods to be as fast or faster than lodash.

## [0.5.1] - 2019-09-19

### Fixed

-   Use `rfdc` for clone and `fast-copy` for deep-clone to retain functions

## [0.5.0] - 2019-09-18

### Added

-   Added `at` method
-   Added `camelCase` method
-   Added `castArray` method
-   Added `clone` method
-   Added `findKey` method
-   Added `head` method
-   Added `isBoolean` method
-   Added `isNumber` method
-   Added `keyBy` method
-   Added `keys` method
-   Added `last` method
-   Added `lowerCase` method
-   Added `mapValues` method
-   Added `max` method
-   Added `maxBy` method
-   Added `merge` method
-   Added `min` method
-   Added `omitBy` method
-   Added `pascalCase` method
-   Added `pickBy` method
-   Added `pull` method
-   Added `pullAll` method
-   Added `pullAllBy` method
-   Added `random` method
-   Added `reject` method
-   Added `snakeCase` method
-   Added `tail` method
-   Added `toString` method
-   Added `union` method
-   Added `unionBy` method
-   Added `uniqBy` method
-   Added `upperCase` method
-   Added `zipObject` method

## [0.4.0] - 2019-09-16

### Added

-   Added `cappedSet` method
-   Added `chunk` method
-   Added `cloneDeep` method
-   Added `Collection` class
-   Added `groupBy` method
-   Added `hasProperty` method
-   Added `hasSomeProperty` method
-   Added `has` method
-   Added `isArrayOfType` method
-   Added `isBooleanArray` method
-   Added `isConstructor` method
-   Added `isEmpty` method
-   Added `isEqual` method
-   Added `isFunction` method
-   Added `isNil` method
-   Added `isNumberArray` method
-   Added `isObject` method
-   Added `isStringArray` method
-   Added `isString` method
-   Added `isSymbol` method
-   Added `isUndefined` method
-   Added `minBy` method
-   Added `NSect` class
-   Added `OrderedCappedMap` class
-   Added `partition` method
-   Added `pick` method
-   Added `sample` method
-   Added `shuffle` method
-   Added `take` method
-   Added `uniq` method
-   Added `unset` method

## [0.3.0] - 2019-02-27

### Removed

-   Extracted `Dato` into its own package ([faustbrian/dato](https://github.com/faustbrian/dato))

## [0.2.7] - 2019-02-27

### Changed

-   Replaced `Dato.make` with the `dato` factory function

## [0.2.6] - 2019-02-27

### Added

-   Support for `string` and `number`

### Changed

-   Replaced `now`, `fromString`, `fromDate` with `make`

### Removed

-   Removed the `now` method
-   Removed the `fromString` method
-   Removed the `fromDate` method

## [0.2.51] - 2019-02-27

### Changed

-   Allow `number`, `Date` and `Dato` as input types

## [0.2.5] - 2019-02-27

### Added

-   Lightweight wrapper around `Dato` that works based on `UTC`

## [0.2.4] - 2019-02-23

### Changed

-   Allow iteratees of orderBy to be functions

## [0.2.3] - 2019-02-16

### Changed

-   Make `sortBy`, `sortByDesc` and `orderBy` generic

## [0.2.2] - 2019-01-23

### Changed

-   Replaced `fast-stringify` with `fast-safe-stringify`

## [0.2.1] - 2019-01-18

### Added

-   Added the `capitalize` function
-   Added the `uncapitalize` function

## [0.2.0] - 2019-01-14

### Added

-   Initial Benchmark Suite

### Removed

-   Removed `lodash.*`
-   Removed `camelCase`

## [0.1.4] - 2019-01-14

### Added

-   Exporting `first` as an alias of `head`

### Changed

-   Replaced `cloneDeep` with `lodash/cloneDeep`
-   Replaced `cloneDeepWith` with `lodash/cloneDeepWith`
-   Replaced `compact` with `lodash/compact`
-   Replaced `pick` with `lodash/pick`
-   Replaced `sample` with `lodash/sample`
-   Replaced `sumBy` with `lodash/sumBy`
-   Replaced `uniq` with `lodash/uniq`

## [0.1.3] - 2019-01-14

### Added

-   Support functions and strings in `sumBy`

### Changed

-   `sortBy` and `sortByDesc` now work without passing any `iteratees`

## [0.1.2] - 2019-01-14

### Fixed

-   Properly build the TypeScript files

## [0.1.1] - 2019-01-14

### Changed

-   `cloneDeep` is now an alias of `copy` from `fast-copy`
-   `camelCase` is now an alias of `camelize` from `xcase`

## 0.1.0 - 2019-01-11

-   Initial Release

[1.1.8]: https://github.com/ArkEcosystem/utils/compare/1.1.7...1.1.8
[1.1.7]: https://github.com/ArkEcosystem/utils/compare/1.1.6...1.1.7
[1.1.6]: https://github.com/ArkEcosystem/utils/compare/1.1.5...1.1.6
[1.1.5]: https://github.com/ArkEcosystem/utils/compare/1.1.4...1.1.5
[1.1.4]: https://github.com/ArkEcosystem/utils/compare/1.1.0...1.1.4
[1.1.0]: https://github.com/ArkEcosystem/utils/compare/1.0.34...1.1.0
[1.0.34]: https://github.com/ArkEcosystem/utils/compare/1.0.31...1.0.34
[1.0.31]: https://github.com/ArkEcosystem/utils/compare/1.0.30...1.0.31
[1.0.30]: https://github.com/ArkEcosystem/utils/compare/1.0.0...1.0.30
[1.0.0]: https://github.com/ArkEcosystem/utils/compare/0.9.9...1.0.0
[0.9.9]: https://github.com/ArkEcosystem/utils/compare/0.9.1...0.9.9
[0.9.1]: https://github.com/ArkEcosystem/utils/compare/0.8.8...0.9.1
[0.8.8]: https://github.com/ArkEcosystem/utils/compare/0.8.3...0.8.8
[0.8.3]: https://github.com/ArkEcosystem/utils/compare/0.8.0...0.8.3
[0.8.0]: https://github.com/ArkEcosystem/utils/compare/0.7.1...0.8.0
[0.7.1]: https://github.com/ArkEcosystem/utils/compare/0.7.0...0.7.1
[0.7.0]: https://github.com/ArkEcosystem/utils/compare/0.6.8...0.7.0
[0.6.8]: https://github.com/ArkEcosystem/utils/compare/0.6.0...0.6.8
[0.6.0]: https://github.com/ArkEcosystem/utils/compare/0.5.1...0.6.0
[0.5.1]: https://github.com/ArkEcosystem/utils/compare/0.5.0...0.5.1
[0.5.0]: https://github.com/ArkEcosystem/utils/compare/0.4.0...0.5.0
[0.4.0]: https://github.com/ArkEcosystem/utils/compare/0.3.0...0.4.0
[0.3.0]: https://github.com/ArkEcosystem/utils/compare/0.2.7...0.3.0
[0.2.7]: https://github.com/ArkEcosystem/utils/compare/0.2.6...0.2.7
[0.2.6]: https://github.com/ArkEcosystem/utils/compare/0.2.51...0.2.6
[0.2.51]: https://github.com/ArkEcosystem/utils/compare/0.2.5...0.2.51
[0.2.5]: https://github.com/ArkEcosystem/utils/compare/0.2.4...0.2.5
[0.2.4]: https://github.com/ArkEcosystem/utils/compare/0.2.3...0.2.4
[0.2.4]: https://github.com/ArkEcosystem/utils/compare/0.2.3...0.2.4
[0.2.3]: https://github.com/ArkEcosystem/utils/compare/0.2.2...0.2.3
[0.2.2]: https://github.com/ArkEcosystem/utils/compare/0.2.1...0.2.2
[0.2.1]: https://github.com/ArkEcosystem/utils/compare/0.2.0...0.2.1
[0.2.0]: https://github.com/ArkEcosystem/utils/compare/0.1.4...0.2.0
[0.1.4]: https://github.com/ArkEcosystem/utils/compare/0.1.3...0.1.4
[0.1.3]: https://github.com/ArkEcosystem/utils/compare/0.1.2...0.1.3
[0.1.2]: https://github.com/ArkEcosystem/utils/compare/0.1.1...0.1.2
[0.1.1]: https://github.com/ArkEcosystem/utils/compare/0.1.0...0.1.1
