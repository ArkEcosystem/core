// accounts.js
const Router = require('restify-router').Router
const router = new Router()
const config = require('../../../core/config')

function getAutoConfigure (req, res, next) {
  res.send(200, {
    success: true,
    network: config.network
  })
  next()
}

// define routes here
router.get({path: '/loader/autoconfigure', version: '1.0.0'}, getAutoConfigure)
router.get({path: '/v1/loader/autoconfigure'}, getAutoConfigure)

module.exports = router

