const Bignum = require('bigi')
const { isString } = require('lodash')

// This one is nasty, but the default constants are internally
// constructed from a number instead of a string. This results
// in slightly different string representations, breaking a lot
// of tests which check for equality.
// Bignum.ZERO:       {"0": 0, "s": 0, "t": 0}
// new Bignum('0'):   {"s": 0, "t": 0}

Bignum.ZERO = new Bignum('0')
Bignum.ONE = new Bignum('1')

/**
 * Creates a new Bignum instance from a value which is either a string
 * or can be casted to a numeric string.
 * @param {String|Number|Object} value
 * @returns {Bignum}
 */
Bignum.from = (value) => {
  return new Bignum(isString(value) ? value : value.toString())
}

/**
 * Returns the actual number.
 * @returns {Number}
 */
Bignum.prototype.toNumber = function () {
  return +this.toString()
}

module.exports = Bignum
