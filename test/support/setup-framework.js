const arkjs = require('arkjs')
const { matcherHint, printExpected, printReceived } = require('jest-matcher-utils')
const getType = require('jest-get-type')

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
      pass: arkjs.crypto.validateAddress(received, argument)
    }
  },
  toBePublicKey (received) {
    return {
      message: () => 'Expected value to be a valid public key',
      pass: arkjs.crypto.getAddress(received).length === 34
    }
  }
})
