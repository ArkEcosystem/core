module.exports = async (model) => {
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
