# decache

[![Build Status](https://travis-ci.org/dwyl/decache.svg)](https://travis-ci.org/dwyl/decache)
[![codecov.io](https://codecov.io/github/dwyl/decache/coverage.svg?branch=master)](https://codecov.io/github/dwyl/decache?branch=master)
[![Code Climate](https://codeclimate.com/github/dwyl/decache/badges/gpa.svg)](https://codeclimate.com/github/dwyl/decache)
[![Dependency Status](https://david-dm.org/dwyl/decache.svg)](https://david-dm.org/dwyl/decache)
[![devDependency Status](https://david-dm.org/dwyl/decache/dev-status.svg)](https://david-dm.org/dwyl/decache#info=devDependencies)

In node.js when you `require()` a module, node stores a cached version of the
module, so that all subsequent calls to `require()` do not have to reload
the module from the filesystem.

`decache` ( _**De**lete **Cache**_ ) lets you delete modules from node.js `require()` cache
this is useful when _**testing**_ your modules/projects.

## Why?

When testing our modules we often need to re-require the module being tested.
This makes it easy.

## What?

An easy way to delete a cached module.

## How? (_usage_)

### install

Install the module from npm:

```sh
npm install decache --save-dev
```

### Use it in your code:

```js
// require the decache module:
var decache = require('decache');

// require a module that you wrote"
var mymod = require('./mymodule.js');

// use your module the way you need to:
console.log(mymod.count()); // 0   (the initial state for our counter is zero)
console.log(mymod.incrementRunCount()); // 1

// delete the cached module:
decache('./mymodule.js');

//
mymod = require('./mymodule.js'); // fresh start
console.log(mymod.count()); // 0   (back to initial state ... zero)
```

Modules other than `.js`, like for example, `.jsx`, are supported as well.

If you have any questions or need more examples, please create a GitHub issue:
https://github.com/nelsonic/decache/issues

***Thanks***!
