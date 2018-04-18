'use strict';

const { crypto } = require('@arkecosystem/client')
const { matcherHint, printExpected, printReceived } = require('jest-matcher-utils')
const getType = require('jest-get-type')

jest.setTimeout(10000)

expect.extend({
  toBeType (received, expected) {
    const type = getType(received)

    const pass = type === expected

    const message = pass
      ? () =>
        matcherHint('.not.toBeType', 'value', 'type') +
        '\n\n' +
        'Expected value to be of type:\n' +
        `  ${printExpected(expected)}\n` +
        'Received:\n' +
        `  ${printReceived(received)}\n`
      : () =>
        matcherHint('.toBeType', 'value', 'type') +
        '\n\n' +
        'Expected value to be of type:\n' +
        `  ${printExpected(expected)}\n` +
        'Received:\n' +
        `  ${printReceived(received)}\n` +
        'type:\n' +
        `  ${printReceived(type)}`

    return { pass, message }
  },
  toBeAddress (received, argument) {
    return {
      message: () => 'Expected value to be a valid address',
      pass: crypto.validateAddress(received, argument)
    }
  },
  toBePublicKey (received) {
    return {
      message: () => 'Expected value to be a valid public key',
      pass: crypto.getAddress(received).length === 34
    }
  }
})
