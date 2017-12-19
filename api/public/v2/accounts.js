// accounts.js
const Router = require('restify-router').Router
const router = new Router()

function all (req, res, next) {
  res.send(200, {
    success: true,
    api: 'v2-not yet implemented',
    requestedVersion: req.version(),
    matchedVersion: req.matchedVersion()
  })
  next()
}

router.get({path: '/accounts', version: '2.0.0'}, all)
router.get({path: '/v2/accounts'}, all)

module.exports = router
