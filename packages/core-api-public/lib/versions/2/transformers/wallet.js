'use strict';

/**
 * [description]
 * @param  {[type]} model [description]
 * @return {[type]}       [description]
 */
module.exports = (model) => {
  return {
    address: model.address,
    publicKey: model.publicKey,
    balance: model.balance,
    isDelegate: !!model.username
  }
}
