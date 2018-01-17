const logger = requireFrom('core/logger')
const fs = require('fs')
const path = require('path')
const restify = require('restify')

const RouteRegistrar = require('../registrars/route')
const PluginRegistrar = require('../registrars/plugin')

const Throttle = require('../plugins/throttle')
const Validator = require('../plugins/validator')
const Cache = require('../plugins/cache')
const State = require('../plugins/state')
const VersionPlugin = require('../plugins/version')

class PublicAPI {
  constructor (config) {
    this.config = config
  }

  mount () {
    if (!this.config.server.api.mount) {
      logger.info('Public API not mounted as not configured to do so')
      return
    }

    this.createServer()
    this.registerPlugins()
    this.registerRouters()
    this.startServer()
  }

  createServer () {
    this.server = restify.createServer({ name: 'ARK Core - Public API' })
  }

  registerPlugins () {
    const registrar = new PluginRegistrar(this.server)

    registrar
      .pre(VersionPlugin)
      .use(new Throttle(this.config.server.api.throttle).mount)
      .use(restify.plugins.bodyParser({ mapParams: true }), true)
      .use(restify.plugins.queryParser(), true)
      .use(restify.plugins.gzipResponse(), true)
      .use(new Validator().mount)
      .use(new State().mount)

    if (this.config.server.redis.enabled) {
      const cache = new Cache()

      registrar
        .use(cache.before)
        .on('after', cache.after)
    }
  }

  registerRouters () {
    this.registerVersion('v1', '1.0.0')
    this.registerVersion('v2', '2.0.0')
  }

  startServer () {
    this.server.listen(this.config.server.api.port, () => {
      logger.info(`[${this.server.name}] listening at [${this.server.url}] 📦`)
    })
  }

  registerVersion (directory, version) {
    const registrar = new RouteRegistrar(this.server, version)

    directory = path.resolve(__dirname, directory + '/routers')

    fs.readdirSync(directory).forEach(file => {
      if (file.indexOf('.js') !== -1) {
        require(directory + '/' + file)(registrar)
      }
    })
  }
}

module.exports = PublicAPI
