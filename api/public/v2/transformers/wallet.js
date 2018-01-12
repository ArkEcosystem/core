class WalletTransformer {
  constructor(model) {
    return {
      address: model.address,
      public_key: model.publicKey,
      balance: model.balance,
    };
  }
}

module.exports = WalletTransformer
