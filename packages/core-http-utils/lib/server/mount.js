'use strict'

const logger = require('@arkecosystem/core-container').resolvePlugin('logger')

module.exports = async (name, server) => {
  try {
    await server.start()

    logger.info(`${name} Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    logger.error(error.stack)

    process.exit(1)
  }
}
