const blockchain = requireFrom('core/blockchainManager')
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const arkjs = require('arkjs')
const helpers = require('../helpers')

class WalletsController {
  index (req, res, next) {
    db.accounts
      .all(req.query)
      .then(result => helpers.toCollection(result.rows, 'account'))
      .then(accounts => helpers.respondWith('ok', {accounts}))
  }

  show (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(accounts => {
        if (!accounts) return helpers.respondWith('error', 'Not found')

        helpers.respondWith('ok', {
          account: helpers.toResource(accounts, 'account')
        })
      })
  }

  balance (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(account => {
        if (!account) return helpers.respondWith('error', 'Not found')

        helpers.respondWith('ok', {
          balance: account ? account.balance : '0',
          unconfirmedBalance: account ? account.balance : '0'
        })
      })
  }

  publicKey (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(account => {
        if (!account) return helpers.respondWith('error', 'Not found')

        helpers.respondWith('ok', { publicKey: account.publicKey })
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
        if (!account) return helpers.respondWith('error', 'Address not found.')

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
  }

  top (req, res, next) {
    db.accounts
      .top(req.query)
      .then(result => helpers.respondWith('ok', { accounts: result.rows }))
  }

  count (req, res, next) {
    db.accounts
      .all()
      .then(result => helpers.respondWith('ok', { count: result.count }))
  }
}

module.exports = new WalletsController()
