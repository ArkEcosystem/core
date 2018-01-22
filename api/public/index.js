const logger = requireFrom('core/logger')
const fs = require('fs')
const path = require('path')
const restify = require('restify')

const RouteRegistrar = require('../registrars/route')

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
    if (!this.config.server.api.mount) return logger.info('Public API not mounted as not configured to do so')

    this
      .createServer()
      .then(server => (this.server = server))
      .then(() => this.registerPlugins())
      .then(() => this.registerRouters())
      .then(() => this.startServer())
  }

  createServer () {
    return Promise.resolve(restify.createServer({
      name: 'ARK Core - Public API',
      handleUncaughtExceptions: true
    }))
  }

  registerPlugins () {
    this.server
      .pre((req, res, next) => VersionPlugin(req, res, next))
      .use((req, res, next) => new Throttle(this.config.server.api.throttle).mount(req, res, next))
      .use(restify.plugins.bodyParser({ mapParams: true }))
      .use(restify.plugins.queryParser())
      .use(restify.plugins.gzipResponse())
      .use((req, res, next) => new Validator().mount(req, res, next))
      .use((req, res, next) => new State().mount(req, res, next))

    if (this.config.server.api.cache) {
      this.server
        .use((req, res, next) => Cache.before(req, res, next))
        .on('after', Cache.after)
    }
  }

  registerRouters () {
    this.registerVersion('v1', '1.0.0')
    this.registerVersion('v2', '2.0.0')
  }

  startServer () {
    this.server
      .on('uncaughtException', (req, res, route, error) => {
        const version = { '1.0.0': 'v1', '2.0.0': 'v2' }[req.version()]
        const helpers = require(`./${version}/helpers`)

        version === 'v1'
          ? helpers.respondWith('error', error.message)
          : helpers.respondWith('InternalServer', error.message)

        return true
      })
      .listen(this.config.server.api.port, () => logger.info(`[${this.server.name}] listening on [${this.server.url}] 📦`))
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
