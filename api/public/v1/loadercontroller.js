// loader.js

let db = null
let server = null
let config = null

class LoaderController {
  start (dbI, configs, serverRestify) {
    db = dbI
    server = serverRestify
    config = configs
    this.initRoutes()
  }

  initRoutes () {
    server.get({path: 'api/loader/autoconfigure', version: '1.0.0'}, this.getAutoConfigure)
  }

  getAutoConfigure (req, res, next) {
    res.send(200, {
      success: true,
      network: config.network,
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }
}

module.exports = new LoaderController()
