const { crypto } = require('@phantomchain/crypto')

/**
 * Verify if the given value is an phantom address.
 * @param  {String} received
 * @param  {String} argument
 * @return {Boolean}
 */
const toBePhanomAddress = (received, argument) => ({
  message: () => 'Expected value to be a valid address',
  pass: crypto.validateAddress(received, argument),
})

expect.extend({
  toBePhanomAddress,
})
