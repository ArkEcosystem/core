// wallets.js - former accounts
const Router = require('restify-router').Router
const router = new Router()
const Account = require('../../../model/account')
const BC = require('../../../core/blockchainManager')
const logger = require('../../../core/logger')
const arkjs = require('arkjs')

class WalletRouter {
  getBalance (req, res, next) {
    BC.getInstance().getDb().getAccount(req.query.address)
      .then(account => {
        res.send(200, {
          success: true,
          account: account,
          meta: {
            requestedVersion: req.version(),
            matchedVersion: req.matchedVersion()
          }
        })
        next()
      })
      .catch(error => {
        logger.error(error)
        res.send(500, {success: false, error: error})
        next()
      })
  }
}

const walletRouter = new WalletRouter()

router.get({path: '/getBalance', version: '1.0.0'}, walletRouter.getBalance)

module.exports = router
