module.exports = {
  config: require('./core/config'),
  logger: require('./core/logger'),
  DBInterface: require('./core/dbinterface'),
  webhookManager: require('./core/managers/webhook')
}
