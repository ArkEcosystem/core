'use strict'

/**
 * Turns a "delegate" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = (model) => {
  return {
    username: model.username,
    address: model.address,
    publicKey: model.publicKey,
    vote: model.vote,
    producedblocks: model.producedblocks,
    missedblocks: model.missedblocks,
    rate: model.rate,
    approval: model.approval,
    productivity: model.productivity
  }
}
