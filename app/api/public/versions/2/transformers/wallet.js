module.exports = async (model) => {
  return {
    address: model.address,
    public_key: model.publicKey,
    balance: model.balance,
    is_delegate: !!model.username
  }
}
