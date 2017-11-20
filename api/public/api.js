const restify = require('restify')
const logger = require('../../core/logger')
const blockchain = require('../../core/blockchainManager')

class PublicAPI {
  constructor (config) {
    this.port = config.server.api.port
    this.mount = config.server.api.mount
    this.config = config
  }

  start () {
    if (!this.mount) {
      logger.info('Public API not mounted as not configured to do so')
      return
    }
    let server = restify.createServer({name: 'arkpublic'})
    // server.use((req, res, next) => this.acceptRequest(req, res, next))
    server.use(restify.plugins.bodyParser({mapParams: true}))
    server.use(restify.plugins.queryParser())
    server.use(restify.plugins.gzipResponse())

    this.mountPublicAPI(server)

    server.listen(this.port, () => {
      logger.info('%s interface listening at %s', server.name, server.url)
    })
  }

  mountPublicAPI (server) {
    server.get('/api/loader/autoconfigure', (req, res, next) => this.getAutoConfigure(req, res, next))
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }

  getAutoConfigure (req, res, next) {
    res.send(200, {
      success: true,
      network: this.config.network
    })
    next()
  }
}

module.exports = PublicAPI
