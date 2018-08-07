const request = require('./request')
const logger = require('./logger')

module.exports = async () => {
  try {
    return (await request.get('/api/v2/node/configuration')).data.data.constants
  } catch (error) {
    logger.error(`Failed to get constants: ${error.message}`)
    return {}
  }
}
