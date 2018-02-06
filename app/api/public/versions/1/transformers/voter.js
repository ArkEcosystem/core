module.exports = async (model) => {
  return {
    username: model.username,
    address: model.address,
    publicKey: model.publicKey,
    balance: model.balance
  }
}
