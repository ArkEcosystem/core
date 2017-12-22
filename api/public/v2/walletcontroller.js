// wallets.js - former accounts
const logger = require('../../../core/logger')
const arkjs = require('arkjs')
const config = require('../../../core/config')
const blockchain = require('../../../core/blockchainManager')

let db = null

// TODO implement according to new v2 specs
class WalletController {
  start (serverRestify) {
    db = blockchain.getInstance().getDb()
    this.server = serverRestify
    this.initRoutes()
  }

  initRoutes () {
    this.server.get({path: 'api/accounts/getBalance', version: '2.0.0'}, this.getBalance)
  }

  getBalance (req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.getAccount(req.query.address)
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
    } else {
      res.send(200, {
        success: false,
        error: 'Object didn\'t pass validation for format address: ' + req.query.address,
        meta: {
          requestedVersion: req.version(),
          matchedVersion: req.matchedVersion()
        }
      })
      next()
    }
  }
}

module.exports = new WalletController()
