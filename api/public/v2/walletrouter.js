// wallets.js - former accounts
const Router = require('restify-router').Router
const router = new Router()

class WalletRouter {
  getBalance (req, res, next) {
    res.send(200, {
      success: false,
      message: 'V2 not yet implemented',
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }
}

const walletRouter = new WalletRouter()

router.get({path: '/getBalance', version: '2.0.0'}, walletRouter.getBalance)

module.exports = router
