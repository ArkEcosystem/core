const utils = require('app/wizard/utils')

module.exports = async () => {
  let config = utils.readConfig('api/public')
  config.cache.enabled = true

  return utils.writeConfig('api/public', config)
}
