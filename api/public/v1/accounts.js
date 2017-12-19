// accounts.js
const Router = require('restify-router').Router
const router = new Router()

function all (req, res, next) {
  res.send(200, {
    success: true
  })
  next()
}

// add a routes like you would on a restify server instance
router.get('/accounts', all)

module.exports = router
