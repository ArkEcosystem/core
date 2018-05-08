'use strict'

const { VOTE } = require('@arkecosystem/client').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid VOTE transaction.',
    pass: received.type === VOTE
  }
}
