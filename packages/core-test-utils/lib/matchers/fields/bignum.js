'use strict'

const Bignum = require('bigi')
const { isString, isNumber } = require('lodash')

/**
 * Verify if the given Bignum matches the value.
 * @param  {Bignum} received
 * @param  {Bignum|Number|String} argument
 * @return {Boolean}
 */
module.exports = (received, argument) => {
  if (isString(argument)) {
    argument = new Bignum(argument)
  } else if (isNumber(argument)) {
    argument = new Bignum(argument.toString())
  } else if (!(argument instanceof Bignum)) {
    argument = null
  }

  return {
    message: () => 'Expected value does not match received Bignum.',
    pass: argument && received.equals(argument)
  }
}
