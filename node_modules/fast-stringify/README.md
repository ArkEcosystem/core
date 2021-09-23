# fast-stringify

A [blazing fast](#benchmarks) stringifier that safely handles circular objects

## Table of contents

- [fast-stringify](#fast-stringify)
  - [Table of contents](#Table-of-contents)
  - [Summary](#Summary)
  - [Usage](#Usage)
      - [stringify](#stringify)
  - [Importing](#Importing)
  - [Benchmarks](#Benchmarks)
      - [Simple objects](#Simple-objects)
      - [Complex objects](#Complex-objects)
      - [Circular objects](#Circular-objects)
      - [Special objects](#Special-objects)
  - [Development](#Development)

## Summary

The fastest way to stringify an object will always be the native `JSON.stringify`, but it does not support circular objects out of the box. If you need to stringify objects that have circular references, `fast-stringify` is there for you! It maintains a very similar API to the native `JSON.stringify`, and aims to be the most performant stringifier that handles circular references.

## Usage

```javascript
import stringify from "fast-stringify";

const object = {
  foo: "bar",
  deeply: {
    recursive: {
      object: {}
    }
  }
};

object.deeply.recursive.object = object;

console.log(stringify(object));
// {"foo":"bar","deeply":{"recursive":{"object":"[ref-0]"}}}
```

#### stringify

`stringify(object: any, replacer: ?function, indent: ?number, circularReplacer: ?function): string`

Stringifies the object passed based on the parameters you pass. The only required value is the `object`. The additional parameters passed will customize how the string is compiled.

- `replacer` => function to customize how the value for each key is stringified (see [the documentation for JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) for more details)
- `indent` => number of spaces to indent the stringified object for pretty-printing (see [the documentation for JSON.stringify](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify) for more details)
- `circularReplacer` => function to customize how the circular reference is stringified (defaults to `[ref-##]` where `##` is the reference count)

## Importing

ESM in browsers:

```javascript
import stringify from "fast-stringify";
```

ESM in NodeJS:

```javascript
import stringify from "fast-stringify/mjs";
```

CommonJS:

```javascript
const stringify = require("fast-stringify").default;
```

## Benchmarks

#### Simple objects

_Small number of properties, all values are primitives_

|                            | Operations / second | Relative margin of error |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **679,923**         | **0.58%**                |
| fast-json-stable-stringify | 341,889             | 0.61%                    |
| json-stringify-safe        | 334,542             | 0.44%                    |
| json-stable-stringify      | 254,565             | 0.69%                    |
| json-cycle                 | 196,417             | 0.56%                    |
| decircularize              | 145,771             | 0.47%                    |

#### Complex objects

_Large number of properties, values are a combination of primitives and complex objects_

|                            | Operations / second | Relative margin of error |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **128,056**         | **0.50%**                |
| json-stringify-safe        | 59,644              | 0.54%                    |
| fast-json-stable-stringify | 57,641              | 1.07%                    |
| json-cycle                 | 50,753              | 0.69%                    |
| json-stable-stringify      | 39,456              | 0.95%                    |
| decircularize              | 26,572              | 0.74%                    |

#### Circular objects

_Objects that deeply reference themselves_

|                                            | Operations / second | Relative margin of error |
| ------------------------------------------ | ------------------- | ------------------------ |
| **fast-stringify**                         | **116,247**         | **0.52%**                |
| json-stringify-safe                        | 56,599              | 0.44%                    |
| json-cycle                                 | 47,026              | 0.91%                    |
| decircularize                              | 25,084              | 0.72%                    |
| fast-json-stable-stringify (not supported) | 0                   | 0.00%                    |
| json-stable-stringify (not supported)      | 0                   | 0.00%                    |

#### Special objects

_Custom constructors, React components, etc_

|                            | Operations / second | Relative margin of error |
| -------------------------- | ------------------- | ------------------------ |
| **fast-stringify**         | **34,901**          | **0.54%**                |
| json-stringify-safe        | 19,514              | 0.31%                    |
| json-cycle                 | 18,329              | 0.68%                    |
| fast-json-stable-stringify | 18,258              | 0.81%                    |
| json-stable-stringify      | 13,059              | 0.83%                    |
| decircularize              | 9,168               | 1.15%                    |

## Development

Standard practice, clone the repo and `npm i` to get the dependencies. The following npm scripts are available:

- benchmark => run benchmark tests against other equality libraries
- build => build dist files with `rollup`
- clean => run `clean:dist`, `clean:es`, and `clean:lib` scripts
- clean:dist => run `rimraf` on the `dist` folder
- clean:es => run `rimraf` on the `es` folder
- clean:lib => run `rimraf` on the `lib` folder
- dev => start webpack playground App
- dist => run `build` and `build:minified` scripts
- lint => run ESLint on all files in `src` folder (also runs on `dev` script)
- lint:fix => run `lint` script, but with auto-fixer
- prepublish:compile => run `lint`, `test:coverage`, `transpile:lib`, `transpile:es`, and `dist` scripts
- start => run `dev`
- test => run AVA with NODE_ENV=test on all files in `test` folder
- test:coverage => run same script as `test` with code coverage calculation via `nyc`
- test:watch => run same script as `test` but keep persistent watcher
- transpile:es => run Babel on all files in `src` folder (transpiled to `es` folder without transpilation of ES2015 export syntax)
- transpile:lib => run Babel on all files in `src` folder (transpiled to `lib` folder)
