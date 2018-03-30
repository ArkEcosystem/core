const logger = require('../../core/logger')
const Hapi = require('hapi')

module.exports = class Up {
  constructor (p2p, config) {
    this.p2p = p2p
    this.config = config
  }

  async start () {
    this.server = new Hapi.Server({ port: this.config.server.port })

    await this.server.register({
      plugin: require('./plugins/accept-request')
    })

    await this.server.register({
      plugin: require('./plugins/set-headers')
    })

    await this.server.register({
      plugin: require('./versions/internal'),
      routes: { prefix: '/internal' }
    })

    if (this.config.api.p2p.remoteinterface) {
      await this.server.register({
        plugin: require('./versions/remote'),
        routes: { prefix: '/remote' }
      })
    }

    await this.server.register({ plugin: require('./versions/1') })

    try {
      await this.server.start()

      logger.info(`Oh hapi day! P2P API is listening on ${this.server.info.uri}`)
    } catch (err) {
      logger.error(err)

      process.exit(1)
    }
  }

  stop () {
    return this.server.stop()
  }
}
