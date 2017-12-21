// loader.js
const Router = require('restify-router').Router
const router = new Router()
const config = require('../../../core/config')

class LoaderRouter {
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

const loaderRouter = new LoaderRouter()

router.get({path: '/autoconfigure', version: '1.0.0'}, loaderRouter.getAutoConfigure)

module.exports = router
