const { readConfig, writeConfig } = require('commander/utils')

module.exports = async () => {
  let config = readConfig('api/public')
  config.cache.enabled = true

  return writeConfig('api/public', config)
}
