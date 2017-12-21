const logger = require('../../../core/logger')
const arkjs = require('arkjs')

let db = null
let server = null
let config = null

class WalletController {
  start (dbI, configs, serverRestify) {
    db = dbI
    server = serverRestify
    config = configs
    this.initRoutes()
  }

  initRoutes () {
    server.get({path: 'api/accounts/getBalance', version: '1.0.0'}, this.getBalance)
    server.get({path: 'api/accounts/getPublicKey', version: '1.0.0'}, this.getPublicKey)
    server.get({path: 'api/accounts/', version: '1.0.0'}, this.getAccount)
    server.get({path: 'api/accounts/delegates', version: '1.0.0'}, this.getVotedDelegate)
    server.get({path: 'api/accounts/delegates/fee', version: '1.0.0'}, this.getDelegateRegistrationFee)
  }

  getVotedDelegate(req, res, next){
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.getAccount(req.query.address)
        .then(account => {
          db.getAccount(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
            .then(delegate => {
              res.send(200, {
                success: true,
                delegates: [
                  {
                    username: delegate.username,
                    address: delegate.address,
                    publicKey: delegate.publicKey,
                    vote: '0',
                    producedblocks: '000',
                    missedblocks: '000',
                    rate: -1,
                    approval: 1.14,
                    productivity: 99.3
                  }
                ],
                meta: {
                  requestedVersion: req.version(),
                  matchedVersion: req.matchedVersion()
                }
              })
            })
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

  getBalance (req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.getAccount(req.query.address)
        .then(account => {
          res.send(200, {
            success: true,
            balance: account ? account.balance : '0',
            unconfirmedBalance: account ? account.balance : '0',
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

  getPublicKey (req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.getAccount(req.query.address)
        .then(account => {
          res.send(200, {
            success: true,
            publicKey: account.publicKey,
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

  getDelegateRegistrationFee (req, res, next) {
    // TODO adjust the constant response to block height 0 or 1
    res.send(200, {
      success: true,
      fee: config.network.constants[1].fees.delegate,
      meta: {
        requestedVersion: req.version(),
        matchedVersion: req.matchedVersion()
      }
    })
    next()
  }
}

module.exports = new WalletController()
