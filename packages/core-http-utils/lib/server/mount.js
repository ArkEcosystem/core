const app = require('@arkecosystem/core-container')

const logger = app.resolvePlugin('logger')

module.exports = async (name, server) => {
  try {
    await server.start()

    logger.info(`${name} Server running at: ${server.info.uri}`)

    return server
  } catch (error) {
    app.forceExit(`Could not start ${name} Server!`, error)
  }
}
