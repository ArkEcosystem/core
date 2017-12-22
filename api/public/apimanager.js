const restify = require('restify')
const logger = require('../../core/logger')

const walletCtrlV1 = require('./v1/walletcontroller')
const autoLoaderCtrlV1 = require('./v1/loadercontroller')
const walletCtrlV2 = require('./v2/walletcontroller')
const autoLoaderCtrlV2 = require('./v2/loadercontroller')

class ApiManager {
  constructor (config, dbI) {
    this.port = config.server.api.port
    this.mount = config.server.api.mount
    this.config = config
    this.db = dbI
  }

  start () {
    if (!this.mount) {
      logger.info('Public API not mounted as not configured to do so')
      return
    }
    this.server = this.createPublicRESTServer()
  }

  createPublicRESTServer () {
    logger.debug('Starting to mount of Public API')

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
    walletCtrlV1.start(this.db, this.config, server)
    autoLoaderCtrlV1.start(this.db, this.config, server)
  }

  applyV2Routes (server) {
    walletCtrlV2.start(this.db, this.config, server)
    autoLoaderCtrlV2.start(this.db, this.config, server)
  }

  apiVersionCheck (req, res, next) {
    if (!req.header('accept-version')) {
      req.headers['accept-version'] = this.config.server.api.version
      logger.info('Client header for accept-version REST API undefined (header value accept-version missing).  Setting default config version', req.headers['accept-version'])
    }
    next()
  }

  isLocalhost (request) {
    const ip = request.connection.remoteAddress
    return ip === '::1' || ip === '127.0.0.1' || ip === '::ffff:127.0.0.1'
  }
}

module.exports = ApiManager
