const logger = require('../../../core/logger')
const arkjs = require('arkjs')
const blockchain = require('../../../core/blockchainManager')
const config = require('../../../core/config')

let db = null

// TODO implement v2 spec when done
class WalletController {
  constructor (serverRestify) {
    db = blockchain.getInstance().getDb()
    this.server = serverRestify
  }

  initRoutes (pathPrefix) {
    this.server.get({path: pathPrefix + '/', version: '2.0.0'}, this.getAccount)
  }

  getAccount (req, res, next) {
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

module.exports = WalletController
