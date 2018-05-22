'use strict'

const { IPFS } = require('@arkecosystem/crypto').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid IPFS transaction.',
    pass: received.type === IPFS
  }
}
