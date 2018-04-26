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
    balance: model.balance
  }
}
