'use strict'

const container = require('@arkecosystem/core-container')
const logger = container.resolvePlugin('logger')

module.exports = async (name, server) => {
  try {
    await server.start()

    logger.info(`${name} Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    container.forceExit(`Could not start ${name} Server!`, error)
  }
}
