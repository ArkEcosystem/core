class LoaderController {
  start (dbI, configs, serverRestify) {
    this.db = dbI
    this.server = serverRestify
    this.config = configs
    this.initRoutes()
  }

  initRoutes () {
    this.server.get({path: 'api/loader/autoconfigure', version: '2.0.0'}, this.getAutoConfigure)
  }

  getAutoConfigure (req, res, next) {
    res.send(200, {
      success: true,
      network: this.config.network,
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }
}
module.exports = new LoaderController()
