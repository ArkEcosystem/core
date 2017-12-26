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
    this.server = restify.createServer({name: 'arkpublic'})
    // server.use((req, res, next) => this.acceptRequest(req, res, next))
    this.server.use(restify.plugins.bodyParser({mapParams: true}))
    this.server.use(restify.plugins.queryParser())
    this.server.use(restify.plugins.gzipResponse())

    this.mountPublicAPI()

    this.server.listen(this.port, () => {
      logger.info('%s interface listening at %s', this.server.name, this.server.url)
    })
  }

  mountPublicAPI () {
    this.server.get('/api/loader/autoconfigure', (req, res, next) => this.getAutoConfigure(req, res, next))
  }

  isLocalhost (request) {
    const ip = request.connection.remoteAddress
    return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'
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
