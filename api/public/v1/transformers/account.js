class AccountTransformer {
  constructor(model) {
    return {
      address: model.address,
    };
  }
}

module.exports = AccountTransformer
