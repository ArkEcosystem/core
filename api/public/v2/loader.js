// loader.js
const Router = require('restify-router').Router
const router = new Router()
const config = require('../../../core/config')

function getAutoConfigure (req, res, next) {
  res.send(200, {
    success: true,
    api: 'v2-not yet implemented',
    network: config.network
  })
  next()
}

router.get({path: '/loader/autoconfigure', version: '2.0.0'}, getAutoConfigure)

module.exports = router
