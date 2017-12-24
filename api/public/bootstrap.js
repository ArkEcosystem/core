const logger = require(__root + 'core/logger')
const fs = require('fs')
const restify = require('restify')
const RouteRegistrar = require('./registrar')

class PublicAPI {
    constructor(config) {
        this.config = config
    }

    mount() {
        this.createServer()
        this.registerPlugins()
        this.registerRouters()
        this.startServer()
    }

    createServer() {
        this.server = restify.createServer({
            name: 'ARK Core - Public API'
        })
    }

    registerPlugins() {
        this.server.pre((req, res, next) => this.setDefaultVersion(req, res, next))
        this.server.use(restify.plugins.bodyParser({
            mapParams: true
        }))
        this.server.use(restify.plugins.queryParser())
        this.server.use(restify.plugins.gzipResponse())
    }

    registerRouters() {
        this.registerVersion('v1', '1.0.0')
        this.registerVersion('v2', '2.0.0')
    }

    startServer() {
        this.server.listen(this.config.server.api.port, () => {
            console.log('ARK Core - Public API - Mounted')
            console.log('[%s] listening at [%s].', this.server.name, this.server.url)
        })
    }

    setDefaultVersion(req, res, next) {
        if (!req.header('accept-version')) {
            req.headers['accept-version'] = this.config.server.api.version

            logger.info('Accept-Version Header is undefined. Using [' + req.headers['accept-version'] + '] as default.')
        }

        next()
    }

    registerVersion(directory, version) {
        directory = __dirname + '/' + directory + '/routers'

        fs.readdirSync(directory).forEach(file => {
            if (file.indexOf('.js') != -1) {
                require(directory + '/' + file).register(
                    new RouteRegistrar(this.server, version)
                )
            }
        })
    }
}

module.exports = PublicAPI
