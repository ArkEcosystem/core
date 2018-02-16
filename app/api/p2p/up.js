const goofy = require('app/core/goofy')
const Hapi = require('hapi')

module.exports = class Up {
  constructor (config) {
    this.config = config
  }

  async start (p2p) {
    this.server = new Hapi.Server({ port: this.config.server.port })
    this.server.app.p2p = p2p

    await this.server.register({
      plugin: require('./plugins/accept-request')
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

      goofy.info(`Oh hapi day! P2P API is listening on ${this.server.info.uri}`)
    } catch (err) {
      goofy.error(err)

      process.exit(1)
    }
  }

  stop () {
    return this.server.stop()
  }
}