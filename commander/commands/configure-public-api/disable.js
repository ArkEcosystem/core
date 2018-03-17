const { readConfig, writeConfig } = require('../../utils')

module.exports = async () => {
  let config = readConfig('api/public')
  config.cache.enabled = false

  return writeConfig('api/public', config)
}
