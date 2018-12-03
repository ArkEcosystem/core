/**
 * Turns a "voter" object into a generic object.
 * @param  {Object} model
 * @return {Object}
 */
module.exports = model => ({
  username: model.username,
  address: model.address,
  publicKey: model.publicKey,
  balance: `${model.balance}`,
})
