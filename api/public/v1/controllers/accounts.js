const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const arkjs = require('arkjs')
const utils = require('../utils')

class WalletsController {
  index (req, res, next) {
    db.accounts
      .findAll({...req.query, ...utils.paginator()})
      .then(result => utils.toCollection(result.rows, 'account'))
      .then(accounts => utils.respondWith('ok', {accounts}))
      .then(() => next())
  }

  show (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(accounts => {
        if (!accounts) return utils.respondWith('error', 'Not found')

        return utils.respondWith('ok', {
          account: utils.toResource(accounts, 'account')
        })
      })
      .then(() => next())
  }

  balance (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(account => {
        if (!account) return utils.respondWith('error', 'Not found')

        return utils.respondWith('ok', {
          balance: account ? account.balance : '0',
          unconfirmedBalance: account ? account.balance : '0'
        })
      })
      .then(() => next())
  }

  publicKey (req, res, next) {
    db.accounts
      .findById(req.query.address)
      .then(account => {
        if (!account) return utils.respondWith('error', 'Not found')

        utils.respondWith('ok', { publicKey: account.publicKey })
      })
      .then(() => next())
  }

  fee (req, res, next) {
    utils
      .respondWith('ok', {
        fee: config.getConstants(blockchain.status.lastBlock.data.height).fees.delegate
      })
      .then(() => next())
  }

  delegates (req, res, next) {
    db.accounts.findById(req.query.address).then(account => {
      if (!account) return utils.respondWith('error', 'Address not found.')
      if (!account.vote) return utils.respondWith('error', `Address ${req.query.address} hasn't voted yet.`)

      const lastBlock = blockchain.status.lastBlock.data
      const constants = config.getConstants(lastBlock.height)
      const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

      db.getActiveDelegates(lastBlock.height).then(delegates => {
          const delegateRank = delegates.findIndex(d => d.publicKey === account.vote)
          const delegate = delegates[delegateRank]

          db.accounts.findById(arkjs.crypto.getAddress(account.vote, config.network.pubKeyHash)).then(account => {
            utils
              .respondWith('ok', {
                delegates: [{
                  username: account.username,
                  address: account.address,
                  publicKey: account.publicKey,
                  vote: delegate.balance + '',
                  producedblocks: account.producedBlocks,
                  missedblocks: 0, // TODO how?
                  rate: delegateRank + 1,
                  approval: ((delegate.balance / totalSupply) * 100).toFixed(2),
                  productivity: (100 - (account.missedBlocks / ((account.producedBlocks + account.missedBlocks) / 100))).toFixed(2)
                }]
              })
              .then(() => next())
          })
        })
      })
  }

  top (req, res, next) {
    db.accounts
      .top(req.query)
      .then(result => utils.respondWith('ok', { accounts: result.rows }))
      .then(() => next())
  }

  count (req, res, next) {
    db.accounts
      .findAll()
      .then(result => utils.respondWith('ok', { count: result.count }))
      .then(() => next())
  }
}

module.exports = new WalletsController()
