'use strict'

module.exports = (actual, expected) => {
  const allowed = ['id', 'version', 'timestamp', 'previousBlock', 'height', 'numberOfTransactions', 'totalAmount', 'totalFee', 'reward', 'payloadLength', 'payloadHash', 'generatorPublicKey', 'blockSignature']
  const notAllowed = ['createdAt', 'updatedAt']

  return {
    message: () => `Expected ${JSON.stringify(actual)} to be a block table row`,
    pass: allowed.every(key => actual.hasOwnProperty(key)) && notAllowed.every(key => !actual.hasOwnProperty(key))
  }
}
