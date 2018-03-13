const utils = require('app/wizard/utils')

module.exports = async () => {
  let config = utils.readConfig('api/public')
  config.cache.enabled = false

  return utils.writeConfig('api/public', config)
}
