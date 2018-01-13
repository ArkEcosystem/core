const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const db = requireFrom('core/dbinterface').getInstance()
const responder = requireFrom('api/responder')
const Transformer = requireFrom('api/transformer')
const arkjs = require('arkjs')

class WalletsController {
  index(req, res, next) {
    db.accounts.all(req.query).then(result => {
      responder.ok(req, res, {
        accounts: new Transformer(req).collection(result.rows, 'account')
      })
    })

    next()
  }


  show (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(result => {
      if (result) {
        responder.ok(req, res, {
          account: new Transformer(req).resource(result, 'account')
        })
      }else {
        responder.error(req, res, {
          error: 'Not found',
        })
      }
    })
    .catch(error => {
      logger.error(error)

      responder.error(req, res, {
        error: error
      })
    })

    next()
  }

  balance (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(account => {
      if (account) {
        responder.ok(req, res, {
          balance: account ? account.balance : '0',
          unconfirmedBalance: account ? account.balance : '0'
        })
      }
      else {
        responder.error(req, res, {
          error: 'Not found',
        })
      }
    })
    .catch(error => {
      logger.error(error)
      responder.error(req, res, {
        error: error
      })
    })

    next()
  }


  publicKey (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(account => {
      if (account) {
        responder.ok(req, res, {
          publicKey: account.publicKey,
        })
      }else {
        responder.error(req, res, {
          error: 'Not found',
        })
      }
    })
    .catch(error => {
      logger.error(error)
      responder.error(req, res, {
        error: error
      })
    })

    next()
  }

  fee (req, res, next) {
    res.send(200, {
      fee: config.getConstants(blockchain.getInstance().lastBlock.data.height).fees.delegate
    })

    next()
  }

  // TODO - pretify this below
  delegates (req, res, next) {
    let lastblock = blockchain.getInstance().lastBlock.data
    db.accounts.findById(req.query.address)
      .then(account => {
        if (!account){
          responder.error(req, res, {
            error: `Address not found.`
          })
          return
        }
        if (!account.vote) {
          responder.error(req, res, {
            error: `Address ${req.query.address} hasn\'t voted yet.`
          })
          return
        }
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
                      vote: ''+votedDel.balance,
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
      })
      .catch(error => {
        logger.error(error)

        responder.error(req, res, {
          error: error
        })
      })
    next()
  }

  top (req, res, next) {
    db.accounts.top(req.query).then(result => {
      responder.ok(req, res, {
        accounts: result.rows
      })
    })

    next()
  }

  count (req, res, next) {
    db.accounts.all().then(result => {
      responder.ok(req, res, {
        count: result.count
      })
    })

    next()
  }

}

module.exports = new WalletsController()
