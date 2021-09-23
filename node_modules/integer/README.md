# integer [![Build Status](https://travis-ci.org/JoshuaWise/integer.svg?branch=master)](https://travis-ci.org/JoshuaWise/integer)

Native 64-bit signed integers in Nodejs.

- All standard operators (arithmetic, bitwise, logical)
- Protection from overflow and unsafe numbers
- Always immutable
- Other useful utilities

## Installation

```bash
npm install --save integer
```

## Usage

```js
var Integer = require('integer');

var a = Integer('7129837312139827189');
var b = a.subtract(1).shiftRight(3);
assert(b.equals('891229664017478398'));
```

## Overflow protection

We will not let you perform operations that would result in overflow. If you try to create an `Integer` that cannot be represented in 64-bits (signed), we will throw a `RangeError`.

```js
// These will each throw a RangeError
var tooBig = Integer(13897283129).multiply(13897283129);
var tooSmall = Integer.MIN_VALUE.subtract(1);
var divideByZero = Integer(123).divide(0);
var alsoTooBig = Integer('4029384203948203948923');

// You are also protected against two's complement overflow (this will throw a RangeError)
var twosComplement = Integer.MIN_VALUE.divide(-1);
```

## Unsafe number protection

It's easy to convert between me and regular JavaScript numbers.

```js
var int = Integer(12345);
assert(int instanceof Integer);

var num = Number(int); // same as int.toNumber()
assert(typeof num === 'number');
```

However, we will prevent you from converting an `Integer` to an unsafe number, and vice-versa. To learn more about unsafe numbers, [click here](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Number/isSafeInteger).

```js
// This will throw a RangeError
var unsafe = Integer(Number.MAX_SAFE_INTEGER + 1);

// This is okay
var int = Integer(Number.MAX_SAFE_INTEGER).plus(1);

// But this will throw a RangeError
var unsafe = int.toNumber();
```

# API

### Integer(*value*) -> *Integer*

Casts a value to an `Integer`. If the value cannot be converted safely and losslessly, a `RangeError` is thrown.

```js
var a = Integer();
var b = Integer(12345);
var c = Integer('12345');
assert(a.equals(0));
assert(b.equals(c));
```

### Integer.fromNumber(*number*, [*defaultValue*]) -> *Integer*

Casts a regular number to an `Integer`.

If the number is unsafe the `defaultValue` is used instead (or a `RangeError` is thrown if no `defaultValue` was provided).

```js
Integer.fromNumber(12345, 0); // results in Integer(12345)
Integer.fromNumber(Number.MAX_SAFE_INTEGER + 1, 0); // results in Integer(0)
```

### Integer.fromString(*string*, [*radix*, [*defaultValue*]]) -> *Integer*

