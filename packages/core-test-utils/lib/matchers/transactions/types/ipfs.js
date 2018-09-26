'use strict'

const { IPFS } = require('@arkecosystem/crypto').constants

const toBeIpfsType = (received) => {
  return {
    message: () => 'Expected value to be a valid IPFS transaction.',
    pass: received.type === IPFS
  }
}

expect.extend({
  toBeIpfsType
})
