module.exports = {
  // Client...
  client: require('./client'),

  // Models...
  models: {
    Block: require('./models/block'),
    Delegate: require('./models/delegate'),
    Transaction: require('./models/transaction'),
    Wallet: require('./models/wallet')
  },

  // Identities...
  identities: {
    address: require('./identities/address'),
    keys: require('./identities/keys'),
    privateKey: require('./identities/private-key'),
    publicKey: require('./identities/public-key'),
    wif: require('./identities/wif')
  },

  // Builder...
  transactionBuilder: require('./builder'),

  // Crypto...
  ...require('./crypto'),

  // Managers...
  configManager: require('./managers/config'),
  feeManager: require('./managers/fee'),
  NetworkManager: require('./managers/network'),
  dynamicFeeManager: require('./managers/dynamic-fee'),

  // Constants...
  constants: require('./constants'),

  // Utils...
  ...require('./utils'),

  // Validations
  ...require('./validation')
}
