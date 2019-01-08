const { bignumify } = require('@arkecosystem/core-utils')

/**
 * Turns a "wallet" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => ({
  address: model.address,
  publicKey: model.publicKey,
  username: model.username,
  secondPublicKey: model.secondPublicKey,
  balance: +bignumify(model.balance).toFixed(),
  isDelegate: !!model.username,
})
