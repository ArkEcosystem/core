// accounts.js
const Router = require('restify-router').Router
const router = new Router()

function all (req, res, next) {
  res.send(200, {
    success: true
  })
  next()
}

router.get({path: '/accounts', version: '1.0.0'}, all)
router.get({path: '/v1/accounts'}, all)

module.exports = router
