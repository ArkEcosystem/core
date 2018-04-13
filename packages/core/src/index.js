module.exports = {
  config: require('./core/config'),
  logger: require('./core/logger'),
  DBInterface: require('./core/dbinterface'),
  webhookManager: require('./core/managers/webhook'),

  utils: {
    forgerCrypto: require('./utils/forger-crypto'),
    delegateCalculator: require('./utils/delegate-calculator'),
  }
}
