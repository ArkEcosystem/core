const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const logger = requireFrom('core/logger')
const db = requireFrom('core/dbinterface').getInstance()
const arkjs = require('arkjs')
const helpers = require('../helpers')

class WalletsController {
  index (req, res, next) {
    db.accounts.all(req.query).then(result => {
      helpers.respondWith('ok', {
        accounts: helpers.toCollection(result.rows, 'account')
      })
    })
  }

  show (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(result => {
      if (result) {
        helpers.respondWith('ok', {
          account: helpers.toResource(result, 'account')
        })
      } else {
        helpers.respondWith('error', {
          error: 'Not found'
        })
      }
    })
    .catch(error => {
      logger.error(error)

      helpers.respondWith('error', {
        error: error
      })
    })
  }

  balance (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(account => {
      if (account) {
        helpers.respondWith('ok', {
          balance: account ? account.balance : '0',
          unconfirmedBalance: account ? account.balance : '0'
        })
      } else {
        helpers.respondWith('error', {
          error: 'Not found'
        })
      }
    })
    .catch(error => {
      logger.error(error)
      helpers.respondWith('error', {
        error: error
      })
    })
  }

  publicKey (req, res, next) {
    db.accounts.findById(req.query.address)
    .then(account => {
      if (account) {
        helpers.respondWith('ok', {
          publicKey: account.publicKey
        })
      } else {
        helpers.respondWith('error', {
          error: 'Not found'
        })
      }
    })
    .catch(error => {
      logger.error(error)
      helpers.respondWith('error', {
        error: error
      })
    })
  }

  fee (req, res, next) {
    helpers.respondWith('ok', {
      fee: config.getConstants(blockchain.getInstance().status.lastBlock.data.height).fees.delegate
    })
  }

  // TODO - pretify this below
  delegates (req, res, next) {
    let lastblock = blockchain.getInstance().status.lastBlock.data
    db.accounts.findById(req.query.address)
      .then(account => {
        if (!account) {
          helpers.respondWith('error', {
            error: 'Address not found.'
          })
          return
        }

        if (!account.vote) {
          helpers.respondWith('error', {
            error: `Address ${req.query.address} hasn't voted yet.`
          })
          return
        }

        let totalSupply = config.genesisBlock.totalAmount + (lastblock.height - config.getConstants(lastblock.height).height) * config.getConstants(lastblock.height).reward
        db.getActiveDelegates(blockchain.getInstance().status.lastBlock.data.height)
          .then(activedelegates => {
            let delPos = activedelegates.findIndex(del => { return del.publicKey === account.vote })
            let votedDel = activedelegates[delPos]
            db.accounts.getProducedBlocks(account.vote).then(producedBlocks => {
              db.accounts.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash))
                .then(account => {
                  helpers.respondWith('ok', {
                    delegates: [{
                      username: account.username,
                      address: account.address,
                      publicKey: account.publicKey,
                      vote: '' + votedDel.balance,
                      producedblocks: producedBlocks,
                      missedblocks: 0, // TODO how?
                      rate: delPos + 1,
                      approval: (votedDel.balance / totalSupply) * 100,
                      productivity: 100
                    }]
                  })
                })
            })
          })
      })
      .catch(error => {
        logger.error(error)

        helpers.respondWith('error', {
          error: error
        })
      })
  }

  top (req, res, next) {
    db.accounts.top(req.query).then(result => {
      helpers.respondWith('ok', {
        accounts: result.rows
      })
    })
  }

  count (req, res, next) {
    db.accounts.all().then(result => {
      helpers.respondWith('ok', {
        count: result.count
      })
    })
  }
}

module.exports = new WalletsController()
