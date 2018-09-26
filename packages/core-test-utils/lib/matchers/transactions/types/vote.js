'use strict'

const { VOTE } = require('@arkecosystem/crypto').constants

const toBeVoteType = (received) => {
  return {
    message: () => 'Expected value to be a valid VOTE transaction.',
    pass: received.type === VOTE
  }
}

expect.extend({
  toBeVoteType
})
