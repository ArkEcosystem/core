const restify = require('restify')
const logger = require('../../core/logger')

const accountsRouterV1 = require('./v1/accounts')
const autoLoaderRouterV1 = require('./v1/loader')
const accountsRouterV2 = require('./v2/accounts')
const autoLoaderRouterV2 = require('./v2/loader')

const API_PREFIX = 'api'

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

    this.server = this.createPublicRESTServer()
  }

  createPublicRESTServer () {
    logger.debug('Mounting of Public API started')

    // let router = new Router()
    let server = restify.createServer({name: 'arkpublic'})
    // server.use((req, res, next) => this.acceptRequest(req, res, next))

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
    // ROUTES FOR V1 - API REPLICATION
    accountsRouterV1.applyRoutes(server, API_PREFIX)
    autoLoaderRouterV1.applyRoutes(server, API_PREFIX)
    // TODO add other API routes here
  }

  applyV2Routes (server) {
    // ROUTES FOR V1 - API REPLICATION
    accountsRouterV2.applyRoutes(server, API_PREFIX)
    autoLoaderRouterV2.applyRoutes(server, API_PREFIX)
    // TODO add other API routes here
  }

  apiVersionCheck (req, res, next) {
    if (!req.header('accept-version')) {
      // if url is not fixed with version - i.e. different from /api/v2m then - we set accept-version to default as specified in config.api.version
      if (!req.url.match(/^\/api\/v[1-9]\/.+$/)) {
        req.headers['accept-version'] = this.config.server.api.version
        logger.info('Client header for Accept-version API undefined (neither uri, or header value), Setting config version', req.headers['accept-version'])
      }
    }
    next()
  }

  isLocalhost (req) {
    return req.connection.remoteAddress === '::1' || req.connection.remoteAddress === '127.0.0.1' || req.connection.remoteAddress === '::ffff:127.0.0.1'
  }
}

module.exports = PublicAPI
