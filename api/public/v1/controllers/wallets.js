const blockchain = requireFrom('core/blockchainManager').getInstance()
const config = requireFrom('core/config')
const db = requireFrom('core/dbinterface').getInstance()
const arkjs = require('arkjs')
const utils = require('../utils')

class WalletsController {
  index (req, res, next) {
    db.wallets
      .findAll({...req.query, ...utils.paginator()})
      .then(result => utils.toCollection(result.rows, 'wallet'))
      .then(wallets => utils.respondWith('ok', {wallets}))
      .then(() => next())
  }

  show (req, res, next) {
    db.wallets
      .findById(req.query.address)
      .then(wallets => {
        if (!wallets) return utils.respondWith('error', 'Not found')

        return utils.respondWith('ok', {
          wallet: utils.toResource(wallets, 'wallet')
        })
      })
      .then(() => next())
  }

  balance (req, res, next) {
    db.wallets
      .findById(req.query.address)
      .then(wallet => {
        if (!wallet) return utils.respondWith('error', 'Not found')

        return utils.respondWith('ok', {
          balance: wallet ? wallet.balance : '0',
          unconfirmedBalance: wallet ? wallet.balance : '0'
        })
      })
      .then(() => next())
  }

  publicKey (req, res, next) {
    db.wallets
      .findById(req.query.address)
      .then(wallet => {
        if (!wallet) return utils.respondWith('error', 'Not found')

        utils.respondWith('ok', { publicKey: wallet.publicKey })
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
    db.wallets.findById(req.query.address).then(wallet => {
      if (!wallet) return utils.respondWith('error', 'Address not found.')
      if (!wallet.vote) return utils.respondWith('error', `Address ${req.query.address} hasn't voted yet.`)

      const lastBlock = blockchain.status.lastBlock.data
      const constants = config.getConstants(lastBlock.height)
      const totalSupply = config.genesisBlock.totalAmount + (lastBlock.height - constants.height) * constants.reward

      db.getActiveDelegates(lastBlock.height).then(delegates => {
          const delegateRank = delegates.findIndex(d => d.publicKey === wallet.vote)
          const delegate = delegates[delegateRank]

          db.wallets.findById(arkjs.crypto.getAddress(wallet.vote, config.network.pubKeyHash)).then(wallet => {
            utils
              .respondWith('ok', {
                delegates: [{
                  username: wallet.username,
                  address: wallet.address,
                  publicKey: wallet.publicKey,
                  vote: delegate.balance + '',
                  producedblocks: wallet.producedBlocks,
                  missedblocks: 0, // TODO how?
                  rate: delegateRank + 1,
                  approval: ((delegate.balance / totalSupply) * 100).toFixed(2),
                  productivity: (100 - (wallet.missedBlocks / ((wallet.producedBlocks + wallet.missedBlocks) / 100))).toFixed(2)
                }]
              })
              .then(() => next())
          })
        })
      })
  }

  top (req, res, next) {
    db.wallets
      .top(req.query)
      .then(result => utils.respondWith('ok', { wallets: result.rows }))
      .then(() => next())
  }

  count (req, res, next) {
    db.wallets
      .findAll()
      .then(result => utils.respondWith('ok', { count: result.count }))
      .then(() => next())
  }
}

module.exports = new WalletsController()
