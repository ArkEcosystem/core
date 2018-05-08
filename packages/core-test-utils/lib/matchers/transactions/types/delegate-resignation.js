'use strict'

const { DELEGATE_RESIGNATION } = require('@arkecosystem/client').constants

module.exports = (received) => {
  return {
    message: () => 'Expected value to be a valid DELEGATE_RESIGNATION transaction.',
    pass: received.type === DELEGATE_RESIGNATION
  }
}
