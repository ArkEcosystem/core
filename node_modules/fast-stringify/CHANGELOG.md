# fast-stringify CHANGELOG

## 1.1.2

- Update documentation to explain the purpose of the library and its relationship to `JSON.stringify`
- Add `typeof value === 'object'` check to only cache objects for faster iteration
- Improve internal `indexOf` lookup for faster cache comparisons

## 1.1.1

- Upgrade to use Babel 7 for transformations

## 1.1.0

- Add ESM support for NodeJS with separate [`.mjs` extension](https://nodejs.org/api/esm.html) exports

## 1.0.4

- Reduce runtime function checks

## 1.0.3

- Abandon use of `WeakSet` for caching, instead using more consistent and flexible `Array` cache with custom modifier methods

## 1.0.2

- Fix issue where directly nested objects like `window` were throwing circular errors when nested in a parent object

## 1.0.1

- Fix repeated reference issue (#2)

## 1.0.0

- Initial release
