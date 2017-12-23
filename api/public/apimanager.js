const restify = require('restify')
const logger = require('../../core/logger')
const config = require('../../core/config')
const WalletCtrlV1 = require('./v1/walletcontroller')
const LoaderCtrlV1 = require('./v1/loadercontroller')
const walletCtrlV2 = require('./v2/walletcontroller')
const autoLoaderCtrlV2 = require('./v2/loadercontroller')

class ApiManager {
  start () {
    if (!config.server.api.mount) {
      logger.info('Public API not mounted as not configured to do so')
      return
    }
    this.createPublicRESTServer()
  }

  createPublicRESTServer () {
    logger.debug('Starting to mount of Public API')

    // let router = new Router()
    this.server = restify.createServer({name: 'arkpublic'})

    this.server.pre((req, res, next) => this.apiVersionCheck(req, res, next))
    this.server.use(restify.plugins.bodyParser({mapParams: true}))
    this.server.use(restify.plugins.queryParser())
    this.server.use(restify.plugins.gzipResponse())

    this.applyV1Routes()
    this.applyV2Routes()

    this.server.listen(config.server.api.port, () => {
      logger.info('Public API successfully mounted')
      logger.info('%s interface listening at %s', this.server.name, this.server.url)
    })
  }

  applyV1Routes () {
    this.wallet = new WalletCtrlV1(this.server)
    this.wallet.initRoutes('api/accounts')

    this.loader = new LoaderCtrlV1(this.server)
    this.loader.initRoutes('api/loader')
  }

  applyV2Routes () {
    // TODO when v2...
    walletCtrlV2.start(this.server)
    autoLoaderCtrlV2.start(this.server)
  }

  apiVersionCheck (req, res, next) {
    if (!req.header('accept-version')) {
      req.headers['accept-version'] = config.server.api.version
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
