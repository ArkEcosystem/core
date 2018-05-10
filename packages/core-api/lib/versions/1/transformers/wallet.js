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
    secondPublicKey: model.secondPublicKey,
    vote: model.vote,
    username: model.username,
    balance: model.balance,
    votebalance: model.votebalance
  }
}
