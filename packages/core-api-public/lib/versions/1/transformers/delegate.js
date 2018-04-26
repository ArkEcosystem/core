'use strict';

/**
 * [description]
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
