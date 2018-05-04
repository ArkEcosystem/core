'use strict'

/**
 * Turns a "wallet" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  return {
    address: model.address,
    publicKey: model.publicKey,
    balance: model.balance,
    isDelegate: !!model.username
  }
}
