# assert-options

Smart `options` handling, with one line of code:

* throw detailed error on invalid options
* set default values for missing options  

[![Build Status](https://travis-ci.org/vitaly-t/assert-options.svg?branch=master)](https://travis-ci.org/vitaly-t/assert-options)
[![Coverage Status](https://coveralls.io/repos/vitaly-t/assert-options/badge.svg?branch=master)](https://coveralls.io/r/vitaly-t/assert-options?branch=master)

## Rationale

* Passing in invalid or misspelled option names is one of the most common errors.
* Assigning defaults is the most common operation for methods that take options.  

This module automates proper options parsing and setting defaults where needed.

## Installation

```
$ npm install assert-options
```

## Usage

```js
const assertOptions = require('assert-options');

function functionWithOptions(options) {
    options = assertOptions(options, {first: 123, second: null});
    
    // options is a safe object here, with all missing defaults set.
}
```

And when default values are not needed, you can use an array of strings:

```js
function functionWithOptions(options) {
    options = assertOptions(options, ['first', 'second']);
    
    // the result is exactly the same as using the following:
    // options = assertOptions(options, {first: undefined, second: undefined});
    
    // options is a safe object here, without defaults.
}
```

Including `src/index.js` in a browser makes function `assertOptions` available globally.

## API

### `assertOptions(options, defaults) => {}` 

* When `options` is `null`/`undefined`, new `{}` is returned, applying `defaults` as specified.

* When `options` contains an unknown property, [Error] `Option "name" is not supported.` is thrown.

* When a property in `options` is missing or `undefined`, its value is set from the `defaults`,
provided it is available and not `undefined`.

* When `options` is not `null`/`undefined`, it must be of type `object`, or else [TypeError] is thrown:
`Invalid "options" parameter: value`.

* Parameter `defaults` is required, as a non-`null` object or an array of strings, or else [TypeError]
is thrown: `Invalid "defaults" parameter: value`.

[Error]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Error
[TypeError]:https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/TypeError
