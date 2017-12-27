const accounts = require(`${__root}/repositories/accounts`)
const arkjs = require('arkjs')
const blockchain = require(`${__root}/core/blockchainManager`)
const config = require(`${__root}/core/config`)
const logger = require(`${__root}/core/logger`)
const responder = require(`${__root}/api/responder`)
const transformer = require(`${__root}/api/transformer`)

class WalletsController {
  index(req, res, next) {
    accounts.all({
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)
    }).then(result => {
      responder.ok(req, res, {
        accounts: result
      })
    })

    next()
  }

  show(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      accounts.findById(req.query.address)
        .then(account => {
          responder.ok(req, res, {
            account: new transformer(req, account, 'account')
          })
        })
        .catch(error => {
          logger.error(error)

          responder.error(req, res, {
            error: error
          })
        })
    } else {
      responder.error(req, res, {
        error: 'Object didn\'t pass validation for format address: ' + req.query.address
      })
    }

    next()
  }

  balance(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      accounts.findById(req.query.address)
        .then(account => {
          responder.ok(req, res, {
            balance: account ? account.balance : '0',
            unconfirmedBalance: account ? account.balance : '0'
          })
        })
        .catch(error => {
          logger.error(error)

          responder.error(req, res, {
            error: error
          })
        })
    } else  {
      responder.error(req, res, {
        error: 'Object didn\'t pass validation for format address: ' + req.query.address,
      })
    }

    next()
  }

  publicKey(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      accounts.findById(req.query.address)
        .then(account => {
          responder.ok(req, res, {
            publicKey: account.publicKey,
          })
        })
        .catch(error => {
          logger.error(error)

          responder.error(req, res, {
            error: error
          })
        })
    } else {
      responder.error(req, res, {
        error: 'Object didn\'t pass validation for format address: ' + req.query.address,
      })
    }

    next()
  }

  fee(req, res, next) {
    res.send(200, {
      fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate,
    })

    next()
  }

  delegates(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      accounts.findById(req.query.address)
        .then(account => {
          if (!account.vote) {
            responder.ok(req, res, {
              delegates: []
            })
          } else {
            accounts.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
              .then(delegate => {
                responder.ok(req, res, {
                  delegates: [{
                    username: delegate.username,
                    address: delegate.address,
                    publicKey: delegate.publicKey,
                    vote: '0',
                    producedblocks: '000',
                    missedblocks: '000',
                    rate: -1,
                    approval: 1.14,
                    productivity: 99.3
                  }]
                })
              })
          }
        })
        .catch(error => {
          logger.error(error)

          responder.error(req, res, {
            error: error
          })
        })
    } else {
      responder.error(req, res, {
        error: 'Object didn\'t pass validation for format address: ' + req.query.address,
      })
    }

    next()
  }

  top(req, res, next) {
    accounts.all({
      attributes: ['address', 'balance', 'publicKey'],
      order: [
        ['balance', 'DESC']
      ],
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100),
    }).then(result => {
      responder.ok(req, res, {
        accounts: result.rows
      })
    })

    next()
  }

  count(req, res, next) {
    accounts.all().then(result => {
      responder.ok(req, res, {
        count: result.count,
      })
    })

    next()
  }
}

module.exports = new WalletsController
