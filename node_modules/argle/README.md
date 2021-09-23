# Argle [![Build Status](https://travis-ci.org/zackehh/argle.svg?branch=master)](https://travis-ci.org/zackehh/argle)

Argle is a very small argument shifting library for JavaScript which makes it easy to accept optional parameters **before** the end of your arguments list. It works great against things like destructuring in ES6, but is still usable from within ES5 versions of JavaScript.

### Installation

Argle lives on npm, so just install it via the command line and you're good to go. All other dependencies will be pulled automatically.

```
$ npm install --save argle
```

### Usage

The API is super simple, there's a single function `shift/3`:

```javascript
argle.shift(argumentsArray, [ optionalDefaultValues | optionalOptionsObject ], detectionFunction);

// argumentsArray           - your args list to shift (an array or arguments object)
// optionalDefaultValues    - a values list to shift with rather than 'undefined', this is the same as { defaults: optionalDefaultValues }
// optionalOptionsObject    - an object containing options
    // count                - the amount of arguments you desire (only useful with ...args syntax)
    // defaults             - a values list to shift with rather than 'undefined'
    // match                - the number of matches to require (in a row) before shifting (defaults to 1)
// detectionFunction        - a function which should return true when you've found your right-most argument
```

### Examples

```javascript
// Define a function which always has a callback, but two optional arguments
function myFunction(optionalArgument1, optionalArgument2, callbackFunction) {
  
}

// Typically you're stuck shifting these arguments manually:
function myFunction(optionalArgument1, optionalArgument2, callbackFunction) {
  if (isFunction(optionalArgument1)) {
    callbackFunction = optionalArgument1;
    optionalArgument2 = undefined;
    optionalArgument1 = undefined;
  }
  else if (isFunction(optionalArgument2)) {
    callbackFunction = optionalArgument2;
    optionalArgument2 = undefined;
  }
}

// Even in ES6, you can't use default arguments to assist with this.
// Calling myFunction(function () { }) would give you [ function () { }, { } ] as arguments.
function myFunction(optionalArgument1 = {}, optionalArgument2 = {}, callbackFunction) {
  // optionalArgument1 == function () { }
  // optionalArgument2 == { }
  // callbackFunction  == undefined;
}

// Argle aims to make this a little less awful (it's still gross though)
// In ES5, calling with: myFunction(function () { }):
function myFunction(optionalArgument1, optionalArgument2, callbackFunction) {
  var args1 = argle.shift([ optionalArgument1, optionalArgument2, callbackFunction ], isFunction);
  var args2 = argle.shift([ optionalArgument1, optionalArgument2, callbackFunction ], [ 1, 2 ], isFunction);
  var args3 = argle.shift([ optionalArgument1, optionalArgument2, callbackFunction ], [ {} ], isFunction);
  var args4 = argle.shift(arguments, { count: 3 }, isFunction);
  
  // args1 == [ undefined, undefined, function () { })
  // args2 == [ 1, 2, function () { })
  // args3 == [ undefined, {}, function () { })
  // args4 == [ undefined, undefined, function () { })
}

// In ES6, calling with: myFunction(function () { }):
// Note that you should provide 'count' as an option to inform how many arguments you're wanting
function myFunction(...argList) {
  let optionalArgument1, optionalArgument2, callbackFunction, opts = {
    count: 3,
    defaults: [ {}, {} ]
  };
  
  [ optionalArgument1, optionalArgument2, callbackFunction ] = argle.shift(argList, opts, isFunction);
  // or [ optionalArgument1 = {}, optionalArgument2 = {}, callbackFunction ] = argle.shift(argList, { count: 3 }, isFunction);
}

// Match counts can be used to determine how many must match (in a row) before shifting:
// Here's an example of when you would use a custom match count:
function myFunction(optionalArgument1, optionalArgument2, callbackFunction1, callbackFunction2) {
  return argle.shift([ optionalArgument1, optionalArgument2, callbackFunction1, callbackFunction2 ], { match: 2 }, isFunction);
  
  // myFunction(function () { }, function () { }) == [ undefined, undefined, function () { }, function () { })
  // myFunction(1, function () { }, function () { }) == [ 1, undefined, function () { }, function () { })
  // myFunction(1, 2, function () { }, function () { }) == [ 1, 2, function () { }, function () { })
  // myFunction(1, function () { }, 2, function () { }) == [ 1, function () { }, 2, function () { })
}
```
