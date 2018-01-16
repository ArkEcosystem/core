const logger = requireFrom('core/logger')
const fs = require('fs')
const path = require('path')
const restify = require('restify')
const RouteRegistrar = require('../registrar')

const Throttle = require('../plugins/throttle')
const Validator = require('../plugins/validator')
const Cache = require('../plugins/cache')

class PublicAPI {
  constructor (config) {
    this.config = config
  }

  mount () {
    if (!this.config.server.api.mount) {
      logger.info('Public API not mounted as not configured to do so')
      return
    }

    if (!this.throttle) {
      this.throttle = new Throttle(this.config.server.api.throttle)
    }

    if (!this.validator) {
      this.validator = new Validator()
    }

    this.createServer()
    this.registerPlugins()
    this.registerRouters()
    this.startServer()
  }

  createServer () {
    this.server = restify.createServer({
      name: 'ARK Core - Public API'
    })
  }

  registerPlugins () {
    this.server.pre((req, res, next) => this.setDefaultVersion(req, res, next))

    this.server.use((req, res, next) => this.throttle.mount(req, res, next))

    this.server.use(restify.plugins.bodyParser({
      mapParams: true
    }))

    this.server.use(restify.plugins.queryParser())

    this.server.use(restify.plugins.gzipResponse())

    this.server.use((req, res, next) => this.validator.mount(req, res, next))

    if (this.config.server.redis.enabled) {
      this.server.use(Cache.before)
      this.server.on('after', Cache.after)
    }
  }

  registerRouters () {
    this.registerVersion('v1', '1.0.0')
    this.registerVersion('v2', '2.0.0')
  }

  startServer () {
    this.server.listen(this.config.server.api.port, () => {
      logger.info('ARK Core - Public API - Mounted')
      logger.info('[%s] listening at [%s].', this.server.name, this.server.url)
    })
  }

  setDefaultVersion (req, res, next) {
    let version = req.header('Accept-Version') || req.header('accept-version');

    if (!version) {
      req._version = this.config.server.api.version

      logger.debug('Accept-Version Header is undefined. Using [' + req._version + '] as default.')
    }

    if (req.version().startsWith('~')) {
      req._version = {
        1: '1.0.0',
        2: '2.0.0'
      }[version.charAt(1)];
    }

    next()
  }

  registerVersion (directory, version) {
    directory = path.resolve(__dirname, directory + '/routers')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        require(directory + '/' + file).register(
          new RouteRegistrar(this.server, version)
        )
      }
    })
  }
}

module.exports = PublicAPI
