const restify = require('restify')
const logger = require('../../core/logger')

const walletRouterV1 = require('./v1/walletrouter')
const autoLoaderRouterV1 = require('./v1/loader')
const walletRouterV2 = require('./v2/walletrouter')
const autoLoaderRouterV2 = require('./v2/loader')

const API_PREFIX = 'api/'
let db = null

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
    //db = dbInterface
    this.server = this.createPublicRESTServer()
  }

  createPublicRESTServer () {
    logger.debug('Mounting of Public API started')

    // let router = new Router()
    let server = restify.createServer({name: 'arkpublic'})

    server.pre((req, res, next) => this.apiVersionCheck(req, res, next))
    server.use(restify.plugins.bodyParser({mapParams: true}))
    server.use(restify.plugins.queryParser())
    server.use(restify.plugins.gzipResponse())

    this.applyV1Routes(server)
    this.applyV2Routes(server)

    server.listen(this.port, () => {
      logger.info('Public API successfully mounted')
      logger.info('%s interface listening at %s', server.name, server.url)
    })

    return server
  }

  applyV1Routes (server) {
    walletRouterV1.applyRoutes(server, API_PREFIX + 'accounts')
    autoLoaderRouterV1.applyRoutes(server, API_PREFIX + 'loader')
    // TODO add other API routes here
  }

  applyV2Routes (server) {
    walletRouterV2.applyRoutes(server, API_PREFIX + 'wallet')
    autoLoaderRouterV2.applyRoutes(server, API_PREFIX + 'loader')
    // TODO add other API routes here
  }

  apiVersionCheck (req, res, next) {
    if (!req.header('accept-version')) {
      req.headers['accept-version'] = this.config.server.api.version
      logger.info('Client header for accept-version REST API undefined (header value accept-version missing).  Setting default config version', req.headers['accept-version'])
    }
    next()
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }
}

module.exports = PublicAPI
