// accounts.js
const Router = require('restify-router').Router
const router = new Router()
const config = require('../../core/config')

function getAutoConfigure (req, res, next) {
  res.send(200, {
    success: true,
    network: config.network
  })
  next()
}

// add a routes like you would on a restify server instance
router.get('/autoconfigure', getAutoConfigure)

module.exports = router