Casts a string to an `Integer`. The string is assumed to be [base-10](https://en.wikipedia.org/wiki/Radix) unless a different `radix` is specified.

If conversions fails the `defaultValue` is used instead (or a `RangeError` is thrown if no `defaultValue` was provided).

```js
var hexColor = 'ff55dd';
var int = Integer.fromString(hexColor, 16, 'ffffff');
```

### Integer.fromBits(*lowBits*, [*highBits*]) -> *Integer*

Creates an `Integer` by concatenating two regular 32-bit signed integers. The `highBits` are optional and default to `0`.

```js
var int = Integer.frombits(0x40, 0x20);
int.toString(16); // => '2000000040'
```

## Arithmetic operations

#### &nbsp;&nbsp;&nbsp;&nbsp;.add/plus(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.subtract/sub/minus(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.multiply/mul/times(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.divide/div/divideBy/dividedBy/over(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.modulo/mod(*other*) -> *Integer*

Performs the arithmetic operation and returns a new `Integer`. The argument must either be a number, a base-10 string, or an `Integer`. If the operation results in overflow, a `RangeError` is thrown.

#### &nbsp;&nbsp;&nbsp;&nbsp;.negate/neg() -> *Integer*

Returns the unary negation (`-value`) of the `Integer`.

#### &nbsp;&nbsp;&nbsp;&nbsp;.abs/absoluteValue() -> *Integer*

Returns the absolute value of the `Integer`.

## Bitwise operations

#### &nbsp;&nbsp;&nbsp;&nbsp;.and(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.or(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.xor(*other*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.not() -> *Integer*

Performs the bitwise operation and returns a new `Integer`. The argument must either be a number, a base-10 string, or an `Integer`.

#### &nbsp;&nbsp;&nbsp;&nbsp;.shiftLeft/shl(*numberOfBits*) -> *Integer*
#### &nbsp;&nbsp;&nbsp;&nbsp;.shiftRight/shr(*numberOfBits*) -> *Integer*

Shifts the `Integer` by specified number of bits and returns the result.

## Logical operations

#### &nbsp;&nbsp;&nbsp;&nbsp;.equals/eq/isEqualTo(*other*) -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.notEquals/neq/isNotEqualTo/doesNotEqual(*other*) -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.greaterThan/gt/isGreaterThan(*other*) -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.lessThan/lt/isLessThan(*other*) -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.greaterThanOrEquals/gte/isGreaterThanOrEqualTo(*other*) -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.lessThanOrEquals/lte/isLessThanOrEqualTo(*other*) -> *boolean*

Performs the logical operation and returns `true` or `false`. The argument must either be a number, a base-10 string, or an `Integer`.

#### &nbsp;&nbsp;&nbsp;&nbsp;.compare(*other*) -> *number*

Compares the value of the `Integer` and `other`, resulting in:
- `-1` if `this` is less than `other`
- `1` if `this` is greater than `other`
- `0` if `this` is equal to `other`

## Converting to other values

#### &nbsp;&nbsp;&nbsp;&nbsp;.toString([*radix*]) -> *string*

Converts the `Integer` to a string. A base-10 string is returned unless a different `radix` is specified.

#### &nbsp;&nbsp;&nbsp;&nbsp;.valueOf/toNumber() -> *number*

Converts the `Integer` to a regular number. If the `Integer` is not within the safe range, a `RangeError` is thrown.

#### &nbsp;&nbsp;&nbsp;&nbsp;.toNumberUnsafe() -> *number*

Converts the `Integer` to a regular number, **even if the conversion would result in a loss of precision**. This method will never throw an error.

## Other utility

#### &nbsp;&nbsp;&nbsp;&nbsp;.bitSizeAbs() -> *number*

Returns the number of bits necessary to hold the absolute value of the `Integer`.

```js
Integer(0).bitSizeAbs(); // => 1
Integer(128).bitSizeAbs(); // => 8
Integer(-255).bitSizeAbs(); // => 8
Integer.fromString('4fffffffffff', 16).bitSizeAbs(); // => 47
```

#### &nbsp;&nbsp;&nbsp;&nbsp;.isEven() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isOdd() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isPositive() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isNegative() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isZero() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isNonZero/isNotZero() -> *boolean*

These methods are self-explanatory.

#### &nbsp;&nbsp;&nbsp;&nbsp;.isSafe() -> *boolean*
#### &nbsp;&nbsp;&nbsp;&nbsp;.isUnsafe() -> *boolean*

Returns whether or not the `Integer` is within the safe range. If it's not within the safe range, trying to convert it to a regular number would result in a `RangeError` being thrown.

The safe range is defined as `n >= Number.MIN_SAFE_INTEGER && n <= Number.MAX_SAFE_INTEGER`.

#### Integer.isInstance(*value*) -> *boolean*

Determines if the given value is an `Integer` object.

#### Getters

- **.low -> _number_** - the lower 32-bits of the `Integer`
- **.high -> _number_** - the upper 32-bits of the `Integer`

#### Constants

- **Integer.MAX_VALUE** - maximum value of an `Integer`
- **Integer.MIN_VALUE** - minimum value of an `Integer`
- **Integer.ZERO** - an `Integer` with a value of `0`
- **Integer.ONE** - an `Integer` with a value of `1`
- **Integer.NEG_ONE** - an `Integer` with a value of `-1`

## License

[MIT](https://github.com/JoshuaWise/integer/blob/master/LICENSE)
