const arkjs = require('arkjs')
const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const transformer = requireFrom('api/transformer')
const crypto = require('crypto')


class WalletsController {
  index(req, res, next) {
    db.accounts.all({
      offset: parseInt(req.query.offset || 1),
      limit: parseInt(req.query.limit || 100)
    }).then(result => {
      responder.ok(req, res, {
        accounts: new transformer(req).collection(result.rows, 'account')
      })
    })

    next()
  }

  show(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.accounts.findById(req.query.address)
        .then(result => {
          responder.ok(req, res, {
            account: new transformer(req).resource(result, 'account')
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
      db.accounts.findById(req.query.address)
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
    } else {
      responder.error(req, res, {
        error: 'Object didn\'t pass validation for format address: ' + req.query.address,
      })
    }

    next()
  }

  publicKey(req, res, next) {
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.accounts.findById(req.query.address)
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
    let lastblock = blockchain.getInstance().lastBlock.data
    if (arkjs.crypto.validateAddress(req.query.address, config.network.pubKeyHash)) {
      db.accounts.findById(req.query.address)
        .then(account => {
          if (!account.vote) {
            responder.error(req, res, {
              error: `Address ${req.query.address} hasn\'t voted yet.`
            })
          } else {
            let totalSupply = config.genesisBlock.totalAmount +  (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
            db.getActiveDelegates(blockchain.getInstance().lastBlock.data.height)
              .then(activedelegates => {
                let delPos = activedelegates.findIndex(del => {return del.publicKey === account.vote})
                let votedDel = activedelegates[delPos]
                db.accounts.getProducedBlocks(account.vote).then(producedBlocks => {
                  db.accounts.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
                    .then(account => {
                      responder.ok(req, res, {
                        delegates: [{
                          username: account.username,
                          address: account.address,
                          publicKey: account.publicKey,
                          vote: account.vote,
                          producedblocks: producedBlocks,
                          missedblocks: 0, //TODO how?
                          rate: delPos+1,
                          approval: (votedDel.balance / totalSupply) * 100,
                          productivity: 100,
                        }],
                      })
                    })
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
    db.accounts.all({
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
    db.accounts.all().then(result => {
      responder.ok(req, res, {
        count: result.count,
      })
    })

    next()
  }

}

module.exports = new WalletsController()
