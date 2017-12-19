const restify = require('restify')
const logger = require('../../core/logger')
// const blockchain = require('../../core/blockchainManager')
const accountsRouterV1 = require('./v1/accounts')
const autoLoaderRouter = require('./loader')

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

    this.createPublicRESTServer({name: 'arkpublic'})
  }

  createPublicRESTServer (options) {
    logger.debug('Mounting of Public API started')

    // let router = new Router()
    let server = restify.createServer({name: 'arkpublic'})
    // server.use((req, res, next) => this.acceptRequest(req, res, next))
    server.use(restify.plugins.bodyParser({mapParams: true}))
    server.use(restify.plugins.queryParser())
    server.use(restify.plugins.gzipResponse())

    this.applyV1Routes(server)

    server.listen(this.port, () => {
      logger.info('%s interface listening at %s', server.name, server.url)
      logger.info('Public API successfully mounted')
    })
  }

  applyV1Routes(server) {
    // ROUTES FOR V1 - API REPLICATION
    accountsRouterV1.applyRoutes(server, 'api/public/v1')
    autoLoaderRouter.applyRoutes(server, 'api/loader')
    // TODO add other API routes here
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }
}

module.exports = PublicAPI
