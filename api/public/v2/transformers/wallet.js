class WalletTransformer {
  constructor(model) {
    return {
      address: model.address,
    };
  }
}

module.exports = WalletTransformer
