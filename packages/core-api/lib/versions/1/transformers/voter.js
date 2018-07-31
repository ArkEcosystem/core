'use strict'

/**
 * Turns a "voter" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  return {
    username: model.username,
    address: model.address,
    publicKey: model.publicKey,
    balance: model.balance + ''
  }
}
