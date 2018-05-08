'use strict'

const { DELEGATE } = require('@arkecosystem/client').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid DELEGATE transaction.',
    pass: received.type === DELEGATE
  }
}
